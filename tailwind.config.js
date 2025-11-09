/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#1565c0',
          600: '#0d47a1',
          700: '#1565c0',
          800: '#0d47a1',
          900: '#0a3d91',
        },
      },
    },
  },
  plugins: [],
}