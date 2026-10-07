"use client";

import { useState } from "react";

export function NotificationOptIn() {
  const [message, setMessage] = useState("");
  const enable = async () => {
    if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setMessage("Tu navegador no admite notificaciones web.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      setMessage("Las notificaciones no están activadas.");
      return;
    }
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      setMessage("Las notificaciones aún no están configuradas por el administrador.");
      return;
    }
    const registration = await navigator.serviceWorker.ready;
    const padding = "=".repeat((4 - vapidKey.length % 4) % 4);
    const base64 = (vapidKey + padding).replace(/-/g, "+").replace(/_/g, "/");
    const applicationServerKey = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
    const response = await fetch("/api/notifications/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(subscription) });
    setMessage(response.ok ? "Notificaciones activadas." : "No se pudo guardar la suscripción.");
  };
  return <div className="flex flex-wrap items-center gap-3"><button type="button" onClick={enable} className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-secondary">Activar notificaciones</button>{message ? <span className="text-sm text-muted-foreground">{message}</span> : null}</div>;
}
