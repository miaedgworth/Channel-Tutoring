import { Badge } from "@/components/ui/badge";
import type { BookingStatus } from "@prisma/client";

const VARIANT: Record<BookingStatus, "neutral" | "success" | "warning" | "danger"> = {
  PENDING_PAYMENT: "warning",
  CONFIRMED: "success",
  COMPLETED: "neutral",
  CANCELLED_BY_CLIENT: "danger",
  CANCELLED_BY_TUTOR: "danger",
  REFUNDED: "danger",
  DISPUTED: "danger",
};

const LABEL: Record<BookingStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  CONFIRMED: "Confirmed",
  COMPLETED: "Completed",
  CANCELLED_BY_CLIENT: "Cancelled by client",
  CANCELLED_BY_TUTOR: "Cancelled by tutor",
  REFUNDED: "Refunded",
  DISPUTED: "Disputed",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
