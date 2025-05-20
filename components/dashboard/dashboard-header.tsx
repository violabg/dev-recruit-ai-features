"use client";

import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useMobile } from "@/hooks/use-mobile";
import { useSupabase } from "@/lib/supabase/supabase-provider";
import { BrainCircuit, Loader2, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CurrentUserAvatar } from "../auth/current-user-avatar";
import { DashboardNav } from "./dashboard-nav";

export function DashboardHeader() {
  const { supabase, user, loading } = useSupabase();
  const router = useRouter();
  const isMobile = useMobile();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center gap-2 font-bold text-xl">
        {isMobile && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <DashboardNav />
            </SheetContent>
          </Sheet>
        )}
        <Link href="/" className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" />
          <span>DevRecruit AI</span>
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        {loading ? (
          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
        ) : (
          <>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <CurrentUserAvatar />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Il mio account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/profile">Profilo</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/settings">Impostazioni</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild>
                <Link href="/auth/login">Accedi</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
