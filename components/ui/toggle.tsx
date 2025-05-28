"use client";

import * as TogglePrimitive from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const toggleVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium hover:bg-glass-bg hover:text-foreground disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-gradient-to-br data-[state=on]:from-primary/20 data-[state=on]:to-primary/10 data-[state=on]:text-primary data-[state=on]:border-primary/30 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none transition-all duration-300 ease-vision aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap backdrop-blur-vision vision-interactive data-[state=on]:shadow-vision-sm hover:border-glass-border/60",
  {
    variants: {
      variant: {
        default: "bg-transparent border border-transparent",
        outline:
          "border border-glass-border/60 bg-glass-bg/50 shadow-vision-xs hover:bg-glass-bg hover:text-foreground hover:border-glass-border",
      },
      size: {
        default: "h-9 px-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Toggle({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants>) {
  return (
    <TogglePrimitive.Root
      data-slot="toggle"
      className={cn(toggleVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Toggle, toggleVariants };
