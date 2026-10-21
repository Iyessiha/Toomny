// Pixels publicitaires : champs, validation et scripts de suivi.
// Module pur (sans accès base) pour pouvoir être testé directement.
//
// Les identifiants sont injectés dans du JavaScript inline. Chaque motif est
// donc strict : un identifiant qui ne correspond pas est refusé à la saisie,
// et ne peut jamais sortir d'une chaîne JS.

export const PIXEL_FIELDS = {
  meta_pixel_id: { label: "Meta (Facebook / Instagram)", pattern: /^[0-9]{8,20}$/, hint: "Chiffres uniquement" },
  tiktok_pixel_id: { label: "TikTok", pattern: /^[A-Z0-9]{20,40}$/, hint: "Lettres majuscules et chiffres" },
  google_ads_id: { label: "Google Ads", pattern: /^AW-[0-9]{6,15}$/, hint: "Format AW-123456789" },
  ga4_measurement_id: { label: "Google Analytics 4", pattern: /^G-[A-Z0-9]{4,15}$/, hint: "Format G-XXXXXXXXXX" },
  snapchat_pixel_id: { label: "Snapchat", pattern: /^[a-f0-9-]{36}$/, hint: "Identifiant UUID" },
  pinterest_tag_id: { label: "Pinterest", pattern: /^[0-9]{13,16}$/, hint: "Chiffres uniquement" },
} as const;

export type PixelField = keyof typeof PIXEL_FIELDS;
export type PixelSettings = Record<PixelField, string | null>;

export const PIXEL_KEYS = Object.keys(PIXEL_FIELDS) as PixelField[];

export const PIXEL_SETTINGS_EMPTY: PixelSettings = Object.fromEntries(
  PIXEL_KEYS.map((k) => [k, null]),
) as PixelSettings;

/**
 * Lit les valeurs saisies. Une valeur vide désactive le pixel.
 * Renvoie le premier champ invalide, ou les valeurs normalisées.
 */
export function parsePixelSettings(
  read: (name: string) => string,
): { ok: true; values: PixelSettings } | { ok: false; field: PixelField } {
  const values = { ...PIXEL_SETTINGS_EMPTY };
  for (const key of PIXEL_KEYS) {
    const raw = read(key).trim();
    if (raw === "") continue;
    if (!PIXEL_FIELDS[key].pattern.test(raw)) return { ok: false, field: key };
    values[key] = raw;
  }
  return { ok: true, values };
}

export type PixelScript = { id: string; src?: string; code?: string };

const META = (id: string) => `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${id}');fbq('track','PageView');`;

const TIKTOK = (id: string) => `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instance","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${id}');ttq.page();}(window,document,'ttq');`;

const SNAPCHAT = (id: string) => `(function(e,t,n){if(e.snaptr)return;var a=e.snaptr=function(){a.handleRequest?a.handleRequest.apply(a,arguments):a.queue.push(arguments)};a.queue=[];var s='script';var r=t.createElement(s);r.async=!0;r.src=n;var u=t.getElementsByTagName(s)[0];u.parentNode.insertBefore(r,u);})(window,document,'https://sc-static.net/scevent.min.js');snaptr('init','${id}');snaptr('track','PAGE_VIEW');`;

const PINTEREST = (id: string) => `!function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version="3.0";var t=document.createElement("script");t.async=!0,t.src=e;var r=document.getElementsByTagName("script")[0];r.parentNode.insertBefore(t,r)}}("https://s.pinimg.com/ct/core.js");pintrk('load','${id}');pintrk('page');`;

/**
 * Scripts à charger pour une configuration donnée. Google Ads et GA4 partagent
 * une seule bibliothèque gtag.js : elle est chargée une fois, puis chaque
 * identifiant est configuré.
 */
export function pixelScripts(s: PixelSettings): PixelScript[] {
  const scripts: PixelScript[] = [];

  if (s.meta_pixel_id) scripts.push({ id: "meta", code: META(s.meta_pixel_id) });
  if (s.tiktok_pixel_id) scripts.push({ id: "tiktok", code: TIKTOK(s.tiktok_pixel_id) });
  if (s.snapchat_pixel_id) scripts.push({ id: "snapchat", code: SNAPCHAT(s.snapchat_pixel_id) });
  if (s.pinterest_tag_id) scripts.push({ id: "pinterest", code: PINTEREST(s.pinterest_tag_id) });

  const gtagIds = [s.google_ads_id, s.ga4_measurement_id].filter((id): id is string => Boolean(id));
  if (gtagIds.length > 0) {
    scripts.push({ id: "gtag-lib", src: `https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}` });
    const configs = gtagIds.map((id) => `gtag('config','${id}');`).join("");
    scripts.push({
      id: "gtag-init",
      code: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${configs}`,
    });
  }

  return scripts;
}
