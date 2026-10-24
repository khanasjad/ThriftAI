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
        'constructor-blue': 'rgba(227, 236, 250, 1)',
        'constructor-dark': 'rgba(1, 1, 1, 1)',
      },
      fontSize: {
        'hero-mobile': '42px',
        'hero-desktop': '78px',
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '25': '6.25rem',  // 100px
        '30': '7.5rem',   // 120px
      },
    },
  },
  plugins: [],
};

export default config;
