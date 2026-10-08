import { Platform } from 'react-native';

export const colors = {
  background: '#F7F8FC', surface: '#FFFFFF', surfaceSubtle: '#F2F4F8', text: '#171A2B',
  textSecondary: '#697082', textMuted: '#A0A6B4', border: '#E8EAF0', borderStrong: '#D6D9E2',
  primary: '#6068ED', primaryDark: '#4C54D6', primarySoft: '#EEF0FF', accent: '#FF785A',
  accentSoft: '#FFF0EB', yellow: '#F4B942', danger: '#E05454',
};
export const spacing = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32, xxl: 48 };
export const radius = { sm: 10, md: 14, lg: 18, xl: 24, full: 999 };
export const shadow = {
  card: Platform.select({ web: { boxShadow: '0 8px 28px rgba(25, 31, 54, 0.06)' }, default: { elevation: 2 } }) as object,
  float: Platform.select({ web: { boxShadow: '0 16px 48px rgba(25, 31, 54, 0.14)' }, default: { elevation: 8 } }) as object,
};
