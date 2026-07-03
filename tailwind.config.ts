import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

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

        // 边框/分割线
        borderGray: '#e0e0e0',
        borderSoft: '#d9d9d9',
        lineSubtle: '#edf1f5',
        lineSoft: '#f1f4f7',

        // 功能色
        primary: '#14B886',
        'primary-hover': '#0d9e6d',
        'primary-soft': '#f0f9f6',
        'primary-soft-strong': '#e8f7f2',
        success: '#00b42a',
        'success-soft': '#edf9f0',
        warning: '#ff7d00',
        'warning-soft': '#fff5e8',
        danger: '#f53f3f',
        'danger-hover': '#d32f2f',
        'danger-soft': '#fff1f0',

        gray: {
          1: '#f2f3f5',
          2: '#e5e6eb',
          3: '#c9cdd4',
          4: '#86909c',
          5: '#4e5969',
          6: '#272e3b',
          7: '#1d2129',
        },
      },
      fontSize: {
        xs: ['12px', '16px'],
        sm: ['14px', '20px'],
        base: ['16px', '24px'],
        lg: ['18px', '26px'],
        xl: ['20px', '28px'],
        '2xl': ['24px', '32px'],
        '3xl': ['28px', '36px'],
        '4xl': ['32px', '40px'],
        '5xl': ['36px', '44px'],
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
        full: '999px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,0,0,0.02)',
        md: '0 4px 20px rgba(0,0,0,0.05)',
        lg: '0 8px 30px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [typography],
} satisfies Config
