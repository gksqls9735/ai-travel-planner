import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { responsive } from '@/features/layout/responsive';
import { colors, shadow, spacing } from '@/features/trip/theme';

type TimePickerSheetProps = {
  label: string;
  onClose: () => void;
  onConfirm: (value: string) => void;
  value: string;
  visible: boolean;
};

const hours = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0'));

function parseTime(value: string) {
  const [hour = '09', minute = '00'] = value.split(':');
  return {
    hour: hours.includes(hour) ? hour : '09',
    minute: minutes.includes(minute) ? minute : '00',
  };
}

function isValidTime(value: string) {
  return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function formatDirectTime(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export function TimePickerSheet({ label, onClose, onConfirm, value, visible }: TimePickerSheetProps) {
  const insets = useSafeAreaInsets();
  const initialTime = parseTime(value);
  const [selectedHour, setSelectedHour] = useState(initialTime.hour);
  const [selectedMinute, setSelectedMinute] = useState(initialTime.minute);
  const [directMode, setDirectMode] = useState(isValidTime(value) && !minutes.includes(value.split(':')[1]));
  const [directValue, setDirectValue] = useState(isValidTime(value) ? value : `${initialTime.hour}:${initialTime.minute}`);

  const selectedTime = `${selectedHour}:${selectedMinute}`;
  const directTimeValid = isValidTime(directValue);
  const confirmedTime = directMode ? directValue : selectedTime;

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="시간 선택 닫기" onPress={onClose} style={styles.dismissArea} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.headerCopy}>
              <Text style={styles.kicker}>FLIGHT TIME</Text>
              <Text style={styles.title}>{label}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="시간 선택 닫기" hitSlop={4} onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={22} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View accessibilityLabel={`선택한 시간 ${confirmedTime}`} style={styles.preview}>
              <Ionicons name="time-outline" size={21} color={colors.primary} />
              <Text style={styles.previewTime}>{directMode && !directTimeValid ? '--:--' : confirmedTime}</Text>
            </View>

            {!directMode ? <>
              <Text style={styles.optionLabel}>시간</Text>
              <View style={styles.optionGrid}>
                {hours.map((hour) => {
                  const selected = selectedHour === hour;
                  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={hour} onPress={() => setSelectedHour(hour)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{hour}시</Text></Pressable>;
                })}
              </View>

              <Text style={styles.optionLabel}>분 · 5분 단위</Text>
              <View style={styles.optionGrid}>
                {minutes.map((minute) => {
                  const selected = selectedMinute === minute;
                  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} key={minute} onPress={() => setSelectedMinute(minute)} style={({ pressed }) => [styles.option, selected && styles.optionSelected, pressed && styles.optionPressed]}><Text style={[styles.optionText, selected && styles.optionTextSelected]}>{minute}분</Text></Pressable>;
                })}
              </View>

              <Pressable accessibilityRole="button" onPress={() => { setDirectValue(selectedTime); setDirectMode(true); }} style={({ pressed }) => [styles.directToggle, pressed && styles.optionPressed]}><Ionicons name="keypad-outline" size={17} color={colors.primaryDark} /><Text style={styles.directToggleText}>정확한 시간 직접 입력</Text><Ionicons name="chevron-forward" size={16} color={colors.textMuted} /></Pressable>
            </> : <View style={styles.directPanel}>
              <Text style={styles.optionLabel}>정확한 시간</Text>
              <Text style={styles.directHelp}>항공권에 표시된 시간을 24시간 형식으로 입력해 주세요.</Text>
              <View style={[styles.directInputWrap, directValue.length > 0 && !directTimeValid && styles.directInputWrapInvalid]}><Ionicons name="time-outline" size={19} color={directTimeValid ? colors.primary : colors.danger} /><TextInput accessibilityLabel="정확한 항공편 시간 직접 입력" autoFocus keyboardType="number-pad" maxLength={5} onChangeText={(input) => setDirectValue(formatDirectTime(input))} placeholder="예: 18:47" placeholderTextColor={colors.textMuted} style={styles.directInput} value={directValue} /></View>
              {directValue.length > 0 && !directTimeValid ? <Text style={styles.errorText}>00:00부터 23:59 사이의 시간을 입력해 주세요.</Text> : null}
              <Pressable accessibilityRole="button" onPress={() => setDirectMode(false)} style={({ pressed }) => [styles.quickSelectButton, pressed && styles.optionPressed]}><Ionicons name="grid-outline" size={16} color={colors.primaryDark} /><Text style={styles.quickSelectText}>5분 단위로 선택하기</Text></Pressable>
            </View>}

            <Pressable accessibilityRole="button" accessibilityState={{ disabled: directMode && !directTimeValid }} disabled={directMode && !directTimeValid} onPress={() => onConfirm(confirmedTime)} style={({ pressed }) => [styles.confirmButton, directMode && !directTimeValid && styles.confirmButtonDisabled, pressed && styles.confirmButtonPressed]}>
              <Text style={styles.confirmText}>{directMode && !directTimeValid ? '시간을 정확히 입력해 주세요' : `${confirmedTime} 선택`}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(9,12,26,0.48)', justifyContent: 'flex-end' },
  dismissArea: { flex: 1 },
  sheet: { width: '100%', maxWidth: 560, maxHeight: '92%', alignSelf: 'center', backgroundColor: '#FFFFFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 10, overflow: 'hidden', ...shadow.float },
  handle: { width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 12 },
  header: { minHeight: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md },
  headerCopy: { flex: 1, minWidth: 0 },
  kicker: { color: colors.primary, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.text, fontSize: 20, lineHeight: 27, fontWeight: '900', marginTop: 2 },
  closeButton: { width: responsive.minimumTouchTarget, height: responsive.minimumTouchTarget, flexShrink: 0, borderRadius: 15, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  preview: { minHeight: 64, borderRadius: 18, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  previewTime: { color: colors.primaryDark, fontSize: 25, fontWeight: '900', letterSpacing: 0.5 },
  optionLabel: { color: colors.text, fontSize: 12, fontWeight: '900', marginTop: 18, marginBottom: 8 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  option: { flexBasis: '21%', flexGrow: 1, maxWidth: '24%', minWidth: responsive.minimumTouchTarget, minHeight: responsive.minimumTouchTarget, borderRadius: 13, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  optionSelected: { backgroundColor: colors.primary },
  optionPressed: { opacity: 0.72 },
  optionText: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' },
  optionTextSelected: { color: '#FFFFFF' },
  directToggle: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 16, backgroundColor: '#F7F7FF', borderWidth: 1, borderColor: '#E4E5FF', paddingHorizontal: 14, marginTop: 18 },
  directToggleText: { flex: 1, minWidth: 0, color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  directPanel: { marginTop: 2 },
  directHelp: { color: colors.textSecondary, fontSize: 10, lineHeight: 16, marginTop: -2, marginBottom: 10 },
  directInputWrap: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 17, borderWidth: 1, borderColor: colors.primary, backgroundColor: '#FFFFFF', paddingHorizontal: 14 },
  directInputWrapInvalid: { borderColor: colors.danger, backgroundColor: '#FFF8F8' },
  directInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 21, fontWeight: '900', outlineStyle: 'none' } as never,
  errorText: { color: colors.danger, fontSize: 9, lineHeight: 14, marginTop: 6 },
  quickSelectButton: { minHeight: responsive.minimumTouchTarget, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, backgroundColor: colors.primarySoft, paddingHorizontal: 12, marginTop: 12 },
  quickSelectText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  confirmButton: { minHeight: 54, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  confirmButtonDisabled: { backgroundColor: '#C8CCD6' },
  confirmButtonPressed: { opacity: 0.82 },
  confirmText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
});
