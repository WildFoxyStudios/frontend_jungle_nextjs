# Neobrutal big-bang — QA & release checklist

Use this before shipping a single cut that includes the full Neobrutal refactor.

## Visual & layout

- [ ] **Web:** feed, post detail, profile, messages, notifications, marketplace checkout — no horizontal scroll at 320px, 390px, 768px, 1280px.
- [ ] **Admin:** users list, settings forms, moderation tables — readable at 1280px and 1600px; sidebars and tables do not overflow unexpectedly.
- [ ] **Dark mode:** primary surfaces (`card`, `popover`, `input`) remain legible; borders visible on `border-foreground`.
- [ ] **Focus:** interactive elements show a visible focus ring (`ring-ring` / `focus-visible:ring-2`).

## Functional smoke (no regressions)

- [ ] Login / register / refresh session.
- [ ] Feed load, post composer, first image LCP where `priority` is set.
- [ ] Messages thread open, send text.
- [ ] Admin login, open dashboard, one settings page save.

## i18n

- [ ] No `MISSING_MESSAGE` in console for `en` (and one secondary locale if enabled).

## Performance & stability

- [ ] No massive layout shift on feed first paint (skeletons align with content width).
- [ ] Mobile bottom nav respects safe area (notch / home indicator).

## Build

- [ ] `pnpm --filter @jungle/web typecheck` passes.
- [ ] `pnpm --filter @jungle/admin typecheck` passes.
- [ ] `pnpm --filter @jungle/ui exec tsc --noEmit` or workspace equivalent passes.

## Post-release (24–48h)

- [ ] Monitor error boundaries and API 5xx on critical flows.
- [ ] Sample Real User Monitoring: LCP, CLS, INP on home and feed if available.
