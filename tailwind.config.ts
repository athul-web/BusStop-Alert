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
        cream: '#FCF9F1',
        gold: {
          light: '#F3D98B',
          DEFAULT: '#D6A43A',
          dark: '#B88528',
          hover: '#C49430',
        },
        lavender: {
          soft: '#EEE7FF',
          light: '#F7F3FF',
          DEFAULT: '#8B72C9',
          dark: '#735AAE',
        },
        card: '#FFFFFF',
        main: '#29252F',
        secondary: '#77727F',
        gps: {
          DEFAULT: '#58A477',
          light: '#EAF5EE',
          dark: '#45855F',
        },
        alert: {
          DEFAULT: '#E87568',
          light: '#FDEEEB',
          dark: '#D05A4D',
        },
        subtle: '#F4EFE6',
        line: '#EFE8DC',
      },
      boxShadow: {
        'warm': '0 4px 20px -2px rgba(41, 37, 47, 0.05), 0 2px 6px -1px rgba(41, 37, 47, 0.03)',
        'warm-md': '0 8px 30px -4px rgba(41, 37, 47, 0.08), 0 4px 12px -2px rgba(41, 37, 47, 0.04)',
        'warm-lg': '0 16px 40px -6px rgba(41, 37, 47, 0.12), 0 8px 18px -3px rgba(41, 37, 47, 0.06)',
        'gold': '0 8px 25px -4px rgba(214, 164, 58, 0.35)',
        'coral': '0 8px 25px -4px rgba(232, 117, 104, 0.35)',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.06)' },
        },
        alarmRing: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '20%, 60%': { transform: 'rotate(-12deg)' },
          '40%, 80%': { transform: 'rotate(12deg)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'alarm-ring': 'alarmRing 0.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
