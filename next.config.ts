import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mobile-first et réseau lent : on garde les images strictement optimisées.
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  poweredByHeader: false,
};

export default nextConfig;
