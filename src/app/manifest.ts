import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Toomny — Travailler ensemble, grandir ensemble",
    short_name: "Toomny",
    description:
      "La marketplace de talents africains. Recrutez, collaborez, payez en mobile money.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "browser"],
    background_color: "#0a0f0d",
    theme_color: "#108043",
    orientation: "portrait-primary",
    lang: "fr",
    dir: "ltr",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icons/icon-48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Tableau de bord",
        short_name: "Dashboard",
        description: "Accédez à votre tableau de bord",
        url: "/dashboard",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
      },
      {
        name: "Vérification KYC",
        short_name: "KYC",
        description: "Vérifiez votre identité",
        url: "/dashboard/verification",
        icons: [{ src: "/icons/icon-96.png", sizes: "96x96" }],
      },
    ],
  };
}
