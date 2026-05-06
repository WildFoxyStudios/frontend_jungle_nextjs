"use client";

import { useEffect } from "react";

// OPS-2: opt-in client observability. Both Sentry and PostHog are gated
// on env vars so a self-hosted deployment can run zero-telemetry by
// default. The dynamic imports keep the SDKs out of the initial bundle
// when the env vars are missing.

export function ObservabilityProvider({ children }: { children: React.ReactNode }) {
 useEffect(() => {
 const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
 if (sentryDsn) {
 import("@sentry/nextjs")
 .then((Sentry: { init: (config: Record<string, unknown>) => void }) => {
 Sentry.init({
 dsn: sentryDsn,
 tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_RATE ?? 0.05),
 environment: process.env.NEXT_PUBLIC_APP_ENV ?? "development",
 });
 })
 .catch((err: unknown) => {
 console.warn("Sentry init failed", err);
 });
 }

 const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
 const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";
 if (posthogKey) {
 import("posthog-js")
 .then((mod: { default?: unknown } & Record<string, unknown>) => {
 const posthog = (mod.default ?? mod) as {
 init: (key: string, config: Record<string, unknown>) => void;
 };
 posthog.init(posthogKey, {
 api_host: posthogHost,
 person_profiles: "identified_only",
 capture_pageview: true,
 });
 })
 .catch((err: unknown) => {
 console.warn("PostHog init failed", err);
 });
 }
 }, []);

 return <>{children}</>;
}
