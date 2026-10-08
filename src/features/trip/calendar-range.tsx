import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from './theme';

const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
const toKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function CalendarRange({ startDate, endDate, onChange }: { startDate: string; endDate: string; onChange: (start: string, end: string) => void }) {
  const initial = new Date(); initial.setDate(1);
  const [visibleMonth, setVisibleMonth] = useState(initial);
  const days = useMemo(() => {
    const year = visibleMonth.getFullYear(); const month = visibleMonth.getMonth();
    const count = new Date(year, month + 1, 0).getDate(); const offset = new Date(year, month, 1).getDay();
    return [...Array.from({ length: offset }, () => null), ...Array.from({ length: count }, (_, i) => new Date(year, month, i + 1))];
  }, [visibleMonth]);
  const today = toKey(new Date());
  return <View style={styles.calendar}>
    <View style={styles.monthHeader}>
      <Pressable accessibilityRole="button" accessibilityLabel="이전 달" onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} style={styles.monthButton}><Text style={styles.monthArrow}>‹</Text></Pressable>
      <Text style={styles.monthTitle}>{visibleMonth.getFullYear()}년 {visibleMonth.getMonth() + 1}월</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="다음 달" onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} style={styles.monthButton}><Text style={styles.monthArrow}>›</Text></Pressable>
    </View>
    <View style={styles.grid}>
      {weekDays.map((day) => <View key={day} style={styles.cell}><Text style={styles.weekDay}>{day}</Text></View>)}
      {days.map((date, index) => {
        if (!date) return <View key={`empty-${index}`} style={styles.cell} />;
        const key = toKey(date); const disabled = key < today; const selected = key === startDate || key === endDate;
        const inRange = Boolean(startDate && endDate && key > startDate && key < endDate);
        return <View key={key} style={[styles.cell, inRange && styles.rangeCell]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일`} disabled={disabled}
            onPress={() => !startDate || endDate || key < startDate ? onChange(key, '') : onChange(startDate, key)} style={[styles.dayButton, selected && styles.selectedDay]}>
            <Text style={[styles.dayText, disabled && styles.disabledDayText, selected && styles.selectedDayText]}>{date.getDate()}</Text>
          </Pressable>
        </View>;
      })}
    </View>
    <View style={styles.selectionSummary}>
      <View><Text style={styles.summaryLabel}>출발</Text><Text style={styles.summaryValue}>{startDate || '날짜 선택'}</Text></View><Text style={styles.summaryArrow}>→</Text>
      <View><Text style={styles.summaryLabel}>도착</Text><Text style={styles.summaryValue}>{endDate || '날짜 선택'}</Text></View>
    </View>
  </View>;
}
const styles = StyleSheet.create({
  calendar: { gap: spacing.md }, monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, monthArrow: { color: colors.text, fontSize: 26 }, monthTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' }, cell: { width: '14.285%', height: 39, alignItems: 'center', justifyContent: 'center' }, rangeCell: { backgroundColor: colors.primarySoft }, weekDay: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  dayButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' }, selectedDay: { backgroundColor: colors.primary }, dayText: { color: colors.text, fontSize: 13, fontWeight: '600' }, disabledDayText: { color: colors.borderStrong }, selectedDayText: { color: '#FFF', fontWeight: '900' },
  selectionSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceSubtle, borderRadius: radius.md, padding: 12 }, summaryLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginBottom: 3 }, summaryValue: { color: colors.text, fontSize: 12, fontWeight: '800' }, summaryArrow: { color: colors.primary, fontSize: 18 },
});
