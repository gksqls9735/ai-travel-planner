# Responsive UI Harness

This project is a mobile-first React Native and React Native Web app. Apply these rules to every UI change.

## Required viewport matrix

Before completing UI work, verify the affected flow at all of these widths:

- 320px: smallest supported phone
- 360px: compact Android phone
- 375px: standard small iPhone
- 390px: current iPhone baseline
- 412px and 430px: large Android/iPhone
- 768px: tablet portrait
- 1024px: desktop web smoke test

Use a representative viewport height of 844px for phone checks. Also scroll through the full page; a correct first viewport is not sufficient.

## Non-negotiable behavior

1. Essential controls and choices must never become unreachable, clipped, or hidden solely because the viewport narrows.
2. Small finite option sets must wrap with `flexWrap: 'wrap'` or adapt their column count. Do not put required choices in a horizontal `ScrollView`.
3. Horizontal scrolling is allowed only for secondary or naturally sequential content such as day tabs. It must show an affordance or a partially visible next item.
4. Rows containing text must give text containers `flex: 1` and/or `minWidth: 0`. Actions must use `flexShrink: 0` when their full label is required.
5. Avoid fixed child widths inside fluid rows unless the total width, gaps, and container padding are proven to fit at 320px.
6. Prefer `flexBasis` plus `flexGrow` and `maxWidth` for adaptive option grids.
7. Fixed bottom actions require matching scroll-content bottom padding and safe-area spacing.
8. Touch targets must be at least 44x44 logical pixels.
9. Text may wrap, but primary actions and critical values may not be truncated without an explicit alternate presentation.
10. A layout is not complete until it has been checked for horizontal overflow and clipped content at every required phone width.

## Implementation checklist

- Reuse tokens from `src/features/layout/responsive.ts`.
- Check both empty and populated states.
- Check longest Korean labels, not only short placeholders.
- Check with the bottom CTA visible.
- Check modals, suggestion lists, and scroll boundaries.
- Run `npm run check:responsive` before handoff.

## Verification scope

- Do not run `npm run web:build` after routine UI, styling, spacing, copy, or responsive changes.
- For routine UI work, prefer the smallest relevant checks: targeted TypeScript, ESLint, `npm run check:responsive`, and viewport inspection.
- Run a full production web build only when the user explicitly asks, when build or bundler configuration changes, when dependencies or routing architecture change, or at a deliberate release/milestone verification point.
- Do not start a local development server unless visual verification is necessary. If started, stop it before handoff.

## Review failure examples

- The fifth option exists only off-screen with no visible scrolling cue.
- A three-column row keeps fixed widths and clips its final column.
- A fixed footer covers the last form control.
- A long destination or place name pushes an action outside the viewport.
- A modal uses a fixed width larger than the phone viewport.
