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
        background: "var(--background)",
        foreground: "var(--foreground)",
        do_now: "#14B8A6",
        schedule: "#F59E0B",
        delegate: "#EC4899",
        eliminate: "#7C3AED",
      },
    },
  },
  plugins: [],
};
export default config;
