import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // 古いURLから新しいURLへの転送（PHPの .htaccess の Redirect と同じ役割）
  async redirects() {
    return [
      // 旧ドメイン（vercel.app）で開いた人を、独自ドメインの同じページへ
      {
        source: "/:path*",
        has: [{ type: "host", value: "toupazu-point-calc.vercel.app" }],
        destination: "https://www.pazugiri-index.com/:path*",
        permanent: true,
      },
      // 以前の共有リンク（トップに ?current=… が付いたもの）は地獄めぐりのページへ
      {
        source: "/",
        has: [{ type: "query", key: "current" }],
        destination: "/point-calc/jigoku-meguri-2026",
        permanent: true,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
