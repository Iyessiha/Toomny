import { describe, expect, it } from "vitest";
import { conversationKey, groupInquiries, type InquiryRow } from "./inquiries";

const ME = "aaaaaaaa-0000-0000-0000-000000000000";
const YOU = "bbbbbbbb-0000-0000-0000-000000000000";
const HER = "cccccccc-0000-0000-0000-000000000000";
const SVC = "dddddddd-0000-0000-0000-000000000000";

function row(partial: Partial<InquiryRow> & { id: string }): InquiryRow {
  return {
    from_id: ME,
    to_id: YOU,
    service_id: SVC,
    message: "bonjour",
    read_at: null,
    created_at: "2026-10-01T10:00:00.000Z",
    ...partial,
  };
}

describe("conversationKey", () => {
  it("est identique dans les deux sens d'écriture", () => {
    expect(conversationKey(ME, YOU, SVC)).toBe(conversationKey(YOU, ME, SVC));
  });

  it("distingue les prestations et le contact direct", () => {
    expect(conversationKey(ME, YOU, SVC)).not.toBe(conversationKey(ME, YOU, null));
    expect(conversationKey(ME, YOU, SVC)).not.toBe(
      conversationKey(ME, YOU, "eeeeeeee-0000-0000-0000-000000000000"),
    );
  });
});

describe("groupInquiries", () => {
  it("regroupe les deux sens en une conversation chronologique", () => {
    const rows = [
      row({ id: "2", from_id: YOU, to_id: ME, created_at: "2026-10-02T10:00:00.000Z" }),
      row({ id: "1", from_id: ME, to_id: YOU, created_at: "2026-10-01T10:00:00.000Z" }),
    ];
    const convs = groupInquiries(rows, ME);
    expect(convs).toHaveLength(1);
    expect(convs[0].otherId).toBe(YOU);
    expect(convs[0].serviceId).toBe(SVC);
    expect(convs[0].messages.map((m) => m.id)).toEqual(["1", "2"]);
  });

  it("sépare les interlocuteurs et les prestations", () => {
    const rows = [
      row({ id: "1", to_id: YOU, service_id: SVC }),
      row({ id: "2", to_id: HER, service_id: SVC }),
      row({ id: "3", to_id: YOU, service_id: null }),
    ];
    expect(groupInquiries(rows, ME)).toHaveLength(3);
  });

  it("ignore les lignes où je ne suis pas partie", () => {
    const rows = [row({ id: "1", from_id: YOU, to_id: HER })];
    expect(groupInquiries(rows, ME)).toHaveLength(0);
  });

  it("compte les non-lus reçus par moi uniquement", () => {
    const rows = [
      row({ id: "1", from_id: YOU, to_id: ME, read_at: null }),
      row({ id: "2", from_id: YOU, to_id: ME, read_at: "2026-10-03T10:00:00.000Z" }),
      row({ id: "3", from_id: ME, to_id: YOU, read_at: null }),
    ];
    const convs = groupInquiries(rows, ME);
    expect(convs[0].unread).toBe(1);
  });

  it("trie les conversations par activité récente", () => {
    const rows = [
      row({ id: "1", to_id: YOU, created_at: "2026-10-01T10:00:00.000Z" }),
      row({ id: "2", to_id: HER, created_at: "2026-10-05T10:00:00.000Z" }),
    ];
    const convs = groupInquiries(rows, ME);
    expect(convs.map((c) => c.otherId)).toEqual([HER, YOU]);
  });
});
