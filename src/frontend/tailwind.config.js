/** @type {import('tailwindcss').Config} */
export default {
  // Configure files to scan for Tailwind classes
  content: [
    "./index.html", // The main HTML file in src/frontend/public/ or src/frontend/
    "./src/**/*.{vue,js,ts,jsx,tsx}", // All Vue components and JS/TS files in src/frontend/src/
  ],
  darkMode: 'class', // Or 'media'. 'class' allows manual toggling via <html class="dark">
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      // You can extend colors, spacing, etc. here if needed
      // Example:
      // colors: {
      //   'mission-blue': '#3498db',
      //   'mission-dark-bg': '#1a202c',
      // },
    },
  },
  plugins: [
    // Add any Tailwind plugins here, e.g., @tailwindcss/forms, @tailwindcss/typography
    // require('@tailwindcss/forms'),
  ],
}
