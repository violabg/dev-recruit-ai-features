import { AppSidebar } from "@/components/app-sidebar";
import Breadcrumbs from "@/components/dashboard/Breadcumbs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="top-0 z-30 sticky flex items-center gap-2 bg-background supports-[backdrop-filter]:bg-background/70 backdrop-blur-md border-b rounded-t-xl h-16 shrink-0">
          <div className="flex items-center gap-2 px-4 w-full">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumbs />
            <div className="flex-1 text-right">
              <ThemeToggle />
            </div>
          </div>
        </header>
        <div className="px-4">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
