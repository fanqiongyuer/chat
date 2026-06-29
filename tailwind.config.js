import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // 背景色系
        bgLight: '#f0f4f9',
        surface: '#ffffff',
        // 文字色系
        primaryText: '#1f1f1f',
        secondaryText: '#444746',
        tertiaryText: '#747775',
        borderGray: '#e0e0e0',
        // 功能色
        activeBlue: '#d3e3fd',
        activeTextBlue: '#041e49',
      },
      fontSize: {
        xs: ['11px', '16px'],
        sm: ['13px', '18px'],
        base: ['14px', '20px'],
        lg: ['15px', '22px'],
        xl: ['18px', '26px'],
        '2xl': ['20px', '28px'],
        '3xl': ['28px', '34px'],
        '4xl': ['34px', '40px'],
        '5xl': ['42px', '48px'],
      },
      borderRadius: {
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,0,0,0.02)',
        md: '0 4px 20px rgba(0,0,0,0.05)',
        lg: '0 8px 30px rgba(0,0,0,0.08)',
        xl: '0 8px 24px rgba(0,0,0,0.12)',
        popover: '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [typography],
};
