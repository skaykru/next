import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'green-550': '#5CB85C',
        'green-650': '#3d8b3d',
        'gray-150': '#eceeef',
        'zink-750': '#333333',
      },
      fontFamily: {
        sans: ['var(--font-source-sans-3)'],
        titilium: ['var(--font-titillium-web)'],
      },
    },
  },
  plugins: [],
};
export default config;
