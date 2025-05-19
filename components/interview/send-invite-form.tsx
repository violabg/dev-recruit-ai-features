"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { sendBulkInvites } from "@/lib/actions/interviews";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const emailFormSchema = z.object({
  emails: z.string().min(1, {
    message: "Please enter at least one email address.",
  }),
  message: z.string().optional(),
  sendEmail: z.boolean().default(true),
});

type EmailFormValues = z.infer<typeof emailFormSchema>;

interface SendInviteFormProps {
  quizId: string;
  onSuccess?: () => void;
}

export function SendInviteForm({ quizId, onSuccess }: SendInviteFormProps) {
  const [sending, setSending] = useState(false);

  const form = useForm<EmailFormValues>({
    resolver: zodResolver(emailFormSchema),
    defaultValues: {
      emails: "",
      message:
        "I invite you to complete this technical quiz for the position you applied for.",
      sendEmail: true,
    },
  });

  async function onSubmit(values: EmailFormValues) {
    if (!quizId) {
      toast.error("Error", {
        description: "Quiz ID is required",
      });
      return;
    }

    setSending(true);

    try {
      const formData = new FormData();
      formData.append("quiz_id", quizId);
      formData.append("emails", values.emails);
      formData.append("message", values.message || "");
      formData.append("send_email", values.sendEmail ? "on" : "off");

      const result = await sendBulkInvites(formData);

      if (!result.success) {
        throw new Error(result.error || "Failed to send invites");
      }

      toast.success("Invites sent", {
        description: `${
          result.results?.filter((r) => r.success).length || 0
        } invites have been sent successfully`,
      });

      form.reset({
        emails: "",
        message: values.message,
        sendEmail: values.sendEmail,
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast.error("Error", {
        description: error.message || "An error occurred while sending invites",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="emails"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email addresses</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter email addresses separated by commas, semicolons, or new lines"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Example: candidate1@example.com, candidate2@example.com
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Message (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter a personalized message to include in the email"
                  className="min-h-20"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                This message will be included in the invitation email
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="sendEmail"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Send email</FormLabel>
                <FormDescription>
                  If disabled, invitation links will be generated without
                  sending emails
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={sending}>
          {sending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send invites
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
