import { notificationsApi } from "@jungle/api-client";

/**
 * VAPID Web Push (W3C Push API) helpers.
 *
 * The browser-side flow is:
 *   1. `registerServiceWorker` boots `/sw.js` (handles `push` events).
 *   2. `subscribeToPush` asks for permission, requests a `PushSubscription`
 *      from the platform using the server's VAPID public key, then sends
 *      `{ endpoint, p256dh, auth }` to the backend so it can deliver
 *      payloads encrypted to that subscription.
 *
 * The legacy mobile-token API (`registerPushToken`) is preserved for
 * native installations; the web layer no longer uses it.
 */

let cachedVapidKey: string | null = null;

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register("/sw.js");
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidKey) return cachedVapidKey;
  const fromEnv = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  if (fromEnv) {
    cachedVapidKey = fromEnv;
    return fromEnv;
  }
  const res = await notificationsApi.getWebPushPublicKey();
  cachedVapidKey = res.public_key ?? "";
  return cachedVapidKey;
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i] ?? 0);
  return window
    .btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function subscribeToPush(): Promise<boolean> {
  const registration = await registerServiceWorker();
  if (!registration) return false;
  const vapidKey = await getVapidPublicKey();
  if (!vapidKey) {
    console.warn("VAPID public key not configured — web push disabled");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
    }

    const p256dhRaw = subscription.getKey("p256dh");
    const authRaw = subscription.getKey("auth");
    if (!p256dhRaw || !authRaw) return false;

    await notificationsApi.subscribeWebPush({
      endpoint: subscription.endpoint,
      p256dh: arrayBufferToBase64Url(p256dhRaw),
      auth: arrayBufferToBase64Url(authRaw),
      user_agent: navigator.userAgent,
    });
    return true;
  } catch (err) {
    console.error("Push subscription failed:", err);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  const endpoint = subscription.endpoint;
  await subscription.unsubscribe();
  if (endpoint) {
    try {
      await notificationsApi.unsubscribeWebPush(endpoint);
    } catch {
      /* the row will be cleaned up server-side on the next 410 too */
    }
  }
}

export function playNotificationSound(): void {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {
      /* non-critical: failure is silent */
    });
  } catch {
    /* Ignore audio errors */
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) view[i] = rawData.charCodeAt(i);
  return buffer;
}
