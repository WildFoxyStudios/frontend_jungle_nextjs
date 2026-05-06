# Deploy en Vercel

## Setup recomendado

Crear dos proyectos Vercel:
- `jungle-web` con root `frontend/apps/web`
- `jungle-admin` con root `frontend/apps/admin`

## Build settings

- Install command: `pnpm install`
- Build command: `pnpm build`
- Output: automático (Next.js)

## Variables mínimas

### Web
- `BACKEND_URL=https://api.example.com`
- `NEXT_PUBLIC_APP_URL=https://app.example.com`

### Admin
- `BACKEND_URL=https://api.example.com`
- `NEXT_PUBLIC_SITE_URL=https://app.example.com`

## Notas operativas

1. No dejar `BACKEND_URL` en localhost para producción.
2. Verificar rewrites funcionales (`/api/*`, `/uploads/*`, `/ws*`).
3. Ejecutar smoke tests tras cada deploy preview y producción.

