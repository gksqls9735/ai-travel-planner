import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripMap } from '@/features/trip/trip-map';
import { PlaceBookingRequirement, PlaceDetailModal } from '@/features/trip/place-detail-modal';
import { PlaceReplacementSheet, ReplacementCandidate } from '@/features/trip/place-replacement-sheet';
import { AddPlaceCandidate, PlaceAddSheet } from '@/features/trip/place-add-sheet';
import { ReorderHandle } from '@/features/trip/reorder-handle';
import { TransportId, TransportOption, TransportSelectionSheet } from '@/features/trip/transport-selection-sheet';
import { buildAccommodationBookingUrl } from '@/features/trip/booking-links';
import { useTrip } from '@/features/trip/trip-context';
import { responsive } from '@/features/layout/responsive';
import { TripsHomeButton } from '@/features/navigation/trips-home-button';
import { colors, shadow, spacing } from '@/features/trip/theme';

type Stop = { time: string; name: string; category: string; duration: string; icon: string; alt: string[]; bookingNote?: string; bookingRequirement?: PlaceBookingRequirement };
type SelectedPlace = { day: number; index: number; stop: Stop };
type ReplacementRequest = { day: number; index: number; returnToDetail: boolean };
type TransportRequest = { day: number; index: number };
type AddRequest = { day: number; index: number };
type DeletedStop = { day: number; index: number; stop: Stop };
type WebPointerGestureEvent = {
  preventDefault: () => void;
  currentTarget: {
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  nativeEvent: { pageY: number; pointerId: number };
};
const plans: Stop[][] = [
  [{ time: '09:00', name: '센소지와 나카미세 거리', category: '전통 문화', duration: '1시간 30분', icon: '⛩', alt: ['네즈 신사와 골목 산책', '아사쿠사 문화관'] }, { time: '11:30', name: '아사쿠사 이마한', category: '맛집', duration: '1시간', icon: '🍲', alt: ['오니기리 아사쿠사 야도라쿠', '소메타로 오코노미야키'], bookingRequirement: 'recommended', bookingNote: '인기 시간대에는 대기가 길 수 있어 사전 예약을 권장해요.' }, { time: '14:00', name: '우에노 공원과 도쿄 국립박물관', category: '예술·산책', duration: '2시간', icon: '🖼️', alt: ['국립서양미술관', '야나카 긴자'], bookingRequirement: 'recommended', bookingNote: '특별전 관람 여부에 따라 사전 예매가 필요할 수 있어요.' }, { time: '18:30', name: '긴자 로컬 스시 바', category: '저녁 식사', duration: '1시간 30분', icon: '🍣', alt: ['츠키지 스시 체험', '유라쿠초 이자카야'], bookingRequirement: 'recommended', bookingNote: '좌석이 적은 매장을 고려해 저녁 시간 예약을 권장해요.' }],
  [{ time: '09:30', name: '메이지 신궁', category: '자연·문화', duration: '1시간 30분', icon: '🌿', alt: ['신주쿠 교엔', '요요기 공원'] }, { time: '12:00', name: '하라주쿠 골목 브런치', category: '맛집', duration: '1시간', icon: '🥞', alt: ['오모테산도 카페', '시부야 우동'] }, { time: '15:00', name: '시부야 스카이', category: '전망대', duration: '1시간 30분', icon: '🌇', alt: ['도쿄 도청 전망대', '롯폰기 힐스 전망대'], bookingRequirement: 'required', bookingNote: '원하는 입장 시간을 확보하려면 시간 지정 티켓을 미리 준비해 주세요.' }],
  [{ time: '10:00', name: '츠키지 장외시장', category: '맛집 탐방', duration: '2시간', icon: '🐟', alt: ['토요스 시장', '몬자야키 거리'] }, { time: '14:00', name: '기요스미 정원', category: '자연 경관', duration: '1시간', icon: '🌳', alt: ['하마리큐 정원', '고이시카와 고라쿠엔'] }],
  [{ time: '09:30', name: '다이칸야마 산책', category: '골목 산책', duration: '1시간 30분', icon: '🚶', alt: ['나카메구로 산책', '지유가오카'] }, { time: '12:00', name: '에비스 로컬 런치', category: '맛집', duration: '1시간', icon: '🍱', alt: ['다이칸야마 브런치', '시부야 라멘'] }],
];

const transitMinutes = [18, 24, 16, 22];
const transitDetails = ['긴자선 이용 · 환승 없음', '히비야선 이용 · 환승 1회', 'JR 야마노테선 · 환승 없음', '도에이선 이용 · 환승 1회'];

function getTransportOptions(dayIndex: number, legIndex: number): TransportOption[] {
  const base = transitMinutes[(dayIndex + legIndex) % transitMinutes.length];
  return [
    { id: 'transit', label: '대중교통', minutes: base, detail: transitDetails[(dayIndex + legIndex) % transitDetails.length], price: `약 ${180 + ((dayIndex + legIndex) % 3) * 40}엔` },
    { id: 'taxi', label: '택시', minutes: Math.max(7, base - 8), detail: '교통 상황에 따라 달라질 수 있어요', price: `약 ${1200 + ((dayIndex + legIndex) % 3) * 300}엔`, note: '짐이 많거나 부모님과 함께라면 편해요' },
    { id: 'walk', label: '도보', minutes: base + 14, detail: `${(1.8 + ((dayIndex + legIndex) % 3) * 0.3).toFixed(1)}km · 평탄한 길 위주`, price: '무료' },
  ];
}

function shiftTime(value: string, delta: number) {
  const [hours, minutes] = value.split(':').map(Number);
  const total = (hours * 60 + minutes + delta + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const normalized = (value + 24 * 60) % (24 * 60);
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
}

function durationToMinutes(value: string) {
  const hours = Number(value.match(/(\d+)시간/)?.[1] ?? 0);
  const minutes = Number(value.match(/(\d+)분/)?.[1] ?? 0);
  return hours * 60 + minutes || 60;
}

export default function ItineraryScreen() {
  const router = useRouter(); const { trip } = useTrip();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const mapHeight = Math.max(360, height * 0.48);
  const snapPoints = useMemo(() => ({
    expanded: Math.max(92, height * 0.11),
    middle: Math.max(300, height * 0.38),
    collapsed: Math.min(height - 176, height * 0.68),
  }), [height]);
  const [sheetTop] = useState(() => new Animated.Value(snapPoints.middle));
  const currentSheetTop = useRef(snapPoints.middle);
  const dragStartTop = useRef(snapPoints.middle);
  const webDragStartY = useRef(0);
  const webDragDeltaY = useRef(0);
  const isWebDragging = useRef(false);
  const deleteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [reorderOffset] = useState(() => new Animated.Value(0));
  const [day, setDay] = useState(0); const [stops, setStops] = useState(plans); const [locked, setLocked] = useState<string[]>([]); const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null); const [replacementRequest, setReplacementRequest] = useState<ReplacementRequest | null>(null); const [transportRequest, setTransportRequest] = useState<TransportRequest | null>(null); const [addRequest, setAddRequest] = useState<AddRequest | null>(null); const [deletedStop, setDeletedStop] = useState<DeletedStop | null>(null); const [editing, setEditing] = useState(false); const [draggingIndex, setDraggingIndex] = useState<number | null>(null); const [transportChoices, setTransportChoices] = useState<Record<string, TransportId>>({}); const [placeBookingStatuses, setPlaceBookingStatuses] = useState<Record<string, boolean>>({}); const [toast, setToast] = useState('');
  const resetDayRouteState = (targetDay: number) => {
    setTransportChoices((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !key.startsWith(`${targetDay}-`))));
    setLocked((current) => current.filter((key) => !key.startsWith(`${targetDay}-`)));
  };
  const addPlace = (place: AddPlaceCandidate) => {
    if (!addRequest) return;
    const { day: targetDay, index } = addRequest;
    setStops((all) => all.map((list, listIndex) => {
      if (listIndex !== targetDay) return list;
      const previous = list[index - 1];
      const next = list[index];
      const startMinutes = previous ? timeToMinutes(previous.time) + durationToMinutes(previous.duration) + 18 : Math.max(6 * 60, timeToMinutes(next?.time ?? '09:00') - 90);
      const requiredNextStart = startMinutes + durationToMinutes(place.duration) + 18;
      const shift = next ? Math.max(0, requiredNextStart - timeToMinutes(next.time)) : 0;
      const shifted = list.map((stop, stopIndex) => stopIndex >= index && shift ? { ...stop, time: shiftTime(stop.time, shift) } : stop);
      const nextStop: Stop = { ...place, time: minutesToTime(startMinutes), bookingRequirement: 'unknown', bookingNote: '직접 추가한 장소예요. 방문 전에 예약 필요 여부를 확인해 주세요.' };
      return [...shifted.slice(0, index), nextStop, ...shifted.slice(index)];
    }));
    resetDayRouteState(targetDay);
    setAddRequest(null);
    notify(`“${place.name}”을(를) 일정에 추가했어요.`);
  };
  const deletePlace = (index: number) => {
    const stop = stops[day]?.[index];
    if (!stop) return;
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setDeletedStop({ day, index, stop });
    setStops((all) => all.map((list, listIndex) => listIndex === day ? list.filter((_, stopIndex) => stopIndex !== index) : list));
    resetDayRouteState(day);
    deleteTimer.current = setTimeout(() => { setDeletedStop(null); deleteTimer.current = null; }, 4500);
  };
  const undoDelete = () => {
    if (!deletedStop) return;
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
    setStops((all) => all.map((list, listIndex) => listIndex === deletedStop.day ? [...list.slice(0, deletedStop.index), deletedStop.stop, ...list.slice(deletedStop.index)] : list));
    setDeletedStop(null);
    deleteTimer.current = null;
  };
  const finishReorder = (index: number, deltaY: number) => {
    const list = stops[day];
    const distance = Math.abs(deltaY) < 36 ? 0 : Math.round(deltaY / 130) || Math.sign(deltaY);
    const target = Math.max(0, Math.min(list.length - 1, index + distance));
    reorderOffset.setValue(0);
    setDraggingIndex(null);
    if (target === index) return;
    setStops((all) => all.map((items, listIndex) => {
      if (listIndex !== day) return items;
      const times = items.map((item) => item.time);
      const reordered = [...items];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(target, 0, moved);
      return reordered.map((item, itemIndex) => ({ ...item, time: times[itemIndex] }));
    }));
    resetDayRouteState(day);
    notify('장소 순서를 바꾸고 이동 구간을 다시 계산했어요.');
  };
  const applyReplacement = (candidate: ReplacementCandidate) => {
    if (!replacementRequest) return;
    const { day: targetDay, index, returnToDetail } = replacementRequest;
    const current = stops[targetDay]?.[index];
    if (!current) return;
    const nextStop = { ...current, ...candidate, alt: [current.name, ...current.alt.filter((name) => name !== candidate.name)], bookingRequirement: 'unknown' as const, bookingNote: '새로 추천된 장소예요. 외부 데이터 연동 후 예약 필요 여부를 확인할 수 있어요.' };
    setStops((all) => all.map((list, listIndex) => listIndex === targetDay ? list.map((stop, stopIndex) => stopIndex === index ? nextStop : stop) : list));
    if (returnToDetail) setSelectedPlace({ day: targetDay, index, stop: nextStop });
    setReplacementRequest(null);
    notify(`“${nextStop.name}”으로 바꿨어요.`);
  };
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2000); };
  const selectTransport = (option: TransportOption) => {
    if (!transportRequest) return;
    const { day: targetDay, index } = transportRequest;
    const key = `${targetDay}-${index}`;
    const options = getTransportOptions(targetDay, index);
    const previous = options.find((item) => item.id === (transportChoices[key] ?? 'transit')) ?? options[0];
    const delta = option.minutes - previous.minutes;
    setTransportChoices((current) => ({ ...current, [key]: option.id }));
    if (delta) setStops((all) => all.map((list, listIndex) => listIndex === targetDay ? list.map((stop, stopIndex) => stopIndex > index ? { ...stop, time: shiftTime(stop.time, delta) } : stop) : list));
    setTransportRequest(null);
    notify(`${option.label} ${option.minutes}분으로 변경했어요.`);
  };
  const snapSheet = (top: number) => {
    Animated.spring(sheetTop, { toValue: top, useNativeDriver: false, damping: 24, stiffness: 240, mass: 0.8 }).start();
  };
  const closestSnap = (value: number) => {
    const points = [snapPoints.expanded, snapPoints.middle, snapPoints.collapsed];
    return points.reduce((closest, point) => Math.abs(point - value) < Math.abs(closest - value) ? point : closest);
  };
  const startDragging = () => {
    sheetTop.stopAnimation();
    dragStartTop.current = currentSheetTop.current;
  };
  const moveSheet = (deltaY: number) => {
    const next = Math.max(snapPoints.expanded, Math.min(snapPoints.collapsed, dragStartTop.current + deltaY));
    currentSheetTop.current = next;
    sheetTop.setValue(next);
  };
  const finishDragging = () => snapSheet(closestSnap(currentSheetTop.current));
  // These callbacks read refs only after a touch or mouse gesture starts.
  // eslint-disable-next-line react-hooks/refs
  const sheetPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 2,
    onPanResponderGrant: startDragging,
    onPanResponderMove: (_, gesture) => moveSheet(gesture.dy),
    onPanResponderRelease: finishDragging,
    onPanResponderTerminate: finishDragging,
  });

  const webDragHandlers = Platform.OS === 'web' ? {
    onPointerDown: (event: WebPointerGestureEvent) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture?.(event.nativeEvent.pointerId);
      isWebDragging.current = true;
      webDragStartY.current = event.nativeEvent.pageY;
      webDragDeltaY.current = 0;
      startDragging();
    },
    onPointerMove: (event: WebPointerGestureEvent) => {
      if (!isWebDragging.current) return;
      event.preventDefault();
      webDragDeltaY.current = event.nativeEvent.pageY - webDragStartY.current;
      moveSheet(webDragDeltaY.current);
    },
    onPointerUp: (event: WebPointerGestureEvent) => {
      if (!isWebDragging.current) return;
      event.preventDefault();
      event.currentTarget.releasePointerCapture?.(event.nativeEvent.pointerId);
      isWebDragging.current = false;
      finishDragging();
    },
    onPointerCancel: (event: WebPointerGestureEvent) => {
      event.currentTarget.releasePointerCapture?.(event.nativeEvent.pointerId);
      if (!isWebDragging.current) return;
      isWebDragging.current = false;
      finishDragging();
    },
  } : {};
  const sheetDragHandlers = Platform.OS === 'web' ? webDragHandlers : sheetPanResponder.panHandlers;

  useEffect(() => {
    currentSheetTop.current = snapPoints.middle;
    sheetTop.setValue(snapPoints.middle);
  }, [sheetTop, snapPoints]);

  useEffect(() => {
    const listenerId = sheetTop.addListener(({ value }) => { currentSheetTop.current = value; });
    return () => sheetTop.removeListener(listenerId);
  }, [sheetTop]);

  useEffect(() => () => {
    if (deleteTimer.current) clearTimeout(deleteTimer.current);
  }, []);

  const flightForDay = !trip.flightLater && day === 0 ? {
    label: '가는 편 항공편',
    route: `출발 공항 → ${trip.destination || '여행지'} 공항`,
    departureLabel: '출발',
    departureTime: trip.inboundDepartureTime,
    arrivalLabel: '현지 도착',
    arrivalTime: trip.inboundArrivalTime,
  } : !trip.flightLater && day === stops.length - 1 ? {
    label: '오는 편 항공편',
    route: `${trip.destination || '여행지'} 공항 → 도착 공항`,
    departureLabel: '현지 출발',
    departureTime: trip.outboundDepartureTime,
    arrivalLabel: '도착',
    arrivalTime: trip.outboundArrivalTime,
  } : null;

  return <View style={styles.screen}>
    <View style={[styles.mapLayer, { height: mapHeight }]}><TripMap activeDay={day} showDetails={false} /><View style={styles.mapShade} /></View>
    <View style={[styles.topBarWrap, { top: Math.max(16, insets.top + 8) }]}><View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="숙소 설정으로 돌아가기" hitSlop={6} onPress={() => router.replace('/accommodation')} style={styles.mapButton}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable><View style={styles.tripCopy}><Text style={styles.tripKicker}>AI가 만든 여행</Text><Text numberOfLines={1} style={styles.tripTitle}>{trip.destination || '도쿄'} · {day + 1}일차</Text></View><Pressable accessibilityRole="button" accessibilityLabel="일정 저장" hitSlop={4} onPress={() => notify('일정을 저장했어요.')} style={styles.mapButton}><Ionicons name="heart-outline" size={20} color={colors.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="일정 공유" hitSlop={4} onPress={() => notify('공유 링크를 준비했어요.')} style={styles.mapButton}><Ionicons name="share-outline" size={20} color={colors.text} /></Pressable></View></View>

    <Animated.View style={[styles.sheet, { top: sheetTop, height: Math.max(420, height - snapPoints.expanded) }]}> 
      <View {...sheetDragHandlers} accessibilityLabel="일정 패널 드래그 손잡이" accessibilityHint="위아래로 드래그해 일정 영역 높이를 조절합니다" style={styles.dragSurface}>
        <View style={styles.dragHandleArea}><View style={styles.handle} /></View>
      </View>
      <View style={styles.sheetHeader}><View style={styles.sheetHeading}><Text style={styles.sheetKicker}>{editing ? '직접 편집 중' : '오늘의 일정'}</Text><Text style={styles.sheetTitle}>{editing ? '장소를 추가하거나 순서를 바꿔보세요' : day === 0 ? '도쿄의 오래된 골목부터 시작해요' : '가까운 장소끼리 편안하게 연결했어요'}</Text></View><View style={styles.sheetActions}>{!editing ? <View style={styles.optimized}><Text style={styles.optimizedText}>✦ 최적 동선</Text></View> : null}<Pressable accessibilityRole="button" accessibilityState={{ selected: editing }} onPress={() => setEditing((value) => !value)} style={[styles.editToggle, editing && styles.editToggleActive]}><Ionicons name={editing ? 'checkmark' : 'create-outline'} size={15} color={editing ? '#FFFFFF' : colors.primaryDark} /><Text style={[styles.editToggleText, editing && styles.editToggleTextActive]}>{editing ? '완료' : '편집'}</Text></Pressable></View></View>
      <ScrollView horizontal style={styles.daysScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>{plans.map((_, index) => <Pressable key={index} onPress={() => setDay(index)} style={[styles.day, day === index && styles.dayActive]}><Text style={[styles.dayName, day === index && styles.dayNameActive]}>Day {index + 1}</Text><Text style={[styles.dayDate, day === index && styles.dayDateActive]}>{index + 8}일</Text></Pressable>)}</ScrollView>

      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
        {flightForDay ? <Pressable accessibilityRole="button" accessibilityLabel={`${flightForDay.label} 정보 수정`} onPress={() => router.push('/new-trip')} style={({ pressed }) => [styles.flightCard, pressed && styles.flightCardPressed]}><View style={styles.flightIcon}><Ionicons name="airplane" size={20} color={colors.primaryDark} /></View><View style={styles.flightCopy}><View style={styles.flightTitleRow}><Text style={styles.flightKicker}>{flightForDay.label}</Text><Text numberOfLines={1} style={styles.flightRoute}>{flightForDay.route}</Text></View><View style={styles.flightTimes}><View style={styles.flightTimeBlock}><Text style={styles.flightTimeLabel}>{flightForDay.departureLabel}</Text><Text style={styles.flightTime}>{flightForDay.departureTime || '--:--'}</Text></View><View style={styles.flightLine}><View style={styles.flightLineRule} /><Ionicons name="airplane" size={12} color={colors.primary} /></View><View style={[styles.flightTimeBlock, styles.flightTimeBlockEnd]}><Text style={styles.flightTimeLabel}>{flightForDay.arrivalLabel}</Text><Text style={styles.flightTime}>{flightForDay.arrivalTime || '--:--'}</Text></View></View></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable> : null}
        <View style={styles.stayCard}><Pressable accessibilityRole="button" accessibilityLabel="숙소 정보 확인 및 변경" onPress={() => router.push('/accommodation')} style={({ pressed }) => [styles.stayMain, pressed && styles.stayCardPressed]}><View style={styles.stayIcon}><Ionicons name={trip.accommodationMode === 'skip' ? 'navigate-outline' : 'bed-outline'} size={20} color={colors.primaryDark} /></View><View style={styles.stayCopy}><Text style={styles.stayKicker}>일정 기준 숙소</Text><Text numberOfLines={1} style={styles.stayName}>{trip.accommodationMode === 'skip' ? `${trip.destination || '도쿄'} 중심 지역` : trip.accommodationName || '숙소를 선택해 주세요'}</Text><Text numberOfLines={1} style={styles.stayAddress}>{trip.accommodationMode === 'skip' ? '숙소를 정하면 동선을 다시 최적화할 수 있어요.' : trip.accommodationAddress || `${trip.checkInTime} 체크인 · ${trip.checkOutTime} 체크아웃`}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.textMuted} /></Pressable>{trip.accommodationMode !== 'skip' && trip.accommodationName ? <View style={styles.stayBookingRow}><View style={styles.stayBookingStatus}><View style={[styles.stayBookingDot, trip.accommodationBookingStatus === 'booked' && styles.stayBookingDotDone]} /><Text style={styles.stayBookingStatusText}>{trip.accommodationBookingStatus === 'booked' ? '예약 완료' : '예약 필요'}</Text></View><Pressable accessibilityRole="link" onPress={() => { void Linking.openURL(buildAccommodationBookingUrl(trip)).catch(() => notify('예약 페이지를 열 수 없어요.')); }} style={({ pressed }) => [styles.stayBookingLink, pressed && styles.stayCardPressed]}><Text style={styles.stayBookingLinkText}>{trip.accommodationBookingStatus === 'booked' ? '예약 내역 보기' : '예약처 보기'}</Text><Ionicons name="open-outline" size={14} color={colors.primaryDark} /></Pressable></View> : null}</View>
        {stops[day].map((stop, index) => { const key = `${day}-${index}`; const isLocked = locked.includes(key); const isDragging = draggingIndex === index; const isBooked = Boolean(placeBookingStatuses[stop.name]); return <Animated.View key={`${stop.name}-${index}`} style={[isDragging && styles.draggingStop, isDragging && { transform: [{ translateY: reorderOffset }] }]}>
          <View style={styles.stop}><View style={styles.timeColumn}><Text style={styles.time}>{stop.time}</Text><View style={styles.dot} />{index < stops[day].length - 1 ? <View style={styles.line} /> : null}</View>
            <View style={styles.stopContent}><View style={styles.stopTop}><Pressable accessibilityRole="button" accessibilityLabel={`${stop.name} 장소 정보 보기${isBooked ? ', 예약 완료' : ''}`} disabled={editing} onPress={() => setSelectedPlace({ day, index, stop })} style={styles.placeSummary}><View style={styles.placeIcon}><Text style={styles.placeEmoji}>{stop.icon}</Text></View><View style={styles.placeCopy}><Text style={styles.placeName}>{stop.name}</Text><View style={styles.placeMetaRow}><Text style={styles.placeMeta}>{stop.category} · {stop.duration}</Text>{isBooked ? <View style={styles.bookedBadge}><Ionicons name="checkmark" size={11} color={colors.primaryDark} /><Text style={styles.bookedBadgeText}>예약 완료</Text></View> : null}</View></View></Pressable>{editing ? <><Pressable accessibilityRole="button" accessibilityLabel={`${stop.name} 삭제`} onPress={() => deletePlace(index)} style={styles.deleteButton}><Ionicons name="trash-outline" size={18} color={colors.danger} /></Pressable><ReorderHandle dragOffset={reorderOffset} onStart={() => setDraggingIndex(index)} onFinish={(deltaY) => finishReorder(index, deltaY)} /></> : <Pressable accessibilityRole="button" accessibilityLabel={isLocked ? '장소 고정 해제' : '장소 고정'} onPress={() => setLocked((items) => isLocked ? items.filter((item) => item !== key) : [...items, key])} style={[styles.lock, isLocked && styles.lockActive]}><Ionicons name={isLocked ? 'lock-closed' : 'lock-open-outline'} size={15} color={isLocked ? colors.primary : colors.textMuted} /></Pressable>}</View>
              {!editing ? <Pressable disabled={isLocked} onPress={() => setReplacementRequest({ day, index, returnToDetail: false })} style={[styles.regenerate, isLocked && styles.disabled]}><Text style={styles.regenerateText}>↻  이 장소 대신 다른 곳 추천</Text></Pressable> : null}
            </View>
          </View>
          {index < stops[day].length - 1 ? (() => { const options = getTransportOptions(day, index); const selected = options.find((option) => option.id === (transportChoices[`${day}-${index}`] ?? 'transit')) ?? options[0]; const iconName = selected.id === 'transit' ? 'subway-outline' : selected.id === 'taxi' ? 'car-outline' : 'walk-outline'; return <View style={styles.transit}><View style={styles.transitRail}><View style={styles.transitRailLine} /><View style={styles.transitJunction} /></View><View style={styles.transitBranch} /><Pressable accessibilityRole="button" accessibilityLabel={`${selected.label} ${selected.minutes}분, 다른 이동수단 보기`} disabled={editing} onPress={() => setTransportRequest({ day, index })} style={({ pressed }) => [styles.transitButton, editing && styles.transitButtonEditing, pressed && styles.transitButtonPressed]}><Ionicons name={iconName} size={14} color={colors.primaryDark} /><Text style={styles.transitText}>{selected.label} {selected.minutes}분</Text>{!editing ? <Ionicons name="chevron-down" size={13} color={colors.primaryDark} /> : null}</Pressable>{editing ? <Pressable accessibilityRole="button" accessibilityLabel={`${stop.name} 다음에 장소 추가`} onPress={() => setAddRequest({ day, index: index + 1 })} style={styles.addBetween}><Ionicons name="add" size={19} color={colors.primaryDark} /></Pressable> : null}</View>; })() : null}
        </Animated.View>; })}
        <Pressable onPress={() => setAddRequest({ day, index: stops[day].length })} style={styles.add}><Ionicons name="add-circle-outline" size={17} color={colors.primary} /><Text style={styles.addText}>직접 장소 추가하기</Text></Pressable><View style={styles.bottomSpace} />
      </ScrollView>
    </Animated.View>
    <PlaceDetailModal bookingStatus={selectedPlace ? Boolean(placeBookingStatuses[selectedPlace.stop.name]) : false} destination={trip.destination || '도쿄'} isLocked={selectedPlace ? locked.includes(`${selectedPlace.day}-${selectedPlace.index}`) : false} onClose={() => setSelectedPlace(null)} onKeep={() => { if (!selectedPlace) return; const key = `${selectedPlace.day}-${selectedPlace.index}`; setLocked((items) => items.includes(key) ? items : [...items, key]); notify('이 장소를 일정에 유지할게요.'); setSelectedPlace(null); }} onOpenBooking={() => { if (!selectedPlace) return; notify(`“${selectedPlace.stop.name}” 예약 페이지는 외부 데이터 연동 후 연결할게요.`); }} onRegenerate={() => { if (!selectedPlace) return; setReplacementRequest({ day: selectedPlace.day, index: selectedPlace.index, returnToDetail: true }); }} onToggleBooking={() => { if (!selectedPlace) return; const placeName = selectedPlace.stop.name; const nextStatus = !placeBookingStatuses[placeName]; setPlaceBookingStatuses((current) => ({ ...current, [placeName]: nextStatus })); notify(nextStatus ? '예약 완료로 표시했어요.' : '예약 완료 표시를 취소했어요.'); }} place={replacementRequest ? null : selectedPlace?.stop ?? null} />
    <PlaceReplacementSheet onClose={() => setReplacementRequest(null)} onSelect={applyReplacement} place={replacementRequest ? stops[replacementRequest.day]?.[replacementRequest.index] ?? null : null} />
    <PlaceAddSheet destination={trip.destination || '도쿄'} onAdd={addPlace} onClose={() => setAddRequest(null)} visible={Boolean(addRequest)} />
    <TransportSelectionSheet from={transportRequest ? stops[transportRequest.day]?.[transportRequest.index]?.name ?? '' : ''} onClose={() => setTransportRequest(null)} onSelect={selectTransport} options={transportRequest ? getTransportOptions(transportRequest.day, transportRequest.index) : []} selectedId={transportRequest ? transportChoices[`${transportRequest.day}-${transportRequest.index}`] ?? 'transit' : 'transit'} to={transportRequest ? stops[transportRequest.day]?.[transportRequest.index + 1]?.name ?? '' : ''} visible={Boolean(transportRequest)} />
    <View style={[styles.homeFab, { bottom: Math.max(insets.bottom, 12) + 16, right: Math.max(spacing.md, (width - 760) / 2 + spacing.md) }]}><TripsHomeButton size={56} /></View>
    {deletedStop ? <View style={[styles.undoToast, { bottom: Math.max(insets.bottom, 12) + 86 }]}><Text numberOfLines={1} style={styles.undoText}>“{deletedStop.stop.name}” 삭제됨</Text><Pressable accessibilityRole="button" onPress={undoDelete} style={styles.undoButton}><Text style={styles.undoButtonText}>되돌리기</Text></Pressable></View> : null}
    {toast ? <View style={styles.toast}><Text style={styles.toastText}>✓  {toast}</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: '#E9EDF4' }, mapLayer: { position: 'absolute', left: 0, right: 0, top: 0 }, mapShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 80, backgroundColor: 'rgba(18,22,38,0.1)' },
  topBarWrap: { position: 'absolute', left: 0, right: 0, paddingHorizontal: spacing.md, alignItems: 'center', zIndex: 3 }, topBar: { width: '100%', maxWidth: responsive.contentMaxWidth, minHeight: responsive.headerControlSize, flexDirection: 'row', alignItems: 'center', gap: 8 }, mapButton: { width: responsive.headerControlSize, height: responsive.headerControlSize, flexShrink: 0, borderRadius: responsive.headerControlSize / 2, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center', ...shadow.card }, tripCopy: { flex: 1, minWidth: 0, height: 44, justifyContent: 'center', backgroundColor: 'rgba(23,26,43,0.9)', borderRadius: 22, paddingHorizontal: 16 }, tripKicker: { color: '#A9AFFF', fontSize: 8, lineHeight: 10, fontWeight: '900' }, tripTitle: { color: '#FFF', fontSize: 13, lineHeight: 17, fontWeight: '900', marginTop: 1 },
  sheet: { position: 'absolute', width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', ...shadow.float }, dragSurface: { cursor: 'grab', touchAction: 'none', userSelect: 'none' } as never, dragHandleArea: { height: 44, alignItems: 'center', justifyContent: 'center' }, handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  sheetHeader: { paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }, sheetHeading: { flex: 1, minWidth: 0 }, sheetKicker: { color: colors.primary, fontSize: 10, fontWeight: '900', marginBottom: 5 }, sheetTitle: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '900', letterSpacing: -0.4 }, sheetActions: { flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }, optimized: { flexShrink: 0, backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 7 }, optimizedText: { color: colors.primaryDark, fontSize: 8, fontWeight: '900' }, editToggle: { minWidth: 52, minHeight: 44, flexShrink: 0, borderRadius: 14, backgroundColor: colors.surfaceSubtle, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 8 }, editToggleActive: { backgroundColor: colors.primary }, editToggleText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' }, editToggleTextActive: { color: '#FFFFFF' },
  daysScroll: { flexGrow: 0, maxHeight: 90 }, days: { paddingHorizontal: spacing.lg, gap: 8, paddingTop: 18, paddingBottom: 14 }, day: { width: 72, height: 58, borderRadius: 17, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, dayActive: { backgroundColor: colors.primary }, dayName: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' }, dayNameActive: { color: '#FFF' }, dayDate: { color: colors.textMuted, fontSize: 9, marginTop: 3 }, dayDateActive: { color: '#DDE0FF' },
  timeline: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border }, timelineContent: { paddingHorizontal: spacing.lg, paddingTop: 18 }, flightCard: { minHeight: 96, borderRadius: 19, backgroundColor: '#F7F7FF', borderWidth: 1, borderColor: '#E4E5FF', flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 10 }, flightCardPressed: { opacity: 0.72 }, flightIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, flightCopy: { flex: 1, minWidth: 0 }, flightTitleRow: { minWidth: 0 }, flightKicker: { color: colors.primary, fontSize: 8, fontWeight: '900' }, flightRoute: { color: colors.textSecondary, fontSize: 9, lineHeight: 14, marginTop: 2 }, flightTimes: { minWidth: 0, flexDirection: 'row', alignItems: 'center', marginTop: 8 }, flightTimeBlock: { flexShrink: 0 }, flightTimeBlockEnd: { alignItems: 'flex-end' }, flightTimeLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700' }, flightTime: { color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 1 }, flightLine: { minWidth: 24, flex: 1, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7 }, flightLineRule: { height: 1, flex: 1, backgroundColor: colors.borderStrong }, stayCard: { borderRadius: 19, backgroundColor: '#F7F7FF', borderWidth: 1, borderColor: '#E4E5FF', overflow: 'hidden', marginBottom: 22 }, stayMain: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12 }, stayCardPressed: { opacity: 0.72 }, stayIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, stayCopy: { flex: 1, minWidth: 0 }, stayKicker: { color: colors.primary, fontSize: 8, fontWeight: '900' }, stayName: { color: colors.text, fontSize: 12, lineHeight: 17, fontWeight: '900', marginTop: 2 }, stayAddress: { color: colors.textSecondary, fontSize: 9, marginTop: 3 }, stayBookingRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderTopWidth: 1, borderTopColor: '#E4E5FF', paddingLeft: 13, paddingRight: 7 }, stayBookingStatus: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 6 }, stayBookingDot: { width: 7, height: 7, flexShrink: 0, borderRadius: 4, backgroundColor: colors.accent }, stayBookingDotDone: { backgroundColor: colors.primary }, stayBookingStatusText: { color: colors.textSecondary, fontSize: 9, fontWeight: '800' }, stayBookingLink: { minHeight: 44, flexShrink: 0, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 13, paddingHorizontal: 9 }, stayBookingLinkText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' }, stop: { flexDirection: 'row', gap: 12 }, timeColumn: { width: 48, alignItems: 'center' }, time: { color: colors.text, fontSize: 11, fontWeight: '900', marginBottom: 8 }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.primarySoft }, line: { width: 2, flex: 1, minHeight: 92, backgroundColor: colors.border, marginTop: 4 },
  stopContent: { flex: 1, paddingBottom: 8 }, stopTop: { flexDirection: 'row', alignItems: 'center', gap: 6 }, placeSummary: { flex: 1, minWidth: 0, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 11 }, placeIcon: { width: 44, height: 44, flexShrink: 0, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, placeEmoji: { fontSize: 20 }, placeCopy: { flex: 1, minWidth: 0 }, placeName: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '900' }, placeMetaRow: { minWidth: 0, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 4 }, placeMeta: { color: colors.textSecondary, fontSize: 10 }, bookedBadge: { flexShrink: 0, minHeight: 22, borderRadius: 8, backgroundColor: colors.primarySoft, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6 }, bookedBadgeText: { color: colors.primaryDark, fontSize: 8, fontWeight: '900' }, lock: { width: 36, height: 36, flexShrink: 0, borderRadius: 13, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, lockActive: { backgroundColor: colors.primarySoft }, deleteButton: { width: 44, height: 44, flexShrink: 0, borderRadius: 14, backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center' }, draggingStop: { zIndex: 10, opacity: 0.9, backgroundColor: '#FFFFFF', borderRadius: 18, ...shadow.float }, regenerate: { alignSelf: 'flex-start', minHeight: 34, marginTop: 11, borderRadius: 12, backgroundColor: colors.surfaceSubtle, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' }, regenerateText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' }, disabled: { opacity: 0.4 },
  transit: { minHeight: 62, flexDirection: 'row', alignItems: 'flex-start' }, transitRail: { width: 48, height: '100%', flexShrink: 0, alignItems: 'center' }, transitRailLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: colors.border }, transitJunction: { width: 8, height: 8, marginTop: 8, borderRadius: 4, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.primary }, transitBranch: { width: 38, height: 2, flexShrink: 0, marginLeft: -24, marginTop: 11, backgroundColor: colors.borderStrong }, transitButton: { minHeight: 44, flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 14, backgroundColor: colors.primarySoft, paddingHorizontal: 11, transform: [{ translateY: -10 }] }, transitButtonEditing: { opacity: 0.64 }, transitButtonPressed: { opacity: 0.7 }, transitText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' }, addBetween: { width: 44, height: 44, flexShrink: 0, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', marginLeft: 6, transform: [{ translateY: -10 }] }, add: { minHeight: 50, marginLeft: 60, marginTop: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.primary, backgroundColor: '#FAFAFF', flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, addText: { color: colors.primary, fontSize: 11, fontWeight: '900' }, bottomSpace: { height: 104 }, homeFab: { position: 'absolute', zIndex: 4 }, undoToast: { position: 'absolute', left: spacing.md, right: spacing.md, maxWidth: 520, minHeight: 52, alignSelf: 'center', zIndex: 7, borderRadius: 18, backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 15, paddingRight: 8, ...shadow.float }, undoText: { flex: 1, minWidth: 0, color: '#FFFFFF', fontSize: 10, fontWeight: '800' }, undoButton: { minWidth: 76, minHeight: 40, flexShrink: 0, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 }, undoButtonText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' }, toast: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: colors.text, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, zIndex: 5 }, toastText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
});
