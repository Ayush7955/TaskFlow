/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#f5f5f5',
        ink: {
          DEFAULT: '#0c0a09',
          900: '#0c0a09',
          800: '#1c1917',
          700: '#292524',
        },
        secondary: '#57534e',
        muted: '#a8a29e',
        border: '#e7e5e4',
        surface: '#ffffff',
        'surface-alt': '#fafaf9',
      },
      fontFamily: {
        display: ['"EB Garamond"', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
      },
      borderRadius: {
        pill: '9999px',
        xl: '16px',
        lg: '12px',
        md: '8px',
        sm: '6px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        sm: '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        card: '0 2px 8px 0 rgb(0 0 0 / 0.08), 0 1px 2px 0 rgb(0 0 0 / 0.04)',
        elevated: '0 8px 24px 0 rgb(0 0 0 / 0.12), 0 2px 8px 0 rgb(0 0 0 / 0.06)',
        modal: '0 24px 64px 0 rgb(0 0 0 / 0.16)',
      },
      backgroundImage: {
        'orb-mint': 'radial-gradient(ellipse at center, #a7f3d0 0%, #ccfbf1 60%, transparent 100%)',
        'orb-peach': 'radial-gradient(ellipse at center, #fcd9bd 0%, #ffe4e6 60%, transparent 100%)',
        'orb-lavender': 'radial-gradient(ellipse at center, #ddd6fe 0%, #ede9fe 60%, transparent 100%)',
        'orb-sky': 'radial-gradient(ellipse at center, #bae6fd 0%, #dbeafe 60%, transparent 100%)',
        'orb-rose': 'radial-gradient(ellipse at center, #fecdd3 0%, #ffe4e6 60%, transparent 100%)',
      },
    },
  },
  plugins: [],
};

