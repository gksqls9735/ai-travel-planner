# Project Agent Guide

Read the responsive UI harness before creating or changing any screen, component, modal, navigation surface, or fixed action area:

- `.codex/harness/responsive-ui.md`

The responsive harness is mandatory for both React Native and React Native Web work. UI work is incomplete until the affected flow has been checked against its viewport matrix and `npm run check:responsive` passes.

Do not run a full web production build for every change. Follow the verification scope in the responsive harness and use the smallest check appropriate to the work.
