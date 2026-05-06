import type { Config } from "tailwindcss";

export const sharedConfig: Partial<Config> = {
  darkMode: "class" as const,
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        none: "0px",
        xs: "6px",
        sm: "8px",
        md: "12px",
        lg: "14px",         /* feed cards (signature) */
        xl: "18px",         /* modales, drawers */
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
        DEFAULT: "var(--radius)",
      },
      borderWidth: {
        DEFAULT: "1px",     /* CHANGED: was 2px */
        "0": "0",
        "1": "1px",
        "1.5": "1.5px",
        "2": "2px",
        "3": "3px",
        "4": "4px",
      },
      boxShadow: {
        /* Canonical soft shadows */
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow-md)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
        "2xl": "var(--shadow-2xl)",
        hover: "var(--shadow-hover)",
        focus: "var(--shadow-focus-ring)",
        /* Backward compat: neo-* names still resolve */
        neo: "var(--shadow-md)",
        "neo-xs": "var(--shadow-xs)",
        "neo-sm": "var(--shadow-sm)",
        "neo-lg": "var(--shadow-lg)",
        "neo-xl": "var(--shadow-xl)",
        none: "none",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "Inter Display", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        /* Social scale — base 15px (slightly larger than shadcn default for feed comfort) */
        xs: ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],            /* 12px */
        sm: ["0.8125rem", { lineHeight: "1.125rem" }],                                  /* 13px */
        base: ["0.9375rem", { lineHeight: "1.45rem" }],                                 /* 15px */
        md: ["1rem", { lineHeight: "1.5rem" }],                                          /* 16px */
        lg: ["1.125rem", { lineHeight: "1.65rem" }],                                    /* 18px */
        xl: ["1.375rem", { lineHeight: "1.85rem", letterSpacing: "-0.01em" }],         /* 22px */
        "2xl": ["1.75rem", { lineHeight: "2.15rem", letterSpacing: "-0.02em", fontWeight: "700" }],     /* 28px */
        "3xl": ["2.125rem", { lineHeight: "2.5rem", letterSpacing: "-0.02em", fontWeight: "800" }],     /* 34px */
        "4xl": ["2.5rem", { lineHeight: "2.75rem", letterSpacing: "-0.03em", fontWeight: "800" }],      /* 40px */
        "5xl": ["2.75rem", { lineHeight: "1", letterSpacing: "-0.03em", fontWeight: "900" }],            /* 44px display */
        "6xl": ["3.5rem", { lineHeight: "1", letterSpacing: "-0.04em", fontWeight: "900" }],
      },
      transitionTimingFunction: {
        /* Soft Social motion curves */
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        /* Backward compat */
        neo: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        instant: "80ms",
        fast: "150ms",
        DEFAULT: "220ms",
        slow: "350ms",
        xslow: "600ms",
      },
      keyframes: {
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "reaction-pop": {
          "0%": { transform: "scale(0) translateY(8px)", opacity: "0" },
          "60%": { transform: "scale(1.08) translateY(-2px)", opacity: "1" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "like-pop": {
          "0%, 100%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.3)" },
        },
      },
      animation: {
        "shimmer": "shimmer 1.5s linear infinite",
        "reaction-pop": "reaction-pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "like-pop": "like-pop 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
};
