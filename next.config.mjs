/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Externalize server-side packages so Next.js does not bundle them.
    // pdfkit reads .afm files at runtime from its own package dir.
    // @sparticuz/chromium ships its own binary and depends on the bin/ folder
    //   being present at node_modules/@sparticuz/chromium/bin.
    // puppeteer-core / puppeteer resolve chromium at runtime.
    serverComponentsExternalPackages: [
      "pdfkit",
      "@sparticuz/chromium",
      "puppeteer-core",
      "puppeteer",
    ],
    // Include the sparticuz binary + brotli-compressed chromium files
    // in the Vercel serverless function output tracing.
    outputFileTracingIncludes: {
      "/api/save-report": [
        "./node_modules/@sparticuz/chromium/**",
      ],
    },
  },
};

export default nextConfig;
