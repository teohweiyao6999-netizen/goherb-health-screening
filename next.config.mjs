/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfkit reads .afm files from its own package directory at runtime.
  // Next.js bundling moves the JS but leaves data files behind, breaking it.
  // Treat pdfkit as a server external so it's resolved at runtime as-is.
  experimental: {
    serverComponentsExternalPackages: ["pdfkit"],
  },
};

export default nextConfig;
