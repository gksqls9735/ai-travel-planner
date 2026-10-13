import { PropsWithChildren, useEffect, useState } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';

export function SkeletonBlock({ style }: { style?: StyleProp<ViewStyle> }) {
  const [opacity] = useState(() => new Animated.Value(0.46));

  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.82, duration: 650, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.46, duration: 650, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return <Animated.View accessible={false} style={[styles.block, style, { opacity }]} />;
}

export function SkeletonGroup({ children, style }: PropsWithChildren<{ style?: StyleProp<ViewStyle> }>) {
  return <Animated.View accessibilityLabel="콘텐츠를 불러오는 중" accessibilityLiveRegion="polite" style={style}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#E7E9F0', overflow: 'hidden' },
});
