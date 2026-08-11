// frontend/api/render/project/[id].js
//
// Server-side project renderer for Vercel.
//
// Request:
//   /api/render/project/31
//
// Flow:
//   1. Validate project ID.
//   2. Fetch project from backend.
//   3. Check Redis.
//   4. Launch Chromium.
//   5. Load the real React project page.
//   6. Capture rendered HTML.
//   7. Cache the HTML.
//   8. Return HTML.
//
// Mirrors api/render/product/[id].js exactly — same flow, same
// error-stage reporting shape, same cache-failure-is-non-fatal
// behavior. Only the backend endpoint, cache namespace, and
// site path differ.
//
// Redis namespace is "project-v2" (parallel to "product-v2") so
// it never collides with the product cache keyspace.

export const config = {
  maxDuration: 60,
};

const SITE_ORIGIN =
  process.env.SITE_ORIGIN ||
  'https://www.jelectronics.store';

const CACHE_TYPE = 'project-v2';

export default async function handler(request, response) {
  const { id } = request.query;

  // ---------------------------------------------------------
  // 1. Validate ID
  // ---------------------------------------------------------

  if (!id || Array.isArray(id)) {
    return response.status(400).json({
      ok: false,
      error: 'Invalid project ID',
    });
  }

  const projectId = String(id);

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
    // 4. Fetch project from backend
    // -------------------------------------------------------

    const cleanBackendUrl =
      backendUrl.replace(/\/+$/, '');

    // NOTE: confirm this matches the actual backend route —
    // written to mirror /api/products/:id. If projectController
    // exposes a different path (e.g. /api/projects/:id/detail,
    // or getProjectById is mounted elsewhere), update this line.
    const projectApiUrl =
      `${cleanBackendUrl}/api/projects/${encodeURIComponent(projectId)}`;

    console.log(
      'Fetching project:',
      projectApiUrl
    );

    let projectResponse;

    try {
      projectResponse = await fetch(
        projectApiUrl,
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

    if (!projectResponse.ok) {
      console.error(
        'Backend status:',
        projectResponse.status
      );

      return response.status(
        projectResponse.status === 404
          ? 404
          : 502
      ).json({
        ok: false,
        stage: 'backend-response',
        status: projectResponse.status,
        error:
          projectResponse.status === 404
            ? 'Project not found'
            : 'Backend request failed',
      });
    }

    let projectPayload;

    try {
      projectPayload =
        await projectResponse.json();
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

    // getProjectById in the frontend service returns { project },
    // per ProjectDetail.jsx's `res.project` usage — unwrap the
    // same way here so currentUpdatedAt reads from the right shape.
    const project =
      projectPayload?.project ?? projectPayload;

    const currentUpdatedAt =
      project?.updatedAt ??
      project?.updated_at ??
      null;

    // -------------------------------------------------------
    // 5. Redis cache lookup
    // -------------------------------------------------------

    try {
      const cachedHtml =
        await getCachedRender(
          CACHE_TYPE,
          projectId,
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
    // 6. Build real project URL
    // -------------------------------------------------------

    const siteOrigin =
      SITE_ORIGIN.replace(/\/+$/, '');

    const pageUrl =
      `${siteOrigin}/project/${encodeURIComponent(projectId)}`;

    console.log(
      'Rendering project:',
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
    // 8. Render project
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
          'Middleware returned its debug response instead of the project page.',
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
        projectId,
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
      'Unexpected project renderer error:',
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
// Puppeteer renderer (identical to product renderer)
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
    // Therefore middleware lets /project/:id continue
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
    // Navigate to actual project page
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