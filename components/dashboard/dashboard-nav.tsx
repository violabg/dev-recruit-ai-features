"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FileQuestion, Briefcase, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function DashboardNav() {
  const pathname = usePathname()

  const routes = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/positions",
      label: "Posizioni",
      icon: Briefcase,
    },
    {
      href: "/dashboard/candidates",
      label: "Candidati",
      icon: Users,
    },
    {
      href: "/dashboard/quizzes",
      label: "Quiz",
      icon: FileQuestion,
    },
    {
      href: "/dashboard/settings",
      label: "Impostazioni",
      icon: Settings,
    },
  ]

  return (
    <div className="w-64 border-r bg-background h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-2 p-4">
        {routes.map((route) => (
          <Button
            key={route.href}
            variant={pathname === route.href ? "secondary" : "ghost"}
            className={cn("justify-start", pathname === route.href && "bg-secondary")}
            asChild
          >
            <Link href={route.href}>
              <route.icon className="mr-2 h-5 w-5" />
              {route.label}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
