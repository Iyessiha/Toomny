"use client";

import { useState } from "react";

type Message = {
  id: string;
  body: string;
  created_at: string;
  senderName: string;
  senderRole: string;
};

export function DisputeThread({
  messages,
  showLabel,
  hideLabel,
  threadLabel,
  noMessagesLabel,
}: {
  messages: Message[];
  showLabel: string;
  hideLabel: string;
  threadLabel: string;
  noMessagesLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border-t border-[var(--border)] pt-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs font-semibold text-[var(--subtle)] hover:text-[var(--foreground)]"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-90" : ""}`}
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
        {threadLabel}
        {messages.length > 0 && (
          <span className="ml-1 rounded-full bg-[var(--surface)] px-2 py-0.5 text-[11px]">
            {messages.length}
          </span>
        )}
        <span className="ml-auto font-normal">{open ? hideLabel : showLabel}</span>
      </button>

      {open && (
        <div className="mt-3 max-h-72 space-y-3 overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-xs text-[var(--subtle)]">{noMessagesLabel}</p>
          ) : (
            messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-[var(--surface)] px-4 py-3 text-sm">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-[var(--color-brand-600)]">
                    {m.senderName}
                    <span className="ml-1.5 font-normal text-[var(--subtle)]">· {m.senderRole}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-[var(--subtle)]">
                    {new Date(m.created_at).toLocaleString(undefined, {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 whitespace-pre-line text-[var(--foreground)]">{m.body}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
