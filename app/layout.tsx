import { ThemeProvider } from "@/components/theme-provider";
import { SupabaseProvider } from "@/lib/supabase/supabase-provider";
import type { Metadata } from "next";
import type React from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevRecruit AI",
  description:
    "AI-powered technical recruitment platform with Apple Vision Pro design aesthetic",
  generator: "v0.dev",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "oklch(0.98 0.005 210)" },
    { media: "(prefers-color-scheme: dark)", color: "oklch(0.12 0.015 240)" },
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

// Update the RootLayout component to handle Supabase provider errors gracefully
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="bg-background min-h-screen font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider>
            <div className="relative min-h-screen">{children}</div>
            <Toaster
              richColors
              position="top-right"
              toastOptions={{
                className: "glass-card border-0 backdrop-blur-vision",
                style: {
                  background: "var(--glass-bg)",
                  backdropFilter: "blur(20px) saturate(1.8)",
                  border: "1px solid var(--glass-border)",
                  boxShadow: "var(--glass-shadow)",
                },
              }}
            />
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
