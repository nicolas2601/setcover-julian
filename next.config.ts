import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimizations
  reactStrictMode: false, // disable double render in dev for perf
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  experimental: {
    // Tree-shake heavy packages
    optimizePackageImports: [
      "framer-motion",
      "gsap",
      "@gsap/react",
      "lenis",
      "highlight.js",
      "katex",
      "react-katex",
      "split-type",
      "maath",
    ],
  },

  // Cache static assets aggressively
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|gif|webp|avif|ico)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/data/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400",
          },
        ],
      },
    ];
  },

  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
