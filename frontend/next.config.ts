import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Em produção o Next não precisa de eval; só o Fast Refresh do dev usa. Manter
// a CSP mais fechada possível sem quebrar a hidratação (que exige unsafe-inline
// enquanto não há suporte a nonce por rota neste app).
const scriptSrc = isProd
  ? "script-src 'self' 'unsafe-inline'"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  // Evita o aviso de "workspace root" por haver mais de um lockfile na árvore
  // e garante que o rastreamento de arquivos use a raiz deste app.
  outputFileTracingRoot: __dirname,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  compiler: {
    // Remove console.* do bundle em produção, preservando error/warn para
    // observabilidade no servidor (logs da Vercel).
    removeConsole: isProd ? { exclude: ["error", "warn"] } : false,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
