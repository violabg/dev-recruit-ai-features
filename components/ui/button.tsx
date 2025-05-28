import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex relative justify-center items-center gap-2 disabled:opacity-50 backdrop-blur-vision aria-invalid:border-destructive focus-visible:border-ring rounded-xl outline-none aria-invalid:ring-destructive/20 focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:aria-invalid:ring-destructive/40 [&_svg:not([class*='size-'])]:size-4 overflow-hidden font-medium text-vision-sm whitespace-nowrap transition-all [&_svg]:pointer-events-none disabled:pointer-events-none shrink-0 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-vision hover:shadow-vision-md hover:-translate-y-0.5 active:translate-y-0 hover:bg-primary-hover backdrop-blur-vision border border-primary/20",
        destructive:
          "bg-destructive text-destructive-foreground shadow-vision hover:shadow-vision-md hover:-translate-y-0.5 hover:bg-destructive-hover focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 backdrop-blur-vision border border-destructive/20",
        outline:
          "border border-glass-border bg-glass-bg backdrop-blur-vision shadow-vision-sm hover:bg-card-hover hover:shadow-vision hover:-translate-y-0.5 text-foreground",
        outlineDestructive:
          "hover:bg-destructive/10 shadow-vision-sm border border-destructive/30 backdrop-blur-vision focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive hover:-translate-y-0.5",
        secondary:
          "bg-secondary text-secondary-foreground shadow-vision-sm hover:shadow-vision hover:-translate-y-0.5 hover:bg-secondary-hover backdrop-blur-vision border border-secondary/20",
        ghost:
          "hover:bg-accent-hover hover:text-accent-foreground text-foreground backdrop-blur-vision hover:-translate-y-0.5 transition-all duration-300",
        link: "text-primary underline-offset-4 hover:underline",
        glass:
          "bg-glass-bg border border-glass-border backdrop-blur-vision shadow-glass hover:shadow-vision-md hover:-translate-y-0.5 text-foreground",
      },
      size: {
        default: "h-10 px-6 py-2.5 has-[>svg]:px-4",
        sm: "h-9 rounded-lg gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-12 rounded-xl px-8 has-[>svg]:px-6 text-vision-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
