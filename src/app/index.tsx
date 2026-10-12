import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { getScreenPadding, responsive } from '@/features/layout/responsive';
import { colors, shadow, spacing } from '@/features/trip/theme';
import { TripState, useTrip } from '@/features/trip/trip-context';

type SavedTrip = {
  id: string;
  city: string;
  country: string;
  code: string;
  dates: string;
  startDate: string;
  endDate: string;
  days: number;
  places: number;
  status: '다가오는 여행' | '다녀온 여행';
  symbol: string;
  palette: { background: string; accent: string };
};

const savedTrips: SavedTrip[] = [
  { id: 'tokyo-autumn', city: '도쿄', country: '일본', code: 'TYO', dates: '2026. 10. 8 — 10. 11', startDate: '2026-10-08', endDate: '2026-10-11', days: 4, places: 12, status: '다가오는 여행', symbol: '東京', palette: { background: '#242943', accent: '#858CFF' } },
  { id: 'osaka-spring', city: '오사카', country: '일본', code: 'KIX', dates: '2026. 4. 16 — 4. 19', startDate: '2026-04-16', endDate: '2026-04-19', days: 4, places: 10, status: '다녀온 여행', symbol: '大阪', palette: { background: '#315B57', accent: '#8BD8C4' } },
  { id: 'paris-winter', city: '파리', country: '프랑스', code: 'CDG', dates: '2025. 12. 20 — 12. 24', startDate: '2025-12-20', endDate: '2025-12-24', days: 5, places: 15, status: '다녀온 여행', symbol: 'PARIS', palette: { background: '#704C55', accent: '#F4B7B8' } },
];

export default function MyTripsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { updateTrip } = useTrip();
  const horizontalPadding = getScreenPadding(width);
  const useTwoColumns = width >= responsive.tabletBreakpoint;

  const openTrip = (savedTrip: SavedTrip) => {
    const patch: Partial<TripState> = {
      destination: savedTrip.city,
      destinationCode: savedTrip.code,
      startDate: savedTrip.startDate,
      endDate: savedTrip.endDate,
    };
    updateTrip(patch);
    router.push('/itinerary');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: Math.max(insets.top, 12) + 8, paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View accessibilityLabel="Wander" style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MY TRIPS</Text>
            <Text style={styles.title}>내 여행 보관함</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="새 여행 만들기" onPress={() => router.push('/new-trip')} style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>다시 떠나고 싶은 여행을{`\n`}한곳에 모았어요.</Text>
          <Text style={styles.introCopy}>저장한 일정을 열어 장소를 바꾸거나 동선을 다시 확인해 보세요.</Text>
        </View>

        {savedTrips.length ? (
          <View style={styles.tripGrid}>
            {savedTrips.map((savedTrip) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${savedTrip.city} ${savedTrip.dates} 일정 열기`}
                key={savedTrip.id}
                onPress={() => openTrip(savedTrip)}
                style={({ pressed }) => [styles.tripCard, useTwoColumns && styles.tripCardWide, pressed && styles.cardPressed]}
              >
                <View style={[styles.cover, { backgroundColor: savedTrip.palette.background }]}>
                  <View style={[styles.coverOrb, { backgroundColor: savedTrip.palette.accent }]} />
                  <Text style={styles.coverSymbol}>{savedTrip.symbol}</Text>
                  <View style={styles.statusPill}><View style={[styles.statusDot, savedTrip.status === '다녀온 여행' && styles.statusDotMuted]} /><Text style={styles.statusText}>{savedTrip.status}</Text></View>
                  <View style={styles.coverArrow}><Ionicons name="arrow-forward" size={18} color="#FFFFFF" /></View>
                </View>
                <View style={styles.cardBody}>
                  <View style={styles.destinationRow}>
                    <View style={styles.destinationCopy}><Text style={styles.city}>{savedTrip.city}</Text><Text style={styles.country}>{savedTrip.country}</Text></View>
                    <Text style={styles.code}>{savedTrip.code}</Text>
                  </View>
                  <Text style={styles.dates}>{savedTrip.dates}</Text>
                  <View style={styles.metaRow}>
                    <View style={styles.metaItem}><Ionicons name="calendar-outline" size={15} color={colors.textSecondary} /><Text style={styles.metaText}>{savedTrip.days}일</Text></View>
                    <View style={styles.metaDivider} />
                    <View style={styles.metaItem}><Ionicons name="location-outline" size={15} color={colors.textSecondary} /><Text style={styles.metaText}>{savedTrip.places}개 장소</Text></View>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="map-outline" size={30} color={colors.primary} /></View>
            <Text style={styles.emptyTitle}>아직 저장한 여행이 없어요</Text>
            <Text style={styles.emptyCopy}>첫 여행 일정을 만들면 이곳에서 다시 볼 수 있어요.</Text>
            <Pressable onPress={() => router.push('/new-trip')} style={styles.emptyButton}><Text style={styles.emptyButtonText}>첫 여행 만들기</Text></Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { width: '100%', maxWidth: 1080, alignSelf: 'center', paddingBottom: 48 },
  header: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandMark: { width: 48, height: 48, flexShrink: 0, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  brandMarkText: { color: '#FFFFFF', fontSize: 18, fontWeight: '900' },
  pressed: { opacity: 0.72 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 9, lineHeight: 12, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900', marginTop: 1 },
  addButton: { width: 48, height: 48, flexShrink: 0, borderRadius: 24, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  intro: { marginTop: 40, marginBottom: 24 },
  introTitle: { color: colors.text, fontSize: 29, lineHeight: 38, fontWeight: '900', letterSpacing: -0.8 },
  introCopy: { maxWidth: 520, color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 10 },
  tripGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tripCard: { width: '100%', minWidth: 0, borderRadius: 24, backgroundColor: colors.surface, overflow: 'hidden', ...shadow.card },
  tripCardWide: { flexBasis: '47%', flexGrow: 1, maxWidth: 520 },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  cover: { height: 142, overflow: 'hidden', padding: spacing.md, justifyContent: 'flex-end' },
  coverOrb: { position: 'absolute', width: 190, height: 190, borderRadius: 95, opacity: 0.38, right: -28, top: -76 },
  coverSymbol: { position: 'absolute', right: 16, bottom: -10, color: 'rgba(255,255,255,0.16)', fontSize: 58, lineHeight: 68, fontWeight: '900', letterSpacing: -3 },
  statusPill: { position: 'absolute', left: 16, top: 16, minHeight: 29, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#8AF0C8' },
  statusDotMuted: { backgroundColor: '#D5D8E0' },
  statusText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  coverArrow: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.17)', alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 18 },
  destinationRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  destinationCopy: { flex: 1, minWidth: 0 },
  city: { color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '900' },
  country: { color: colors.textSecondary, fontSize: 11, lineHeight: 16, marginTop: 1 },
  code: { flexShrink: 0, color: colors.primaryDark, fontSize: 10, fontWeight: '900', backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  dates: { color: colors.text, fontSize: 12, fontWeight: '800', marginTop: 14 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: colors.border },
  metaItem: { minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaDivider: { width: 1, height: 13, backgroundColor: colors.borderStrong },
  metaText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' },
  emptyState: { minHeight: 360, borderRadius: 24, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, ...shadow.card },
  emptyIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center', marginTop: 18 },
  emptyCopy: { maxWidth: 280, color: colors.textSecondary, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7 },
  emptyButton: { minWidth: 160, minHeight: 48, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 22, paddingHorizontal: 18 },
  emptyButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '900' },
});
