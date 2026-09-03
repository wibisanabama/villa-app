import { describe, expect, it } from "vitest";
import { canTransitionBooking, hasInvoiceBeenPaid } from "./state.js";

describe("booking state machine", () => {
  it("allows staff to run check-in operations only", () => {
    expect(canTransitionBooking("STAFF", "CONFIRMED", "CHECKED_IN")).toBe(true);
    expect(canTransitionBooking("STAFF", "CHECKED_IN", "COMPLETED")).toBe(true);
    expect(canTransitionBooking("STAFF", "PENDING_PAYMENT", "CANCELLED")).toBe(false);
  });

  it("rejects skipped and reversed transitions", () => {
    expect(canTransitionBooking("OWNER", "CONFIRMED", "COMPLETED")).toBe(false);
    expect(canTransitionBooking("OWNER", "COMPLETED", "CHECKED_IN")).toBe(false);
  });
});

describe("Mayar status normalization", () => {
  it("accepts documented paid variants without trusting unrelated status", () => {
    expect(hasInvoiceBeenPaid("paid")).toBe(true);
    expect(hasInvoiceBeenPaid("SUCCESS")).toBe(true);
    expect(hasInvoiceBeenPaid("created")).toBe(false);
  });
});

