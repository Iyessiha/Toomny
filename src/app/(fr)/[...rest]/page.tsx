import { notFound, redirect } from "next/navigation";
import { visitorLocale } from "@/i18n/server-locale";

/**
 * Catch-all de la version française : toute URL inconnue passe ici, puis
 * `notFound()` affiche la 404 localisée de ce groupe. Un visiteur anglophone
 * est envoyé vers la même URL sous /en, pour que la page soit servie avec le bon `lang`.
 */
export default async function UnknownPage({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  if ((await visitorLocale()) === "en") {
    redirect(`/en/${rest.map(encodeURIComponent).join("/")}`);
  }
  notFound();
}
