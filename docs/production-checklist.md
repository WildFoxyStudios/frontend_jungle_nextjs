# Production Checklist (Frontend)

## Pre-release

- [ ] `pnpm --filter @jungle/web typecheck`
- [ ] `pnpm --filter @jungle/web build`
- [ ] `pnpm --filter @jungle/admin typecheck`
- [ ] `pnpm --filter @jungle/admin build`
- [ ] Variables de entorno definidas en Vercel.
- [ ] `BACKEND_URL` apunta a Fly.io (no localhost).

## Functional smoke

- [ ] Login/registro en web.
- [ ] Feed y publicación.
- [ ] Mensajería básica.
- [ ] Wallet (top-up / retiro).
- [ ] Acceso admin y navegación principal.

## Security / quality

- [ ] Secretos no expuestos como `NEXT_PUBLIC_*` por error.
- [ ] Sentry/PostHog configurados o desactivados explícitamente.
- [ ] i18n: sin claves faltantes en rutas críticas.

