import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#F8F5EF",
        ink: "#1C2422",
        moss: {
          50: "#EDF6F2",
          100: "#D5EBE1",
          200: "#A8D6C2",
          300: "#72BC9E",
          400: "#3E9C78",
          500: "#0B7A55",
          600: "#096446",
          700: "#084F38",
          800: "#0A3D2D",
          900: "#0B2F24",
        },
        amber: {
          400: "#F0B457",
          500: "#E9A13B",
          600: "#D18A24",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,36,34,.06), 0 8px 24px -12px rgba(28,36,34,.18)",
        lift: "0 2px 4px rgba(28,36,34,.08), 0 16px 40px -12px rgba(11,122,85,.25)",
      },
    },
  },
  plugins: [],
};
export default config;
