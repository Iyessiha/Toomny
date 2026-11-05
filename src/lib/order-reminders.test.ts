import { describe, expect, it } from "vitest";
import {
  PAYMENT_EXPIRY_HOURS,
  PAYMENT_REMINDER_AFTER_HOURS,
  paymentExpiryCutoff,
  paymentReminderCutoff,
} from "./order-reminders";

const hoursBetween = (now: Date, iso: string) => (now.getTime() - new Date(iso).getTime()) / 3_600_000;

describe("paymentReminderCutoff", () => {
  it("recule de la durée de rappel", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    expect(hoursBetween(now, paymentReminderCutoff(now))).toBe(PAYMENT_REMINDER_AFTER_HOURS);
  });
});

describe("paymentExpiryCutoff", () => {
  it("annule après 72 heures sans paiement", () => {
    expect(PAYMENT_EXPIRY_HOURS).toBe(72);
    const now = new Date("2026-10-23T12:00:00Z");
    expect(hoursBetween(now, paymentExpiryCutoff(now))).toBe(72);
  });
});
