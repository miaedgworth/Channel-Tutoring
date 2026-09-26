"use client";

import { useSyncExternalStore } from "react";
import { Analytics } from "@vercel/analytics/next";
import { CONSENT_CHANGED_EVENT } from "@/components/layout/cookie-consent";

const STORAGE_KEY = "ct-cookie-consent";

function subscribe(callback: () => void) {
  window.addEventListener(CONSENT_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "accepted";
  } catch {
    return false;
  }
}

function getServerSnapshot() {
  return false;
}

// Only loads Vercel Web Analytics once a visitor has accepted analytics
// cookies via CookieConsent, matching what that banner promises ("optional
// analytics cookies"). Starts immediately on that choice via
// CONSENT_CHANGED_EVENT (dispatched by CookieConsent), without needing a
// page reload.
export function AnalyticsGate() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!accepted) return null;
  return <Analytics />;
}
