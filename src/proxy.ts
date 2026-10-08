import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALE_COOKIE, localeForCountry } from "@/i18n/locale-detection";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Rafraîchit la session Supabase à chaque requête.
 *
 * Sans cela, le jeton expire et l'utilisateur est déconnecté silencieusement
 * au bout d'une heure. `getUser()` est volontairement appelé ici : c'est lui
 * qui déclenche le renouvellement et qui valide le jeton auprès du serveur
 * d'auth, contrairement à `getSession()` qui se contente de lire le cookie.
 */
export async function proxy(request: NextRequest) {
  // Première visite sur l'accueil : langue choisie selon le pays détecté, une seule fois.
  // Le cookie évite toute boucle de redirection et respecte un choix déjà fait.
  if (request.nextUrl.pathname === "/" && !request.cookies.get(LOCALE_COOKIE)) {
    const locale = localeForCountry(request.headers.get("x-vercel-ip-country"));
    const target = locale === "en" ? "/en" : "/";
    const redirect = NextResponse.redirect(new URL(target, request.url));
    redirect.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    if (locale === "en") return redirect;
    // Français : on sert la page et on mémorise le choix.
    const page = NextResponse.next({ request });
    page.cookies.set(LOCALE_COOKIE, locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return page;
  }

  // Un passage explicite sur /en ou / met à jour la langue mémorisée (lien de changement de langue).
  const path = request.nextUrl.pathname;
  const pathLocale: Locale | null = path === "/en" || path.startsWith("/en/") ? "en" : path === "/" ? "fr" : null;
  const current = request.cookies.get(LOCALE_COOKIE)?.value;
  const syncLocale = pathLocale !== null && current !== pathLocale;

  let response = NextResponse.next({ request });
  if (syncLocale && pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
