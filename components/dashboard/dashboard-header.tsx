"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { BrainCircuit, LogOut, Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useSupabase } from "@/components/shared/supabase-provider"
import { useToast } from "@/components/ui/use-toast"
import { useMobile } from "@/hooks/use-mobile"
import { ThemeToggle } from "@/components/layout/theme-toggle"

export function DashboardHeader() {
  const { supabase, user } = useSupabase()
  const router = useRouter()
  const { toast } = useToast()
  const isMobile = useMobile()

  const handleSignOut = async () => {
    if (!supabase) return

    try {
      await supabase.auth.signOut()
      toast({
        title: "Disconnesso",
        description: "Hai effettuato il logout con successo",
      })
      router.push("/")
      router.refresh()
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante il logout",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-6">
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
        <Link href="/dashboard" className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6" />
          <span>DevRecruit AI</span>
        </Link>
      </div>
      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Profilo utente</span>
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
      </div>
    </header>
  )
}

// Fix circular dependency by importing DashboardNav here
import { DashboardNav } from "./dashboard-nav"
