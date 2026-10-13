import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { responsive } from '@/features/layout/responsive';
import { colors, shadow } from '@/features/trip/theme';

type TripsHomeButtonProps = {
  size?: number;
  tone?: 'light' | 'glass';
};

export function TripsHomeButton({ size = responsive.minimumTouchTarget, tone = 'light' }: TripsHomeButtonProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="내 여행 보관함으로 이동"
      hitSlop={4}
      onPress={() => router.replace('/')}
      style={({ pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        tone === 'glass' && styles.glass,
        pressed && styles.pressed,
      ]}
    >
      <Ionicons name="albums-outline" size={Math.round(size * 0.43)} color={tone === 'glass' ? '#FFFFFF' : colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { flexShrink: 0, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  glass: { backgroundColor: 'rgba(255,255,255,0.13)', borderColor: 'rgba(255,255,255,0.24)' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.96 }] },
});
