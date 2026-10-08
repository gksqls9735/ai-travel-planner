import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pace, useTrip } from '@/features/trip/trip-context';
import { responsive } from '@/features/layout/responsive';
import { colors, spacing } from '@/features/trip/theme';

const companions = [{ id: 'solo', icon: '🎒', label: '혼자' }, { id: 'couple', icon: '💛', label: '연인' }, { id: 'friends', icon: '🙌', label: '친구' }, { id: 'parents', icon: '👨‍👩‍👧', label: '부모님' }, { id: 'kids', icon: '🧸', label: '아이' }];
const interests = [
  { name: '맛집 탐방', icon: '🍜', color: '#FFF0EB' }, { name: '전통 문화', icon: '🏯', color: '#FFF5D9' },
  { name: '골목 산책', icon: '🚶', color: '#EAF6F1' }, { name: '쇼핑', icon: '🛍️', color: '#F3ECFF' },
  { name: '자연 경관', icon: '🌿', color: '#E8F5E9' }, { name: '액티비티', icon: '🏄', color: '#E8F2FF' },
  { name: '예술·전시', icon: '🎨', color: '#FFF0F6' }, { name: '야경', icon: '🌙', color: '#EEF0FF' },
];
const extras = ['오래 걷기 어려워요', '유모차를 이용해요', '채식 메뉴가 필요해요', '알레르기가 있어요'];
const paceOptions: { id: Pace; title: string; caption: string; icon: string }[] = [
  { id: 'relaxed', title: '느긋하게', caption: '하루 2~3곳', icon: '☕' }, { id: 'balanced', title: '적당하게', caption: '하루 3~4곳', icon: '🚶' }, { id: 'packed', title: '알차게', caption: '하루 5곳+', icon: '⚡' },
];

export default function PreferencesScreen() {
  const router = useRouter(); const { trip, updateTrip } = useTrip(); const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const toggleList = (list: string[], value: string) => list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  const toggleCompanion = (id: string) => {
    if (id === 'solo') return updateTrip({ companions: trip.companions.includes(id) ? [] : [id], partySize: 1 });
    const list = trip.companions.filter((item) => item !== 'solo');
    updateTrip({ companions: toggleList(list, id), partySize: Math.max(2, trip.partySize) });
  };
  const generate = () => { setLoading(true); setTimeout(() => router.replace('/itinerary'), 900); };

  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: Math.max(16, insets.top + 12) }]} showsVerticalScrollIndicator={false}>
      <View style={styles.nav}><Pressable accessibilityRole="button" accessibilityLabel="이전 화면으로" hitSlop={6} onPress={() => router.back()} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable><View style={styles.navCopy}><Text style={styles.navKicker}>2 / 3</Text><Text style={styles.navTitle}>여행 취향</Text></View><View style={styles.progress}><View style={styles.progressFill} /></View></View>

      <Question number="01" title="이번 여행, 누구와 함께하나요?" copy="여러 명을 함께 선택해도 좋아요." />
      <View style={styles.peopleGrid}>{companions.map((item) => { const selected = trip.companions.includes(item.id); return <Pressable key={item.id} onPress={() => toggleCompanion(item.id)} style={styles.person}><View style={[styles.personAvatar, selected && styles.personSelected]}><Text style={styles.personIcon}>{item.icon}</Text>{selected ? <View style={styles.check}><Text style={styles.checkText}>✓</Text></View> : null}</View><Text style={[styles.personLabel, selected && styles.personLabelSelected]}>{item.label}</Text></Pressable>; })}</View>
      {!trip.companions.includes('solo') ? <View style={styles.countRow}><Text style={styles.countLabel}>총 여행 인원</Text><View style={styles.counter}><Pressable onPress={() => updateTrip({ partySize: Math.max(2, trip.partySize - 1) })} style={styles.countButton}><Text style={styles.countButtonText}>−</Text></Pressable><Text style={styles.countValue}>{trip.partySize}명</Text><Pressable onPress={() => updateTrip({ partySize: Math.min(12, trip.partySize + 1) })} style={styles.countButton}><Text style={styles.countButtonText}>＋</Text></Pressable></View></View> : null}

      <View style={styles.rule} />
      <Question number="02" title="어느 정도로 움직일까요?" copy="AI가 장소 수와 이동 거리를 맞춰요." />
      <View style={styles.paceRow}>{paceOptions.map((item) => { const selected = trip.pace === item.id; return <Pressable key={item.id} onPress={() => updateTrip({ pace: item.id })} style={[styles.pace, selected && styles.paceSelected]}><Text style={styles.paceIcon}>{item.icon}</Text><Text style={[styles.paceTitle, selected && styles.paceTitleSelected]}>{item.title}</Text><Text style={styles.paceCaption}>{item.caption}</Text></Pressable>; })}</View>

      <View style={styles.rule} />
      <Question number="03" title="끌리는 여행 장면을 골라주세요" copy="최소 3개를 선택하면 취향을 분석할 수 있어요." />
      <View style={styles.interestGrid}>{interests.map((item) => { const selected = trip.interests.includes(item.name); return <Pressable key={item.name} onPress={() => updateTrip({ interests: toggleList(trip.interests, item.name) })} style={[styles.interest, { backgroundColor: item.color }, selected && styles.interestSelected]}><Text style={styles.interestIcon}>{item.icon}</Text><Text style={styles.interestName}>{item.name}</Text>{selected ? <View style={styles.interestCheck}><Text style={styles.interestCheckText}>✓</Text></View> : null}</Pressable>; })}</View>
      <Text style={styles.selectedCount}>{trip.interests.length}개 선택됨</Text>

      <View style={styles.rule} />
      <Question number="04" title="미리 알아둘 것이 있나요?" copy="선택 사항이에요." />
      <View style={styles.extraWrap}>{extras.map((item) => { const selected = trip.requests.includes(item); return <Pressable key={item} onPress={() => updateTrip({ requests: toggleList(trip.requests, item) })} style={[styles.extra, selected && styles.extraSelected]}><Text style={[styles.extraText, selected && styles.extraTextSelected]}>{selected ? '✓  ' : ''}{item}</Text></Pressable>; })}</View>
    </ScrollView>
    <View style={styles.ctaBar}><Pressable disabled={trip.interests.length < 3 || loading} onPress={generate} style={[styles.cta, (trip.interests.length < 3 || loading) && styles.ctaDisabled]}><Text style={styles.ctaText}>{loading ? '여행을 디자인하고 있어요…' : '나만의 일정 만들기'}</Text><Text style={styles.ctaIcon}>✦</Text></Pressable></View>
  </View>;
}

function Question({ number, title, copy }: { number: string; title: string; copy: string }) { return <View style={styles.question}><Text style={styles.questionNumber}>{number}</Text><View style={styles.questionCopy}><Text style={styles.questionTitle}>{title}</Text><Text style={styles.questionCaption}>{copy}</Text></View></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFF' }, content: { width: '100%', maxWidth: responsive.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg, paddingBottom: 120 },
  nav: { minHeight: responsive.headerControlSize, flexDirection: 'row', alignItems: 'center', marginBottom: 38 }, back: { width: responsive.headerControlSize, height: responsive.headerControlSize, borderRadius: responsive.headerControlSize / 2, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, navCopy: { flex: 1, minWidth: 0, minHeight: responsive.headerControlSize, justifyContent: 'center' }, navKicker: { color: colors.primary, fontSize: 10, lineHeight: 12, fontWeight: '900' }, navTitle: { color: colors.text, fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 2 }, progress: { width: 74, flexShrink: 0, height: 5, borderRadius: 3, backgroundColor: colors.border }, progressFill: { width: '66%', height: '100%', borderRadius: 3, backgroundColor: colors.primary },
  question: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 }, questionNumber: { color: colors.primary, fontSize: 11, fontWeight: '900', paddingTop: 4 }, questionCopy: { flex: 1 }, questionTitle: { color: colors.text, fontSize: 21, lineHeight: 28, fontWeight: '900', letterSpacing: -0.5 }, questionCaption: { color: colors.textSecondary, fontSize: 12, lineHeight: 18, marginTop: 5 },
  peopleGrid: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 10, rowGap: 14, paddingBottom: 4 }, person: { flexBasis: 58, flexGrow: 1, maxWidth: 96, minWidth: 0, alignItems: 'center', gap: 8 }, personAvatar: { width: 62, height: 62, maxWidth: '100%', aspectRatio: 1, borderRadius: 22, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' }, personSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, personIcon: { fontSize: 25 }, personLabel: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' }, personLabelSelected: { color: colors.primary, fontWeight: '900' }, check: { position: 'absolute', right: -2, top: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, borderWidth: 2, borderColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, checkText: { color: '#FFF', fontSize: 9, fontWeight: '900' },
  countRow: { marginTop: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceSubtle, borderRadius: 18, padding: 12, paddingLeft: 16 }, countLabel: { color: colors.text, fontSize: 13, fontWeight: '800' }, counter: { flexDirection: 'row', alignItems: 'center', gap: 12 }, countButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }, countButtonText: { color: colors.text, fontSize: 17 }, countValue: { minWidth: 30, textAlign: 'center', color: colors.text, fontSize: 14, fontWeight: '900' },
  rule: { height: 1, backgroundColor: colors.border, marginVertical: 34 }, paceRow: { flexDirection: 'row', gap: 8 }, pace: { flex: 1, minWidth: 0, minHeight: 106, borderRadius: 20, backgroundColor: colors.surfaceSubtle, paddingHorizontal: 6, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' }, paceSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, paceIcon: { fontSize: 23, marginBottom: 9 }, paceTitle: { color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center' }, paceTitleSelected: { color: colors.primaryDark }, paceCaption: { color: colors.textMuted, fontSize: 8, marginTop: 4, textAlign: 'center' },
  interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, interest: { width: '48%', flexGrow: 1, minHeight: 108, borderRadius: 22, padding: 16, justifyContent: 'flex-end', borderWidth: 2, borderColor: 'transparent', overflow: 'hidden' }, interestSelected: { borderColor: colors.primary }, interestIcon: { fontSize: 27, marginBottom: 12 }, interestName: { color: colors.text, fontSize: 13, fontWeight: '900' }, interestCheck: { position: 'absolute', top: 12, right: 12, width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }, interestCheckText: { color: '#FFF', fontSize: 10, fontWeight: '900' }, selectedCount: { color: colors.primary, fontSize: 11, fontWeight: '900', marginTop: 12 },
  extraWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, extra: { minHeight: 42, borderRadius: 14, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' }, extraSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary }, extraText: { color: colors.textSecondary, fontSize: 11, fontWeight: '700' }, extraTextSelected: { color: colors.primaryDark },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.96)', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 11, paddingBottom: 18 }, cta: { width: '100%', maxWidth: 680, alignSelf: 'center', minHeight: 56, borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, ctaDisabled: { backgroundColor: '#C8CCD6' }, ctaText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, ctaIcon: { color: '#FFF', fontSize: 15 },
});
