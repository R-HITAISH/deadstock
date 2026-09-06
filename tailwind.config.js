/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#121212',
          900: '#121212',
          800: '#1C1C1C',
          700: '#262626',
        },
        bone: {
          DEFAULT: '#EDEBE4',
          50: '#F5F4EF',
          100: '#EDEBE4',
          200: '#E0DDD4',
          300: '#D3D0C5',
        },
        accent: {
          DEFAULT: '#FF4D00',
          hover: '#CC3D00',
          light: '#FF6B2C',
        },
        muted: {
          DEFAULT: '#6B6A63',
          light: '#8C8B84',
          dark: '#54534D',
        },
        success: '#2E7D32',
        warning: '#F9A825',
        error: '#C62828',
      },
      fontFamily: {
        display: ['Anton', 'sans-serif'],
        body: ['Space Mono', 'monospace'],
      },
      boxShadow: {
        hard: '6px 6px 0 #121212',
        'hard-sm': '4px 4px 0 #121212',
        'hard-lg': '8px 8px 0 #121212',
        'hard-accent': '6px 6px 0 #FF4D00',
        'hard-bone': '6px 6px 0 #EDEBE4',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'stamp-in': 'stampIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        stampIn: {
          '0%': { opacity: '0', transform: 'scale(0.5) rotate(-25deg)' },
          '100%': { opacity: '1', transform: 'scale(1) rotate(-12deg)' },
        },
      },
    },
  },
  plugins: [],
};
