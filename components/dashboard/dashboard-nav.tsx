"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Briefcase,
  FileQuestion,
  LayoutDashboard,
  Loader2,
  Settings,
  Users,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function DashboardNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
  ];

  return (
    <div className="w-64 border-r bg-background h-[calc(100vh-4rem)]">
      <div className="flex flex-col gap-2 p-4">
        {routes.map((route) => {
          const isActive = pathname === route.href;
          const isLoading = isPending && clickedHref === route.href;
          return (
            <Button
              key={route.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("justify-between", isActive && "bg-secondary")}
              asChild
            >
              <span
                role="link"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  setClickedHref(route.href);
                  startTransition(() => {
                    router.push(route.href);
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setClickedHref(route.href);
                    startTransition(() => {
                      router.push(route.href);
                    });
                  }
                }}
                style={{ display: "flex", alignItems: "center", width: "100%" }}
              >
                <route.icon className="mr-2 h-5 w-5" />
                <span style={{ flex: 1 }}>{route.label}</span>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
