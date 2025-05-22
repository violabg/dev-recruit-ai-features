import { ThemeProvider } from "@/components/theme-provider";
import { SupabaseProvider } from "@/lib/supabase/supabase-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type React from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevRecruit AI",
  description: "AI-powered technical recruitment platform",
  generator: "v0.dev",
};

// Update the RootLayout component to handle Supabase provider errors gracefully
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            {children}
            <Toaster richColors />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
