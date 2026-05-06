# Jungle Frontend

A full-stack social network frontend monorepo built with Next.js 15, TypeScript, Tailwind CSS 4, and Turborepo.

## Documentation

- [Frontend docs index](./docs/README.md)
- [Vercel deployment guide](./docs/vercel.md)
- [Environment variables](./docs/environment.md)
- [Production checklist](./docs/production-checklist.md)

## Structure

```
frontend/
├── apps/
│   ├── web/          # Social network app (port 3000)
│   └── admin/        # Admin panel (port 3001)
├── packages/
│   ├── ui/           # shadcn/ui components
│   ├── api-client/   # Typed HTTP client + all API endpoints
│   ├── hooks/        # Zustand stores + React Query hooks
│   └── utils/        # Pure utilities (media, date, validation, etc.)
└── tooling/
    ├── eslint/       # Shared ESLint config
    ├── typescript/   # Shared TypeScript configs
    └── tailwind/     # Shared Tailwind config
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Build all packages
pnpm build

# Run tests
pnpm test

# Type check
pnpm typecheck
```

## Environment Variables

Copy the included env templates:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

Minimal production values:

```bash
# apps/web/.env.local
BACKEND_URL=https://api.example.com
NEXT_PUBLIC_APP_URL=https://app.example.com

# apps/admin/.env.local
BACKEND_URL=https://api.example.com
NEXT_PUBLIC_SITE_URL=https://app.example.com
```

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5 (strict)
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI
- **State**: Zustand
- **Data Fetching**: TanStack Query v5
- **Forms**: React Hook Form + Zod
- **Real-time**: Native WebSocket
- **Testing**: Vitest + fast-check (PBT) + Playwright (E2E)
- **Build**: Turborepo + pnpm workspaces
