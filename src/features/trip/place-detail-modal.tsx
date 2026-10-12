import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { responsive } from '@/features/layout/responsive';
import { colors, shadow, spacing } from '@/features/trip/theme';

export type PlaceSummary = {
  name: string;
  category: string;
  duration: string;
  icon: string;
};

type Props = {
  destination: string;
  isLocked: boolean;
  onClose: () => void;
  onKeep: () => void;
  onRegenerate: () => void;
  place: PlaceSummary | null;
};

const descriptions: Record<string, string> = {
  '센소지와 나카미세 거리': '도쿄의 전통적인 분위기와 활기찬 상점가를 한 번에 둘러볼 수 있는 산책 코스예요.',
  '아사쿠사 이마한': '오래된 도쿄의 분위기 속에서 여유롭게 식사를 즐기기 좋은 장소예요.',
  '우에노 공원과 도쿄 국립박물관': '공원 산책과 전시 관람을 함께 즐기며 여행의 속도를 잠시 낮추기 좋아요.',
  '긴자 로컬 스시 바': '하루 동선을 마무리하며 현지 분위기의 저녁 식사를 즐기기 좋은 선택이에요.',
  '메이지 신궁': '도심 안에서도 조용한 숲길과 일본의 전통적인 분위기를 느낄 수 있어요.',
  '시부야 스카이': '도쿄의 넓은 도심 풍경과 해 질 무렵의 분위기를 감상하기 좋은 전망 포인트예요.',
  '츠키지 장외시장': '다양한 현지 먹거리를 짧은 동선 안에서 경험하기 좋은 시장이에요.',
};

function getDescription(place: PlaceSummary) {
  return descriptions[place.name] ?? `${place.category}을(를) 즐기면서 주변 장소와 자연스럽게 연결할 수 있도록 AI가 선택한 장소예요.`;
}

export function PlaceDetailModal({ destination, isLocked, onClose, onKeep, onRegenerate, place }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= responsive.tabletBreakpoint;

  if (!place) return null;

  return <Modal animationType={desktop ? 'fade' : 'slide'} onRequestClose={onClose} statusBarTranslucent transparent visible>
    <View style={[styles.overlay, desktop ? styles.overlayDesktop : styles.overlayMobile]}>
      <Pressable accessibilityLabel="장소 정보 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.card, desktop && styles.cardDesktop, { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md) }]}>
        {!desktop ? <View style={styles.handle} /> : null}
        <View style={styles.header}>
          <View><Text style={styles.eyebrow}>PLACE DETAILS</Text><Text style={styles.headerTitle}>장소 정보</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" hitSlop={6} onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={22} color={colors.text} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <View style={styles.placeHero}>
            <View style={styles.placeIcon}><Text style={styles.placeEmoji}>{place.icon}</Text></View>
            <View style={styles.placeCopy}>
              <View style={styles.tags}><View style={styles.aiTag}><Text style={styles.aiTagText}>✦ AI 추천</Text></View><Text style={styles.category}>{place.category}</Text></View>
              <Text style={styles.placeName}>{place.name}</Text>
              <Text style={styles.destination}>{destination}</Text>
            </View>
          </View>

          <Text style={styles.description}>{getDescription(place)}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}><View style={styles.infoIcon}><Ionicons name="time-outline" size={18} color={colors.primary} /></View><Text style={styles.infoLabel}>예상 체류시간</Text><Text style={styles.infoValue}>{place.duration}</Text></View>
            <View style={styles.infoItem}><View style={styles.infoIcon}><Ionicons name="walk-outline" size={18} color={colors.primary} /></View><Text style={styles.infoLabel}>일정 흐름</Text><Text style={styles.infoValue}>가까운 동선</Text></View>
          </View>

          <View style={styles.reason}>
            <View style={styles.reasonTitleRow}><Ionicons name="sparkles-outline" size={17} color={colors.primary} /><Text style={styles.reasonTitle}>이 장소를 추천한 이유</Text></View>
            <Text style={styles.reasonText}>선택한 여행 취향과 잘 맞고, 앞뒤 장소의 이동 시간을 줄일 수 있어 일정에 포함했어요.</Text>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={isLocked} onPress={onRegenerate} style={[styles.secondaryButton, isLocked && styles.buttonDisabled]}>
            <Ionicons name="refresh" size={17} color={colors.primaryDark} /><Text style={styles.secondaryText}>다른 장소 추천</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={isLocked} onPress={onKeep} style={[styles.primaryButton, isLocked && styles.buttonDisabled]}>
            <Ionicons name={isLocked ? 'lock-closed' : 'checkmark'} size={18} color="#FFFFFF" /><Text style={styles.primaryText}>{isLocked ? '일정에 유지 중' : '이 장소 유지'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, paddingHorizontal: spacing.md, backgroundColor: 'rgba(19,22,38,0.48)', alignItems: 'center' },
  overlayMobile: { justifyContent: 'flex-end', paddingHorizontal: 0 },
  overlayDesktop: { justifyContent: 'center', paddingVertical: spacing.lg },
  card: { width: '100%', maxWidth: 520, maxHeight: '90%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, overflow: 'hidden', ...shadow.float },
  cardDesktop: { borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  handle: { width: 44, height: 5, borderRadius: 3, alignSelf: 'center', backgroundColor: colors.borderStrong, marginBottom: 8 },
  header: { minHeight: 60, paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 0.8, fontWeight: '900' },
  headerTitle: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '900', marginTop: 2 },
  closeButton: { width: responsive.minimumTouchTarget, height: responsive.minimumTouchTarget, borderRadius: 16, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.md },
  placeHero: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  placeIcon: { width: 64, height: 64, flexShrink: 0, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  placeEmoji: { fontSize: 29 },
  placeCopy: { flex: 1, minWidth: 0 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 6 },
  aiTag: { borderRadius: 8, backgroundColor: colors.primarySoft, paddingHorizontal: 7, paddingVertical: 4 },
  aiTagText: { color: colors.primaryDark, fontSize: 8, fontWeight: '900' },
  category: { color: colors.textSecondary, fontSize: 9, fontWeight: '800' },
  placeName: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '900', letterSpacing: -0.4 },
  destination: { color: colors.textMuted, fontSize: 10, marginTop: 4 },
  description: { color: colors.textSecondary, fontSize: 12, lineHeight: 20, marginTop: 20 },
  infoGrid: { flexDirection: 'row', gap: 10, marginTop: 20 },
  infoItem: { flex: 1, minWidth: 0, minHeight: 100, borderRadius: 18, backgroundColor: colors.surfaceSubtle, padding: 13 },
  infoIcon: { width: 30, height: 30, borderRadius: 11, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  infoLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 12, fontWeight: '900', marginTop: 4 },
  reason: { borderRadius: 18, backgroundColor: '#F5F6FF', padding: 15, marginTop: 12 },
  reasonTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  reasonTitle: { color: colors.text, fontSize: 11, fontWeight: '900' },
  reasonText: { color: colors.textSecondary, fontSize: 10, lineHeight: 17, marginTop: 8 },
  actions: { paddingHorizontal: spacing.lg, flexDirection: 'row', gap: 9 },
  secondaryButton: { flex: 1, minWidth: 0, minHeight: 50, borderRadius: 17, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  primaryButton: { flex: 1, minWidth: 0, minHeight: 50, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 },
});
