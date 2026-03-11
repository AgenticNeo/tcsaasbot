/**
 * Connecteam-inspired Design System
 * Color palette, typography, spacing, and component guidelines
 */

export const designSystem = {
  colors: {
    // Primary colors - inspired by Connecteam's blue
    primary: {
      50: '#f0f6ff',
      100: '#e0ecff',
      200: '#c7deff',
      300: '#a3d2ff',
      400: '#7ab8ff',
      500: '#4a9eff', // Main primary
      600: '#2e7fd4',
      700: '#1e5ba8',
      800: '#144389',
      900: '#0d2d70',
    },
    // Secondary - Accent teal/green
    secondary: {
      50: '#f0fdf7',
      100: '#dffef3',
      200: '#b8fce9',
      300: '#6ef9dd',
      400: '#2ef5ce',
      500: '#06ddb8', // Main secondary
      600: '#04b89a',
      700: '#038d7f',
      800: '#046b68',
      900: '#034d54',
    },
    // Neutral grays
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    // Semantic colors
    success: '#06b6d4',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },

  typography: {
    fontFamily: {
      primary: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      mono: "'JetBrains Mono', 'Courier New', monospace",
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
      '5xl': ['48px', { lineHeight: '56px' }],
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    '4xl': '64px',
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glass: '0 8px 32px rgba(31, 38, 135, 0.37)',
  },

  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  components: {
    button: {
      basePadding: '12px 16px',
      largePadding: '16px 24px',
      borderRadius: '8px',
      fontWeight: 500,
      transition: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    card: {
      borderRadius: '12px',
      padding: '20px',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
    input: {
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '14px',
      transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
};

export type DesignSystem = typeof designSystem;
