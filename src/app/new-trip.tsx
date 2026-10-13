import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CalendarRange } from '@/features/trip/calendar-range';
import { createCityStay, destinations, useTrip } from '@/features/trip/trip-context';
import { TimePickerSheet } from '@/features/trip/time-picker-sheet';
import { colors, shadow, spacing } from '@/features/trip/theme';

type FlightTimeKey = 'inboundDepartureTime' | 'inboundArrivalTime' | 'outboundDepartureTime' | 'outboundArrivalTime';
type TimePickerRequest = { key: FlightTimeKey; label: string };

export default function TripSetupScreen() {
  const router = useRouter();
  const { trip, updateTrip } = useTrip();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [timePicker, setTimePicker] = useState<TimePickerRequest | null>(null);
  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    const available = destinations.filter((item) => !trip.destinationStops.some((selected) => selected.code === item.code));
    return value ? available.filter((item) => `${item.city} ${item.country} ${item.code}`.toLowerCase().includes(value)) : available.slice(0, 4);
  }, [query, trip.destinationStops]);
  const ready = Boolean(trip.destinationStops.length && trip.startDate && trip.endDate);
  const addDestination = (item: (typeof destinations)[number]) => {
    const destinationStops = [...trip.destinationStops, { city: item.city, code: item.code, nights: 0 }];
    const cityStays = [...trip.cityStays, createCityStay(item.city, item.code, trip)];
    updateTrip({ destinationStops, cityStays, destination: destinationStops[0].city, destinationCode: destinationStops[0].code });
    setQuery(''); setSearching(false);
  };
  const removeDestination = (code: string) => {
    const destinationStops = trip.destinationStops.filter((item) => item.code !== code);
    updateTrip({ destinationStops, cityStays: trip.cityStays.filter((item) => item.code !== code), destination: destinationStops[0]?.city ?? '', destinationCode: destinationStops[0]?.code ?? '' });
  };

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.glowOne} /><View style={styles.glowTwo} />
        <View style={styles.nav}><Pressable accessibilityRole="button" accessibilityLabel="내 여행 보관함으로 돌아가기" hitSlop={6} onPress={() => router.replace('/')} style={({ pressed }) => [styles.logo, pressed && styles.navButtonPressed]}><Ionicons name="arrow-back" size={18} color="#FFFFFF" /></Pressable><Text style={styles.brand}>새 여행 만들기</Text><Pressable accessibilityRole="button" accessibilityLabel="내 여행 보관함으로 돌아가기" onPress={() => router.replace('/')} style={({ pressed }) => [styles.tripsLink, pressed && styles.navButtonPressed]}><Text style={styles.tripsLinkText}>MY TRIPS</Text></Pressable></View>
        <Text style={styles.heroLabel}>AI TRIP PLANNER</Text>
        <Text style={styles.heroTitle}>다음 여행은{`\n`}어디로 갈까요?</Text>
        <View style={styles.searchBox}><Text style={styles.searchIcon}>⌕</Text><TextInput accessibilityLabel="여행지 검색" value={query} placeholder="도시 또는 공항 검색" placeholderTextColor="#8C94A7" style={styles.searchInput}
          onFocus={() => setSearching(true)} onChangeText={(value) => { setQuery(value); setSearching(true); }} />
          {query ? <Pressable accessibilityLabel="검색어 지우기" onPress={() => setQuery('')} style={styles.clearButton}><Text style={styles.clear}>×</Text></Pressable> : null}</View>
        {trip.destinationStops.length ? <View style={styles.destinationChips}>{trip.destinationStops.map((item, index) => <View key={item.code} style={styles.destinationChip}><View style={styles.destinationOrder}><Text style={styles.destinationOrderText}>{index + 1}</Text></View><Text style={styles.destinationChipText}>{item.city}</Text><Pressable accessibilityRole="button" accessibilityLabel={`${item.city} 삭제`} hitSlop={6} onPress={() => removeDestination(item.code)} style={styles.destinationRemove}><Ionicons name="close" size={14} color="#FFFFFF" /></Pressable></View>)}</View> : <Text style={styles.destinationHint}>여러 도시를 방문한다면 차례대로 추가해 주세요.</Text>}
        {searching ? <View style={styles.suggestions}>{matches.length ? matches.map((item) => <Pressable key={item.code} onPress={() => addDestination(item)} style={styles.suggestion}>
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
        <View style={styles.flightHeader}><View style={styles.flightHeaderCopy}><Text style={styles.sectionTitle}>항공편 시간</Text><Text style={styles.sectionCopy}>각 공항의 현지 시간으로 입력해 주세요.</Text></View><View style={styles.laterControl}><Text style={styles.laterLabel}>나중에</Text><Switch value={trip.flightLater} onValueChange={(flightLater) => updateTrip({ flightLater })} trackColor={{ false: colors.borderStrong, true: colors.primary }} thumbColor="#FFFFFF" /></View></View>
        {!trip.flightLater ? <View style={styles.flightLegs}>
          <View style={styles.flightLeg}>
            <View style={styles.flightLegHeader}><View style={styles.flightLegIcon}><Ionicons name="airplane" size={15} color={colors.primaryDark} /></View><View style={styles.grow}><Text style={styles.flightLegTitle}>가는 편</Text><Text style={styles.flightLegRoute}>출발 공항  →  {trip.destinationStops[0]?.city || '여행지'} 공항</Text></View></View>
            <View style={styles.flightGrid}>
              <Pressable accessibilityRole="button" accessibilityLabel={`가는 편 공항 출발 시간 ${trip.inboundDepartureTime}`} onPress={() => setTimePicker({ key: 'inboundDepartureTime', label: '가는 편 · 공항 출발' })} style={({ pressed }) => [styles.flightField, pressed && styles.flightFieldPressed]}><Text style={styles.flightLabel}>공항 출발</Text><View style={styles.timeValueRow}><Text style={styles.timeValue}>{trip.inboundDepartureTime || '--:--'}</Text><Ionicons name="chevron-down" size={14} color={colors.textMuted} /></View></Pressable>
              <View style={styles.flightArrow}><Ionicons name="arrow-forward" size={16} color={colors.textMuted} /></View>
              <Pressable accessibilityRole="button" accessibilityLabel={`가는 편 현지 도착 시간 ${trip.inboundArrivalTime}`} onPress={() => setTimePicker({ key: 'inboundArrivalTime', label: '가는 편 · 현지 도착' })} style={({ pressed }) => [styles.flightField, pressed && styles.flightFieldPressed]}><Text style={styles.flightLabel}>현지 도착</Text><View style={styles.timeValueRow}><Text style={styles.timeValue}>{trip.inboundArrivalTime || '--:--'}</Text><Ionicons name="chevron-down" size={14} color={colors.textMuted} /></View></Pressable>
            </View>
          </View>
          <View style={styles.flightLeg}>
            <View style={styles.flightLegHeader}><View style={[styles.flightLegIcon, styles.flightLegIconReturn]}><Ionicons name="airplane" size={15} color={colors.accent} style={styles.returnPlane} /></View><View style={styles.grow}><Text style={styles.flightLegTitle}>오는 편</Text><Text style={styles.flightLegRoute}>{trip.destinationStops[trip.destinationStops.length - 1]?.city || '여행지'} 공항  →  도착 공항</Text></View></View>
            <View style={styles.flightGrid}>
              <Pressable accessibilityRole="button" accessibilityLabel={`오는 편 현지 출발 시간 ${trip.outboundDepartureTime}`} onPress={() => setTimePicker({ key: 'outboundDepartureTime', label: '오는 편 · 현지 출발' })} style={({ pressed }) => [styles.flightField, pressed && styles.flightFieldPressed]}><Text style={styles.flightLabel}>현지 출발</Text><View style={styles.timeValueRow}><Text style={styles.timeValue}>{trip.outboundDepartureTime || '--:--'}</Text><Ionicons name="chevron-down" size={14} color={colors.textMuted} /></View></Pressable>
              <View style={styles.flightArrow}><Ionicons name="arrow-forward" size={16} color={colors.textMuted} /></View>
              <Pressable accessibilityRole="button" accessibilityLabel={`오는 편 공항 도착 시간 ${trip.outboundArrivalTime}`} onPress={() => setTimePicker({ key: 'outboundArrivalTime', label: '오는 편 · 공항 도착' })} style={({ pressed }) => [styles.flightField, pressed && styles.flightFieldPressed]}><Text style={styles.flightLabel}>공항 도착</Text><View style={styles.timeValueRow}><Text style={styles.timeValue}>{trip.outboundArrivalTime || '--:--'}</Text><Ionicons name="chevron-down" size={14} color={colors.textMuted} /></View></Pressable>
            </View>
          </View>
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
    {timePicker ? <TimePickerSheet label={timePicker.label} onClose={() => setTimePicker(null)} onConfirm={(value) => { updateTrip({ [timePicker.key]: value }); setTimePicker(null); }} value={trip[timePicker.key]} visible /> : null}
  </View>;
}

function formatDate(value: string) { const date = new Date(`${value}T12:00:00`); return `${date.getMonth() + 1}월 ${date.getDate()}일`; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, scroll: { paddingBottom: 110 }, hero: { minHeight: 360, backgroundColor: '#171A2B', paddingHorizontal: spacing.lg, paddingTop: 18, paddingBottom: 54, overflow: 'visible', zIndex: 5 },
  glowOne: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: '#6068ED', opacity: 0.32, right: -110, top: -70 }, glowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FF785A', opacity: 0.2, left: -100, bottom: -40 },
  nav: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10 }, logo: { width: 44, height: 44, flexShrink: 0, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }, navButtonPressed: { opacity: 0.7 }, brand: { minWidth: 0, color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: -0.1, flex: 1 }, tripsLink: { minHeight: 44, flexShrink: 0, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, tripsLinkText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  heroLabel: { width: '100%', maxWidth: 680, alignSelf: 'center', color: '#9DA4FF', fontSize: 10, fontWeight: '900', letterSpacing: 1.8, marginTop: 38 }, heroTitle: { width: '100%', maxWidth: 680, alignSelf: 'center', color: '#FFF', fontSize: 35, lineHeight: 43, fontWeight: '900', letterSpacing: -1.2, marginTop: 8 },
  searchBox: { width: '100%', maxWidth: 680, alignSelf: 'center', height: 60, borderRadius: 20, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, marginTop: 24, ...shadow.float }, searchIcon: { color: colors.primary, fontSize: 24 }, searchInput: { flex: 1, height: '100%', color: colors.text, fontSize: 15, outlineStyle: 'none' } as never, clearButton: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }, clear: { fontSize: 24, color: colors.textMuted }, destinationChips: { width: '100%', maxWidth: 680, alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }, destinationChip: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingLeft: 7, paddingRight: 4 }, destinationOrder: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, destinationOrderText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' }, destinationChipText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' }, destinationRemove: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }, destinationHint: { width: '100%', maxWidth: 680, alignSelf: 'center', color: 'rgba(255,255,255,0.58)', fontSize: 10, marginTop: 10 },
  suggestions: { width: '100%', maxWidth: 680, alignSelf: 'center', marginTop: 8, backgroundColor: '#FFF', borderRadius: 20, overflow: 'hidden', ...shadow.float }, suggestion: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.border }, suggestionPin: { width: 34, height: 34, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, suggestionPinText: { color: colors.primary }, grow: { flex: 1 }, suggestionTitle: { color: colors.text, fontSize: 14, fontWeight: '800' }, suggestionSub: { color: colors.textSecondary, fontSize: 10, marginTop: 3 }, suggestionCode: { color: colors.primary, fontSize: 10, fontWeight: '900' }, noResult: { padding: 20, textAlign: 'center', color: colors.textSecondary },
  sheet: { width: '100%', maxWidth: 720, alignSelf: 'center', marginTop: -28, backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: spacing.lg, paddingTop: 10, paddingBottom: 28, zIndex: 2 }, handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 25 }, sheetIntro: { marginBottom: 22 }, sheetTitle: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: -0.4 }, sheetCopy: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 6 },
  bigRow: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13 }, rowIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, rowIconText: { color: colors.primary, fontSize: 19 }, rowLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700', marginBottom: 5 }, rowValue: { color: colors.text, fontSize: 15, fontWeight: '900' }, placeholder: { color: colors.textMuted, fontWeight: '700' }, chevron: { color: colors.textMuted, fontSize: 30 }, divider: { height: 1, backgroundColor: colors.border, marginVertical: 18 },
  flightHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }, flightHeaderCopy: { flex: 1, minWidth: 0 }, sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' }, sectionCopy: { color: colors.textSecondary, fontSize: 11, marginTop: 5 }, laterControl: { minHeight: 44, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 7 }, laterLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' }, flightLegs: { gap: 12, marginTop: 18 }, flightLeg: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#FFFFFF', padding: 13 }, flightLegHeader: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10 }, flightLegIcon: { width: 38, height: 38, flexShrink: 0, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, flightLegIconReturn: { backgroundColor: colors.accentSoft }, returnPlane: { transform: [{ rotate: '180deg' }] }, flightLegTitle: { color: colors.text, fontSize: 13, fontWeight: '900' }, flightLegRoute: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 2 }, flightGrid: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 }, flightField: { flex: 1, minWidth: 0, minHeight: 66, borderRadius: 16, backgroundColor: colors.surfaceSubtle, justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8 }, flightFieldPressed: { opacity: 0.68 }, flightArrow: { width: 20, flexShrink: 0, alignItems: 'center' }, flightLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700' }, timeValueRow: { minWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4, marginTop: 3 }, timeValue: { minWidth: 0, color: colors.text, fontSize: 18, fontWeight: '900' }, skipNotice: { marginTop: 16, padding: 15, borderRadius: 16, backgroundColor: colors.surfaceSubtle }, skipText: { color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 11, paddingBottom: 18 }, cta: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 56, borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 }, ctaDisabled: { backgroundColor: '#C8CCD6' }, ctaText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, ctaArrow: { color: '#FFF', fontSize: 20 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(9,12,26,0.48)', justifyContent: 'flex-end' }, modalDismiss: { flex: 1 }, calendarSheet: { width: '100%', maxWidth: 720, alignSelf: 'center', backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: spacing.lg, paddingTop: 10, paddingBottom: 24 }, modalHandle: { width: 42, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 20 }, modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, modalKicker: { color: colors.primary, fontSize: 11, fontWeight: '800' }, modalTitle: { color: colors.text, fontSize: 22, fontWeight: '900', marginTop: 4 }, closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, closeText: { color: colors.text, fontSize: 24 }, confirm: { height: 54, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 20 }, confirmText: { color: '#FFF', fontSize: 14, fontWeight: '900' },
});
