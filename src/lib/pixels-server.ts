import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { PIXEL_KEYS, PIXEL_SETTINGS_EMPTY, type PixelSettings } from "@/lib/pixels";

export const PIXELS_CACHE_TAG = "pixels";

async function lirePixels(): Promise<PixelSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from("pixels_publicitaires")
    .select(PIXEL_KEYS.join(", "))
    .eq("id", 1)
    .maybeSingle();

  // Sans configuration lisible, le site se charge sans pixel plutôt que de tomber.
  if (error || !data) return PIXEL_SETTINGS_EMPTY;
  return { ...PIXEL_SETTINGS_EMPTY, ...(data as unknown as Partial<PixelSettings>) };
}

/** Valeurs lues en base, mises en cache jusqu'à la prochaine sauvegarde admin. */
export const getPixelSettings = unstable_cache(lirePixels, ["pixels-publicitaires"], {
  tags: [PIXELS_CACHE_TAG],
  revalidate: 3600,
});
