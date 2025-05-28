import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "oklch(var(--border))",
        input: "oklch(var(--input))",
        ring: "oklch(var(--ring))",
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        primary: {
          DEFAULT: "oklch(var(--primary))",
          foreground: "oklch(var(--primary-foreground))",
          hover: "oklch(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "oklch(var(--secondary))",
          foreground: "oklch(var(--secondary-foreground))",
          hover: "oklch(var(--secondary-hover))",
        },
        destructive: {
          DEFAULT: "oklch(var(--destructive))",
          foreground: "oklch(var(--destructive-foreground))",
          hover: "oklch(var(--destructive-hover))",
        },
        muted: {
          DEFAULT: "oklch(var(--muted))",
          foreground: "oklch(var(--muted-foreground))",
          hover: "oklch(var(--muted-hover))",
        },
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
          hover: "oklch(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover))",
          foreground: "oklch(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "oklch(var(--card))",
          foreground: "oklch(var(--card-foreground))",
          hover: "oklch(var(--card-hover))",
        },
        sidebar: {
          DEFAULT: "oklch(var(--sidebar))",
          foreground: "oklch(var(--sidebar-foreground))",
          primary: "oklch(var(--sidebar-primary))",
          "primary-foreground": "oklch(var(--sidebar-primary-foreground))",
          accent: "oklch(var(--sidebar-accent))",
          "accent-foreground": "oklch(var(--sidebar-accent-foreground))",
          border: "oklch(var(--sidebar-border))",
          ring: "oklch(var(--sidebar-ring))",
        },
        glass: {
          bg: "var(--glass-bg)",
          border: "var(--glass-border)",
        },
        gradient: {
          primary: "oklch(var(--gradient-primary))",
          secondary: "oklch(var(--gradient-secondary))",
          accent: "oklch(var(--gradient-accent))",
        },
      },
      borderRadius: {
        xs: "var(--radius-xs)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        mono: ["var(--font-mono)"],
        serif: ["var(--font-serif)"],
      },
      fontSize: {
        "vision-xs": [
          "0.75rem",
          { lineHeight: "1rem", letterSpacing: "0.01em" },
        ],
        "vision-sm": [
          "0.875rem",
          { lineHeight: "1.25rem", letterSpacing: "0.01em" },
        ],
        "vision-base": [
          "1rem",
          { lineHeight: "1.5rem", letterSpacing: "0.01em" },
        ],
        "vision-lg": [
          "1.125rem",
          { lineHeight: "1.75rem", letterSpacing: "0.01em" },
        ],
        "vision-xl": [
          "1.25rem",
          { lineHeight: "1.75rem", letterSpacing: "0.01em" },
        ],
        "vision-2xl": [
          "1.5rem",
          { lineHeight: "2rem", letterSpacing: "0.01em" },
        ],
        "vision-3xl": [
          "1.875rem",
          { lineHeight: "2.25rem", letterSpacing: "0.01em" },
        ],
        "vision-4xl": [
          "2.25rem",
          { lineHeight: "2.5rem", letterSpacing: "0.01em" },
        ],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
        },
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px oklch(var(--primary) / 0.2)",
          },
          "50%": {
            boxShadow: "0 0 30px oklch(var(--primary) / 0.4)",
          },
        },
        "glass-shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "depth-float": {
          "0%, 100%": {
            transform: "translateY(0px) scale(1)",
            boxShadow: "var(--shadow-md)",
          },
          "50%": {
            transform: "translateY(-4px) scale(1.02)",
            boxShadow: "var(--shadow-xl)",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-shift": "gradient-shift 6s ease infinite",
        float: "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "glass-shimmer": "glass-shimmer 2s ease-in-out infinite",
        "depth-float": "depth-float 6s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        vision: "20px",
        "vision-sm": "12px",
        "vision-md": "16px",
        "vision-lg": "24px",
        "vision-xl": "32px",
      },
      backdropSaturate: {
        vision: "1.8",
      },
      boxShadow: {
        "vision-xs": "0 1px 2px oklch(0.12 0.015 240 / 0.08)",
        "vision-sm": "0 2px 8px oklch(0.12 0.015 240 / 0.08)",
        vision: "0 4px 16px oklch(0.12 0.015 240 / 0.12)",
        "vision-md": "0 8px 24px oklch(0.12 0.015 240 / 0.15)",
        "vision-lg": "0 12px 32px oklch(0.12 0.015 240 / 0.18)",
        "vision-xl": "0 20px 48px oklch(0.12 0.015 240 / 0.25)",
        glow: "0 0 20px oklch(var(--primary) / 0.3)",
        "glow-lg": "0 0 40px oklch(var(--primary) / 0.4)",
        "depth-1": "var(--shadow-sm)",
        "depth-2": "var(--shadow-md)",
        "depth-3": "var(--shadow-lg)",
        "depth-4": "var(--shadow-xl)",
        "depth-5": "var(--shadow-2xl)",
        glass: "var(--glass-shadow)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "vision-gradient":
          "linear-gradient(135deg, var(--gradient-primary) 0%, var(--gradient-secondary) 50%, var(--gradient-accent) 100%)",
        "glass-texture":
          "linear-gradient(135deg, transparent 0%, oklch(1 0 0 / 0.1) 50%, transparent 100%)",
      },
      transitionTimingFunction: {
        vision: "cubic-bezier(0.4, 0, 0.2, 1)",
        "vision-bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
    },
  },
  plugins: [],
} satisfies Config;

export default config;
