/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}", // if using React/Vite
    ],
  
  theme: {
    extend: {
      // Add custom breakpoints while keeping defaults
      screens: {
        xs: "480px",
      },
    },
  },
  
    plugins: [],
}
  