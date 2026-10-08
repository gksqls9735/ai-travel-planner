import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TripMap } from '@/features/trip/trip-map';
import { useTrip } from '@/features/trip/trip-context';
import { responsive } from '@/features/layout/responsive';
import { colors, shadow, spacing } from '@/features/trip/theme';

type Stop = { time: string; name: string; category: string; duration: string; icon: string; alt: string[] };
type WebPointerGestureEvent = {
  preventDefault: () => void;
  currentTarget: {
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  nativeEvent: { pageY: number; pointerId: number };
};
const plans: Stop[][] = [
  [{ time: '09:00', name: '센소지와 나카미세 거리', category: '전통 문화', duration: '1시간 30분', icon: '⛩', alt: ['네즈 신사와 골목 산책', '아사쿠사 문화관'] }, { time: '11:30', name: '아사쿠사 이마한', category: '맛집', duration: '1시간', icon: '🍲', alt: ['오니기리 아사쿠사 야도라쿠', '소메타로 오코노미야키'] }, { time: '14:00', name: '우에노 공원과 도쿄 국립박물관', category: '예술·산책', duration: '2시간', icon: '🖼️', alt: ['국립서양미술관', '야나카 긴자'] }, { time: '18:30', name: '긴자 로컬 스시 바', category: '저녁 식사', duration: '1시간 30분', icon: '🍣', alt: ['츠키지 스시 체험', '유라쿠초 이자카야'] }],
  [{ time: '09:30', name: '메이지 신궁', category: '자연·문화', duration: '1시간 30분', icon: '🌿', alt: ['신주쿠 교엔', '요요기 공원'] }, { time: '12:00', name: '하라주쿠 골목 브런치', category: '맛집', duration: '1시간', icon: '🥞', alt: ['오모테산도 카페', '시부야 우동'] }, { time: '15:00', name: '시부야 스카이', category: '전망대', duration: '1시간 30분', icon: '🌇', alt: ['도쿄 도청 전망대', '롯폰기 힐스 전망대'] }],
  [{ time: '10:00', name: '츠키지 장외시장', category: '맛집 탐방', duration: '2시간', icon: '🐟', alt: ['토요스 시장', '몬자야키 거리'] }, { time: '14:00', name: '기요스미 정원', category: '자연 경관', duration: '1시간', icon: '🌳', alt: ['하마리큐 정원', '고이시카와 고라쿠엔'] }],
  [{ time: '09:30', name: '다이칸야마 산책', category: '골목 산책', duration: '1시간 30분', icon: '🚶', alt: ['나카메구로 산책', '지유가오카'] }, { time: '12:00', name: '에비스 로컬 런치', category: '맛집', duration: '1시간', icon: '🍱', alt: ['다이칸야마 브런치', '시부야 라멘'] }],
];

export default function ItineraryScreen() {
  const router = useRouter(); const { trip } = useTrip();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
  const [day, setDay] = useState(0); const [stops, setStops] = useState(plans); const [locked, setLocked] = useState<string[]>([]); const [toast, setToast] = useState('');
  const replaceStop = (index: number) => { const current = stops[day][index]; const next = current.alt[0]; setStops((all) => all.map((list, dayIndex) => dayIndex === day ? list.map((stop, stopIndex) => stopIndex === index ? { ...stop, name: next, alt: [stop.name, ...stop.alt.slice(1)] } : stop) : list)); notify(`“${next}”으로 바꿨어요.`); };
  const notify = (message: string) => { setToast(message); setTimeout(() => setToast(''), 2000); };
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

  return <View style={styles.screen}>
    <View style={[styles.mapLayer, { height: mapHeight }]}><TripMap activeDay={day} showDetails={false} /><View style={styles.mapShade} /></View>
    <View style={[styles.topBarWrap, { top: Math.max(16, insets.top + 8) }]}><View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="여행 취향으로 돌아가기" hitSlop={6} onPress={() => router.replace('/preferences')} style={styles.mapButton}><Ionicons name="arrow-back" size={21} color={colors.text} /></Pressable><View style={styles.tripCopy}><Text style={styles.tripKicker}>AI가 만든 여행</Text><Text numberOfLines={1} style={styles.tripTitle}>{trip.destination || '도쿄'} · {day + 1}일차</Text></View><Pressable accessibilityRole="button" accessibilityLabel="일정 저장" hitSlop={4} onPress={() => notify('일정을 저장했어요.')} style={styles.mapButton}><Ionicons name="heart-outline" size={20} color={colors.text} /></Pressable><Pressable accessibilityRole="button" accessibilityLabel="일정 공유" hitSlop={4} onPress={() => notify('공유 링크를 준비했어요.')} style={styles.mapButton}><Ionicons name="share-outline" size={20} color={colors.text} /></Pressable></View></View>

    <Animated.View style={[styles.sheet, { top: sheetTop, height: Math.max(420, height - snapPoints.expanded) }]}> 
      <View {...sheetDragHandlers} accessibilityLabel="일정 패널 드래그 손잡이" accessibilityHint="위아래로 드래그해 일정 영역 높이를 조절합니다" style={styles.dragSurface}>
        <View style={styles.dragHandleArea}><View style={styles.handle} /></View>
      </View>
      <View style={styles.sheetHeader}><View style={styles.sheetHeading}><Text style={styles.sheetKicker}>오늘의 일정</Text><Text style={styles.sheetTitle}>{day === 0 ? '도쿄의 오래된 골목부터 시작해요' : '가까운 장소끼리 편안하게 연결했어요'}</Text></View><View style={styles.optimized}><Text style={styles.optimizedText}>✦ 최적 동선</Text></View></View>
      <ScrollView horizontal style={styles.daysScroll} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.days}>{plans.map((_, index) => <Pressable key={index} onPress={() => setDay(index)} style={[styles.day, day === index && styles.dayActive]}><Text style={[styles.dayName, day === index && styles.dayNameActive]}>Day {index + 1}</Text><Text style={[styles.dayDate, day === index && styles.dayDateActive]}>{index + 8}일</Text></Pressable>)}</ScrollView>

      <ScrollView style={styles.timeline} contentContainerStyle={styles.timelineContent} showsVerticalScrollIndicator={false}>
        {stops[day].map((stop, index) => { const key = `${day}-${index}`; const isLocked = locked.includes(key); return <View key={key}>
          <View style={styles.stop}><View style={styles.timeColumn}><Text style={styles.time}>{stop.time}</Text><View style={styles.dot} />{index < stops[day].length - 1 ? <View style={styles.line} /> : null}</View>
            <View style={styles.stopContent}><View style={styles.stopTop}><View style={styles.placeIcon}><Text style={styles.placeEmoji}>{stop.icon}</Text></View><View style={styles.placeCopy}><Text style={styles.placeName}>{stop.name}</Text><Text style={styles.placeMeta}>{stop.category} · {stop.duration}</Text></View><Pressable onPress={() => setLocked((items) => isLocked ? items.filter((item) => item !== key) : [...items, key])} style={[styles.lock, isLocked && styles.lockActive]}><Text style={[styles.lockText, isLocked && styles.lockTextActive]}>{isLocked ? '●' : '○'}</Text></Pressable></View>
              <Pressable disabled={isLocked} onPress={() => replaceStop(index)} style={[styles.regenerate, isLocked && styles.disabled]}><Text style={styles.regenerateText}>↻  이 장소 대신 다른 곳 추천</Text></Pressable>
            </View>
          </View>
          {index < stops[day].length - 1 ? <View style={styles.transit}><Text style={styles.transitIcon}>⌁</Text><Text style={styles.transitText}>대중교통으로 {index % 2 ? '24분' : '18분'}</Text></View> : null}
        </View>; })}
        <Pressable onPress={() => notify('장소 추가 기능은 준비 중이에요.')} style={styles.add}><Text style={styles.addText}>＋ 일정에 장소 추가</Text></Pressable><View style={styles.bottomSpace} />
      </ScrollView>
    </Animated.View>
    {toast ? <View style={styles.toast}><Text style={styles.toastText}>✓  {toast}</Text></View> : null}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, overflow: 'hidden', backgroundColor: '#E9EDF4' }, mapLayer: { position: 'absolute', left: 0, right: 0, top: 0 }, mapShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 80, backgroundColor: 'rgba(18,22,38,0.1)' },
  topBarWrap: { position: 'absolute', left: 0, right: 0, paddingHorizontal: spacing.md, alignItems: 'center', zIndex: 3 }, topBar: { width: '100%', maxWidth: responsive.contentMaxWidth, minHeight: responsive.headerControlSize, flexDirection: 'row', alignItems: 'center', gap: 8 }, mapButton: { width: responsive.headerControlSize, height: responsive.headerControlSize, flexShrink: 0, borderRadius: responsive.headerControlSize / 2, backgroundColor: 'rgba(255,255,255,0.96)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.72)', alignItems: 'center', justifyContent: 'center', ...shadow.card }, tripCopy: { flex: 1, minWidth: 0, height: 44, justifyContent: 'center', backgroundColor: 'rgba(23,26,43,0.9)', borderRadius: 22, paddingHorizontal: 16 }, tripKicker: { color: '#A9AFFF', fontSize: 8, lineHeight: 10, fontWeight: '900' }, tripTitle: { color: '#FFF', fontSize: 13, lineHeight: 17, fontWeight: '900', marginTop: 1 },
  sheet: { position: 'absolute', width: '100%', maxWidth: 760, alignSelf: 'center', backgroundColor: '#FFF', borderTopLeftRadius: 30, borderTopRightRadius: 30, overflow: 'hidden', ...shadow.float }, dragSurface: { cursor: 'grab', touchAction: 'none', userSelect: 'none' } as never, dragHandleArea: { height: 44, alignItems: 'center', justifyContent: 'center' }, handle: { width: 48, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong },
  sheetHeader: { paddingHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }, sheetHeading: { flex: 1, minWidth: 0 }, sheetKicker: { color: colors.primary, fontSize: 10, fontWeight: '900', marginBottom: 5 }, sheetTitle: { color: colors.text, fontSize: 18, lineHeight: 25, fontWeight: '900', letterSpacing: -0.4 }, optimized: { flexShrink: 0, backgroundColor: colors.primarySoft, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 7 }, optimizedText: { color: colors.primaryDark, fontSize: 9, fontWeight: '900' },
  daysScroll: { flexGrow: 0, maxHeight: 90 }, days: { paddingHorizontal: spacing.lg, gap: 8, paddingTop: 18, paddingBottom: 14 }, day: { width: 72, height: 58, borderRadius: 17, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, dayActive: { backgroundColor: colors.primary }, dayName: { color: colors.textSecondary, fontSize: 11, fontWeight: '800' }, dayNameActive: { color: '#FFF' }, dayDate: { color: colors.textMuted, fontSize: 9, marginTop: 3 }, dayDateActive: { color: '#DDE0FF' },
  timeline: { flex: 1, borderTopWidth: 1, borderTopColor: colors.border }, timelineContent: { paddingHorizontal: spacing.lg, paddingTop: 22 }, stop: { flexDirection: 'row', gap: 12 }, timeColumn: { width: 48, alignItems: 'center' }, time: { color: colors.text, fontSize: 11, fontWeight: '900', marginBottom: 8 }, dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.primarySoft }, line: { width: 2, flex: 1, minHeight: 92, backgroundColor: colors.border, marginTop: 4 },
  stopContent: { flex: 1, paddingBottom: 8 }, stopTop: { flexDirection: 'row', alignItems: 'center', gap: 11 }, placeIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }, placeEmoji: { fontSize: 20 }, placeCopy: { flex: 1 }, placeName: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '900' }, placeMeta: { color: colors.textSecondary, fontSize: 10, marginTop: 4 }, lock: { width: 32, height: 32, borderRadius: 12, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center' }, lockActive: { backgroundColor: colors.primarySoft }, lockText: { color: colors.textMuted, fontSize: 12 }, lockTextActive: { color: colors.primary }, regenerate: { alignSelf: 'flex-start', minHeight: 34, marginTop: 11, borderRadius: 12, backgroundColor: colors.surfaceSubtle, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' }, regenerateText: { color: colors.primaryDark, fontSize: 10, fontWeight: '800' }, disabled: { opacity: 0.4 },
  transit: { marginLeft: 60, flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 9 }, transitIcon: { color: colors.textMuted, fontSize: 15 }, transitText: { color: colors.textMuted, fontSize: 10, fontWeight: '700' }, add: { minHeight: 48, marginLeft: 60, marginTop: 12, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }, addText: { color: colors.primary, fontSize: 11, fontWeight: '900' }, bottomSpace: { height: 28 }, toast: { position: 'absolute', bottom: 24, alignSelf: 'center', backgroundColor: colors.text, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, zIndex: 5 }, toastText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
});
