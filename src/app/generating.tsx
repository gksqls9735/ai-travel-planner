import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { responsive } from '@/features/layout/responsive';
import { useTrip } from '@/features/trip/trip-context';
import { colors, shadow, spacing } from '@/features/trip/theme';

const stages = [
  { icon: 'sparkles-outline' as const, label: '여행 취향을 분석하고 있어요' },
  { icon: 'location-outline' as const, label: '취향에 맞는 장소를 고르고 있어요' },
  { icon: 'navigate-outline' as const, label: '이동 동선을 최적화하고 있어요' },
];

export default function GeneratingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { markItineraryGenerated, trip } = useTrip();
  const [stage, setStage] = useState(0);
  const [pulse] = useState(() => new Animated.Value(0));
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const pulseAnimation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 850, useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 850, useNativeDriver: true }),
    ]));
    pulseAnimation.start();
    Animated.timing(progress, { toValue: 1, duration: 2800, useNativeDriver: false }).start();

    const stageTwo = setTimeout(() => setStage(1), 850);
    const stageThree = setTimeout(() => setStage(2), 1750);
    const complete = setTimeout(() => {
      markItineraryGenerated();
      router.replace('/itinerary');
    }, 2850);

    return () => {
      clearTimeout(stageTwo);
      clearTimeout(stageThree);
      clearTimeout(complete);
      pulseAnimation.stop();
      progress.stopAnimation();
    };
  }, [markItineraryGenerated, progress, pulse, router]);

  const destination = trip.destination || '도쿄';
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.34, 0.08] });
  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['8%', '100%'] });

  return <View style={[styles.screen, { paddingTop: Math.max(insets.top, spacing.md), paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
    <View style={styles.glowTop} />
    <View style={styles.glowBottom} />

    <View style={styles.content}>
      <View style={styles.stepBadge}><Text style={styles.stepText}>4 / 4</Text></View>

      <View style={styles.visual}>
        <View style={[styles.routeLine, styles.routeLineLeft]} />
        <View style={[styles.routeLine, styles.routeLineRight]} />
        <Animated.View style={[styles.halo, { opacity: haloOpacity, transform: [{ scale }] }]} />
        <Animated.View style={[styles.aiOrb, { transform: [{ scale }] }]}>
          <Ionicons name="sparkles" size={34} color="#FFFFFF" />
        </Animated.View>
        <View style={[styles.routeDot, styles.routeDotLeft]}><Ionicons name="restaurant-outline" size={17} color={colors.primaryDark} /></View>
        <View style={[styles.routeDot, styles.routeDotRight]}><Ionicons name="camera-outline" size={17} color={colors.primaryDark} /></View>
      </View>

      <Text style={styles.eyebrow}>AI TRIP DESIGNER</Text>
      <Text style={styles.title}>{destination} 여행을{`\n`}디자인하고 있어요</Text>
      <Text style={styles.description}>선택한 취향과 이동 시간을 함께 계산해{`\n`}나만의 일정을 만들고 있어요.</Text>

      <View style={styles.progressTrack}><Animated.View style={[styles.progressFill, { width: progressWidth }]} /></View>

      <View accessibilityLiveRegion="polite" style={styles.stageCard}>
        <View style={styles.stageIcon}><Ionicons name={stages[stage].icon} size={19} color={colors.primary} /></View>
        <View style={styles.stageCopy}>
          <Text style={styles.stageLabel}>{stages[stage].label}</Text>
          <Text style={styles.stageCount}>{stage + 1} / {stages.length}</Text>
        </View>
      </View>

      <View style={styles.dots}>{stages.map((_, index) => <View key={index} style={[styles.dot, index <= stage && styles.dotActive]} />)}</View>
    </View>

    <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.cancel}>
      <Text style={styles.cancelText}>다시 선택하기</Text>
    </Pressable>
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: '#F7F8FF', paddingHorizontal: spacing.lg, justifyContent: 'center', alignItems: 'center' },
  glowTop: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#E8EAFF', top: -90, right: -90, opacity: 0.9 },
  glowBottom: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: '#FFF0EB', bottom: -110, left: -90, opacity: 0.72 },
  content: { width: '100%', maxWidth: 440, alignItems: 'center' },
  stepBadge: { minHeight: 28, borderRadius: 14, backgroundColor: colors.primarySoft, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 36 },
  stepText: { color: colors.primary, fontSize: 10, fontWeight: '900' },
  visual: { width: 226, height: 150, alignItems: 'center', justifyContent: 'center', marginBottom: 26 },
  halo: { position: 'absolute', width: 126, height: 126, borderRadius: 63, backgroundColor: colors.primarySoft, zIndex: 1 },
  aiOrb: { width: 86, height: 86, borderRadius: 30, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', zIndex: 3, ...shadow.float },
  routeDot: { position: 'absolute', width: 40, height: 40, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E4F2', alignItems: 'center', justifyContent: 'center', zIndex: 4, ...shadow.card },
  routeDotLeft: { left: 13, bottom: 14 },
  routeDotRight: { right: 13, top: 14 },
  routeLine: { position: 'absolute', width: 72, height: 3, borderRadius: 2, backgroundColor: '#C5C9FF', zIndex: 2 },
  routeLineLeft: { left: 45, top: 98, transform: [{ rotate: '-17deg' }] },
  routeLineRight: { right: 45, top: 49, transform: [{ rotate: '-17deg' }] },
  eyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.2, fontWeight: '900', marginBottom: 10 },
  title: { color: colors.text, fontSize: 27, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  description: { color: colors.textSecondary, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: 12 },
  progressTrack: { width: '100%', height: 7, borderRadius: 4, backgroundColor: '#E5E7F4', overflow: 'hidden', marginTop: 34 },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
  stageCard: { width: '100%', minHeight: 66, marginTop: 16, paddingHorizontal: 15, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: colors.border, ...shadow.card },
  stageIcon: { width: 38, height: 38, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stageCopy: { flex: 1, minWidth: 0, marginLeft: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  stageLabel: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  stageCount: { flexShrink: 0, color: colors.textMuted, fontSize: 10, fontWeight: '800' },
  dots: { flexDirection: 'row', gap: 6, marginTop: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.borderStrong },
  dotActive: { width: 18, backgroundColor: colors.primary },
  cancel: { minWidth: 120, minHeight: responsive.minimumTouchTarget, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  cancelText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800', textDecorationLine: 'underline' },
});
