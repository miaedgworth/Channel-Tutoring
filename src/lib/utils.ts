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

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
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
  }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
