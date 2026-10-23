import { describe, expect, it } from "vitest";
import { needsTeamAction, serviceQueue } from "./service-queue";

describe("serviceQueue", () => {
  it("une prestation jamais revue est « nouvelle »", () => {
    expect(serviceQueue({ status: "draft", review_notes: null, review_requested_at: null })).toBe("new");
  });

  it("une prestation refusée et non resoumise est « rejetée »", () => {
    expect(serviceQueue({ status: "draft", review_notes: "1. Photo", review_requested_at: null })).toBe("rejected");
  });

  it("une prestation corrigée et resoumise passe en tête : « resoumise »", () => {
    expect(serviceQueue({ status: "draft", review_notes: "1. Photo", review_requested_at: "2026-10-23T10:00:00Z" })).toBe("resubmitted");
  });

  it("une prestation publiée n'a pas de file", () => {
    expect(serviceQueue({ status: "active", review_notes: null, review_requested_at: null })).toBeNull();
  });

  it("nouvelles et resoumises demandent une action de l'équipe, pas les rejetées", () => {
    expect(needsTeamAction("new")).toBe(true);
    expect(needsTeamAction("resubmitted")).toBe(true);
    expect(needsTeamAction("rejected")).toBe(false);
  });
});
