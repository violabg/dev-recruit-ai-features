"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MonitorCog, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="w-[1.2rem] h-[1.2rem] rotate-0 dark:-rotate-90 scale-100 dark:scale-0 transition-all" />
          <Moon className="absolute w-[1.2rem] h-[1.2rem] rotate-90 dark:rotate-0 scale-0 dark:scale-100 transition-all" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          className="justify-between"
          onClick={() => setTheme("light")}
        >
          <span>Chiaro</span>
          <Sun className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between"
          onClick={() => setTheme("dark")}
        >
          <span>Scuro</span>
          <Moon className="w-4 h-4" />
        </DropdownMenuItem>
        <DropdownMenuItem
          className="justify-between"
          onClick={() => setTheme("system")}
        >
          <span>Sistema</span>
          <MonitorCog className="w-4 h-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
