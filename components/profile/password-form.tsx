"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PasswordInput from "@/components/ui/password-input";
import { updatePassword } from "@/lib/actions/profile";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const passwordSchema = z
  .object({
    current_password: z
      .string()
      .min(6, { message: "Password deve essere almeno 6 caratteri" }),
    new_password: z
      .string()
      .min(6, { message: "Password deve essere almeno 6 caratteri" })
      .max(100, { message: "Password deve essere massimo 100 caratteri" }),
    confirm_password: z
      .string()
      .min(6, { message: "Password deve essere almeno 6 caratteri" }),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Le password non corrispondono",
    path: ["confirm_password"],
  })
  .refine((data) => data.current_password !== data.new_password, {
    message: "La nuova password deve essere diversa da quella attuale",
    path: ["new_password"],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

type PasswordFormProps = {
  className?: string;
} & React.ComponentPropsWithoutRef<"div">;

export const PasswordForm = ({ className, ...props }: PasswordFormProps) => {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const { handleSubmit, reset } = form;

  const onSubmit = (values: PasswordFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("current_password", values.current_password);
        formData.append("new_password", values.new_password);

        await updatePassword(formData);
        toast.success("Password aggiornata con successo");
        reset();
        router.push("/dashboard/profile");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Errore nell&apos;aggiornamento della password"
        );
      }
    });
  };

  return (
    <div className={cn("w-full", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Cambia Password</CardTitle>
          <CardDescription>
            Aggiorna la password del tuo account per mantenere la sicurezza
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="current_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password Attuale</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Inserisci la password attuale"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nuova Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Inserisci la nuova password"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Conferma Nuova Password</FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder="Conferma la nuova password"
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type="submit" disabled={isPending} className="w-full">
                {isPending ? "Aggiornamento..." : "Aggiorna Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
