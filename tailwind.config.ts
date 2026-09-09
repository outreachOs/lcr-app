import type { Config } from "tailwindcss";

// Brand tokens carried over from the app concept mockups and the existing
// leicester-car-recovery.co.uk site (navy #0d1b2a, yellow #f5c518).
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0D1B2A",
        yellow: "#F5C518",
        bg: "#F5F7FA",
        mapbg: "#EAF0F6",
        ink: {
          DEFAULT: "#0D1B2A",
          2: "#5B6B7C",
          3: "#94A2B3",
        },
        border: "#E2E7EC",
        good: "#2FAE72",
      },
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
        body: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "16px",
        sheet: "28px",
      },
    },
  },
  plugins: [],
};
export default config;
