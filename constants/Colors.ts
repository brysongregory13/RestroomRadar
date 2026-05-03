export const LightColors = {
  primary: '#00897B',
  primaryDark: '#00695C',
  primaryLight: '#E0F2F1',
  accent: '#FFA726',
  success: '#43A047',
  danger: '#E53935',
  background: '#F5F7F5',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#555555',
  textHint: '#888888',
  border: '#E0E0E0',
};

export const DarkColors = {
  primary: '#4DB6AC',
  primaryDark: '#00897B',
  primaryLight: '#1A3330',
  accent: '#FFB74D',
  success: '#66BB6A',
  danger: '#EF5350',
  background: '#121212',
  surface: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#BDBDBD',
  textHint: '#757575',
  border: '#333333',
};

export type ColorScheme = typeof LightColors;

// Default export for backward compatibility with components not yet themed
export const Colors = LightColors;
