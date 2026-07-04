// ════════════════════════════════════════════════════════════════
// Puppeteer-based PDF renderer.
//
// - In production (Vercel serverless), uses @sparticuz/chromium binary
//   bundled in the deployment, driven by puppeteer-core.
// - In local development, uses the regular `puppeteer` package
//   (which bundles Chrome for Testing).
// ════════════════════════════════════════════════════════════════

import type { Browser } from "puppeteer-core";

const isProd = !!process.env.VERCEL || process.env.NODE_ENV === "production";

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    // Allow document + stylesheet + fonts (needed for Chinese font on Vercel).
    // Block images/scripts/etc so page still loads fast.
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const type = req.resourceType();
      const url = req.url();
      if (
        type === "document" ||
        type === "stylesheet" ||
        type === "font" ||
        url.includes("fonts.googleapis.com") ||
        url.includes("fonts.gstatic.com")
      ) {
        req.continue();
      } else {
        req.abort();
      }
    });
    await page.setContent(html, {
      waitUntil: "load",
      timeout: 60000,
    });
    // Wait for fonts to be fully loaded (Google Fonts CSS + WOFF2 files)
    await page.evaluate(async () => {
      if ("fonts" in document) {
        await (document as Document & { fonts: { ready: Promise<void> } }).fonts.ready;
      }
    });
    // Auto-fit content to single page: scale page-inner down if it overflows
    await page.evaluate(() => {
      const page = document.querySelector(".page") as HTMLElement | null;
      const inner = document.getElementById("page-inner");
      if (!page || !inner) return;
      const style = window.getComputedStyle(page);
      const pageH = page.clientHeight;
      const padT = parseFloat(style.paddingTop);
      const padB = parseFloat(style.paddingBottom);
      const availH = pageH - padT - padB;
      const contentH = inner.scrollHeight;
      if (contentH > availH) {
        let scale = availH / contentH;
        scale = Math.max(0.65, Math.min(1, scale));
        inner.style.transform = `scale(${scale})`;
        inner.style.transformOrigin = "top left";
        inner.style.width = `${100 / scale}%`;
      }
    });
    await new Promise((r) => setTimeout(r, 150));
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      preferCSSPageSize: true,
      timeout: 60000,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function launchBrowser(): Promise<Browser> {
  if (isProd) {
    // sparticuz/chromium v149+ recommended launch config
    const chromium = (await import("@sparticuz/chromium")).default;
    const puppeteerCore = await import("puppeteer-core");

    // Disable graphics mode to shrink footprint and avoid missing libs
    chromium.setGraphicsMode = false;

    const executablePath = await chromium.executablePath();

    return (await puppeteerCore.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    })) as unknown as Browser;
  }
  const puppeteer = await import("puppeteer");
  return (await puppeteer.default.launch({
    headless: true,
  })) as unknown as Browser;
}
