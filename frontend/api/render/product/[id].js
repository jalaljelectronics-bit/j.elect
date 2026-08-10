
// frontend/api/render/product/[id].js
//
// Server-side product renderer for Vercel.
//
// Request:
//   /api/render/product/600
//
// Flow:
//   1. Validate product ID.
//   2. Fetch product from backend.
//   3. Check Redis.
//   4. Launch Chromium.
//   5. Load the real React product page.
//   6. Capture rendered HTML.
//   7. Cache the HTML.
//   8. Return HTML.
//
// Redis namespace is intentionally "product-v2" so the old
// "MIDDLEWARE IS RUNNING" cache entry is not reused.

export const config = {
  maxDuration: 60,
};

const SITE_ORIGIN =
  process.env.SITE_ORIGIN ||
  'https://www.jelectronics.store';

const CACHE_TYPE = 'product-v2';

export default async function handler(request, response) {
  const { id } = request.query;

  // ---------------------------------------------------------
  // 1. Validate ID
  // ---------------------------------------------------------

  if (!id || Array.isArray(id)) {
    return response.status(400).json({
      ok: false,
      error: 'Invalid product ID',
    });
  }

  const productId = String(id);

  // ---------------------------------------------------------
  // 2. Validate backend URL
  // ---------------------------------------------------------

  const backendUrl =
    process.env.BACKEND_API_URL;

  if (!backendUrl) {
    console.error(
      'BACKEND_API_URL is not configured'
    );

    return response.status(500).json({
      ok: false,
      stage: 'configuration',
      error: 'BACKEND_API_URL is not configured',
    });
  }

  try {
    // -------------------------------------------------------
    // 3. Load Redis
    // -------------------------------------------------------

    let getCachedRender;
    let setCachedRender;

    try {
      const redis =
        await import('../../../lib/redis.js');

      getCachedRender =
        redis.getCachedRender;

      setCachedRender =
        redis.setCachedRender;

      if (
        typeof getCachedRender !== 'function' ||
        typeof setCachedRender !== 'function'
      ) {
        throw new Error(
          'redis.js must export getCachedRender and setCachedRender'
        );
      }
    } catch (error) {
      console.error(
        'Redis import error:',
        error
      );

      return response.status(500).json({
        ok: false,
        stage: 'redis-import',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    // -------------------------------------------------------
    // 4. Fetch product from backend
    // -------------------------------------------------------

    const cleanBackendUrl =
      backendUrl.replace(/\/+$/, '');

    const productApiUrl =
      `${cleanBackendUrl}/api/products/${encodeURIComponent(productId)}`;

    console.log(
      'Fetching product:',
      productApiUrl
    );

    let productResponse;

    try {
      productResponse = await fetch(
        productApiUrl,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        }
      );
    } catch (error) {
      console.error(
        'Backend connection error:',
        error
      );

      return response.status(502).json({
        ok: false,
        stage: 'backend-fetch',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    if (!productResponse.ok) {
      console.error(
        'Backend status:',
        productResponse.status
      );

      return response.status(
        productResponse.status === 404
          ? 404
          : 502
      ).json({
        ok: false,
        stage: 'backend-response',
        status: productResponse.status,
        error:
          productResponse.status === 404
            ? 'Product not found'
            : 'Backend request failed',
      });
    }

    let product;

    try {
      product =
        await productResponse.json();
    } catch (error) {
      console.error(
        'Backend JSON error:',
        error
      );

      return response.status(502).json({
        ok: false,
        stage: 'backend-json',
        error:
          'Backend returned invalid JSON',
      });
    }

    const currentUpdatedAt =
      product?.updatedAt ??
      product?.updated_at ??
      null;

    // -------------------------------------------------------
    // 5. Redis cache lookup
    // -------------------------------------------------------

    try {
      const cachedHtml =
        await getCachedRender(
          CACHE_TYPE,
          productId,
          currentUpdatedAt
        );

      if (
        cachedHtml &&
        typeof cachedHtml === 'string' &&
        cachedHtml.length > 500
      ) {
        response.setHeader(
          'Content-Type',
          'text/html; charset=utf-8'
        );

        response.setHeader(
          'X-Render-Cache',
          'HIT'
        );

        response.setHeader(
          'Cache-Control',
          'private, no-store, max-age=0'
        );

        return response
          .status(200)
          .send(cachedHtml);
      }
    } catch (error) {
      // Cache failure must not stop rendering.
      console.error(
        'Redis read error:',
        error
      );
    }

    // -------------------------------------------------------
    // 6. Build real product URL
    // -------------------------------------------------------

    const siteOrigin =
      SITE_ORIGIN.replace(/\/+$/, '');

    const pageUrl =
      `${siteOrigin}/product/${encodeURIComponent(productId)}`;

    console.log(
      'Rendering product:',
      pageUrl
    );

    // -------------------------------------------------------
    // 7. Load browser dependencies
    // -------------------------------------------------------

    let chromium;
    let puppeteer;

    try {
      const chromiumModule =
        await import('@sparticuz/chromium');

      const puppeteerModule =
        await import('puppeteer-core');

      chromium =
        chromiumModule.default ||
        chromiumModule;

      puppeteer =
        puppeteerModule.default ||
        puppeteerModule;
    } catch (error) {
      console.error(
        'Browser import error:',
        error
      );

      return response.status(500).json({
        ok: false,
        stage: 'browser-import',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    // -------------------------------------------------------
    // 8. Render product
    // -------------------------------------------------------

    let html;

    try {
      html = await renderPage({
        url: pageUrl,
        chromium,
        puppeteer,
      });
    } catch (error) {
      console.error(
        'Browser rendering error:',
        error
      );

      return response.status(500).json({
        ok: false,
        stage: 'browser-render',
        error:
          error instanceof Error
            ? error.message
            : String(error),
      });
    }

    // -------------------------------------------------------
    // 9. Reject middleware/debug responses
    // -------------------------------------------------------

    if (
      html.trim() ===
      'MIDDLEWARE IS RUNNING'
    ) {
      console.error(
        'Middleware intercepted Puppeteer request.'
      );

      return response.status(500).json({
        ok: false,
        stage: 'middleware-interception',
        error:
          'Middleware returned its debug response instead of the product page.',
      });
    }

    // -------------------------------------------------------
    // 10. Validate rendered HTML
    // -------------------------------------------------------

    if (
      !html ||
      typeof html !== 'string' ||
      html.length < 500
    ) {
      console.error(
        'Invalid rendered HTML length:',
        html?.length || 0
      );

      return response.status(500).json({
        ok: false,
        stage: 'invalid-render',
        error:
          'Rendered HTML is empty or unexpectedly small.',
        length: html?.length || 0,
      });
    }

    // -------------------------------------------------------
    // 11. Save to Redis
    // -------------------------------------------------------

    try {
      await setCachedRender(
        CACHE_TYPE,
        productId,
        html,
        currentUpdatedAt
      );
    } catch (error) {
      // HTML is already valid, so cache failure
      // should not turn the request into a 500.
      console.error(
        'Redis write error:',
        error
      );
    }

    // -------------------------------------------------------
    // 12. Return HTML
    // -------------------------------------------------------

    response.setHeader(
      'Content-Type',
      'text/html; charset=utf-8'
    );

    response.setHeader(
      'X-Render-Cache',
      'MISS'
    );

    response.setHeader(
      'Cache-Control',
      'private, no-store, max-age=0'
    );

    return response
      .status(200)
      .send(html);

  } catch (error) {
    console.error(
      'Unexpected product renderer error:',
      error
    );

    return response.status(500).json({
      ok: false,
      stage: 'unexpected',
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}


// ===========================================================
// Puppeteer renderer
// ===========================================================

async function renderPage({
  url,
  chromium,
  puppeteer,
}) {
  let browser;

  try {
    const isVercel =
      Boolean(process.env.VERCEL);

    // -------------------------------------------------------
    // Launch browser
    // -------------------------------------------------------

    if (isVercel) {
      const executablePath =
        await chromium.executablePath();

      browser = await puppeteer.launch({
        args: [
          ...chromium.args,
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        executablePath,
        headless: chromium.headless,
      });
    } else {
      const executablePath =
        process.env.LOCAL_CHROME_PATH ||
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

      browser = await puppeteer.launch({
        executablePath,
        headless: true,
      });
    }

    // -------------------------------------------------------
    // New page
    // -------------------------------------------------------

    const page =
      await browser.newPage();

    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
    });

    // Important:
    // This is NOT a crawler User-Agent.
    // Therefore middleware lets /product/:id continue
    // to the real React application.
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0.0.0 Safari/537.36'
    );

    // Prevent cached browser resources from interfering
    // with rendering.
    await page.setCacheEnabled(false);

    try {
      await page.setBypassServiceWorker(
        true
      );
    } catch {
      // Safe fallback for Puppeteer versions
      // without this method.
    }

    // -------------------------------------------------------
    // Browser diagnostics
    // -------------------------------------------------------

    page.on(
      'console',
      (message) => {
        console.log(
          `[browser:${message.type()}]`,
          message.text()
        );
      }
    );

    page.on(
      'pageerror',
      (error) => {
        console.error(
          '[browser:pageerror]',
          error
        );
      }
    );

    page.on(
      'requestfailed',
      (request) => {
        console.error(
          '[browser:requestfailed]',
          request.url(),
          request.failure()?.errorText
        );
      }
    );

    // -------------------------------------------------------
    // Navigate to actual product page
    // -------------------------------------------------------

    const navigationResponse =
      await page.goto(
        url,
        {
          waitUntil: 'networkidle0',
          timeout: 30000,
        }
      );

    console.log(
      'Navigation status:',
      navigationResponse?.status()
    );

    console.log(
      'Final URL:',
      page.url()
    );

    // -------------------------------------------------------
    // Allow React to finish rendering
    // -------------------------------------------------------

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 1500)
    );

    // -------------------------------------------------------
    // Capture final DOM
    // -------------------------------------------------------

    const html =
      await page.content();

    console.log(
      'Rendered HTML length:',
      html.length
    );

    console.log(
      'Rendered title:',
      await page.title()
    );

    return html;

  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error(
          'Browser close error:',
          error
        );
      }
    }
  }
}

