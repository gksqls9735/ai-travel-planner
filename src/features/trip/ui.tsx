import { PropsWithChildren } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { colors, radius, spacing } from './theme';

export function AppShell({ children }: PropsWithChildren) { return <SafeAreaView style={styles.shell}>{children}</SafeAreaView>; }
export function StepHeader({ step, title, subtitle, back = false }: { step: number; title: string; subtitle: string; back?: boolean }) {
  const router = useRouter();
  return <View style={styles.header}>
    <View style={styles.headerTop}>
      <View style={styles.titleRow}>
        {back ? <Pressable accessibilityRole="button" accessibilityLabel="이전 화면" onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable> : null}
        <View style={styles.titleCopy}><Text style={styles.overline}>새 여행 만들기</Text><Text style={styles.headerTitle}>{title}</Text></View>
      </View>
      <View style={styles.stepPill}><Text style={styles.stepCount}><Text style={styles.stepCurrent}>{step}</Text> / 3</Text></View>
    </View>
    <Text style={styles.headerSubtitle}>{subtitle}</Text>
    <View style={styles.stepper}>{[1, 2, 3].map((value) => <View key={value} style={[styles.stepLine, value <= step && styles.stepLineActive]} />)}</View>
  </View>;
}
export function FieldLabel({ children }: PropsWithChildren) { return <Text style={styles.fieldLabel}>{children}</Text>; }
export function PrimaryButton({ label, icon, onPress, disabled = false, loading = false }: { label: string; icon?: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.primaryButton, disabled && styles.primaryDisabled, pressed && !disabled && styles.primaryActive]}>
    <Text style={styles.primaryLabel}>{loading ? '나만의 일정을 만들고 있어요…' : label}</Text>{icon && !loading ? <Text style={styles.primaryIcon}>{icon}</Text> : null}
  </Pressable>;
}
const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: colors.background }, header: { gap: 12 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }, titleCopy: { flex: 1 },
  overline: { color: colors.primary, fontSize: 11, fontWeight: '800', marginBottom: 3 }, headerTitle: { color: colors.text, fontSize: 25, lineHeight: 32, fontWeight: '900', letterSpacing: -0.7 },
  headerSubtitle: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  stepPill: { backgroundColor: colors.primarySoft, paddingHorizontal: 11, paddingVertical: 7, borderRadius: radius.full }, stepCount: { color: colors.textMuted, fontSize: 11, fontWeight: '800' }, stepCurrent: { color: colors.primary },
  stepper: { flexDirection: 'row', gap: 5 }, stepLine: { height: 4, flex: 1, backgroundColor: colors.border, borderRadius: 3 }, stepLineActive: { backgroundColor: colors.primary },
  backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.text, fontSize: 31, lineHeight: 31, marginTop: -3 },
  fieldLabel: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, fontWeight: '800', marginBottom: 7 },
  primaryButton: { width: '100%', minHeight: 56, paddingHorizontal: 26, borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
  primaryActive: { backgroundColor: colors.primaryDark, transform: [{ translateY: -1 }] }, primaryDisabled: { backgroundColor: '#B7C4C3' },
  primaryLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, primaryIcon: { color: '#FFFFFF', fontSize: 20, marginTop: -1 },
});
