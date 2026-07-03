/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfkit reads .afm files from its own package directory at runtime.
    // @sparticuz/chromium ships its own binary that must not be bundled.
    // puppeteer-core resolves chromium at runtime.
    serverComponentsExternalPackages: [
      "pdfkit",
      "@sparticuz/chromium",
      "puppeteer-core",
      "puppeteer",
    ],
  },
};

export default nextConfig;
