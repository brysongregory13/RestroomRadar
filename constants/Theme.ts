import { Colors } from './Colors';

export const Theme = {
  colors: Colors,
  typography: {
    fontSizeXS: 11,
    fontSizeSM: 13,
    fontSizeBase: 14,
    fontSizeMD: 16,
    fontSizeLG: 18,
    fontSizeXL: 22,
    fontSizeXXL: 28,
    weightRegular: '400' as const,
    weightSemibold: '600' as const,
    weightBold: '700' as const,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
  },
  radius: {
    sm: 6,
    md: 10,
    lg: 12,
    pill: 24,
    circle: 999,
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
  },
};
