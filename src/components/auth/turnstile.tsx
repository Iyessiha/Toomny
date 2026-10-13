"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: { sitekey: string; callback: (t: string) => void; "expired-callback"?: () => void }) => string;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Widget Cloudflare Turnstile. Rien n'est affiché sans NEXT_PUBLIC_TURNSTILE_SITE_KEY. */
export function TurnstileWidget({ onToken }: { onToken: (token: string | null) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    const el = ref.current;
    if (!sitekey || !el) return;

    const render = () => {
      if (window.turnstile && el.childElementCount === 0) {
        window.turnstile.render(el, {
          sitekey,
          callback: (t) => onToken(t),
          "expired-callback": () => onToken(null),
        });
      }
    };

    if (window.turnstile) {
      render();
      return;
    }
    let script = document.querySelector<HTMLScriptElement>("script[data-turnstile]");
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.dataset.turnstile = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", render);
    return () => script?.removeEventListener("load", render);
  }, [sitekey, onToken]);

  if (!sitekey) return null;
  return <div ref={ref} className="flex justify-center" />;
}
