import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LEVEL_LABELS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Escapes user-supplied text before it's interpolated into an HTML email
// body. Without this, a name or message containing markup would be sent
// as live HTML to whatever address the submitter typed in — effectively
// letting them use the site's own outbound email to deliver arbitrary
// HTML/links to anyone, under a legitimate "Channel Tutoring" sender.
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function formatLevel(level: string) {
  return LEVEL_LABELS[level] ?? level;
}

export function formatCurrencyGBP(amountInPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountInPence / 100);
}

// Formats a token quantity (which may be a Prisma Decimal, string, or
// number) as a plain number string, e.g. 1.5 -> "1.5", 2.00 -> "2".
export function formatTokenQuantity(quantity: number | string | { toString(): string }) {
  return parseFloat(quantity.toString()).toString();
}

// Guernsey follows the same GMT/BST clock changes as the UK and has no
// IANA zone of its own, so "Europe/London" is the correct stand-in. This
// must be explicit: these formatters run on the server (Vercel's runtime
// is UTC) as well as in the browser, and without a fixed zone the server
// render would show raw UTC — e.g. a 4pm BST session displaying as 3pm.
const DISPLAY_TIME_ZONE = "Europe/London";

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  }).format(new Date(date));
}

function londonDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

// Value for an <input type="date">, in Guernsey/UK local time rather than
// the server's UTC runtime — see DISPLAY_TIME_ZONE above.
export function toLocalDateInputValue(date: Date) {
  const p = londonDateParts(date);
  return `${p.year}-${p.month}-${p.day}`;
}

// Value for an <input type="time">, in Guernsey/UK local time.
export function toLocalTimeInputValue(date: Date) {
  const p = londonDateParts(date);
  return `${p.hour}:${p.minute}`;
}

// The inverse of the two helpers above: given a date and time exactly as
// entered into an <input type="date"> / <input type="time"> pair, returns
// the UTC instant they represent in Europe/London — regardless of what
// timezone the browser or server evaluating this happens to be in.
//
// `new Date(`${date}T${time}:00`)` looks like it does the same thing, but
// a timezone-less date string like that is parsed in the *ambient*
// timezone of wherever the JS engine is running, which is only ever
// correct here by coincidence (a UK-based browser). Someone scheduling or
// editing a session from a browser set to a different timezone would
// otherwise have it silently saved at the wrong UTC instant.
//
// This works by taking the input as a naive UTC instant, checking what
// wall-clock time that instant actually renders as in London, and
// correcting by the difference — which naturally accounts for BST/GMT.
export function londonWallTimeToUtc(dateValue: string, timeValue: string): Date {
  const naiveUtc = new Date(`${dateValue}T${timeValue}:00Z`);
  const p = londonDateParts(naiveUtc);
  const londonWallAsUtc = Date.UTC(
    Number(p.year),
    Number(p.month) - 1,
    Number(p.day),
    Number(p.hour),
    Number(p.minute),
    Number(p.second),
  );
  const offsetMs = naiveUtc.getTime() - londonWallAsUtc;
  return new Date(naiveUtc.getTime() + offsetMs);
}
