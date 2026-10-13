import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, PanResponder, Platform, Pressable, StyleSheet } from 'react-native';

import { colors } from '@/features/trip/theme';

type WebPointerEvent = { preventDefault: () => void; currentTarget: { setPointerCapture?: (id: number) => void; releasePointerCapture?: (id: number) => void }; nativeEvent: { pageY: number; pointerId: number } };
type Props = { dragOffset: Animated.Value; onFinish: (deltaY: number) => void; onStart: () => void };

export function ReorderHandle({ dragOffset, onFinish, onStart }: Props) {
  const startY = useRef(0);
  const lastDelta = useRef(0);
  const dragging = useRef(false);
  const [active, setActive] = useState(false);
  const begin = () => { dragging.current = true; lastDelta.current = 0; setActive(true); onStart(); };
  const move = (delta: number) => { if (!dragging.current) return; lastDelta.current = delta; dragOffset.setValue(delta); };
  const finish = () => { if (!dragging.current) return; dragging.current = false; setActive(false); onFinish(lastDelta.current); };
  // These callbacks read refs only after a drag gesture starts.
  // eslint-disable-next-line react-hooks/refs
  const responder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: begin,
    onPanResponderMove: (_, gesture) => move(gesture.dy),
    onPanResponderRelease: finish,
    onPanResponderTerminate: finish,
  });
  const webHandlers = Platform.OS === 'web' ? {
    onPointerDown: (event: WebPointerEvent) => { event.preventDefault(); event.currentTarget.setPointerCapture?.(event.nativeEvent.pointerId); startY.current = event.nativeEvent.pageY; begin(); },
    onPointerMove: (event: WebPointerEvent) => { if (!dragging.current) return; event.preventDefault(); move(event.nativeEvent.pageY - startY.current); },
    onPointerUp: (event: WebPointerEvent) => { event.currentTarget.releasePointerCapture?.(event.nativeEvent.pointerId); finish(); },
    onPointerCancel: (event: WebPointerEvent) => { event.currentTarget.releasePointerCapture?.(event.nativeEvent.pointerId); finish(); },
  } : responder.panHandlers;

  return <Pressable {...webHandlers} accessibilityRole="button" accessibilityLabel="장소 순서 변경" accessibilityHint="누른 채 위아래로 움직여 순서를 변경합니다" style={[styles.handle, active && styles.handleActive]}><Ionicons name="reorder-three" size={22} color={active ? colors.primaryDark : colors.textSecondary} /></Pressable>;
}

const styles = StyleSheet.create({
  handle: { width: 44, height: 44, flexShrink: 0, borderRadius: 14, backgroundColor: colors.surfaceSubtle, alignItems: 'center', justifyContent: 'center', cursor: 'grab', touchAction: 'none', userSelect: 'none' } as never,
  handleActive: { backgroundColor: colors.primarySoft },
});
