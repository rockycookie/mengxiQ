/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        priority: {
          urgent: '#EF4444',       // Do it now - Red
          important: '#F59E0B',    // Important doable - Orange
          quick: '#EAB308',        // Low-hanging fruit - Yellow
          future: '#3B82F6',       // Moon shooting - Blue
        }
      }
    },
  },
  plugins: [],
}
