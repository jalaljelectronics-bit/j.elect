export default function handler(request, response) {
  console.log('RENDER FUNCTION HIT');
  console.log('query:', request.query);
  console.log('url:', request.url);

  return response.status(200).json({
    ok: true,
    message: 'RENDER_FUNCTION_WORKS',
    query: request.query,
    url: request.url
  });
}