import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CalendarRange } from '@/features/trip/calendar-range';
import { destinations, useTrip } from '@/features/trip/trip-context';
import { colors, shadow, spacing } from '@/features/trip/theme';

export default function TripSetupScreen() {
  const router = useRouter();
  const { trip, updateTrip } = useTrip();
  const [query, setQuery] = useState(trip.destination);
  const [searching, setSearching] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    return value ? destinations.filter((item) => `${item.city} ${item.country} ${item.code}`.toLowerCase().includes(value)) : destinations.slice(0, 4);
  }, [query]);
  const ready = Boolean(trip.destination && trip.startDate && trip.endDate);

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.glowOne} /><View style={styles.glowTwo} />
        <View style={styles.nav}><View style={styles.logo}><Text style={styles.logoText}>W</Text></View><Text style={styles.brand}>WANDER</Text><View style={styles.avatar}><Text style={styles.avatarText}>ME</Text></View></View>
        <Text style={styles.heroLabel}>AI TRIP PLANNER</Text>
        <Text style={styles.heroTitle}>다음 여행은{`\n`}어디로 갈까요?</Text>
        <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="여행지 검색" value={query} placeholder="도시 또는 공항 검색" placeholderTextColor="#8C94A7" style={styles.searchInput}
          onFocus={() => setSearching(true)} onChangeText={(value) => { setQuery(value); setSearching(true); if (value !== trip.destination) updateTrip({ destination: '', destinationCode: '' }); }} />
          {query ? <Pressable onPress={() => { setQuery(''); updateTrip({ destination: '', destinationCode: '' }); }}><Text style={styles.clear}>×</Text></Pressable> : null}</View>
        {searching ? <View style={styles.suggestions}>{matches.length ? matches.map((item) => <Pressable key={item.code} onPress={() => { setQuery(item.city); updateTrip({ destination: item.city, destinationCode: item.code }); setSearching(false); }} style={styles.suggestion}>
          <View style={styles.suggestionPin}><Text style={styles.suggestionPinText}>⌖</Text></View><View style={styles.grow}><Text style={styles.suggestionTitle}>{item.city}</Text><Text style={styles.suggestionSub}>{item.country} · {item.airport}</Text></View><Text style={styles.suggestionCode}>{item.code}</Text>
        </Pressable>) : <Text style={styles.noResult}>검색 결과가 없어요.</Text>}</View> : null}
      </View>

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <View style={styles.sheetIntro}><Text style={styles.sheetTitle}>여행의 윤곽을 잡아볼게요</Text><Text style={styles.sheetCopy}>정확하지 않아도 괜찮아요. 나중에 언제든 바꿀 수 있어요.</Text></View>

        <Pressable onPress={() => setCalendarOpen(true)} style={styles.bigRow}>
          <View style={styles.rowIcon}><Text style={styles.rowIconText}>▣</Text></View>
          <View style={styles.grow}><Text style={styles.rowLabel}>여행 날짜</Text><Text style={[styles.rowValue, !trip.startDate && styles.placeholder]}>{trip.startDate && trip.endDate ? `${formatDate(trip.startDate)}  →  ${formatDate(trip.endDate)}` : '출발일과 도착일 선택'}</Text></View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <View style={styles.divider} />
        <View style={styles.flightHeader}><View><Text style={styles.sectionTitle}>항공편 시간</Text><Text style={styles.sectionCopy}>여행지 현지 시간을 입력해 주세요.</Text></View><View style={styles.laterControl}><Text style={styles.laterLabel}>나중에</Text><Switch value={trip.flightLater} onValueChange={(flightLater) => updateTrip({ flightLater })} trackColor={{ false: colors.borderStrong, true: colors.primary }} thumbColor="#FFFFFF" /></View></View>
        {!trip.flightLater ? <View style={styles.flightGrid}>
          <View style={styles.flightField}><Text style={styles.flightMark}>↘</Text><View style={styles.grow}><Text style={styles.flightLabel}>도착</Text><TextInput accessibilityLabel="도착 시간" value={trip.arrivalTime} onChangeText={(arrivalTime) => updateTrip({ arrivalTime })} style={styles.timeInput} maxLength={5} /></View></View>
          <View style={styles.flightField}><Text style={[styles.flightMark, styles.departure]}>↗</Text><View style={styles.grow}><Text style={styles.flightLabel}>출발</Text><TextInput accessibilityLabel="출발 시간" value={trip.departureTime} onChangeText={(departureTime) => updateTrip({ departureTime })} style={styles.timeInput} maxLength={5} /></View></View>
        </View> : <View style={styles.skipNotice}><Text style={styles.skipText}>항공편 없이 하루 전체를 활용하는 일정으로 만들어요.</Text></View>}
      </View>
    </ScrollView>

    <View style={styles.ctaBar}><Pressable disabled={!ready} onPress={() => router.push('/preferences')} style={[styles.cta, !ready && styles.ctaDisabled]}><Text style={styles.ctaText}>{ready ? '내 취향 알려주기' : '여행지와 날짜를 선택하세요'}</Text>{ready ? <Text style={styles.ctaArrow}>→</Text> : null}</Pressable></View>

    <Modal visible={calendarOpen} animationType="slide" transparent onRequestClose={() => setCalendarOpen(false)}>
      <View style={styles.modalBackdrop}><Pressable style={styles.modalDismiss} onPress={() => setCalendarOpen(false)} /><View style={styles.calendarSheet}><View style={styles.modalHandle} /><View style={styles.modalHeader}><View><Text style={styles.modalKicker}>여행 기간</Text><Text style={styles.modalTitle}>언제 떠나시나요?</Text></View><Pressable onPress={() => setCalendarOpen(false)} style={styles.closeButton}><Text style={styles.closeText}>×</Text></Pressable></View>
        <CalendarRange startDate={trip.startDate} endDate={trip.endDate} onChange={(startDate, endDate) => updateTrip({ startDate, endDate })} />
        <Pressable disabled={!trip.startDate || !trip.endDate} onPress={() => setCalendarOpen(false)} style={[styles.confirm, (!trip.startDate || !trip.endDate) && styles.ctaDisabled]}><Text style={styles.confirmText}>이 날짜로 선택</Text></Pressable>
      </View></View>
    </Modal>
  </View>;
}

function formatDate(value: string) { const date = new Date(`${value}T12:00:00`); return `${date.getMonth() + 1}월 ${date.getDate()}일`; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, scroll: { paddingBottom: 110 }, hero: { minHeight: 360, backgroundColor: '#171A2B', paddingHorizontal: spacing.lg, paddingTop: 18, overflow: 'visible', zIndex: 5 },
  glowOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#6068ED', opacity: 0.32, right: -110, top: -70 }, glowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FF785A', opacity: 0.2, left: -100, bottom: -40 },
  nav: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 9 }, logo: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, logoText: { color: '#FFF', fontWeight: '900' }, brand: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1.4, flex: 1 }, avatar: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, borderColor: 'rgba(255,255,255,0.24)', alignItems: 'center', justifyContent: 'center' }, avatarText: { color: '#FFF', fontSize: 9, fontWeight: '800' },
  heroLabel: { width: '100%', maxWidth: 680, alignSelf: 'center', color: '#9DA4FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 38 }, heroTitle: { width: '100%', maxWidth: 680, alignSelf: 'center', color: '#FFF', fontSize: 35, lineHeight: 43, fontWeight: '900', letterSpacing: -1.2, marginTop: 8 },
  searchBox: { width: '100%', maxWidth: 680, alignSelf: 'center', height: 60, borderRadius: 20, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginTop: 24, ...shadow.float }, searchIcon: { color: colors.primary, fontSize: 24 }, searchInput: { flex: 1, height: '100%', color: colors.text, fontSize: 15, outlineStyle: 'none' } as never, clear: { fontSize: 24, color: colors.textMuted, padding: 6 },
  suggestions: { position: 'absolute', left: spacing.lg, right: spacing.lg, top: 330, maxWidth: 680, alignSelf: 'center', backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', ...shadow.float }, suggestion: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, suggestionPin: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, suggestionPinText: { color: colors.primary }, grow: { flex: 1 }, suggestionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' }, suggestionSub: { color: colors.textSecondary, fontSize: 10, marginTop: 3 }, suggestionCode: { color: colors.primary, fontSize: 10, fontWeight: '900' }, noResult: { padding: 20, textAlign: 'center', color: colors.textSecondary },
  sheet: { width: '100%', maxWidth: 720, alignSelf: 'center', marginTop: -28, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 28, zIndex: 2 }, handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 25 }, sheetIntro: { marginBottom: 22 }, sheetTitle: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 }, sheetCopy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 6 },
  bigRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13 }, rowIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, rowIconText: { color: colors.primary, fontSize: 19 }, rowLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 5 }, rowValue: { color: colors.text, fontSize: 15, fontWeight: '900' }, placeholder: { color: colors.textMuted, fontWeight: '700' }, chevron: { color: colors.textMuted, fontSize: 30 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  flightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, sectionCopy: { color: colors.textSecondary, fontSize: 11, marginTop: 5 }, laterControl: { flexDirection: 'row', alignItems: 'center', gap: 7 }, laterLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' }, flightGrid: { flexDirection: 'row', gap: 10, marginTop: 18 }, flightField: { flex: 1, minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 18, backgroundColor: colors.surfaceSubtle, paddingHorizontal: 13 }, flightMark: { width: 32, height: 32, textAlign: 'center', lineHeight: 32, borderRadius: 10, color: colors.primary, backgroundColor: colors.primarySoft }, departure: { color: colors.accent, backgroundColor: colors.accentSoft }, flightLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700' }, timeInput: { color: colors.text, fontSize: 18, fontWeight: '900', paddingVertical: 3, outlineStyle: 'none' } as never, skipNotice: { marginTop: 16, padding: 15, borderRadius: 16, backgroundColor: colors.surfaceSubtle }, skipText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 11, paddingBottom: 18 }, cta: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 56, borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 }, ctaDisabled: { backgroundColor: '#C8CCD6' }, ctaText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, ctaArrow: { color: '#FFF', fontSize: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(9,12,26,0.48)', justifyContent: 'flex-end' }, modalDismiss: { flex: 1 }, calendarSheet: { width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing.lg, paddingTop: 10, paddingBottom: 24 }, modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 20 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, modalKicker: { color: colors.primary, fontSize: 11, fontWeight: '800' }, modalTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 }, closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.text, fontSize: 24 }, confirm: { height: 54, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, confirmText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
