export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ref, maxwidth = '600' } = req.query;

  if (!ref) {
    return res.status(400).json({ error: 'Missing photo reference' });
  }

  // Google photo references are base64url strings — reject anything else
  if (!/^[A-Za-z0-9_\-]+$/.test(ref)) {
    return res.status(400).json({ error: 'Invalid photo reference' });
  }

  const width = Math.min(parseInt(maxwidth, 10) || 600, 1600);
  const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
  const url = 'https://maps.googleapis.com/maps/api/place/photo?photo_reference=' + ref + '&maxwidth=' + width + '&key=' + PLACES_KEY;

  try {
    const response = await fetch(url);
    if (!response.ok) return res.status(response.status).end();

    const contentType = response.headers.get('content-type');
    if (contentType) res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    const buffer = await response.arrayBuffer();
    return res.status(200).send(Buffer.from(buffer));
  } catch (err) {
    return res.status(502).json({ error: 'Photo fetch failed' });
  }
}
