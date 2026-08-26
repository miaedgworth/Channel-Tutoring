import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { LEVEL_LABELS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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

function datePart(date: Date, type: "year" | "month" | "day" | "hour" | "minute") {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return parts.find((p) => p.type === type)?.value ?? "";
}

// Value for an <input type="date">, in Guernsey/UK local time rather than
// the server's UTC runtime — see DISPLAY_TIME_ZONE above.
export function toLocalDateInputValue(date: Date) {
  return `${datePart(date, "year")}-${datePart(date, "month")}-${datePart(date, "day")}`;
}

// Value for an <input type="time">, in Guernsey/UK local time.
export function toLocalTimeInputValue(date: Date) {
  return `${datePart(date, "hour")}:${datePart(date, "minute")}`;
}
