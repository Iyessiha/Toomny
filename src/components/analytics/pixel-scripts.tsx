import Script from "next/script";
import { pixelScripts, type PixelSettings } from "@/lib/pixels";

// Rendu côté serveur : next/script applique le nonce CSP posé par le proxy.
export function PixelScripts({ settings }: { settings: PixelSettings }) {
  return pixelScripts(settings).map((script) =>
    script.src ? (
      <Script key={script.id} id={script.id} src={script.src} strategy="afterInteractive" />
    ) : (
      <Script key={script.id} id={script.id} strategy="afterInteractive">
        {script.code}
      </Script>
    ),
  );
}
