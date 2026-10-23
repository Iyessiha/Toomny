import { describe, expect, it } from "vitest";
import { PAYMENT_REMINDER_AFTER_HOURS, paymentReminderCutoff } from "./order-reminders";

describe("paymentReminderCutoff", () => {
  it("recule de la durée de rappel", () => {
    const now = new Date("2026-10-23T12:00:00Z");
    const cutoff = new Date(paymentReminderCutoff(now));
    expect((now.getTime() - cutoff.getTime()) / 3_600_000).toBe(PAYMENT_REMINDER_AFTER_HOURS);
  });
});
