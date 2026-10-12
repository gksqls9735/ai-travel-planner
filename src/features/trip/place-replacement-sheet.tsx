import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow, spacing } from '@/features/trip/theme';

export type ReplacementSource = {
  alt: string[];
  category: string;
  duration: string;
  icon: string;
  name: string;
};

export type ReplacementCandidate = {
  category: string;
  duration: string;
  icon: string;
  name: string;
};

type Props = {
  onClose: () => void;
  onSelect: (candidate: ReplacementCandidate) => void;
  place: ReplacementSource | null;
};

function getEmoji(name: string, fallback: string) {
  if (/스시|시장|브런치|라멘|우동|런치|야키|이자카야|오니기리/.test(name)) return '🍽️';
  if (/신사|문화관/.test(name)) return '⛩️';
  if (/미술관|박물관/.test(name)) return '🖼️';
  if (/공원|정원/.test(name)) return '🌿';
  if (/전망대|스카이/.test(name)) return '🌇';
  if (/산책|긴자|메구로/.test(name)) return '🚶';
  return fallback || '📍';
}

export function PlaceReplacementSheet({ onClose, onSelect, place }: Props) {
  const insets = useSafeAreaInsets();
  if (!place) return null;

  const candidates = place.alt.slice(0, 3).map((name, index) => ({
    name,
    category: place.category,
    duration: place.duration,
    icon: getEmoji(name, place.icon),
    routeLabel: index === 0 ? '이동 6분 절약' : index === 1 ? '현재 동선과 비슷' : '이동 4분 추가',
    reason: index === 0 ? '취향과 동선을 함께 고려한 가장 가까운 추천' : '비슷한 분위기를 즐길 수 있는 대안 장소',
  }));

  return <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
    <View style={styles.overlay}>
      <Pressable accessibilityLabel="대체 장소 선택 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerCopy}><Text style={styles.eyebrow}>PLACE OPTIONS</Text><Text style={styles.title}>어디로 바꿀까요?</Text><Text style={styles.subtitle}>현재 장소 · {place.name}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" hitSlop={6} onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {candidates.map((candidate, index) => <Pressable accessibilityRole="button" key={candidate.name} onPress={() => onSelect(candidate)} style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}>
            <View style={styles.rank}><Text style={styles.rankText}>{index + 1}</Text></View>
            <View style={styles.optionIcon}><Text style={styles.optionEmoji}>{candidate.icon}</Text></View>
            <View style={styles.optionCopy}>
              <View style={styles.optionTop}><Text numberOfLines={2} style={styles.optionName}>{candidate.name}</Text><View style={[styles.routeTag, index === 0 && styles.routeTagBest]}><Text style={[styles.routeTagText, index === 0 && styles.routeTagTextBest]}>{candidate.routeLabel}</Text></View></View>
              <Text style={styles.optionMeta}>{candidate.category} · {candidate.duration}</Text>
              <Text numberOfLines={2} style={styles.optionReason}>{candidate.reason}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>)}
        </ScrollView>

        <Pressable accessibilityRole="button" onPress={onClose} style={styles.keepButton}><Text style={styles.keepText}>현재 장소 유지하기</Text></Pressable>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(19,22,38,0.5)' },
  sheet: { width: '100%', maxWidth: 680, maxHeight: '84%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: spacing.md, ...shadow.float },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 78, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 0.8, fontWeight: '900' },
  title: { color: colors.text, fontSize: 21, lineHeight: 27, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  subtitle: { color: colors.textSecondary, fontSize: 10, marginTop: 5 },
  closeButton: { width: 44, height: 44, flexShrink: 0, borderRadius: 16, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  options: { gap: 10, paddingTop: spacing.sm, paddingBottom: spacing.md },
  option: { width: '100%', minHeight: 102, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  optionPressed: { backgroundColor: '#F8F8FF', borderColor: '#C9CDFF' },
  rank: { position: 'absolute', left: 8, top: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  rankText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' },
  optionIcon: { width: 52, height: 52, flexShrink: 0, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  optionEmoji: { fontSize: 23 },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  optionName: { flex: 1, minWidth: 0, color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  routeTag: { flexShrink: 0, borderRadius: 8, backgroundColor: colors.surfaceSubtle, paddingHorizontal: 7, paddingVertical: 4 },
  routeTagBest: { backgroundColor: '#EAF7F1' },
  routeTagText: { color: colors.textSecondary, fontSize: 8, fontWeight: '800' },
  routeTagTextBest: { color: '#24825D' },
  optionMeta: { color: colors.textSecondary, fontSize: 9, marginTop: 4 },
  optionReason: { color: colors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 5 },
  keepButton: { minHeight: 50, borderRadius: 17, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  keepText: { color: colors.textSecondary, fontSize: 11, fontWeight: '900' },
});
