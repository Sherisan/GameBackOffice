/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0e14',
          900: '#11151d',
          850: '#161b25',
          800: '#1c2230',
          700: '#2a3242',
          600: '#3a4457',
          400: '#8792a6',
          300: '#aeb7c7',
          100: '#e6eaf1',
        },
        accent: { DEFAULT: '#4f8cff', soft: '#4f8cff22' },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Mono"', 'Consolas', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
