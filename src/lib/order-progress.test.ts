import { describe, expect, it } from "vitest";
import { ORDER_STEPS, orderProgress, stepState } from "./order-progress";

describe("orderProgress", () => {
  it.each([
    ["pending_payment", 0],
    ["funded", 1],
    ["in_progress", 2],
    ["delivered", 3],
    ["completed", 4],
  ])("%s franchit l'étape %i", (status, reached) => {
    expect(orderProgress(status)).toEqual({ reached, terminal: false });
  });

  it.each(["disputed", "cancelled", "refunded", "inconnu"])("%s est terminal", (status) => {
    expect(orderProgress(status)).toEqual({ reached: -1, terminal: true });
  });
});

describe("stepState", () => {
  it("marque franchies, attendue et à venir pour une commande payée", () => {
    const progress = orderProgress("funded");
    const states = ORDER_STEPS.map((_, i) => stepState(i, progress));
    expect(states).toEqual(["done", "done", "next", "upcoming", "upcoming"]);
  });

  it("une commande terminée n'a plus d'étape attendue", () => {
    const progress = orderProgress("completed");
    const states = ORDER_STEPS.map((_, i) => stepState(i, progress));
    expect(states.every((s) => s === "done")).toBe(true);
  });
});
