import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mobile-first et réseau lent : on garde les images strictement optimisées.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  poweredByHeader: false,
  experimental: {
    // Les trois photos KYC réduites côté navigateur dépassent la limite par défaut (1 Mo).
    // Plafond Vercel des requêtes : 4,5 Mo.
    serverActions: { bodySizeLimit: "4mb" },
  },
  // Anciennes adresses de l'ancien site encore présentes dans l'index de Google.
  async redirects() {
    return [
      { source: "/service-categories/:slug", destination: "/services?categorie=:slug", permanent: true },
      { source: "/terms-of-use", destination: "/cgu", permanent: true },
      { source: "/about-us", destination: "/comment-ca-marche", permanent: true },
      { source: "/freelancers", destination: "/services", permanent: true },
      { source: "/freelancers-for-employer", destination: "/services", permanent: true },
      { source: "/freelancer-projects", destination: "/services", permanent: true },
      { source: "/jobs", destination: "/services", permanent: true },
      { source: "/settings-employer", destination: "/dashboard", permanent: true },
    ];
  },
  async headers() {
    // En développement, les aperçus sont affichés dans une iframe (bac à sable
    // distant) : on n'y interdit pas l'encadrement, sinon l'aperçu reste blanc.
    // La production garde le refus, ici et dans la CSP (voir src/proxy.ts).
    const devFrameAncestors = process.env.NODE_ENV !== "production";
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          ...(devFrameAncestors ? [] : [{ key: "X-Frame-Options", value: "DENY" }]),
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
