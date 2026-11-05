import { describe, expect, it } from "vitest";
import { pickEncouragement, type EncouragementInput } from "./encouragement";

const base: EncouragementInput = {
  isProvider: true,
  toStart: 0,
  toValidate: 0,
  completed: 0,
  orders: 0,
  activeServices: 0,
};

describe("pickEncouragement", () => {
  it("célèbre une nouvelle commande avant tout", () => {
    expect(pickEncouragement({ ...base, toStart: 2, completed: 5, orders: 7 })).toEqual({ kind: "new_order", count: 2 });
  });

  it("demande au client de valider une livraison", () => {
    expect(pickEncouragement({ ...base, isProvider: false, toValidate: 1, orders: 3 })).toEqual({ kind: "to_validate", count: 1 });
  });

  it("félicite pour une mission terminée", () => {
    expect(pickEncouragement({ ...base, completed: 3, orders: 3 })).toEqual({ kind: "mission_done", count: 3 });
  });

  it("invite un prestataire sans photo à en ajouter une", () => {
    expect(pickEncouragement({ ...base, photoMissing: true, activeServices: 1 })).toEqual({ kind: "add_photo" });
  });

  it("invite un prestataire sans réalisation à montrer son travail", () => {
    expect(pickEncouragement({ ...base, photoMissing: false, portfolioMissing: true, activeServices: 1 })).toEqual({ kind: "add_portfolio" });
  });

  it("ne demande pas de photo quand elle existe déjà", () => {
    expect(pickEncouragement({ ...base, photoMissing: false, orders: 2, activeServices: 1 })).toBeNull();
  });

  it("invite un prestataire sans prestation à publier la première", () => {
    expect(pickEncouragement(base)).toEqual({ kind: "publish_first" });
  });

  it("invite un prestataire sans commande à partager ses prestations publiées", () => {
    expect(pickEncouragement({ ...base, activeServices: 2 })).toEqual({ kind: "share_services" });
  });

  it("invite un client sans commande à partager Toomny", () => {
    expect(pickEncouragement({ ...base, isProvider: false })).toEqual({ kind: "share_toomny" });
  });

  it("ne dit rien quand il n'y a rien de nouveau", () => {
    expect(pickEncouragement({ ...base, orders: 4, activeServices: 1 })).toBeNull();
  });
});
