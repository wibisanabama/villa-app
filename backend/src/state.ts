import type { BookingStatus } from "@vilara/contracts";

const ownerTransitions = new Map<BookingStatus, BookingStatus>([
  ["PENDING_PAYMENT", "CANCELLED"],
  ["CONFIRMED", "CHECKED_IN"],
  ["CHECKED_IN", "COMPLETED"],
]);
const staffTransitions = new Map<BookingStatus, BookingStatus>([
  ["CONFIRMED", "CHECKED_IN"],
  ["CHECKED_IN", "COMPLETED"],
]);

export function canTransitionBooking(role: "OWNER" | "STAFF", current: BookingStatus, next: BookingStatus) {
  return (role === "OWNER" ? ownerTransitions : staffTransitions).get(current) === next;
}

export function hasInvoiceBeenPaid(status: string) {
  return ["paid", "success", "settled"].includes(status.toLowerCase());
}

