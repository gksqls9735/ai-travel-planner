import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PackingChecklistCategory, PackingChecklistCustomCategory, PackingChecklistItem, TripState } from '@/features/trip/trip-context';
import { colors, shadow, spacing } from '@/features/trip/theme';

type Props = {
  customCategories: PackingChecklistCustomCategory[];
  destination: string;
  items: PackingChecklistItem[];
  onCategoriesChange: (categories: PackingChecklistCustomCategory[]) => void;
  onChange: (items: PackingChecklistItem[]) => void;
  onClose: () => void;
  visible: boolean;
};

type CategoryOption = { id: PackingChecklistCategory; label: string; icon: keyof typeof Ionicons.glyphMap; custom?: boolean };

const baseCategories: CategoryOption[] = [
  { id: 'documents', label: '여권 · 서류', icon: 'document-text-outline' },
  { id: 'electronics', label: '전자기기', icon: 'phone-portrait-outline' },
  { id: 'clothing', label: '의류', icon: 'shirt-outline' },
  { id: 'toiletries', label: '세면 · 건강', icon: 'medkit-outline' },
  { id: 'activity', label: '일정 맞춤', icon: 'sparkles-outline' },
  { id: 'custom', label: '기타', icon: 'create-outline' },
];

export function createPackingChecklist(trip: TripState): PackingChecklistItem[] {
  const result: PackingChecklistItem[] = [];
  const add = (id: string, category: PackingChecklistCategory, label: string, aiRecommended = false) => {
    if (!result.some((item) => item.label === label)) result.push({ id, category, label, checked: false, aiRecommended });
  };

  add('documents-passport', 'documents', '여권과 여권 사본');
  add('documents-wallet', 'documents', '해외 결제 카드와 현지 화폐');
  add('documents-bookings', 'documents', '항공권 · 숙소 예약 내역');
  add('electronics-charger', 'electronics', '휴대폰 충전기');
  add('electronics-battery', 'electronics', '보조 배터리');
  add('clothing-basics', 'clothing', '속옷과 양말');
  add('toiletries-kit', 'toiletries', '세면도구와 상비약');

  const destinations = [trip.destination, ...trip.destinationStops.map((stop) => stop.city)].join(' ');
  const japanTrip = /도쿄|오사카|교토|일본/.test(destinations);
  if (japanTrip) {
    add('ai-japan-adapter', 'electronics', '110V 변환 어댑터', true);
    add('ai-japan-entry', 'documents', 'Visit Japan Web 화면 저장', true);
  }

  const month = Number(trip.startDate.split('-')[1] ?? 0);
  if ([3, 4, 9, 10, 11].includes(month)) add('ai-season-layer', 'clothing', '일교차용 얇은 겉옷', true);
  if ([6, 7, 8].includes(month)) add('ai-season-sun', 'toiletries', '선크림과 휴대용 선풍기', true);
  if ([12, 1, 2].includes(month)) add('ai-season-warm', 'clothing', '보온 겉옷과 장갑', true);

  if (trip.companions.some((item) => /아이|아기/.test(item))) add('ai-child', 'activity', '아이용 상비약과 간식', true);
  if (trip.companions.some((item) => /부모/.test(item))) add('ai-parents', 'activity', '복용약과 편한 신발', true);
  if (trip.interests.some((item) => /산책|자연|액티비티/.test(item))) add('ai-walking', 'activity', '오래 걸어도 편한 신발', true);
  if (trip.interests.some((item) => /온천|수영/.test(item))) add('ai-water', 'activity', '수영복과 방수팩', true);

  return result;
}

export function PackingChecklistSheet({ customCategories, destination, items, onCategoriesChange, onChange, onClose, visible }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const [categoryDraft, setCategoryDraft] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<PackingChecklistCategory>('custom');
  const [expanded, setExpanded] = useState<Record<PackingChecklistCategory, boolean>>({
    documents: true, electronics: true, clothing: true, toiletries: true, activity: true, custom: true,
  });
  const categories = useMemo<CategoryOption[]>(() => [
    ...baseCategories,
    ...customCategories.map((category) => ({ ...category, icon: 'albums-outline' as const, custom: true })),
  ], [customCategories]);
  const completeCount = items.filter((item) => item.checked).length;
  const progress = items.length ? completeCount / items.length : 0;
  const grouped = useMemo(() => Object.fromEntries(categories.map((category) => [category.id, items.filter((item) => item.category === category.id)])) as Record<PackingChecklistCategory, PackingChecklistItem[]>, [categories, items]);

  const toggle = (id: string) => onChange(items.map((item) => item.id === id ? { ...item, checked: !item.checked } : item));
  const remove = (id: string) => onChange(items.filter((item) => item.id !== id));
  const addCustom = () => {
    const label = draft.trim();
    if (!label || items.some((item) => item.label === label)) return;
    onChange([...items, { id: `custom-${Date.now()}`, category: selectedCategory, label, checked: false, custom: true }]);
    setExpanded((current) => ({ ...current, [selectedCategory]: true }));
    setDraft('');
  };
  const addCategory = () => {
    const label = categoryDraft.trim();
    if (!label || categories.some((category) => category.label === label)) return;
    const category = { id: `user-${Date.now()}`, label };
    onCategoriesChange([...customCategories, category]);
    setExpanded((current) => ({ ...current, [category.id]: true }));
    setSelectedCategory(category.id);
    setCategoryDraft('');
    setAddingCategory(false);
  };
  const deleteCategory = (id: string) => {
    onCategoriesChange(customCategories.filter((category) => category.id !== id));
    onChange(items.map((item) => item.category === id ? { ...item, category: 'custom' } : item));
    if (selectedCategory === id) setSelectedCategory('custom');
  };
  const close = () => { setDraft(''); setCategoryDraft(''); setAddingCategory(false); onClose(); };

  if (!visible) return null;
  return <Modal animationType="slide" onRequestClose={close} statusBarTranslucent transparent visible>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <Pressable accessibilityLabel="준비물 체크리스트 닫기" onPress={close} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>TRIP CHECKLIST</Text>
            <Text style={styles.title}>여행 준비물</Text>
            <Text numberOfLines={2} style={styles.subtitle}>{destination || '이번 여행'} 일정에 맞춰 먼저 챙겨봤어요.</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={close} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.text} /></Pressable>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTop}><Text style={styles.progressTitle}>{completeCount === items.length && items.length ? '준비 완료!' : '짐 챙기는 중'}</Text><Text style={styles.progressCount}>{completeCount}/{items.length}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} /></View>
          <Text style={styles.progressCaption}>{Math.round(progress * 100)}% 완료했어요</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {categories.map((category) => {
            const categoryItems = grouped[category.id] ?? [];
            const completed = categoryItems.filter((item) => item.checked).length;
            const isExpanded = expanded[category.id];
            if ((category.id === 'custom' || category.custom) && !categoryItems.length) return null;
            if (category.id === 'activity' && !categoryItems.length) return null;
            return <View key={category.id} style={styles.group}>
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: isExpanded }} onPress={() => setExpanded((current) => ({ ...current, [category.id]: !current[category.id] }))} style={styles.groupHeader}>
                <View style={styles.groupIcon}><Ionicons name={category.icon} size={18} color={colors.primaryDark} /></View>
                <Text style={styles.groupTitle}>{category.label}</Text>
                <Text style={styles.groupCount}>{completed}/{categoryItems.length}</Text>
                <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
              </Pressable>
              {isExpanded ? <View style={styles.items}>{categoryItems.map((item) => <View key={item.id} style={styles.itemRow}>
                <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: item.checked }} onPress={() => toggle(item.id)} style={styles.itemMain}>
                  <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>{item.checked ? <Ionicons name="checkmark" size={15} color="#FFFFFF" /> : null}</View>
                  <View style={styles.itemCopy}><View style={styles.itemTitleRow}><Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]}>{item.label}</Text>{item.aiRecommended ? <View style={styles.aiBadge}><Ionicons name="sparkles" size={9} color={colors.primaryDark} /><Text style={styles.aiBadgeText}>AI 맞춤</Text></View> : null}</View></View>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityLabel={`${item.label} 삭제`} onPress={() => remove(item.id)} style={styles.deleteButton}><Ionicons name="trash-outline" size={17} color={colors.textMuted} /></Pressable>
              </View>)}</View> : null}
            </View>;
          })}

          {!items.length ? <View style={styles.emptyState}><View style={styles.emptyIcon}><Ionicons name="bag-handle-outline" size={24} color={colors.primaryDark} /></View><Text style={styles.emptyTitle}>준비물 목록이 비어 있어요</Text><Text style={styles.emptyDescription}>아래에서 필요한 카테고리와 물품을 직접 추가해 보세요.</Text></View> : null}

          <View style={styles.addSection}>
            <Text style={styles.addTitle}>내 물품 추가</Text>
            <Text style={styles.fieldLabel}>카테고리 선택</Text>
            <View style={styles.categoryOptions}>
              {categories.map((category) => {
                const selected = selectedCategory === category.id;
                return <View key={category.id} style={[styles.categoryChip, selected && styles.categoryChipSelected]}>
                  <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={() => setSelectedCategory(category.id)} style={styles.categoryChipMain}>
                    <Ionicons name={category.icon} size={14} color={selected ? '#FFFFFF' : colors.textSecondary} />
                    <Text numberOfLines={1} style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{category.label}</Text>
                  </Pressable>
                  {category.custom ? <Pressable accessibilityRole="button" accessibilityLabel={`${category.label} 카테고리 삭제`} onPress={() => deleteCategory(category.id)} style={styles.categoryDelete}><Ionicons name="close" size={15} color={selected ? '#FFFFFF' : colors.textMuted} /></Pressable> : null}
                </View>;
              })}
              <Pressable accessibilityRole="button" accessibilityState={{ expanded: addingCategory }} onPress={() => setAddingCategory((value) => !value)} style={styles.newCategoryButton}><Ionicons name="add" size={16} color={colors.primaryDark} /><Text style={styles.newCategoryText}>카테고리</Text></Pressable>
            </View>
            {addingCategory ? <View style={styles.categoryCreateRow}>
              <TextInput accessibilityLabel="새 카테고리 이름" enterKeyHint="done" onChangeText={setCategoryDraft} onSubmitEditing={addCategory} placeholder="예: 촬영 장비" placeholderTextColor={colors.textMuted} returnKeyType="done" style={styles.categoryInput} value={categoryDraft} />
              <Pressable accessibilityRole="button" disabled={!categoryDraft.trim()} onPress={addCategory} style={[styles.categoryConfirm, !categoryDraft.trim() && styles.addButtonDisabled]}><Text style={styles.categoryConfirmText}>만들기</Text></Pressable>
            </View> : null}
            <Text style={styles.fieldLabel}>물품 이름</Text>
            <View style={styles.addRow}>
              <TextInput accessibilityLabel="추가할 준비물" enterKeyHint="done" onChangeText={setDraft} onSubmitEditing={addCustom} placeholder="예: 목베개, 카메라" placeholderTextColor={colors.textMuted} returnKeyType="done" style={styles.input} value={draft} />
              <Pressable accessibilityRole="button" accessibilityLabel="준비물 추가" disabled={!draft.trim()} onPress={addCustom} style={[styles.addButton, !draft.trim() && styles.addButtonDisabled]}><Ionicons name="add" size={22} color="#FFFFFF" /></Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(19,22,38,0.5)' },
  sheet: { width: '100%', maxWidth: 680, maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: spacing.md, ...shadow.float },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 84, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 0.8, fontWeight: '900' },
  title: { color: colors.text, fontSize: 22, lineHeight: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 }, subtitle: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 4 },
  closeButton: { width: 44, height: 44, flexShrink: 0, borderRadius: 16, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  progressCard: { borderRadius: 20, backgroundColor: colors.primarySoft, padding: 15, marginHorizontal: spacing.sm, marginBottom: 12 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, progressTitle: { flex: 1, minWidth: 0, color: colors.text, fontSize: 13, fontWeight: '900' }, progressCount: { flexShrink: 0, color: colors.primaryDark, fontSize: 12, fontWeight: '900' },
  progressTrack: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: '#D9DCFA', marginTop: 11 }, progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary }, progressCaption: { color: colors.textSecondary, fontSize: 9, marginTop: 7 },
  content: { paddingHorizontal: spacing.sm, paddingBottom: spacing.md, gap: 10 },
  group: { borderWidth: 1, borderColor: colors.border, borderRadius: 20, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  groupHeader: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12 }, groupIcon: { width: 34, height: 34, flexShrink: 0, borderRadius: 11, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, groupTitle: { flex: 1, minWidth: 0, color: colors.text, fontSize: 12, fontWeight: '900' }, groupCount: { flexShrink: 0, color: colors.textMuted, fontSize: 9, fontWeight: '800' },
  items: { borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 10, paddingVertical: 4 }, itemRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  itemMain: { flex: 1, minWidth: 0, minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 }, checkbox: { width: 24, height: 24, flexShrink: 0, borderRadius: 8, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary }, itemCopy: { flex: 1, minWidth: 0 }, itemTitleRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }, itemLabel: { flexShrink: 1, color: colors.text, fontSize: 11, lineHeight: 17, fontWeight: '700' }, itemLabelChecked: { color: colors.textMuted, textDecorationLine: 'line-through' }, aiBadge: { flexShrink: 0, minHeight: 22, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 8, backgroundColor: colors.primarySoft, paddingHorizontal: 6 }, aiBadgeText: { color: colors.primaryDark, fontSize: 8, fontWeight: '900' }, deleteButton: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  emptyState: { minHeight: 150, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: 20, backgroundColor: '#FAFAFD', alignItems: 'center', justifyContent: 'center', padding: 18 }, emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 }, emptyTitle: { color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'center' }, emptyDescription: { maxWidth: 260, color: colors.textSecondary, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 5 },
  addSection: { borderRadius: 20, backgroundColor: colors.surfaceSubtle, padding: 12 }, addTitle: { color: colors.text, fontSize: 12, fontWeight: '900', marginBottom: 12 }, fieldLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800', marginBottom: 7 },
  categoryOptions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 7, marginBottom: 12 }, categoryChip: { minHeight: 44, maxWidth: '100%', flexShrink: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', overflow: 'hidden' }, categoryChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary }, categoryChipMain: { minHeight: 44, minWidth: 44, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 10, paddingRight: 10 }, categoryChipText: { minWidth: 0, flexShrink: 1, color: colors.textSecondary, fontSize: 9, fontWeight: '800' }, categoryChipTextSelected: { color: '#FFFFFF' }, categoryDelete: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center', borderLeftWidth: 1, borderLeftColor: 'rgba(160,166,180,0.22)' }, newCategoryButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, paddingHorizontal: 10 }, newCategoryText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' },
  categoryCreateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -4, marginBottom: 12 }, categoryInput: { flex: 1, minWidth: 0, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', color: colors.text, fontSize: 11, paddingHorizontal: 13 }, categoryConfirm: { minWidth: 68, height: 46, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, categoryConfirmText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, input: { flex: 1, minWidth: 0, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', color: colors.text, fontSize: 11, paddingHorizontal: 13 }, addButton: { width: 46, height: 46, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, addButtonDisabled: { opacity: 0.38 },
});
