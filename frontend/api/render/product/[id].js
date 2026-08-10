// frontend/api/render/product/[id].js

export const config = {
  maxDuration: 60,
};

const SITE_ORIGIN =
  process.env.SITE_ORIGIN || 'https://www.jelectronics.store';

export default async function handler(request, response) {
  const { id } = request.query;

  // ---------------------------------------------------------
  // 1. Validate product ID
  // ---------------------------------------------------------
  if (!id || Array.isArray(id)) {
    return response.status(400).json({
      ok: false,
      error: 'Invalid product ID',
    });
  }

  const productId = String(id);

  // ---------------------------------------------------------
  // 2. Validate backend configuration
  // ---------------------------------------------------------
  const backendUrl = process.env.BACKEND_API_URL;

  if (!backendUrl) {
    console.error('BACKEND_API_URL is missing');

    return response.status(500).json({
      ok: false,
      error: 'BACKEND_API_URL is not configured',
    });
  }

  try {
    // -------------------------------------------------------
    // 3. Dynamically load Redis
    // -------------------------------------------------------
    let getCachedRender;
    let setCachedRender;

    try {
      const redis = await import('../../../lib/redis.js');

      getCachedRender = redis.getCachedRender;
      setCachedRender = redis.setCachedRender;

      if (
        typeof getCachedRender !== 'function' ||
        typeof setCachedRender !== 'function'
      ) {
        throw new Error(
          'redis.js does not export getCachedRender/setCachedRender'
        );
      }
    } catch (error) {
      console.error('Redis module error:', error);

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
    // 4. Get current product from backend
    // -------------------------------------------------------
    const productApiUrl =
      `${backendUrl.replace(/\/+$/, '')}/api/products/${encodeURIComponent(productId)}`;

    console.log(`Fetching product: ${productApiUrl}`);

    let productResponse;

    try {
      productResponse = await fetch(productApiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
      });
    } catch (error) {
      console.error('Backend connection error:', error);

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
        `Backend returned ${productResponse.status}`
      );

      return response.status(
        productResponse.status === 404 ? 404 : 502
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
      product = await productResponse.json();
    } catch (error) {
      console.error('Invalid backend JSON:', error);

      return response.status(502).json({
        ok: false,
        stage: 'backend-json',
        error: 'Backend returned invalid JSON',
      });
    }

    const currentUpdatedAt =
      product?.updatedAt ??
      product?.updated_at ??
      null;

    // -------------------------------------------------------
    // 5. Check Redis cache
    // -------------------------------------------------------
    try {
      const cachedHtml = await getCachedRender(
        'product',
        productId,
        currentUpdatedAt
      );

      if (cachedHtml) {
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

        return response.status(200).send(cachedHtml);
      }
    } catch (error) {
      // Redis failure should not prevent rendering.
      // We continue with a cache miss.
      console.error(
        'Redis read error. Continuing without cache:',
        error
      );
    }

    // -------------------------------------------------------
    // 6. Build product page URL
    // -------------------------------------------------------
    const pageUrl =
      `${SITE_ORIGIN.replace(/\/+$/, '')}/product/${encodeURIComponent(productId)}`;

    console.log(`Rendering product page: ${pageUrl}`);

    // -------------------------------------------------------
    // 7. Dynamically load Chromium + Puppeteer
    // -------------------------------------------------------
    let chromium;
    let puppeteer;

    try {
      const chromiumModule =
        await import('@sparticuz/chromium');

      const puppeteerModule =
        await import('puppeteer-core');

      chromium =
        chromiumModule.default || chromiumModule;

      puppeteer =
        puppeteerModule.default || puppeteerModule;

    } catch (error) {
      console.error(
        'Chromium/Puppeteer import error:',
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
    // 8. Render page
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

    if (!html || html.length < 100) {
      console.error(
        `Renderer returned suspicious HTML length: ${
          html?.length || 0
        }`
      );

      return response.status(500).json({
        ok: false,
        stage: 'browser-render',
        error: 'Renderer returned empty or invalid HTML',
      });
    }

    // -------------------------------------------------------
    // 9. Save rendered HTML to Redis
    // -------------------------------------------------------
    try {
      await setCachedRender(
        'product',
        productId,
        html,
        currentUpdatedAt
      );
    } catch (error) {
      // Cache write failure should not destroy
      // an otherwise successful render.
      console.error(
        'Redis write error. Returning rendered HTML:',
        error
      );
    }

    // -------------------------------------------------------
    // 10. Return rendered HTML
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

    return response.status(200).send(html);
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


// =========================================================
// Browser renderer
// =========================================================

async function renderPage({
  url,
  chromium,
  puppeteer,
}) {
  const isVercel = Boolean(process.env.VERCEL);

  let browser;

  try {
    // -------------------------------------------------------
    // Local development
    // -------------------------------------------------------
    if (!isVercel) {
      const executablePath =
        process.env.LOCAL_CHROME_PATH ||
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

      browser = await puppeteer.launch({
        executablePath,
        headless: true,
      });
    }

    // -------------------------------------------------------
    // Vercel
    // -------------------------------------------------------
    else {
      const executablePath =
        await chromium.executablePath();

      browser = await puppeteer.launch({
        args: chromium.args,
        executablePath,
        headless: chromium.headless,
      });
    }

    const page = await browser.newPage();

    // -------------------------------------------------------
    // Browser settings
    // -------------------------------------------------------
    await page.setViewport({
      width: 1366,
      height: 768,
      deviceScaleFactor: 1,
    });

    await page.setUserAgent(
      'Mozilla/5.0 (compatible; JElectronicsRenderer/1.0)'
    );

    // -------------------------------------------------------
    // Navigate
    // -------------------------------------------------------
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // -------------------------------------------------------
    // Give React a moment to finish state updates
    // -------------------------------------------------------
    await new Promise((resolve) =>
      setTimeout(resolve, 1000)
    );

    // -------------------------------------------------------
    // Get final rendered HTML
    // -------------------------------------------------------
    const html = await page.content();

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