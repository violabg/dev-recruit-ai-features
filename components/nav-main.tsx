"use client";
import { Loader2, type LucideIcon } from "lucide-react";
import * as React from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";

export function NavMain({
  items,
  ...props
}: {
  items: {
    label: string;
    href: string;
    icon: LucideIcon;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();
  const router = useRouter();
  const [clickedHref, setClickedHref] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((route) => {
            const isActive = pathname === route.href;
            const isLoading = isPending && clickedHref === route.href;
            return (
              <SidebarMenuItem key={route.label}>
                <SidebarMenuButton
                  asChild
                  size="default"
                  className={cn(
                    "justify-between",
                    isActive && "bg-secondary text-white"
                  )}
                >
                  <span
                    role="link"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      setClickedHref(route.href);
                      startTransition(() => {
                        router.push(route.href as any);
                      });
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setClickedHref(route.href);
                        startTransition(() => {
                          router.push(route.href as any);
                        });
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <route.icon className="mr-2 w-5 h-5" />
                    <span style={{ flex: 1 }}>{route.label}</span>
                    {isLoading && (
                      <Loader2 className="ml-2 w-4 h-4 animate-spin" />
                    )}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
