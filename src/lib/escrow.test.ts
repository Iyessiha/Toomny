import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, isFundsHeld, type OrderStatus } from "./escrow";
import { ORDER_RULES, availableActions } from "./orders";

const ALL: OrderStatus[] = [
  "pending_payment",
  "funded",
  "in_progress",
  "delivered",
  "completed",
  "disputed",
  "cancelled",
  "refunded",
];

describe("machine à états de commande", () => {
  it("autorise le parcours nominal", () => {
    expect(canTransition("pending_payment", "funded")).toBe(true);
    expect(canTransition("funded", "in_progress")).toBe(true);
    expect(canTransition("in_progress", "delivered")).toBe(true);
    expect(canTransition("delivered", "completed")).toBe(true);
  });

  it("états finaux : aucune transition sortante", () => {
    for (const from of ["completed", "cancelled", "refunded"] as const) {
      for (const to of ALL) expect(canTransition(from, to)).toBe(false);
    }
  });

  it("interdit de sauter une étape ou de revenir en arrière", () => {
    expect(canTransition("pending_payment", "completed")).toBe(false);
    expect(canTransition("funded", "delivered")).toBe(false);
    expect(canTransition("completed", "disputed")).toBe(false);
  });

  it("assertTransition lève une erreur hors des transitions prévues", () => {
    expect(() => assertTransition("funded", "in_progress")).not.toThrow();
    expect(() => assertTransition("completed", "funded")).toThrow(/interdite/);
  });

  it("considère les fonds retenus uniquement entre financement et clôture", () => {
    expect(isFundsHeld("pending_payment")).toBe(false);
    expect(isFundsHeld("funded")).toBe(true);
    expect(isFundsHeld("disputed")).toBe(true);
    expect(isFundsHeld("completed")).toBe(false);
    expect(isFundsHeld("refunded")).toBe(false);
  });
});

describe("cohérence entre l'interface et le serveur", () => {
  it("chaque action proposée à l'utilisateur est une transition autorisée", () => {
    for (const [name, rule] of Object.entries(ORDER_RULES)) {
      for (const from of rule.from) {
        expect(canTransition(from as OrderStatus, rule.to as OrderStatus), `${name}: ${from} -> ${rule.to}`).toBe(true);
      }
    }
  });

  it("availableActions ne propose une action qu'au bon rôle", () => {
    expect(availableActions(true, false, "funded")).toEqual(["dispute"]);
    expect(availableActions(false, true, "funded")).toEqual(["start"]);
    expect(availableActions(true, false, "delivered")).toEqual(["accept", "dispute"]);
    expect(availableActions(false, true, "delivered")).toEqual([]);
  });

  it("aucune action n'est proposée dans un état final", () => {
    for (const s of ["completed", "cancelled", "refunded"]) {
      expect(availableActions(true, true, s)).toEqual([]);
    }
  });
});
