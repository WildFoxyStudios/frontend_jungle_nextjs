import { notificationsApi } from "@jungle/api-client";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js");
    return registration;
  } catch (err) {
    console.error("SW registration failed:", err);
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  const registration = await registerServiceWorker();
  if (!registration || !VAPID_PUBLIC_KEY) return false;

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    await notificationsApi.registerPushToken({
      token: subscription.endpoint,
      platform: "web",
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
  if (subscription) {
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    if (endpoint) await notificationsApi.unregisterPushToken(endpoint);
  }
}

export function playNotificationSound(): void {
  try {
    const audio = new Audio("/sounds/notification.mp3");
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {
    // Ignore audio errors
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    view[i] = rawData.charCodeAt(i);
  }
  return buffer;
}
