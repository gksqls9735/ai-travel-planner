import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { responsive } from '@/features/layout/responsive';
import { TripsHomeButton } from '@/features/navigation/trips-home-button';
import { buildAccommodationBookingUrl } from '@/features/trip/booking-links';
import { AccommodationMode, useTrip } from '@/features/trip/trip-context';
import { colors, shadow, spacing } from '@/features/trip/theme';

const budgets = ['10만원 이하', '10~20만원', '20~30만원', '30만원 이상'];
const areas = ['역 근처', '관광지 중심', '조용한 동네', '공항 이동 편리'];
const stayTypes = ['호텔', '료칸', '게스트하우스', '레지던스'];
const amenities = ['조식 포함', '대욕장', '주차 가능', '금연실', '짐 보관'];

type Hotel = { name: string; address: string; area: string; price: string; transit: string; note: string };

function getHotels(destination: string): Hotel[] {
  const city = destination || '도쿄';
  return [
    { name: `${city} 스테이션 호텔`, address: `${city} 중앙역 도보 4분`, area: '역 근처', price: '1박 약 16만 원', transit: '주요 일정까지 평균 18분', note: '공항과 주요 지역을 오가기 가장 편리해요.' },
    { name: `${city} 가든 스테이`, address: `${city} 문화지구 중심`, area: '관광지 중심', price: '1박 약 13만 원', transit: '주요 일정까지 평균 21분', note: '관광과 식사 동선을 균형 있게 연결해요.' },
    { name: `${city} 리버사이드 호텔`, address: `${city} 강변 산책로 인근`, area: '조용한 동네', price: '1박 약 11만 원', transit: '주요 일정까지 평균 26분', note: '조용한 휴식과 합리적인 가격을 함께 고려했어요.' },
  ];
}

export default function AccommodationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hasItinerary, itineraryDirty, trip, updateTrip } = useTrip();
  const [searchOpen, setSearchOpen] = useState(false);
  const [editingKnown, setEditingKnown] = useState(() => trip.accommodationMode !== 'known' || !trip.accommodationName);
  const [showRecommendations, setShowRecommendations] = useState(() => trip.accommodationMode === 'recommend' && Boolean(trip.accommodationName));
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const recommendationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hotels = getHotels(trip.destination);
  const searchValue = trip.accommodationName.trim().toLowerCase();
  const matches = hotels.filter((hotel) => !searchValue || `${hotel.name} ${hotel.address}`.toLowerCase().includes(searchValue));

  useEffect(() => () => {
    if (recommendationTimer.current) clearTimeout(recommendationTimer.current);
  }, []);

  const selectMode = (mode: AccommodationMode) => {
    if (trip.accommodationMode === mode) return;
    if (recommendationTimer.current) clearTimeout(recommendationTimer.current);
    setRecommendationLoading(false);
    setSearchOpen(false);
    setShowRecommendations(false);
    setEditingKnown(mode === 'known');
    updateTrip({ accommodationMode: mode, accommodationName: '', accommodationAddress: '', accommodationBookingStatus: 'required' });
  };
  const toggleAmenity = (value: string) => updateTrip({ accommodationAmenities: trip.accommodationAmenities.includes(value) ? trip.accommodationAmenities.filter((item) => item !== value) : [...trip.accommodationAmenities, value] });
  const selectHotel = (hotel: Hotel) => {
    updateTrip({ accommodationName: hotel.name, accommodationAddress: hotel.address, ...(trip.accommodationName !== hotel.name ? { accommodationBookingStatus: 'required' as const } : {}) });
    setSearchOpen(false);
    if (trip.accommodationMode === 'known') setEditingKnown(false);
  };
  const canContinue = trip.accommodationMode === 'skip' || Boolean(trip.accommodationName);
  const showBookingActions = Boolean(trip.accommodationName) && !recommendationLoading && ((trip.accommodationMode === 'known' && !editingKnown) || (trip.accommodationMode === 'recommend' && showRecommendations));
  const ctaDisabled = recommendationLoading || (trip.accommodationMode === 'recommend' && showRecommendations && !trip.accommodationName);
  const ctaLabel = recommendationLoading
    ? '숙소를 찾고 있어요…'
    : trip.accommodationMode === 'recommend' && !showRecommendations
    ? '조건에 맞는 숙소 추천 보기'
    : trip.accommodationMode === 'skip'
      ? '중심 지역 기준으로 일정 만들기'
      : hasItinerary && !itineraryDirty
        ? '기존 일정으로 돌아가기'
        : trip.accommodationMode === 'recommend'
          ? '선택한 숙소로 일정 만들기'
          : '이 숙소로 일정 만들기';

  const proceed = () => {
    if (recommendationLoading) return;
    if (trip.accommodationMode === 'recommend' && !showRecommendations) {
      updateTrip({ accommodationName: '', accommodationAddress: '' });
      setRecommendationLoading(true);
      recommendationTimer.current = setTimeout(() => {
        setRecommendationLoading(false);
        setShowRecommendations(true);
        recommendationTimer.current = null;
      }, 1100);
      return;
    }
    if (!canContinue) return;
    if (hasItinerary && !itineraryDirty) router.replace('/itinerary');
    else router.push('/generating');
  };
  const openBookingPage = () => {
    const url = buildAccommodationBookingUrl(trip);
    void Linking.openURL(url).catch(() => Alert.alert('예약 페이지를 열 수 없어요', '잠시 후 다시 시도해 주세요.'));
  };

  return <View style={styles.screen}>
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: Math.max(16, insets.top + 12), paddingBottom: 126 + insets.bottom }]}>
      <View style={styles.nav}>
        <Pressable accessibilityRole="button" accessibilityLabel="여행 취향으로 돌아가기" hitSlop={6} onPress={() => router.replace('/preferences')} style={styles.back}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable>
        <View style={styles.navCopy}><Text style={styles.navKicker}>3 / 4</Text><Text style={styles.navTitle}>숙소 설정</Text></View>
        <View style={styles.progress}><View style={styles.progressFill} /></View><View style={styles.homeSlot}><TripsHomeButton /></View>
      </View>

      <Text style={styles.title}>어디에서 머무시나요?</Text>
      <Text style={styles.description}>숙소를 일정의 시작점과 도착점으로 반영해 이동 시간을 줄여드릴게요.</Text>

      <View style={styles.modeGrid}>
        <ModeCard active={trip.accommodationMode === 'known'} icon="bed-outline" label="숙소를 정했어요" copy="이름이나 주소로 찾기" onPress={() => selectMode('known')} />
        <ModeCard active={trip.accommodationMode === 'recommend'} icon="sparkles-outline" label="추천받고 싶어요" copy="조건에 맞춰 비교하기" onPress={() => selectMode('recommend')} />
      </View>

      {trip.accommodationMode === 'known' ? <View style={styles.section}>
        {trip.accommodationName && !editingKnown ? <>
          <SectionTitle title="선택된 숙소" copy="현재 일정은 이 숙소를 기준으로 구성되어 있어요." />
          <View style={styles.currentStay}><View style={styles.currentStayIcon}><Ionicons name="bed" size={23} color={colors.primaryDark} /></View><View style={styles.grow}><Text style={styles.currentStayLabel}>STAY</Text><Text style={styles.currentStayName}>{trip.accommodationName}</Text><Text style={styles.currentStayAddress}>{trip.accommodationAddress || `${trip.destination} 숙소`}</Text></View><Ionicons name="checkmark-circle" size={23} color={colors.primary} /></View>
          <View style={styles.stayTimes}><View style={styles.stayTime}><Text style={styles.stayTimeLabel}>체크인</Text><Text style={styles.stayTimeValue}>{trip.checkInTime}</Text></View><View style={styles.stayTimeDivider} /><View style={styles.stayTime}><Text style={styles.stayTimeLabel}>체크아웃</Text><Text style={styles.stayTimeValue}>{trip.checkOutTime}</Text></View></View>
          <Pressable onPress={() => setEditingKnown(true)} style={styles.changeStay}><Ionicons name="search" size={17} color={colors.primaryDark} /><Text style={styles.changeStayText}>숙소 변경하기</Text></Pressable>
        </> : <>
          <SectionTitle title="숙소 검색" copy="예약한 숙소명이나 주소를 입력해 주세요." />
          <View style={styles.search}><Ionicons name="search" size={19} color={colors.primary} /><TextInput accessibilityLabel="숙소 검색" onFocus={() => setSearchOpen(true)} onChangeText={(accommodationName) => { updateTrip({ accommodationName, accommodationAddress: '', accommodationBookingStatus: 'required' }); setSearchOpen(true); }} placeholder="호텔명 또는 주소 검색" placeholderTextColor={colors.textMuted} value={trip.accommodationName} style={styles.searchInput} />{trip.accommodationName ? <Pressable accessibilityLabel="숙소 검색어 지우기" onPress={() => updateTrip({ accommodationName: '', accommodationAddress: '', accommodationBookingStatus: 'required' })} style={styles.clear}><Ionicons name="close" size={17} color={colors.textMuted} /></Pressable> : null}</View>
          {searchOpen ? <View style={styles.suggestions}>{matches.length ? matches.map((hotel) => <Pressable key={hotel.name} onPress={() => selectHotel(hotel)} style={styles.suggestion}><View style={styles.suggestionIcon}><Ionicons name="bed-outline" size={18} color={colors.primary} /></View><View style={styles.grow}><Text style={styles.suggestionName}>{hotel.name}</Text><Text style={styles.suggestionAddress}>{hotel.address}</Text></View><Ionicons name="chevron-forward" size={17} color={colors.textMuted} /></Pressable>) : <Text style={styles.noResult}>일치하는 숙소가 없어요. 입력한 이름으로 계속할 수 있어요.</Text>}</View> : null}
          {trip.accommodationAddress ? <View style={styles.selectedStay}><Ionicons name="checkmark-circle" size={19} color={colors.primary} /><View style={styles.grow}><Text style={styles.selectedLabel}>일정 기준 숙소</Text><Text style={styles.selectedAddress}>{trip.accommodationAddress}</Text></View></View> : null}
          <View style={styles.timeGrid}><TimeField label="체크인" value={trip.checkInTime} onChange={(checkInTime) => updateTrip({ checkInTime })} /><TimeField label="체크아웃" value={trip.checkOutTime} onChange={(checkOutTime) => updateTrip({ checkOutTime })} /></View>
        </>}
      </View> : null}

      {trip.accommodationMode === 'recommend' ? <View style={styles.section}>
        {recommendationLoading ? <View accessibilityLiveRegion="polite" style={styles.recommendationLoading}><View style={styles.loadingIcon}><ActivityIndicator color={colors.primary} size="small" /></View><Text style={styles.loadingTitle}>조건에 맞는 숙소를 찾고 있어요</Text><Text style={styles.loadingCopy}>가격대와 선호 지역, 주요 일정까지의 이동 시간을 함께 비교하고 있어요.</Text><View style={styles.loadingSteps}><View style={styles.loadingStepActive} /><View style={styles.loadingStep} /><View style={styles.loadingStep} /></View></View> : !showRecommendations ? <>
          <SectionTitle title="추천 조건" copy={`${trip.partySize}명이 머물 숙소를 찾아볼게요.`} />
          <View style={styles.countRow}><View><Text style={styles.fieldLabel}>필요한 객실</Text><Text style={styles.fieldHint}>동반 인원 {trip.partySize}명</Text></View><View style={styles.counter}><Pressable onPress={() => updateTrip({ roomCount: Math.max(1, trip.roomCount - 1) })} style={styles.countButton}><Text style={styles.countButtonText}>−</Text></Pressable><Text style={styles.countValue}>{trip.roomCount}개</Text><Pressable onPress={() => updateTrip({ roomCount: Math.min(6, trip.roomCount + 1) })} style={styles.countButton}><Text style={styles.countButtonText}>＋</Text></Pressable></View></View>
          <OptionGroup label="1박 가격대" options={budgets} selected={trip.accommodationBudget} onSelect={(accommodationBudget) => updateTrip({ accommodationBudget })} />
          <OptionGroup label="선호 지역" options={areas} selected={trip.accommodationArea} onSelect={(accommodationArea) => updateTrip({ accommodationArea })} />
          <OptionGroup label="숙소 유형" options={stayTypes} selected={trip.accommodationType} onSelect={(accommodationType) => updateTrip({ accommodationType })} />
          <View style={styles.optionGroup}><Text style={styles.fieldLabel}>필수 조건</Text><View style={styles.chips}>{amenities.map((item) => { const selected = trip.accommodationAmenities.includes(item); return <Pressable key={item} onPress={() => toggleAmenity(item)} style={[styles.chip, selected && styles.chipSelected]}><Text style={[styles.chipText, selected && styles.chipTextSelected]}>{selected ? '✓  ' : ''}{item}</Text></Pressable>; })}</View></View>
        </> : <>
          <View style={styles.resultsHeader}><View style={styles.grow}><Text style={styles.resultsTitle}>추천 숙소 3곳</Text><Text style={styles.resultsCopy}>{trip.accommodationArea} · {trip.accommodationBudget} 기준</Text></View><Pressable onPress={() => setShowRecommendations(false)} style={styles.editButton}><Ionicons name="options-outline" size={16} color={colors.primaryDark} /><Text style={styles.editText}>조건 수정</Text></Pressable></View>
          <View style={styles.results}>{hotels.map((hotel, index) => { const selected = trip.accommodationName === hotel.name; return <Pressable accessibilityState={{ selected }} key={hotel.name} onPress={() => selectHotel(hotel)} style={[styles.hotelCard, selected && styles.hotelCardSelected]}><View style={styles.hotelTop}><View style={styles.hotelRank}><Text style={styles.hotelRankText}>{index + 1}</Text></View><View style={styles.grow}><View style={styles.hotelNameRow}><Text style={styles.hotelName}>{hotel.name}</Text>{index === 0 ? <View style={styles.best}><Text style={styles.bestText}>AI 추천</Text></View> : null}</View><Text style={styles.hotelAddress}>{hotel.address}</Text></View>{selected ? <Ionicons name="checkmark-circle" size={23} color={colors.primary} /> : <View style={styles.radio} />}</View><View style={styles.hotelMeta}><Text style={styles.hotelPrice}>{hotel.price}</Text><Text style={styles.hotelTransit}>{hotel.transit}</Text></View><Text style={styles.hotelNote}>{hotel.note}</Text></Pressable>; })}</View>
        </>}
      </View> : null}

      {showBookingActions ? <View style={styles.bookingPanel}>
        <View style={styles.bookingHeader}><View style={[styles.bookingStatusIcon, trip.accommodationBookingStatus === 'booked' && styles.bookingStatusIconDone]}><Ionicons name={trip.accommodationBookingStatus === 'booked' ? 'checkmark' : 'ticket-outline'} size={19} color={trip.accommodationBookingStatus === 'booked' ? '#FFFFFF' : colors.primaryDark} /></View><View style={styles.grow}><Text style={styles.bookingTitle}>{trip.accommodationBookingStatus === 'booked' ? '예약 완료된 숙소예요' : '숙소 예약이 필요해요'}</Text><Text style={styles.bookingCopy}>{trip.accommodationBookingStatus === 'booked' ? '예약 사이트에서 상세 내역이나 바우처를 확인할 수 있어요.' : '선택한 날짜와 인원, 객실 수를 예약 페이지에 함께 전달해요.'}</Text></View></View>
        <View style={styles.bookingActions}><Pressable accessibilityRole="link" onPress={openBookingPage} style={({ pressed }) => [styles.bookingLink, pressed && styles.bookingButtonPressed]}><Ionicons name="open-outline" size={17} color="#FFFFFF" /><Text style={styles.bookingLinkText}>{trip.accommodationBookingStatus === 'booked' ? '예약 내역 보기' : '예약 페이지로 이동'}</Text></Pressable><Pressable accessibilityRole="button" onPress={() => updateTrip({ accommodationBookingStatus: trip.accommodationBookingStatus === 'booked' ? 'required' : 'booked' })} style={({ pressed }) => [styles.bookingStateButton, pressed && styles.bookingButtonPressed]}><Ionicons name={trip.accommodationBookingStatus === 'booked' ? 'refresh-outline' : 'checkmark-circle-outline'} size={17} color={colors.primaryDark} /><Text style={styles.bookingStateText}>{trip.accommodationBookingStatus === 'booked' ? '예약 완료 취소' : '예약 완료로 표시'}</Text></Pressable></View>
      </View> : null}

      <Pressable onPress={() => { selectMode('skip'); updateTrip({ accommodationBookingStatus: 'required' }); }} style={[styles.skip, trip.accommodationMode === 'skip' && styles.skipSelected]}><View style={styles.skipIcon}><Ionicons name="navigate-outline" size={18} color={trip.accommodationMode === 'skip' ? colors.primaryDark : colors.textSecondary} /></View><View style={styles.grow}><Text style={[styles.skipTitle, trip.accommodationMode === 'skip' && styles.skipTitleSelected]}>숙소는 나중에 정할게요</Text><Text style={styles.skipCopy}>도심 중심지를 기준으로 먼저 일정을 만들어요.</Text></View>{trip.accommodationMode === 'skip' ? <Ionicons name="checkmark-circle" size={21} color={colors.primary} /> : <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}</Pressable>
    </ScrollView>

    <View style={[styles.ctaBar, { paddingBottom: Math.max(12, insets.bottom + 8) }]}><Pressable disabled={ctaDisabled || (trip.accommodationMode === 'known' && !canContinue)} onPress={proceed} style={[styles.cta, (ctaDisabled || (trip.accommodationMode === 'known' && !canContinue)) && styles.ctaDisabled]}><Text style={styles.ctaText}>{ctaLabel}</Text>{recommendationLoading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.ctaIcon}>{trip.accommodationMode === 'recommend' && !showRecommendations ? '✦' : '→'}</Text>}</Pressable></View>
  </View>;
}

function ModeCard({ active, copy, icon, label, onPress }: { active: boolean; copy: string; icon: 'bed-outline' | 'sparkles-outline'; label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={[styles.modeCard, active && styles.modeCardActive]}><View style={[styles.modeIcon, active && styles.modeIconActive]}><Ionicons name={icon} size={21} color={active ? '#FFFFFF' : colors.primaryDark} /></View><Text style={[styles.modeLabel, active && styles.modeLabelActive]}>{label}</Text><Text style={styles.modeCopy}>{copy}</Text></Pressable>; }
function SectionTitle({ copy, title }: { copy: string; title: string }) { return <View style={styles.sectionTitle}><Text style={styles.sectionHeading}>{title}</Text><Text style={styles.sectionCopy}>{copy}</Text></View>; }
function TimeField({ label, onChange, value }: { label: string; onChange: (value: string) => void; value: string }) { return <View style={styles.timeField}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.timeInputRow}><Ionicons name="time-outline" size={17} color={colors.primary} /><TextInput accessibilityLabel={`${label} 시간`} maxLength={5} onChangeText={onChange} value={value} style={styles.timeInput} /></View></View>; }
function OptionGroup({ label, onSelect, options, selected }: { label: string; onSelect: (value: string) => void; options: string[]; selected: string }) { return <View style={styles.optionGroup}><Text style={styles.fieldLabel}>{label}</Text><View style={styles.chips}>{options.map((item) => <Pressable key={item} onPress={() => onSelect(item)} style={[styles.chip, selected === item && styles.chipSelected]}><Text style={[styles.chipText, selected === item && styles.chipTextSelected]}>{item}</Text></Pressable>)}</View></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFFFF' }, content: { width: '100%', maxWidth: responsive.contentMaxWidth, alignSelf: 'center', paddingHorizontal: spacing.lg }, grow: { flex: 1, minWidth: 0 },
  nav: { minHeight: responsive.headerControlSize, flexDirection: 'row', alignItems: 'center', marginBottom: 34 }, back: { width: responsive.headerControlSize, height: responsive.headerControlSize, flexShrink: 0, borderRadius: responsive.headerControlSize / 2, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12 }, navCopy: { flex: 1, minWidth: 0 }, navKicker: { color: colors.primary, fontSize: 10, fontWeight: '900' }, navTitle: { color: colors.text, fontSize: 20, lineHeight: 25, fontWeight: '900', marginTop: 2 }, progress: { width: 58, height: 5, flexShrink: 0, borderRadius: 3, backgroundColor: colors.border }, progressFill: { width: '75%', height: '100%', borderRadius: 3, backgroundColor: colors.primary }, homeSlot: { flexShrink: 0, marginLeft: 10 },
  title: { color: colors.text, fontSize: 27, lineHeight: 35, fontWeight: '900', letterSpacing: -0.7 }, description: { maxWidth: 520, color: colors.textSecondary, fontSize: 12, lineHeight: 19, marginTop: 8 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 }, modeCard: { flexBasis: 130, flexGrow: 1, minWidth: 0, minHeight: 132, borderRadius: 22, borderWidth: 2, borderColor: colors.border, backgroundColor: '#FFFFFF', padding: 14 }, modeCardActive: { borderColor: colors.primary, backgroundColor: '#F7F7FF' }, modeIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 13 }, modeIconActive: { backgroundColor: colors.primary }, modeLabel: { color: colors.text, fontSize: 13, fontWeight: '900' }, modeLabelActive: { color: colors.primaryDark }, modeCopy: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 4 },
  section: { marginTop: 30 }, sectionTitle: { marginBottom: 15 }, sectionHeading: { color: colors.text, fontSize: 18, fontWeight: '900' }, sectionCopy: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, marginTop: 5 },
  search: { minHeight: 58, borderRadius: 18, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14 }, searchInput: { flex: 1, minWidth: 0, height: 56, color: colors.text, fontSize: 14, outlineStyle: 'none' } as never, clear: { width: 44, height: 44, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  suggestions: { borderRadius: 18, borderWidth: 1, borderColor: colors.border, marginTop: 8, overflow: 'hidden', ...shadow.card }, suggestion: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 13, borderBottomWidth: 1, borderBottomColor: colors.border }, suggestionIcon: { width: 38, height: 38, flexShrink: 0, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, suggestionName: { color: colors.text, fontSize: 12, fontWeight: '900' }, suggestionAddress: { color: colors.textSecondary, fontSize: 9, marginTop: 4 }, noResult: { color: colors.textSecondary, fontSize: 11, lineHeight: 17, textAlign: 'center', padding: 18 },
  selectedStay: { minHeight: 58, borderRadius: 17, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, marginTop: 10 }, selectedLabel: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' }, selectedAddress: { color: colors.textSecondary, fontSize: 9, marginTop: 3 },
  currentStay: { minHeight: 92, borderRadius: 22, borderWidth: 2, borderColor: colors.primary, backgroundColor: '#F8F8FF', flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }, currentStayIcon: { width: 50, height: 50, flexShrink: 0, borderRadius: 17, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, currentStayLabel: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1 }, currentStayName: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: '900', marginTop: 3 }, currentStayAddress: { color: colors.textSecondary, fontSize: 9, marginTop: 4 }, stayTimes: { minHeight: 68, borderRadius: 18, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center', marginTop: 10 }, stayTime: { flex: 1, minWidth: 0, alignItems: 'center' }, stayTimeLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700' }, stayTimeValue: { color: colors.text, fontSize: 14, fontWeight: '900', marginTop: 4 }, stayTimeDivider: { width: 1, height: 30, backgroundColor: colors.borderStrong }, changeStay: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 10 }, changeStayText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' },
  timeGrid: { flexDirection: 'row', gap: 10, marginTop: 16 }, timeField: { flex: 1, minWidth: 0 }, fieldLabel: { color: colors.text, fontSize: 12, fontWeight: '900' }, fieldHint: { color: colors.textSecondary, fontSize: 9, marginTop: 4 }, timeInputRow: { minHeight: 54, borderRadius: 17, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginTop: 8 }, timeInput: { flex: 1, minWidth: 0, color: colors.text, fontSize: 15, fontWeight: '900', outlineStyle: 'none' } as never,
  countRow: { minHeight: 72, borderRadius: 19, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: 13 }, counter: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 10 }, countButton: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, countButtonText: { color: colors.text, fontSize: 17 }, countValue: { minWidth: 32, textAlign: 'center', color: colors.text, fontSize: 13, fontWeight: '900' },
  optionGroup: { marginTop: 24 }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }, chip: { minHeight: 44, borderRadius: 15, borderWidth: 1, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13 }, chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, chipText: { color: colors.textSecondary, fontSize: 10, fontWeight: '700' }, chipTextSelected: { color: colors.primaryDark, fontWeight: '900' },
  recommendationLoading: { minHeight: 240, borderRadius: 24, borderWidth: 1, borderColor: '#E4E5FF', backgroundColor: '#F8F8FF', alignItems: 'center', justifyContent: 'center', padding: spacing.lg }, loadingIcon: { width: 54, height: 54, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow.card }, loadingTitle: { color: colors.text, fontSize: 15, fontWeight: '900', textAlign: 'center', marginTop: 18 }, loadingCopy: { maxWidth: 330, color: colors.textSecondary, fontSize: 10, lineHeight: 17, textAlign: 'center', marginTop: 7 }, loadingSteps: { flexDirection: 'row', gap: 5, marginTop: 18 }, loadingStep: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.borderStrong }, loadingStepActive: { width: 22, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 }, resultsTitle: { color: colors.text, fontSize: 19, fontWeight: '900' }, resultsCopy: { color: colors.textSecondary, fontSize: 10, marginTop: 4 }, editButton: { minHeight: 44, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11 }, editText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' }, results: { gap: 10 },
  hotelCard: { borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 14, backgroundColor: '#FFFFFF' }, hotelCardSelected: { borderWidth: 2, borderColor: colors.primary, backgroundColor: '#F9F9FF' }, hotelTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, hotelRank: { width: 32, height: 32, flexShrink: 0, borderRadius: 11, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, hotelRankText: { color: colors.primaryDark, fontSize: 11, fontWeight: '900' }, hotelNameRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }, hotelName: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '900' }, best: { borderRadius: 7, backgroundColor: colors.primarySoft, paddingHorizontal: 6, paddingVertical: 3 }, bestText: { color: colors.primaryDark, fontSize: 7, fontWeight: '900' }, hotelAddress: { color: colors.textSecondary, fontSize: 9, marginTop: 4 }, radio: { width: 20, height: 20, flexShrink: 0, borderRadius: 10, borderWidth: 2, borderColor: colors.borderStrong }, hotelMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, hotelPrice: { color: colors.text, fontSize: 10, fontWeight: '900' }, hotelTransit: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' }, hotelNote: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 7 },
  bookingPanel: { borderRadius: 22, borderWidth: 1, borderColor: '#E4E5FF', backgroundColor: '#F8F8FF', padding: 14, marginTop: 20 }, bookingHeader: { flexDirection: 'row', alignItems: 'center', gap: 11 }, bookingStatusIcon: { width: 42, height: 42, flexShrink: 0, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, bookingStatusIconDone: { backgroundColor: colors.primary }, bookingTitle: { color: colors.text, fontSize: 13, fontWeight: '900' }, bookingCopy: { color: colors.textSecondary, fontSize: 9, lineHeight: 15, marginTop: 4 }, bookingActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 13 }, bookingLink: { flexBasis: 150, flexGrow: 1, minWidth: 0, minHeight: 48, borderRadius: 15, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12 }, bookingLinkText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' }, bookingStateButton: { flexBasis: 150, flexGrow: 1, minWidth: 0, minHeight: 48, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.borderStrong, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 12 }, bookingStateText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' }, bookingButtonPressed: { opacity: 0.74 },
  skip: { minHeight: 72, borderRadius: 19, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginTop: 28 }, skipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft }, skipIcon: { width: 40, height: 40, flexShrink: 0, borderRadius: 14, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }, skipTitle: { color: colors.text, fontSize: 12, fontWeight: '900' }, skipTitleSelected: { color: colors.primaryDark }, skipCopy: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 4 },
  ctaBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.97)', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingTop: 11 }, cta: { width: '100%', maxWidth: 680, minHeight: 56, alignSelf: 'center', borderRadius: 18, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 11, paddingHorizontal: 14 }, ctaDisabled: { backgroundColor: '#C8CCD6' }, ctaText: { flexShrink: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '900', textAlign: 'center' }, ctaIcon: { flexShrink: 0, color: '#FFFFFF', fontSize: 16 },
});
