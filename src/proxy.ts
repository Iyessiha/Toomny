import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { LOCALE_COOKIE, localeForCountry } from "@/i18n/locale-detection";
import type { Locale } from "@/i18n/dictionaries";

/**
 * Origines de suivi publicitaire, chargées selon les pixels configurés dans
 * l'admin (voir lib/pixels.ts). Elles ne sont utiles qu'aux visiteurs du site
 * public ; le nonce reste la véritable barrière pour les scripts.
 */
const TRACKING_SCRIPT_HOSTS = [
  "https://connect.facebook.net",
  "https://analytics.tiktok.com",
  "https://sc-static.net",
  "https://s.pinimg.com",
  "https://www.googletagmanager.com",
];
const TRACKING_BEACON_HOSTS = [
  "https://www.facebook.com",
  "https://analytics.tiktok.com",
  "https://tr.snapchat.com",
  "https://sc-logs.snapchat.com",
  "https://ct.pinterest.com",
  "https://www.google.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
  "https://*.googletagmanager.com",
  "https://*.doubleclick.net",
];

/**
 * Politique de contenu. Seules les origines réellement utilisées sont listées :
 * Supabase (API, stockage des pièces KYC signées), Cloudflare Turnstile et les
 * plateformes publicitaires configurées. Le nonce autorise les scripts inline
 * que nous posons nous-mêmes (voir root-layout.tsx) et ceux de Next.js, sans
 * ouvrir `'unsafe-inline'`.
 */
export function buildCsp(nonce: string, isDev: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    "'strict-dynamic'",
    "https://challenges.cloudflare.com",
    ...TRACKING_SCRIPT_HOSTS,
    ...(isDev ? ["'unsafe-eval'"] : []),
  ];

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc.join(" ")}`,
    // Next.js et Tailwind injectent des styles ; pas de script via cet attribut.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: https://*.supabase.co ${TRACKING_BEACON_HOSTS.join(" ")}`,
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com ${TRACKING_BEACON_HOSTS.join(" ")}`,
    "frame-src https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Les aperçus de développement sont encadrés par le bac à sable distant.
    // En production, aucun cadre n'est autorisé.
    isDev ? "frame-ancestors 'self' https://*.e2b.app" : "frame-ancestors 'none'",
  ];
  if (!isDev) directives.push("upgrade-insecure-requests");

  return directives.join("; ");
}

/**
 * Point d'entrée unique : nonce CSP par requête, puis routage et rafraîchissement
 * de session. Le nonce voyage dans les en-têtes de requête pour que Next.js
 * l'applique à ses propres scripts.
 */
export async function proxy(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV !== "production");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const response = await route(request, requestHeaders);
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

async function route(request: NextRequest, requestHeaders: Headers): Promise<NextResponse> {
  const next = () => NextResponse.next({ request: { headers: requestHeaders } });
  const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" as const };

  // Première visite sur l'accueil : langue choisie selon le pays détecté, une seule fois.
  // Le cookie évite toute boucle de redirection et respecte un choix déjà fait.
  // Les robots n'ont pas de cookie et crawlent depuis les États-Unis : sans cette exception,
  // Googlebot serait redirigé vers /en à chaque passage et la version française ne serait pas indexée.
  const isCrawler = /googlebot|bingbot|duckduckbot|yandex|baiduspider/i.test(request.headers.get("user-agent") ?? "");
  if (request.nextUrl.pathname === "/" && !request.cookies.get(LOCALE_COOKIE) && !isCrawler) {
    const locale = localeForCountry(request.headers.get("x-vercel-ip-country"));
    const target = locale === "en" ? "/en" : "/";
    const redirect = NextResponse.redirect(new URL(target, request.url));
    redirect.cookies.set(LOCALE_COOKIE, locale, cookieOptions);
    if (locale === "en") return redirect;
    // Français : on sert la page et on mémorise le choix.
    const page = next();
    page.cookies.set(LOCALE_COOKIE, locale, cookieOptions);
    return page;
  }

  // Un passage explicite sur /en ou / met à jour la langue mémorisée (lien de changement de langue).
  const path = request.nextUrl.pathname;
  const pathLocale: Locale | null = path === "/en" || path.startsWith("/en/") ? "en" : path === "/" ? "fr" : null;
  const current = request.cookies.get(LOCALE_COOKIE)?.value;
  const syncLocale = pathLocale !== null && current !== pathLocale;

  let response = next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Le rendu doit voir le jeton renouvelé dans cette même requête.
          requestHeaders.set(
            "cookie",
            request.cookies.getAll().map(({ name, value }) => `${name}=${value}`).join("; "),
          );
          response = next();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  await supabase.auth.getUser();

  // Posé en dernier : le rafraîchissement de session ci-dessus recrée la réponse.
  if (syncLocale && pathLocale) {
    response.cookies.set(LOCALE_COOKIE, pathLocale, cookieOptions);
  }
  return response;
}

export const config = {
  matcher: [
    // Tout sauf les fichiers statiques et les images.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
