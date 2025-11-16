/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg': '#1e1f22',
        'brand-surface': '#2b2d31',
        'brand-muted': '#383a40',
        'brand-subtle': '#6b6f78',
        'brand-text': '#f2f3f5',
        'brand-primary': '#4f85e3',
        'brand-secondary': '#3f6ab8',
      }
    },
  },
  plugins: [],
}
