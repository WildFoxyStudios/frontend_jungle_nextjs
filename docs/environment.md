# Environment Variables (Frontend)

## `apps/web`

### Required in production

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Rewrite target for `/api`, `/uploads`, `/ws` in `next.config.ts`. |
| `NEXT_PUBLIC_APP_URL` | Canonical public URL (SEO/robots). |

### Optional

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_ADMIN_URL` | URL explícita del panel admin para menú usuario. |
| `NEXT_PUBLIC_MEDIA_URL` | Base URL para assets media. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Places autocomplete. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push browser key. |
| `NEXT_PUBLIC_TENOR_API_KEY` | GIF search en composer. |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry client-side. |
| `NEXT_PUBLIC_SENTRY_TRACES_RATE` | Sample rate de trazas (ej: `0.05`). |
| `NEXT_PUBLIC_APP_ENV` | `development` / `staging` / `production`. |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key. |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host (default cloud). |

## `apps/admin`

### Required in production

| Variable | Purpose |
|---|---|
| `BACKEND_URL` | Rewrite target para `/api` y `/uploads`. |

### Optional

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública del sitio (links de sitemap/invitations). |

