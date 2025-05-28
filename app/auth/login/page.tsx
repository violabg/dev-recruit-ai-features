import { LoginForm } from "@/components/auth/login-form";

export default function Page() {
  return (
    <div className="flex justify-center items-center p-6 md:p-10 w-full min-h-svh bg-gradient-to-br from-background via-background/95 to-muted/30 backdrop-blur-vision">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
