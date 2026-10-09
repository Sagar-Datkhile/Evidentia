import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F9F9FA",
        foreground: "#111111",
        surface: "#FFFFFF",
        "surface-secondary": "#F1F1F3",
        border: "#E5E5E7",
        "border-subtle": "#EEEEF0",
        muted: "#6B6B73",
        "muted-foreground": "#8E8E93",
        primary: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
          hover: "#262626",
        },
        secondary: {
          DEFAULT: "#F1F1F3",
          foreground: "#111111",
          hover: "#E5E5E7",
        },
        accent: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
        },
        status: {
          pass: "#15803D",
          "pass-bg": "#F0FDF4",
          "pass-border": "#BBF7D0",
          fail: "#B91C1C",
          "fail-bg": "#FEF2F2",
          "fail-border": "#FECACA",
          pending: "#B45309",
          "pending-bg": "#FFFBEB",
          "pending-border": "#FDE68A",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        heading: ["var(--font-manrope)", "Manrope", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        editorial: "0 4px 20px -2px rgba(0, 0, 0, 0.06), 0 2px 6px -1px rgba(0, 0, 0, 0.04)",
        modal: "0 20px 40px -10px rgba(0, 0, 0, 0.12), 0 1px 3px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
