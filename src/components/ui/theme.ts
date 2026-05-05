import { Platform } from 'react-native';

export const theme = {
  colors: {
    // Canvas & surfaces (dark-first)
    canvas: '#090C0A',
    surface: '#111613',
    surfaceAlt: '#171D19',
    surfaceRaised: '#1E2822',
    surfaceTint: 'rgba(0, 255, 136, 0.06)',
    surfaceTintStrong: 'rgba(0, 255, 136, 0.12)',

    canvasMuted: '#0D120F',
    surfaceDark: '#0B100D',
    surfaceDarkMuted: '#141B17',

    // Borders
    border: 'rgba(255, 255, 255, 0.06)',
    borderSubtle: 'rgba(255, 255, 255, 0.04)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    borderDark: 'rgba(255, 255, 255, 0.08)',

    // Text
    text: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.85)',
    textMuted: 'rgba(255, 255, 255, 0.6)',
    textSoft: 'rgba(255, 255, 255, 0.5)',
    textInverse: '#0D0D0F',
    textOnDark: '#FFFFFF',
    textOnDarkMuted: 'rgba(255, 255, 255, 0.72)',

    // Primary accent (neon green)
    primary: '#00FF88',
    primaryStrong: '#00E678',
    primarySoft: 'rgba(0, 255, 136, 0.15)',
    secondary: '#00FF88',
    secondaryStrong: '#00E678',
    secondarySoft: 'rgba(0, 255, 136, 0.12)',
    accent: '#00FF88',
    accentSoft: 'rgba(0, 255, 136, 0.12)',
    accentGlow: 'rgba(0, 255, 136, 0.35)',

    // Semantic
    success: '#22C55E',
    successSoft: 'rgba(34, 197, 94, 0.15)',
    warning: '#EAB308',
    warningSoft: 'rgba(234, 179, 8, 0.15)',
    danger: '#EF4444',
    dangerSoft: 'rgba(239, 68, 68, 0.15)',

    // Nav (legacy compatibility)
    nav: '#1A1A1E',
    navMuted: 'rgba(255, 255, 255, 0.6)',

    overlay: 'rgba(0, 0, 0, 0.5)',
    shadow: 'rgba(0, 0, 0, 0.4)',
    white: '#FFFFFF',
    black: '#000000',
  },
  gradients: {
    brand: ['#0D1F1A', '#0A2A1E', 'rgba(0, 255, 136, 0.08)'] as const,
    profileHero: ['#0D1518', '#0F1F1A', 'rgba(0, 255, 136, 0.06)'] as const,
    videoOverlay: ['rgba(0, 0, 0, 0.02)', 'rgba(0, 0, 0, 0.75)'] as const,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    jumbo: 56,
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    pill: 999,
  },
  border: {
    hairline: 1,
    regular: 1,
    heavy: 2,
  },
  typography: {
    hero: {
      fontSize: 30,
      lineHeight: 34,
      fontWeight: '800' as const,
      letterSpacing: -0.7,
    },
    heading: {
      fontSize: 24,
      lineHeight: 30,
      fontWeight: '800' as const,
      letterSpacing: -0.5,
    },
    subheading: {
      fontSize: 19,
      lineHeight: 24,
      fontWeight: '700' as const,
      letterSpacing: -0.3,
    },
    title: {
      fontSize: 16,
      lineHeight: 22,
      fontWeight: '700' as const,
    },
    body: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400' as const,
    },
    label: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '700' as const,
    },
    caption: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '500' as const,
    },
    overline: {
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700' as const,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
    },
  },
  shadows: {
    sm: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
    }),
    card: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
    floating: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 10 },
      default: {
        shadowColor: '#000000',
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
    }),
    accentGlow: Platform.select({
      ios: {
        shadowColor: '#00FF88',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      },
      android: { elevation: 4 },
      default: {
        shadowColor: '#00FF88',
        shadowOpacity: 0.4,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
      },
    }),
  },
} as const;

export type ThemeColor = keyof typeof theme.colors;

export function alpha(hex: string, opacity: number) {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6) {
    return hex;
  }

  const value = Math.max(0, Math.min(1, opacity));
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${value})`;
}
