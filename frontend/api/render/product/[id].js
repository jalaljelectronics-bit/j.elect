export default async function handler(request, response) {
  const { id } = request.query;

  try {
    if (!id) {
      return response.status(400).json({
        ok: false,
        stage: 'request',
        error: 'Missing product ID'
      });
    }

    const result = {
      ok: true,
      stage: 'handler',
      id,
      vercel: Boolean(process.env.VERCEL),
      node: process.version,
      backendConfigured: Boolean(process.env.BACKEND_API_URL),
      siteOrigin: process.env.SITE_ORIGIN || 'default'
    };

    return response.status(200).json(result);
  } catch (error) {
    return response.status(500).json({
      ok: false,
      stage: 'handler-catch',
      error: error?.message || String(error),
      stack: error?.stack || null
    });
  }
}