import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TravelExpense, TravelExpenseCategory } from '@/features/trip/trip-context';
import { colors, shadow, spacing } from '@/features/trip/theme';

export type TravelCurrency = { code: string; name: string; symbol: string };

type ExpenseEntryProps = {
  categoryHint: string;
  currency: TravelCurrency;
  day: number;
  onClose: () => void;
  onSave: (expense: Omit<TravelExpense, 'id'>) => void;
  placeName: string;
};

type BudgetOverviewProps = {
  budget: number;
  currency: TravelCurrency;
  expenses: TravelExpense[];
  onAddExpense: () => void;
  onClose: () => void;
  onDeleteExpense: (id: string) => void;
  onUpdateBudget: (budget: number) => void;
};

const expenseCategories: { id: TravelExpenseCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'food', label: '식비', icon: 'restaurant-outline' },
  { id: 'transport', label: '교통', icon: 'bus-outline' },
  { id: 'ticket', label: '입장권', icon: 'ticket-outline' },
  { id: 'shopping', label: '쇼핑', icon: 'bag-handle-outline' },
  { id: 'lodging', label: '숙박', icon: 'bed-outline' },
  { id: 'other', label: '기타', icon: 'ellipsis-horizontal' },
];

export function getTravelCurrency(destination: string): TravelCurrency {
  if (/도쿄|오사카|교토|일본/.test(destination)) return { code: 'JPY', name: '일본 엔', symbol: '¥' };
  if (/파리|프랑스/.test(destination)) return { code: 'EUR', name: '유로', symbol: '€' };
  if (/뉴욕|미국/.test(destination)) return { code: 'USD', name: '미국 달러', symbol: '$' };
  if (/방콕|태국/.test(destination)) return { code: 'THB', name: '태국 바트', symbol: '฿' };
  if (/다낭|베트남/.test(destination)) return { code: 'VND', name: '베트남 동', symbol: '₫' };
  return { code: 'KRW', name: '원', symbol: '₩' };
}

export function guessExpenseCategory(categoryHint: string): TravelExpenseCategory {
  if (/맛집|식사|카페|브런치/.test(categoryHint)) return 'food';
  if (/교통|이동/.test(categoryHint)) return 'transport';
  if (/숙소|호텔/.test(categoryHint)) return 'lodging';
  if (/쇼핑|시장/.test(categoryHint)) return 'shopping';
  if (/박물관|미술관|전망대|공연|체험|전시/.test(categoryHint)) return 'ticket';
  return 'other';
}

export function formatMoney(amount: number, currency: TravelCurrency) {
  const rounded = Math.round(amount);
  const normalized = Object.is(rounded, -0) ? 0 : rounded;
  return `${currency.symbol}${normalized.toLocaleString('ko-KR')}`;
}

function formatAmountInput(value: string) {
  const sanitized = value.replace(/,/g, '').replace(/[^0-9.]/g, '');
  const decimalIndex = sanitized.indexOf('.');
  const wholeRaw = (decimalIndex >= 0 ? sanitized.slice(0, decimalIndex) : sanitized).replace(/^0+(?=\d)/, '');
  const whole = (wholeRaw || (decimalIndex >= 0 ? '0' : '')).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (decimalIndex < 0) return whole;
  const decimal = sanitized.slice(decimalIndex + 1).replace(/\./g, '').slice(0, 2);
  return `${whole}.${decimal}`;
}

function categoryMeta(id: TravelExpenseCategory) {
  return expenseCategories.find((category) => category.id === id) ?? expenseCategories[5];
}

export function ExpenseEntrySheet({ categoryHint, currency, day, onClose, onSave, placeName }: ExpenseEntryProps) {
  const insets = useSafeAreaInsets();
  const [amountDraft, setAmountDraft] = useState('');
  const [category, setCategory] = useState<TravelExpenseCategory>(() => guessExpenseCategory(categoryHint));
  const [note, setNote] = useState('');
  const amount = Number(amountDraft.replace(/,/g, '')) || 0;
  const save = () => {
    if (amount <= 0) return;
    onSave({ amount, category, currencyCode: currency.code, day, note: note.trim(), placeName });
  };

  return <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <Pressable accessibilityLabel="지출 입력 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
        <View style={styles.handle} />
        <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.eyebrow}>ADD EXPENSE</Text><Text style={styles.title}>지출 내역 추가</Text><Text numberOfLines={2} style={styles.subtitle}>Day {day} · {placeName}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>

        <ScrollView contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.amountCard}>
            <Text style={styles.fieldLabel}>현지 통화 금액</Text>
            <View style={styles.amountRow}><Text style={styles.currencySymbol}>{currency.symbol}</Text><TextInput accessibilityLabel={`${currency.name} 지출 금액`} autoFocus inputMode="decimal" keyboardType="decimal-pad" onChangeText={(value) => setAmountDraft(formatAmountInput(value))} placeholder="0" placeholderTextColor={colors.textMuted} style={styles.amountInput} value={amountDraft} /></View>
            <Text style={styles.currencyCaption}>{currency.name} 기준으로 기록해요.</Text>
          </View>

          <Text style={styles.sectionLabel}>카테고리</Text>
          <View style={styles.categoryGrid}>{expenseCategories.map((option) => { const selected = option.id === category; return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={option.id} onPress={() => setCategory(option.id)} style={[styles.categoryOption, selected && styles.categoryOptionSelected]}><Ionicons name={option.icon} size={17} color={selected ? '#FFFFFF' : colors.textSecondary} /><Text style={[styles.categoryText, selected && styles.categoryTextSelected]}>{option.label}</Text></Pressable>; })}</View>

          <Text style={styles.sectionLabel}>메모</Text>
          <TextInput accessibilityLabel="지출 메모" maxLength={80} onChangeText={setNote} placeholder="예: 입장권과 기념품" placeholderTextColor={colors.textMuted} style={styles.noteInput} value={note} />
          <Pressable accessibilityRole="button" disabled={amount <= 0} onPress={save} style={[styles.primaryButton, amount <= 0 && styles.buttonDisabled]}><Text style={styles.primaryButtonText}>지출 저장하기</Text></Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

export function BudgetOverviewSheet({ budget, currency, expenses, onAddExpense, onClose, onDeleteExpense, onUpdateBudget }: BudgetOverviewProps) {
  const insets = useSafeAreaInsets();
  const [budgetDraft, setBudgetDraft] = useState(budget ? formatAmountInput(String(budget)) : '');
  const spentInCurrency = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const remaining = budget - spentInCurrency;
  const ratio = budget ? Math.min(1, spentInCurrency / budget) : 0;
  const budgetValue = Number(budgetDraft.replace(/,/g, '')) || 0;

  return <Modal animationType="slide" onRequestClose={onClose} statusBarTranslucent transparent visible>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <Pressable accessibilityLabel="여행 가계부 닫기" onPress={onClose} style={StyleSheet.absoluteFill} />
      <View style={[styles.sheet, styles.budgetSheet, { paddingBottom: Math.max(spacing.md, insets.bottom + spacing.sm) }]}>
        <View style={styles.handle} />
        <View style={styles.header}><View style={styles.headerCopy}><Text style={styles.eyebrow}>TRIP WALLET</Text><Text style={styles.title}>여행 가계부</Text><Text style={styles.subtitle}>지출과 남은 예산을 한눈에 확인해요.</Text></View><Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={styles.closeButton}><Ionicons name="close" size={22} color={colors.text} /></Pressable></View>

        <ScrollView contentContainerStyle={styles.budgetContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>{budget ? '남은 예산' : '사용한 금액'}</Text>
            <Text style={[styles.summaryAmount, Math.round(remaining) < 0 && styles.overBudget]}>{budget ? formatMoney(remaining, currency) : formatMoney(spentInCurrency, currency)}</Text>
            <View style={styles.summaryMeta}><Text style={styles.summaryMetaText}>지출 {formatMoney(spentInCurrency, currency)}</Text><Text style={styles.summaryMetaText}>총예산 {budget ? formatMoney(budget, currency) : '미설정'}</Text></View>
            <View style={styles.budgetTrack}><View style={[styles.budgetFill, ratio >= 1 ? styles.budgetDanger : ratio >= 0.7 ? styles.budgetWarning : null, { width: `${Math.round(ratio * 100)}%` }]} /></View>
          </View>

          <View style={styles.budgetEditor}><Text style={styles.sectionLabel}>총 여행 예산</Text><View style={styles.budgetInputRow}><View style={styles.budgetInputWrap}><Text style={styles.budgetSymbol}>{currency.symbol}</Text><TextInput accessibilityLabel="총 여행 예산" inputMode="decimal" keyboardType="decimal-pad" onChangeText={(value) => setBudgetDraft(formatAmountInput(value))} placeholder="예산 입력" placeholderTextColor={colors.textMuted} style={styles.budgetInput} value={budgetDraft} /></View><Pressable accessibilityRole="button" disabled={budgetValue <= 0} onPress={() => onUpdateBudget(budgetValue)} style={[styles.saveBudgetButton, budgetValue <= 0 && styles.buttonDisabled]}><Text style={styles.saveBudgetText}>반영</Text></Pressable></View></View>

          <View style={styles.expenseHeader}><Text style={styles.sectionTitle}>지출 내역</Text><Pressable accessibilityRole="button" onPress={onAddExpense} style={styles.addExpenseButton}><Ionicons name="add" size={16} color={colors.primaryDark} /><Text style={styles.addExpenseText}>직접 추가</Text></Pressable></View>
          {expenses.length ? <View style={styles.expenseList}>{[...expenses].reverse().map((expense) => { const meta = categoryMeta(expense.category); return <View key={expense.id} style={styles.expenseRow}><View style={styles.expenseIcon}><Ionicons name={meta.icon} size={18} color={colors.primaryDark} /></View><View style={styles.expenseCopy}><Text numberOfLines={1} style={styles.expensePlace}>{expense.placeName}</Text><Text numberOfLines={1} style={styles.expenseMeta}>{meta.label}{expense.note ? ` · ${expense.note}` : ''} · Day {expense.day}</Text></View><View style={styles.expenseAmountWrap}><Text style={styles.expenseAmount}>{expense.currencyCode === currency.code ? currency.symbol : expense.currencyCode} {expense.amount.toLocaleString('ko-KR')}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`${expense.placeName} 지출 삭제`} onPress={() => onDeleteExpense(expense.id)} style={styles.deleteExpenseButton}><Ionicons name="trash-outline" size={17} color={colors.textMuted} /></Pressable></View>; })}</View> : <View style={styles.emptyExpenses}><Ionicons name="receipt-outline" size={27} color={colors.primaryDark} /><Text style={styles.emptyTitle}>아직 기록된 지출이 없어요</Text><Text style={styles.emptyDescription}>일정의 장소에서 바로 추가하거나 직접 입력해 보세요.</Text></View>}
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(19,22,38,0.5)' }, sheet: { width: '100%', maxWidth: 680, maxHeight: '90%', borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: '#FFFFFF', paddingTop: 10, paddingHorizontal: spacing.md, ...shadow.float }, budgetSheet: { height: '88%' }, handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 84, paddingHorizontal: spacing.sm, flexDirection: 'row', alignItems: 'flex-start', gap: 12 }, headerCopy: { flex: 1, minWidth: 0 }, eyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 0.8, fontWeight: '900' }, title: { color: colors.text, fontSize: 22, lineHeight: 28, fontWeight: '900', letterSpacing: -0.5, marginTop: 3 }, subtitle: { color: colors.textSecondary, fontSize: 10, lineHeight: 15, marginTop: 4 }, closeButton: { width: 44, height: 44, flexShrink: 0, borderRadius: 16, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  formContent: { paddingHorizontal: spacing.sm, paddingBottom: spacing.md }, amountCard: { borderRadius: 22, backgroundColor: colors.primarySoft, padding: 16 }, fieldLabel: { color: colors.textSecondary, fontSize: 9, fontWeight: '800' }, amountRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', marginTop: 7 }, currencySymbol: { flexShrink: 0, color: colors.text, fontSize: 27, fontWeight: '900', marginRight: 7 }, amountInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 34, lineHeight: 42, fontWeight: '900', padding: 0 }, currencyCaption: { color: colors.textSecondary, fontSize: 9, marginTop: 5 }, sectionLabel: { color: colors.text, fontSize: 11, fontWeight: '900', marginTop: 18, marginBottom: 8 }, categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, categoryOption: { minHeight: 44, flexBasis: '30%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', paddingHorizontal: 8 }, categoryOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primary }, categoryText: { color: colors.textSecondary, fontSize: 9, fontWeight: '800' }, categoryTextSelected: { color: '#FFFFFF' }, noteInput: { width: '100%', height: 48, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceSubtle, color: colors.text, fontSize: 11, paddingHorizontal: 13 }, primaryButton: { minHeight: 52, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 16 }, primaryButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' }, buttonDisabled: { opacity: 0.38 },
  budgetContent: { paddingHorizontal: spacing.sm, paddingBottom: spacing.md }, summaryCard: { borderRadius: 22, backgroundColor: colors.text, padding: 17 }, summaryLabel: { color: '#BFC4FF', fontSize: 9, fontWeight: '900' }, summaryAmount: { color: '#FFFFFF', fontSize: 27, lineHeight: 35, fontWeight: '900', marginTop: 4 }, overBudget: { color: '#FF9A83' }, summaryMeta: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 8, marginTop: 9 }, summaryMetaText: { color: '#C9CDDA', fontSize: 9, fontWeight: '700' }, budgetTrack: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.16)', marginTop: 13 }, budgetFill: { height: '100%', borderRadius: 4, backgroundColor: '#70D7AC' }, budgetWarning: { backgroundColor: '#F4B942' }, budgetDanger: { backgroundColor: '#FF785A' },
  budgetEditor: { borderRadius: 19, backgroundColor: colors.surfaceSubtle, padding: 12, marginTop: 10 }, budgetInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }, budgetInputWrap: { flex: 1, minWidth: 0, height: 48, flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', paddingHorizontal: 12 }, budgetSymbol: { flexShrink: 0, color: colors.text, fontSize: 14, fontWeight: '900', marginRight: 5 }, budgetInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 13, fontWeight: '800', padding: 0 }, saveBudgetButton: { minWidth: 62, height: 48, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, saveBudgetText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' },
  expenseHeader: { minHeight: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 7 }, sectionTitle: { flex: 1, minWidth: 0, color: colors.text, fontSize: 14, fontWeight: '900' }, addExpenseButton: { minHeight: 44, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 3, borderRadius: 14, backgroundColor: colors.primarySoft, paddingHorizontal: 10 }, addExpenseText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' }, expenseList: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' }, expenseRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: colors.border, paddingLeft: 10 }, expenseIcon: { width: 38, height: 38, flexShrink: 0, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, expenseCopy: { flex: 1, minWidth: 0 }, expensePlace: { color: colors.text, fontSize: 10, fontWeight: '900' }, expenseMeta: { color: colors.textSecondary, fontSize: 8, marginTop: 3 }, expenseAmountWrap: { flexShrink: 0, alignItems: 'flex-end' }, expenseAmount: { color: colors.text, fontSize: 10, fontWeight: '900' }, deleteExpenseButton: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }, emptyExpenses: { minHeight: 150, borderRadius: 20, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, backgroundColor: '#FAFAFD', alignItems: 'center', justifyContent: 'center', padding: 18 }, emptyTitle: { color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 8 }, emptyDescription: { maxWidth: 260, color: colors.textSecondary, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 5 },
});
