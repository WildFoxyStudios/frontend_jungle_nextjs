# Frontend Architecture

## Monorepo structure

- `apps/web`: producto social (usuario final).
- `apps/admin`: panel de administración.
- `packages/api-client`: cliente HTTP tipado compartido.
- `packages/ui`: componentes visuales compartidos.
- `packages/hooks`: hooks y estado compartido.

## Render strategy

- Next.js App Router.
- SSR/CSR mixto según ruta.
- React Query para datos remotos.
- Realtime vía WebSocket al backend (`/ws`).

## Integraciones

- i18n: `next-intl`.
- observabilidad cliente: Sentry + PostHog (opcionales por env).
- push: Web Push VAPID.

