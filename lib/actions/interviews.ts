"use server";

import { revalidatePath } from "next/cache";
import { sendEmail } from "../email";
import { createClient } from "../supabase/server";

// Interview actions
export async function createInterview(formData: FormData) {
  const supabase = await createClient();

  const candidateId = formData.get("candidate_id") as string;
  const quizId = formData.get("quiz_id") as string;

  // Generate unique token
  const token =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);

  const { data, error } = await supabase
    .from("interviews")
    .insert({
      candidate_id: candidateId,
      quiz_id: quizId,
      status: "pending",
      token,
    })
    .select();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/quizzes/${quizId}`);

  if (data && data[0]) {
    return {
      success: true,
      interviewId: data[0].id,
      token: data[0].token,
    };
  } else {
    throw new Error("Failed to create interview");
  }
}

export async function startInterview(token: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviews")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function submitAnswer(
  token: string,
  questionId: string,
  answer: any
) {
  const supabase = await createClient();

  // Get current interview
  const { data: interview, error: fetchError } = await supabase
    .from("interviews")
    .select("*")
    .eq("token", token)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Get current answers
  const currentAnswers = interview?.answers || {};

  // Update answers
  const updatedAnswers = {
    ...currentAnswers,
    [questionId]: answer,
  };

  // Update interview with new answer
  const { error } = await supabase
    .from("interviews")
    .update({
      answers: updatedAnswers,
    })
    .eq("id", interview.id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function completeInterview(token: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("interviews")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("token", token);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

// New functions for invite management
export async function sendInvite(formData: FormData) {
  const supabase = await createClient();

  try {
    const quizId = formData.get("quiz_id") as string;
    const candidateId = formData.get("candidate_id") as string;
    const message = (formData.get("message") as string) || "";
    const sendEmailNotification = formData.get("send_email") === "on";

    if (!quizId || !candidateId) {
      throw new Error("Quiz ID and Candidate ID are required");
    }

    // Check if candidate exists
    const { data: candidate, error: candidateError } = await supabase
      .from("candidates")
      .select("id, name, email, position_id")
      .eq("id", candidateId)
      .single();

    if (candidateError || !candidate) {
      throw new Error("Candidate not found");
    }

    // Check if quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, position_id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      throw new Error("Quiz not found");
    }

    // Check if candidate is for the same position as the quiz
    if (candidate.position_id !== quiz.position_id) {
      throw new Error("Candidate is not for the same position as the quiz");
    }

    // Check if interview already exists
    const { data: existingInterview, error: existingError } = await supabase
      .from("interviews")
      .select("id, token")
      .eq("candidate_id", candidateId)
      .eq("quiz_id", quizId)
      .maybeSingle();

    let interviewToken: string;

    if (existingInterview) {
      // Use existing interview
      interviewToken = existingInterview.token;
    } else {
      // Create new interview
      const { data: newInterview, error: createError } = await supabase
        .from("interviews")
        .insert({
          candidate_id: candidateId,
          quiz_id: quizId,
          status: "pending",
        })
        .select();

      if (createError || !newInterview || newInterview.length === 0) {
        throw new Error("Failed to create interview");
      }

      interviewToken = newInterview[0].token;
    }

    // Send email if requested
    if (sendEmailNotification) {
      const interviewUrl = `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/interview/${interviewToken}`;

      await sendEmail({
        to: candidate.email,
        subject: `Invitation to complete quiz: ${quiz.title}`,
        text: `
          Hello ${candidate.name},
          
          You have been invited to complete a technical quiz for your application.
          
          ${message ? `Message from the recruiter: ${message}\n\n` : ""}
          
          Please click the link below to start the quiz:
          ${interviewUrl}
          
          Thank you,
          DevRecruit AI Team
        `,
        html: `
          <p>Hello ${candidate.name},</p>
          
          <p>You have been invited to complete a technical quiz for your application.</p>
          
          ${
            message
              ? `<p><strong>Message from the recruiter:</strong> ${message}</p>`
              : ""
          }
          
          <p>Please click the button below to start the quiz:</p>
          
          <p>
            <a href="${interviewUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Start Quiz
            </a>
          </p>
          
          <p>Or copy and paste this link into your browser:</p>
          <p>${interviewUrl}</p>
          
          <p>Thank you,<br>DevRecruit AI Team</p>
        `,
      });
    }

    revalidatePath(`/dashboard/quizzes/${quizId}`);

    return {
      success: true,
      token: interviewToken,
    };
  } catch (error: any) {
    console.error("Error sending invite:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function sendBulkInvites(formData: FormData) {
  const supabase = await createClient();

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const quizId = formData.get("quiz_id") as string;
    const emailsRaw = (formData.get("emails") as string) || "";
    const emails = emailsRaw
      .split(/[,;\n]/)
      .map((email) => email.trim())
      .filter(Boolean);

    // Validate emails
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        throw new Error(`Invalid email format: ${email}`);
      }
    }
    const message = (formData.get("message") as string) || "";
    const sendEmailNotification = formData.get("send_email") === "on";

    if (!quizId || emails.length === 0) {
      throw new Error("Quiz ID and at least one email are required");
    }

    // Check if quiz exists
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .select("id, title, position_id")
      .eq("id", quizId)
      .single();

    if (quizError || !quiz) {
      throw new Error("Quiz not found");
    }

    const results = [];

    // Process each email
    for (const email of emails) {
      try {
        // Check if candidate exists
        const { data: existingCandidate, error: candidateError } =
          await supabase
            .from("candidates")
            .select("id, name")
            .eq("email", email)
            .eq("position_id", quiz.position_id)
            .maybeSingle();

        if (candidateError) {
          throw new Error(
            `Error fetching candidate for ${email}: ${candidateError.message}`
          );
        }

        let candidateId: string;
        let candidateName: string;

        if (existingCandidate) {
          // Use existing candidate
          candidateId = existingCandidate.id;
          candidateName = existingCandidate.name;
        } else {
          // Create new candidate
          const name = email.split("@")[0]; // Use part before @ as name

          const { data: newCandidate, error: createCandidateError } =
            await supabase
              .from("candidates")
              .insert({
                name: name,
                email: email,
                position_id: quiz.position_id,
                status: "invited",
                created_by: user.id,
              })
              .select("id");

          if (
            createCandidateError ||
            !newCandidate ||
            newCandidate.length === 0
          ) {
            throw new Error(
              `Failed to create candidate for ${email}${
                createCandidateError ? `: ${createCandidateError.message}` : ""
              }`
            );
          }

          candidateId = newCandidate[0].id;
          candidateName = name;
        }

        // Check if interview already exists
        const { data: existingInterview, error: existingInterviewError } =
          await supabase
            .from("interviews")
            .select("id, token")
            .eq("candidate_id", candidateId)
            .eq("quiz_id", quizId)
            .maybeSingle();

        if (existingInterviewError) {
          throw new Error(
            `Error fetching interview for ${email}: ${existingInterviewError.message}`
          );
        }

        let interviewToken: string;

        if (existingInterview) {
          // Use existing interview
          interviewToken = existingInterview.token;
        } else {
          // Create new interview
          const token =
            Math.random().toString(36).substring(2, 15) +
            Math.random().toString(36).substring(2, 15);

          const { data: newInterview, error: createInterviewError } =
            await supabase
              .from("interviews")
              .insert({
                candidate_id: candidateId,
                quiz_id: quizId,
                status: "pending",
                token: token,
              })
              .select("token");

          if (
            createInterviewError ||
            !newInterview ||
            newInterview.length === 0
          ) {
            throw new Error(
              `Failed to create interview for ${email}${
                createInterviewError ? `: ${createInterviewError.message}` : ""
              }`
            );
          }

          interviewToken = newInterview[0].token;
        }
        // console.log("🚀 ~ sendBulkInvites ~ interviewToken:", interviewToken);

        // Send email if requested
        if (sendEmailNotification) {
          const interviewUrl = `${
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          }/interview/${interviewToken}`;

          await sendEmail({
            to: email,
            subject: `Invitation to complete quiz: ${quiz.title}`,
            text: `
              Hello ${candidateName},
              
              You have been invited to complete a technical quiz for your application.
              
              ${message ? `Message from the recruiter: ${message}\n\n` : ""}
              
              Please click the link below to start the quiz:
              ${interviewUrl}
              
              Thank you,
              DevRecruit AI Team
            `,
            html: `
              <p>Hello ${candidateName},</p>
              
              <p>You have been invited to complete a technical quiz for your application.</p>
              
              ${
                message
                  ? `<p><strong>Message from the recruiter:</strong> ${message}</p>`
                  : ""
              }
              
              <p>Please click the button below to start the quiz:</p>
              
              <p>
                <a href="${interviewUrl}" style="display: inline-block; background-color: #0070f3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Start Quiz
                </a>
              </p>
              
              <p>Or copy and paste this link into your browser:</p>
              <p>${interviewUrl}</p>
              
              <p>Thank you,<br>DevRecruit AI Team</p>
            `,
          });
        }

        results.push({
          email,
          success: true,
          token: interviewToken,
        });
      } catch (error: unknown) {
        results.push({
          email,
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "An unknown error occurred",
        });
      }
    }

    revalidatePath(`/dashboard/quizzes/${quizId}`);

    return {
      success: true,
      results,
    };
  } catch (error: unknown) {
    console.error("Error sending bulk invites:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

export async function getInterviewsByQuiz(quizId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .select(
      `
      id, 
      token, 
      status, 
      created_at,
      started_at,
      completed_at,
      candidate:candidates(id, name, email)
    `
    )
    .eq("quiz_id", quizId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data || [];
}

export async function deleteInterview(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("interviews")
    .delete()
    .eq("id", id)
    .select("quiz_id");

  if (error) {
    throw new Error(error.message);
  }

  if (data && data[0]) {
    revalidatePath(`/dashboard/quizzes/${data[0].quiz_id}`);
  }

  return { success: true };
}
