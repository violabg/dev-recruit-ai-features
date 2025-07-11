"use client";

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
import { LoginFormData, loginSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { GithubIcon } from "../icons/github";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import PasswordInput from "../ui/password-input";
import { Separator } from "../ui/separator";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  });
  const supabase = createClient();
  const { handleSubmit, setError } = form;

  const handleLogin = async (values: LoginFormData) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });
      if (error) throw error;
      router.push("/dashboard");
    } catch (error: unknown) {
      setError("email", {
        message: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/oauth?next=/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error: unknown) {
      console.log("error :>> ", error);
      //  setError(error instanceof Error ? error.message : 'An error occurred')
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Accedi</CardTitle>
          <CardDescription>
            Inserisci la tua email per accedere al tuo account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={handleSubmit(handleLogin)}
              className="space-y-4"
              autoComplete="off"
            >
              <FormField
                name="email"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="m@example.com"
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
                name="password"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel>Password</FormLabel>
                      <Link
                        href="/auth/forgot-password"
                        className="inline-block ml-auto text-sm hover:underline underline-offset-4"
                      >
                        Password dimenticata?
                      </Link>
                    </div>
                    <FormControl>
                      <PasswordInput
                        autoComplete="current-password"
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
                className="w-full"
                disabled={isLoading || !form.formState.isValid}
              >
                {isLoading ? "Accesso in corso..." : "Accedi"}
              </Button>
            </form>
          </Form>
          <Separator className="my-4" />
          <form onSubmit={handleSocialLogin}>
            <div className="flex flex-col gap-6">
              {/* {error && <p className=\"text-destructive-500 text-sm\">{error}</p>} */}
              <Button
                type="submit"
                className="flex justify-center items-center gap-2 bg-background border-input w-full"
                disabled={isLoading}
              >
                <GithubIcon className="w-5 h-5" />
                <span className="font-medium">
                  {isLoading ? "Logging in..." : "Login con GitHub"}
                </span>
              </Button>
            </div>
          </form>
          <Separator className="my-4" />
          <div className="mt-4 text-sm text-center">
            Non hai un account?{" "}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              Registrati
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
