import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow, spacing } from '@/features/trip/theme';

export type AddPlaceCandidate = { name: string; category: string; duration: string; icon: string; alt: string[] };

type Props = {
  destination: string;
  onAdd: (place: AddPlaceCandidate) => void;
  onClose: () => void;
  visible: boolean;
};

const suggestions: AddPlaceCandidate[] = [
  { name: '아사쿠사 문화관광센터', category: '전망·문화', duration: '1시간', icon: '🏙️', alt: ['스미다 문화관', '에도 시타마치 전통공예관'] },
  { name: '야나카 긴자', category: '골목 산책', duration: '1시간 30분', icon: '🚶', alt: ['네즈 골목', '가구라자카 산책'] },
  { name: '도쿄 로컬 카페', category: '카페', duration: '1시간', icon: '☕', alt: ['정원 카페', '로스터리 카페'] },
  { name: '도쿄 도청 전망대', category: '전망대', duration: '1시간', icon: '🌇', alt: ['롯폰기 전망대', '선샤인 전망대'] },
];

export function PlaceAddSheet({ destination, onAdd, onClose, visible }: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? suggestions.filter((item) => `${item.name} ${item.category}`.toLowerCase().includes(value)) : suggestions;
  }, [query]);
  if (!visible) return null;

  const customPlace: AddPlaceCandidate = { name: query.trim(), category: '직접 추가', duration: '1시간', icon: '📍', alt: ['가까운 추천 장소', '비슷한 분위기의 장소'] };

  return <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
    <View style={styles.overlay}>
      <Pressable accessibilityLabel="장소 추가 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
        <View style={styles.handle} />
        <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.eyebrow}>ADD A PLACE</Text><Text style={styles.title}>어디를 추가할까요?</Text><Text style={styles.subtitle}>{destination || '여행지'} 일정에 직접 장소를 넣어요.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>
        <View style={styles.search}><Ionicons name="search" size={18} color={colors.primary} /><TextInput autoFocus accessibilityLabel="추가할 장소 검색" onChangeText={setQuery} placeholder="장소명 검색 또는 직접 입력" placeholderTextColor={colors.textMuted} style={styles.searchInput} value={query} />{query ? <Pressable accessibilityLabel="검색어 지우기" onPress={() => setQuery('')} style={styles.clear}><Ionicons name="close" size={17} color={colors.textMuted} /></Pressable> : null}</View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.results} showsVerticalScrollIndicator={false}>
          {query.trim() && !matches.some((item) => item.name === query.trim()) ? <Pressable onPress={() => onAdd(customPlace)} style={({ pressed }) => [styles.custom, pressed && styles.pressed]}><View style={styles.customIcon}><Ionicons name="add" size={21} color="#FFFFFF" /></View><View style={styles.resultCopy}><Text style={styles.resultName}>“{query.trim()}” 직접 추가</Text><Text style={styles.resultMeta}>체류시간 1시간 · 추가 후 수정 가능</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable> : null}
          {matches.map((place) => <Pressable key={place.name} onPress={() => onAdd(place)} style={({ pressed }) => [styles.result, pressed && styles.pressed]}><View style={styles.resultIcon}><Text style={styles.emoji}>{place.icon}</Text></View><View style={styles.resultCopy}><Text style={styles.resultName}>{place.name}</Text><Text style={styles.resultMeta}>{place.category} · {place.duration}</Text></View><View style={styles.addIcon}><Ionicons name="add" size={18} color={colors.primaryDark} /></View></Pressable>)}
          {!matches.length && !query.trim() ? <Text style={styles.empty}>장소명을 입력해 주세요.</Text> : null}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(19,22,38,0.5)' },
  sheet: { width: '100%', maxWidth: 680, maxHeight: '86%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: spacing.md, ...shadow.float },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 86, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 }, title: { color: colors.text, fontSize: 21, lineHeight: 27, fontWeight: '900', marginTop: 3 }, subtitle: { color: colors.textSecondary, fontSize: 10, marginTop: 5 }, closeButton: { width: 44, height: 44, flexShrink: 0, borderRadius: 16, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  search: { minHeight: 56, borderRadius: 18, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 13 }, searchInput: { flex: 1, minWidth: 0, height: 54, color: colors.text, fontSize: 13, outlineStyle: 'none' } as never, clear: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  results: { gap: 9, paddingTop: 14 }, result: { minHeight: 74, borderRadius: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11 }, custom: { minHeight: 70, borderRadius: 18, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11 }, pressed: { opacity: 0.72 }, customIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, resultIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 15, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, emoji: { fontSize: 20 }, resultCopy: { flex: 1, minWidth: 0 }, resultName: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '900' }, resultMeta: { color: colors.textSecondary, fontSize: 9, marginTop: 4 }, addIcon: { width: 34, height: 34, flexShrink: 0, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, empty: { color: colors.textSecondary, textAlign: 'center', padding: 24 },
});
