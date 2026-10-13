import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { responsive } from '@/features/layout/responsive';
import { colors, shadow, spacing } from '@/features/trip/theme';
import { SkeletonBlock, SkeletonGroup } from '@/features/trip/skeleton';

export type PlaceSummary = {
  name: string;
  category: string;
  duration: string;
  icon: string;
  bookingNote?: string;
  bookingRequirement?: PlaceBookingRequirement;
};

export type PlaceBookingRequirement = 'required' | 'recommended' | 'unknown' | 'none';

type Props = {
  destination: string;
  bookingStatus: boolean;
  isLocked: boolean;
  onClose: () => void;
  onOpenBooking: () => void;
  onKeep: () => void;
  onRegenerate: () => void;
  onToggleBooking: () => void;
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

export function PlaceDetailModal({ bookingStatus, destination, isLocked, onClose, onKeep, onOpenBooking, onRegenerate, onToggleBooking, place }: Props) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const desktop = width >= responsive.tabletBreakpoint;
  const [loadedPlaceName, setLoadedPlaceName] = useState<string | null>(null);
  const loading = Boolean(place && loadedPlaceName !== place.name);

  useEffect(() => {
    if (!place) return;
    const timer = setTimeout(() => setLoadedPlaceName(place.name), 480);
    return () => clearTimeout(timer);
  }, [place]);

  if (!place) return null;
  const bookingRequirement = place.bookingRequirement ?? 'none';
  const bookingCopy = bookingRequirement === 'required'
    ? '방문 전에 입장권이나 이용 시간을 예약해 두는 것이 필요한 장소예요.'
    : bookingRequirement === 'recommended'
      ? '현장 구매가 가능할 수 있지만 원하는 시간 방문을 위해 사전 예약을 권장해요.'
      : bookingRequirement === 'unknown'
        ? '현재 예약 필요 여부를 확정하지 못했어요. 방문 전에 공식 안내를 확인해 주세요.'
        : '별도 예약 없이 방문할 수 있는 장소로 분류했어요.';
  const bookingLabel = bookingRequirement === 'required' ? '예약 필수' : bookingRequirement === 'recommended' ? '예약 권장' : bookingRequirement === 'unknown' ? '예약 여부 확인' : '예약 불필요';

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
          {loading ? <PlaceDetailSkeleton /> : <>
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

          <View style={[styles.bookingCard, bookingStatus && styles.bookingCardDone]}>
            <View style={styles.bookingHeader}><View style={[styles.bookingIcon, bookingStatus && styles.bookingIconDone]}><Ionicons name={bookingStatus ? 'checkmark' : bookingRequirement === 'none' ? 'checkmark-circle-outline' : 'ticket-outline'} size={19} color={bookingStatus ? '#FFFFFF' : colors.primaryDark} /></View><View style={styles.bookingCopy}><View style={styles.bookingTitleRow}><Text style={styles.bookingTitle}>{bookingStatus ? '예약 완료' : bookingLabel}</Text><View style={styles.mockBadge}><Text style={styles.mockBadgeText}>임시 정보</Text></View></View><Text style={styles.bookingDescription}>{bookingStatus ? '예약 상태를 일정에 저장했어요. 외부 연동 후에는 예약 내역과 바우처를 확인할 수 있어요.' : place.bookingNote ?? bookingCopy}</Text></View></View>
            <Text style={styles.bookingSource}>현재는 샘플 분류이며 실제 예약 정책은 공식 페이지에서 확인해야 해요.</Text>
            {bookingRequirement !== 'none' ? <View style={styles.bookingActions}><Pressable accessibilityRole="button" onPress={onOpenBooking} style={({ pressed }) => [styles.bookingLink, pressed && styles.bookingPressed]}><Ionicons name="open-outline" size={16} color="#FFFFFF" /><Text style={styles.bookingLinkText}>{bookingStatus ? '예약 내역 보기' : '예약 페이지로 이동'}</Text></Pressable><Pressable accessibilityRole="button" onPress={onToggleBooking} style={({ pressed }) => [styles.bookingState, pressed && styles.bookingPressed]}><Ionicons name={bookingStatus ? 'refresh-outline' : 'checkmark-circle-outline'} size={16} color={colors.primaryDark} /><Text style={styles.bookingStateText}>{bookingStatus ? '예약 완료 취소' : '예약 완료로 표시'}</Text></Pressable></View> : null}
          </View>
          </>}
        </ScrollView>

        {loading ? <View style={styles.actions}><SkeletonBlock style={styles.actionSkeleton} /><SkeletonBlock style={styles.actionSkeleton} /></View> : <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={isLocked} onPress={onRegenerate} style={[styles.secondaryButton, isLocked && styles.buttonDisabled]}>
            <Ionicons name="refresh" size={17} color={colors.primaryDark} /><Text style={styles.secondaryText}>다른 장소 추천</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={isLocked} onPress={onKeep} style={[styles.primaryButton, isLocked && styles.buttonDisabled]}>
            <Ionicons name={isLocked ? 'lock-closed' : 'checkmark'} size={18} color="#FFFFFF" /><Text style={styles.primaryText}>{isLocked ? '일정에 유지 중' : '이 장소 유지'}</Text>
          </Pressable>
        </View>}
      </View>
    </View>
  </Modal>;
}

function PlaceDetailSkeleton() {
  return <SkeletonGroup style={styles.skeletonBody}>
    <View style={styles.skeletonHero}><SkeletonBlock style={styles.skeletonIcon} /><View style={styles.skeletonCopy}><SkeletonBlock style={styles.skeletonTag} /><SkeletonBlock style={styles.skeletonTitle} /><SkeletonBlock style={styles.skeletonShort} /></View></View>
    <SkeletonBlock style={styles.skeletonLine} /><SkeletonBlock style={styles.skeletonLineWide} />
    <View style={styles.skeletonGrid}><SkeletonBlock style={styles.skeletonInfo} /><SkeletonBlock style={styles.skeletonInfo} /></View>
    <SkeletonBlock style={styles.skeletonCard} /><SkeletonBlock style={styles.skeletonBooking} />
  </SkeletonGroup>;
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
  bookingCard: { borderRadius: 19, borderWidth: 1, borderColor: '#E4E5FF', backgroundColor: '#F8F8FF', padding: 14, marginTop: 12 },
  bookingCardDone: { borderColor: '#C8CCFF' },
  bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookingIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  bookingIconDone: { backgroundColor: colors.primary },
  bookingCopy: { flex: 1, minWidth: 0 },
  bookingTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  bookingTitle: { color: colors.text, fontSize: 12, fontWeight: '900' },
  mockBadge: { borderRadius: 7, backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 3 },
  mockBadgeText: { color: colors.textMuted, fontSize: 7, fontWeight: '800' },
  bookingDescription: { color: colors.textSecondary, fontSize: 9, lineHeight: 15, marginTop: 4 },
  bookingSource: { color: colors.textMuted, fontSize: 8, lineHeight: 13, marginTop: 11 },
  bookingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 11 },
  bookingLink: { flexBasis: 140, flexGrow: 1, minWidth: 0, minHeight: 46, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  bookingLinkText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  bookingState: { flexBasis: 140, flexGrow: 1, minWidth: 0, minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  bookingStateText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  bookingPressed: { opacity: 0.74 },
  actions: { paddingHorizontal: spacing.lg, flexDirection: 'row', gap: 9 },
  secondaryButton: { flex: 1, minWidth: 0, minHeight: 50, borderRadius: 17, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secondaryText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  primaryButton: { flex: 1, minWidth: 0, minHeight: 50, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  primaryText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  buttonDisabled: { opacity: 0.55 },
  skeletonBody: { gap: 10 }, skeletonHero: { flexDirection: 'row', alignItems: 'center', gap: 14 }, skeletonIcon: { width: 64, height: 64, flexShrink: 0, borderRadius: 22 }, skeletonCopy: { flex: 1, minWidth: 0, gap: 7 }, skeletonTag: { width: 84, height: 19, borderRadius: 7 }, skeletonTitle: { width: '78%', height: 22, borderRadius: 8 }, skeletonShort: { width: 72, height: 12, borderRadius: 6 }, skeletonLine: { width: '94%', height: 13, borderRadius: 7, marginTop: 12 }, skeletonLineWide: { width: '72%', height: 13, borderRadius: 7 }, skeletonGrid: { flexDirection: 'row', gap: 10, marginTop: 8 }, skeletonInfo: { flex: 1, minWidth: 0, height: 100, borderRadius: 18 }, skeletonCard: { height: 82, borderRadius: 18, marginTop: 2 }, skeletonBooking: { height: 118, borderRadius: 19 }, actionSkeleton: { flex: 1, minWidth: 0, height: 50, borderRadius: 17 },
});
