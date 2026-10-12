import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getNotificationTexts } from "@/i18n/notifications";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Cloche de notifications pour le shell connecté. Le comptage passe par la
 * RLS (`notifications_select_own`) : seules les lignes du lecteur comptent,
 * sans jamais exposer son id au client.
 */
export async function NotificationBell({ locale }: { locale: Locale }) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  const unread = count ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={getNotificationTexts(locale).bell}
      className="relative flex h-9 w-9 items-center justify-center rounded-full text-[var(--subtle)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
    >
      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
      {unread > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-brand-500)] px-1 text-[10px] font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
