"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { VariantProps } from "class-variance-authority";
import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function LogoutButton(
  props: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants>
) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <Button onClick={logout} {...props}>
      <LogOut className="mr-2 size-4" />
      Logout
    </Button>
  );
}
