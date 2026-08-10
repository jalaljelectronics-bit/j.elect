export default function handler(request, response) {
  const { id } = request.query;

  return response.status(200).json({
    ok: true,
    message: 'PRODUCT_RENDER_FUNCTION_WORKS',
    id,
    url: request.url
  });
}