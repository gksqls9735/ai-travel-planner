/**
 * Shared responsive layout tokens for native and React Native Web screens.
 * Essential controls must remain reachable at every width in TEST_VIEWPORTS.
 */
export const TEST_VIEWPORTS = [320, 360, 375, 390, 412, 430, 768, 1024] as const;

export const responsive = {
  screenPadding: 24,
  compactScreenPadding: 16,
  minimumTouchTarget: 44,
  headerControlSize: 48,
  minimumReadableControl: 56,
  contentMaxWidth: 720,
  compactBreakpoint: 360,
  tabletBreakpoint: 768,
} as const;

export function getScreenPadding(width: number) {
  return width < responsive.compactBreakpoint ? responsive.compactScreenPadding : responsive.screenPadding;
}

export function getAdaptiveColumns(width: number, minimumItemWidth: number, gap: number, maximumColumns: number) {
  const usableWidth = width - getScreenPadding(width) * 2;
  const columns = Math.floor((usableWidth + gap) / (minimumItemWidth + gap));
  return Math.max(1, Math.min(maximumColumns, columns));
}
