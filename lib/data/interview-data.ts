import { requireUser } from "@/lib/auth-server";
import prisma from "@/lib/prisma";
import type {
  AssignedInterview,
  CandidateQuizData,
  QuizAssignmentData,
} from "@/lib/types/interview";
import { cache } from "react";

const mapAssignedInterview = (interview: {
  id: string;
  token: string;
  status: string;
  createdAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  candidate: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
  quiz: {
    id: string;
    title: string;
  } | null;
}): AssignedInterview => ({
  id: interview.id,
  token: interview.token,
  status: interview.status,
  createdAt: interview.createdAt.toISOString(),
  startedAt: interview.startedAt?.toISOString() ?? null,
  completedAt: interview.completedAt?.toISOString() ?? null,
  candidateId: interview.candidate?.id ?? "",
  candidateName: interview.candidate?.name ?? "",
  candidateEmail: interview.candidate?.email ?? "",
  quizId: interview.quiz?.id ?? "",
  quizTitle: interview.quiz?.title ?? "",
});

const getQuizAssignmentDataCached = cache(
  async (
    quizId: string,
    userId: string
  ): Promise<QuizAssignmentData | null> => {
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        createdBy: userId,
      },
      include: {
        position: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!quiz) {
      return null;
    }

    const interviews = await prisma.interview.findMany({
      where: {
        quizId: quiz.id,
      },
      include: {
        candidate: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        quiz: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const assignedInterviews = interviews.map(mapAssignedInterview);
    const assignedCandidateIds = assignedInterviews
      .map((interview) => interview.candidateId)
      .filter(Boolean);

    const unassignedCandidates = await prisma.candidate.findMany({
      where: {
        positionId: quiz.positionId,
        createdBy: userId,
        id: {
          notIn: assignedCandidateIds,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      quiz: {
        id: quiz.id,
        title: quiz.title,
        positionId: quiz.positionId,
        timeLimit: quiz.timeLimit,
        createdBy: quiz.createdBy,
      },
      position: quiz.position
        ? {
            id: quiz.position.id,
            title: quiz.position.title,
          }
        : null,
      assignedInterviews,
      unassignedCandidates,
    };
  }
);

export const getQuizAssignmentData = async (
  quizId: string
): Promise<QuizAssignmentData | null> => {
  const user = await requireUser();
  return getQuizAssignmentDataCached(quizId, user.id);
};

const getCandidateQuizDataCached = cache(
  async (
    candidateId: string,
    userId: string
  ): Promise<CandidateQuizData | null> => {
    const candidate = await prisma.candidate.findFirst({
      where: {
        id: candidateId,
        createdBy: userId,
      },
      include: {
        position: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!candidate) {
      return null;
    }

    const interviews = await prisma.interview.findMany({
      where: {
        candidateId: candidate.id,
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            createdAt: true,
            timeLimit: true,
            positionId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const assignedInterviews = interviews.map((interview) => ({
      id: interview.id,
      token: interview.token,
      status: interview.status,
      createdAt: interview.createdAt.toISOString(),
      startedAt: interview.startedAt?.toISOString() ?? null,
      completedAt: interview.completedAt?.toISOString() ?? null,
      candidateId: interview.candidateId,
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      quizId: interview.quiz?.id ?? "",
      quizTitle: interview.quiz?.title ?? "",
    }));

    const assignedQuizIds = assignedInterviews
      .map((interview) => interview.quizId)
      .filter(Boolean);

    const availableQuizzes = await prisma.quiz.findMany({
      where: {
        positionId: candidate.positionId,
        createdBy: userId,
        id: {
          notIn: assignedQuizIds,
        },
      },
      select: {
        id: true,
        title: true,
        createdAt: true,
        timeLimit: true,
        positionId: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      candidate: {
        id: candidate.id,
        name: candidate.name,
        email: candidate.email,
        status: candidate.status,
        positionId: candidate.positionId,
      },
      position: candidate.position
        ? {
            id: candidate.position.id,
            title: candidate.position.title,
          }
        : null,
      availableQuizzes: availableQuizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        createdAt: quiz.createdAt.toISOString(),
        timeLimit: quiz.timeLimit,
        positionId: quiz.positionId,
      })),
      assignedInterviews,
    };
  }
);

export const getCandidateQuizData = async (
  candidateId: string
): Promise<CandidateQuizData | null> => {
  const user = await requireUser();
  return getCandidateQuizDataCached(candidateId, user.id);
};
