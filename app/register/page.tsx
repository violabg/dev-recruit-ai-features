"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BrainCircuit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { toast } from "sonner";

const formSchema = z.object({
  fullName: z.string().min(2, {
    message: "Il nome deve contenere almeno 2 caratteri.",
  }),
  company: z.string().min(2, {
    message: "Il nome dell'azienda deve contenere almeno 2 caratteri.",
  }),
  email: z.string().email({
    message: "Inserisci un indirizzo email valido.",
  }),
  password: z.string().min(6, {
    message: "La password deve contenere almeno 6 caratteri.",
  }),
});

export default function RegisterPage() {
  const router = useRouter();
  const { supabase } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      company: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!supabase) {
      toast.error("Errore", {
        description: "Impossibile connettersi al database",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Register the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
            company: values.company,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create profile record
        const { error: profileError } = await supabase.from("profiles").insert({
          user_id: authData.user.id,
          full_name: values.fullName,
          company: values.company,
          role: "recruiter", // Default role for new users
        });

        if (profileError) {
          throw profileError;
        }
      }

      toast.success("Registrazione completata", {
        description: "Il tuo account è stato creato con successo",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error("Errore di registrazione", {
        description:
          error.message || "Si è verificato un errore durante la registrazione",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 flex-col justify-center px-6 py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="flex flex-col space-y-2 text-center mb-8">
            <Link href="/" className="mx-auto">
              <div className="flex items-center gap-2 font-bold text-xl">
                <BrainCircuit className="h-6 w-6" />
                <span>DevRecruit AI</span>
              </div>
            </Link>
            <h1 className="text-2xl font-semibold tracking-tight">
              Crea un account
            </h1>
            <p className="text-sm text-muted-foreground">
              Registrati per iniziare a utilizzare DevRecruit AI
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome completo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Mario Rossi"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Azienda</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Acme Inc."
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="nome@esempio.com"
                        type="email"
                        autoComplete="email"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="••••••••"
                        type="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full mt-6"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrazione in corso...
                  </>
                ) : (
                  "Registrati"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center text-sm">
            Hai già un account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              Accedi
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
