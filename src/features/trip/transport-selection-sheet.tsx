import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, shadow, spacing } from '@/features/trip/theme';

export type TransportId = 'transit' | 'taxi' | 'walk';
export type TransportOption = {
  id: TransportId;
  label: string;
  minutes: number;
  detail: string;
  price: string;
  note?: string;
};

type Props = {
  from: string;
  onClose: () => void;
  onSelect: (option: TransportOption) => void;
  options: TransportOption[];
  selectedId: TransportId;
  to: string;
  visible: boolean;
};

const iconNames = { transit: 'subway-outline', taxi: 'car-outline', walk: 'walk-outline' } as const;

export function TransportSelectionSheet({ from, onClose, onSelect, options, selectedId, to, visible }: Props) {
  const insets = useSafeAreaInsets();
  if (!visible) return null;

  return <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
    <View style={styles.overlay}>
      <Pressable accessibilityLabel="이동수단 선택 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>ROUTE OPTIONS</Text>
            <Text style={styles.title}>어떻게 이동할까요?</Text>
            <Text numberOfLines={2} style={styles.route}>{from}  →  {to}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" hitSlop={6} onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.options} showsVerticalScrollIndicator={false}>
          {options.map((option, index) => {
            const selected = option.id === selectedId;
            return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option.id} onPress={() => onSelect(option)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}>
              <View style={[styles.optionIcon, selected && styles.optionIconSelected]}><Ionicons name={iconNames[option.id]} size={23} color={selected ? '#FFFFFF' : colors.primaryDark} /></View>
              <View style={styles.optionCopy}>
                <View style={styles.optionTitleRow}><Text style={styles.optionTitle}>{option.label}</Text>{index === 0 ? <View style={styles.recommended}><Text style={styles.recommendedText}>추천</Text></View> : null}</View>
                <Text style={styles.optionDetail}>{option.detail}</Text>
                {option.note ? <Text style={styles.optionNote}>{option.note}</Text> : null}
              </View>
              <View style={styles.optionSummary}><Text style={styles.optionTime}>{option.minutes}분</Text><Text style={styles.optionPrice}>{option.price}</Text>{selected ? <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.check} /> : <Ionicons name="chevron-forward" size={17} color={colors.textMuted} style={styles.check} />}</View>
            </Pressable>;
          })}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(19,22,38,0.5)' },
  sheet: { width: '100%', maxWidth: 680, maxHeight: '84%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: spacing.md, ...shadow.float },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 88, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 },
  eyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 0.8, fontWeight: '900' },
  title: { color: colors.text, fontSize: 21, lineHeight: 27, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 },
  route: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 5 },
  closeButton: { width: 44, height: 44, flexShrink: 0, borderRadius: 16, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  options: { gap: 10, paddingTop: spacing.sm },
  option: { width: '100%', minHeight: 88, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  optionSelected: { borderColor: colors.primary, backgroundColor: '#F8F8FF' },
  optionPressed: { opacity: 0.78 },
  optionIcon: { width: 48, height: 48, flexShrink: 0, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  optionIconSelected: { backgroundColor: colors.primary },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  optionTitle: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  recommended: { borderRadius: 7, backgroundColor: '#EAF7F1', paddingHorizontal: 6, paddingVertical: 3 },
  recommendedText: { color: '#24825D', fontSize: 8, fontWeight: '900' },
  optionDetail: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 4 },
  optionNote: { color: colors.primaryDark, fontSize: 8, lineHeight: 12, fontWeight: '800', marginTop: 3 },
  optionSummary: { minWidth: 58, flexShrink: 0, alignItems: 'flex-end' },
  optionTime: { color: colors.text, fontSize: 13, fontWeight: '900' },
  optionPrice: { color: colors.textMuted, fontSize: 8, marginTop: 3 },
  check: { marginTop: 7 },
});
