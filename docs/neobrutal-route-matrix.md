# Neobrutal migration — route & surface matrix

This document maps every App Router `page.tsx` in `apps/web` and `apps/admin` to a functional domain and the **primary layout/shell** that wraps its UI. All routes inherit the **Neobrutal design system** from `@jungle/ui` (tokens in `packages/ui/src/globals.css`, primitives in `packages/ui/src/components/*`, and shared Tailwind in `frontend/tooling/tailwind/tailwind.config.ts`).

**Web shell:** `AppShell` + `TopbarShell` + `SidebarShell` + `RightSidebar` + `Footer` (see `apps/web/src/app/(main)/layout.tsx`). Narrow viewports use the hamburger sheet (`MobileNavSheet`) instead of a bottom tab bar.

**Auth shell:** centered column + `neo-page-bg` (see `apps/web/src/app/(auth)/layout.tsx`).

**Admin shell:** `AppShell` + `AdminSidebar` + `AdminHeader` + `PageContainer` (see `apps/admin/src/app/(admin)/layout.tsx`).

**Static / marketing:** minimal chrome (see `apps/web/src/app/(static)/layout.tsx` if present).

---

## `apps/web` — route count by group

| Group | Count | Notes |
| --- | ---: | --- |
| `(auth)/*` | 9 | login, register, verify, reset, forgot, banned, onboarding, activate |
| `(main)/*` | ~176 | product features behind main shell |
| `(static)/*` | 8 | about, contact, terms, privacy, welcome, get-the-app, dynamic `[slug]` |
| Root & misc | 4 | `page.tsx` (landing), `maintenance`, `oauth/authorize` |

### `(auth)` routes

- `login`, `register`, `verify`, `forgot-password`, `reset-password`, `onboarding`, `banned`, `activate/[code]`
- **Surfaces:** form-heavy; uses `Card`, `Button`, `Input`, `Tabs` from `@jungle/ui`.

### `(main)` — core social

- **Feed & posts:** `feed`, `post/[id]`, `post/[id]/edit`, `most-liked`, `highlights`, `open-to-work-posts`, `boosted/posts`, `boosted/pages`
- **Profile:** `profile/[username]`, `followers`, `following`, `photos`, `follow-requests`, `common/[username]`
- **Stories & reels:** `stories`, `reels`, `reels/create`
- **Media / watch:** `watch`, `watch/[id]`, `movies/*`, `live/*`, `call/[roomName]`, `albums/*`
- **Messages:** `messages`, `messages/[conversationId]`, `messages/broadcasts`
- **Notifications:** `notifications`
- **Discovery:** `explore`, `search`, `search/linkedin`, `directory`, `friends`, `nearby`, `nearby/business`, `nearby/shops`, `hashtag/[tag]`, `professional-search`

### `(main)` — communities

- `groups/*`, `pages/*`, `events/*`, `forums/*`

### `(main)` — commerce & economy

- `marketplace/*`, `checkout/*`, `orders/*`, `wallet`, `withdrawal`, `refund`, `funding/*`, `jobs/*`, `offers/*`, `subscriptions`, `upgraded`, `go-pro`, `monetization/[username]`, `ads/*`

### `(main)` — account & settings

- `settings/*` (all sub-routes: profile, security, design, payments, etc.)

### `(main)` — secondary / platform

- `developers/*`, `ai`, `games`, `pokes`, `saved`, `memories`, `blogs/*`, `saved`, etc.

---

## `apps/admin` — route count by group

| Group | Count |
| --- | ---: |
| `(admin)/*` | 115 |
| `(auth)/login` | 1 |

### Domains

- **Dashboard:** `(admin)/page.tsx`
- **Users:** `users`, `users/[id]`, `users/banned`, `users/roles`, `users/send-email`, permissions
- **Moderation:** reports, pending-posts, verifications, banned-ips, user-reports, forum-*
- **Content:** posts, blogs, stories, movies, live, forums (+ create/edit)
- **Communities:** groups, pages, events
- **Commerce:** products, jobs, orders, funding
- **Payments:** overview, transactions, withdrawals, settings, affiliates, etc.
- **Settings:** general, features, auth, appearance, website-mode, email, SMS, media, store, etc.
- **System:** health, node, dlq, api-keys, oauth-apps, backups, cronjobs, activity-log, etc.
- **Customization & localization:** categories, reactions, stickers, profile-fields, languages, translations

All admin pages are expected to use `AdminPageShell` or `PageContainer` + `Table` / `Card` from `@jungle/ui` for Neobrutal consistency.

---

## Migration status (design system)

| Layer | Status |
| --- | --- |
| Tokens & CSS utilities (`neo-page-bg`, `shadow-neo*`, `neo-surface`) | **Unified** in `packages/ui` + aligned app `globals.css` |
| Primitives (`Button`, `Card`, `Input`, `Table`, `Dialog`, …) | **Neobrutal defaults** in `@jungle/ui` |
| Layout primitives (`AppShell`, `PageContainer`, `PageSection`, `TopbarShell`, …) | **In use** in web & admin |
| Per-route pixel polish | **Ongoing** via shared primitives; individual routes inherit automatically |

This matrix is the single reference for **which route lives where**; when adding a route, file it under the same domain and reuse `@jungle/ui` primitives.
