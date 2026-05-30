export default async function handler(req, res) {

  // ── GEOCODING — GET request for GPS → city name ──
  if (req.method === 'GET' && req.query.geocode) {
    try {
      const { lat, lng } = req.query;
      if (!lat || !lng) return res.status(400).json({ error: 'Missing lat/lng' });
      const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;
      const geoRes = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${PLACES_KEY}`
      );
      const geoData = await geoRes.json();
      return res.status(200).json(geoData);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { vibe, city } = req.body;

    if (!vibe || !city) {
      return res.status(400).json({ error: 'Missing vibe or city' });
    }

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
    const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY;

    // ── GEOCODE CITY → lat/lng to pin Places results ──
    let locationParam = '';
    try {
      const geoUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(city) + '&key=' + PLACES_KEY;
      const geoResp = await fetch(geoUrl);
      const geoJson = await geoResp.json();
      if (geoJson.results && geoJson.results.length > 0) {
        const loc = geoJson.results[0].geometry.location;
        locationParam = '&location=' + loc.lat + ',' + loc.lng + '&radius=50000';
      }
    } catch (geoErr) {
      console.error('Geocoding error:', geoErr.message);
    }

    // ── STEP 1: Claude interprets vibe into search queries ──
    const systemPrompt = `You are Olli, an AI-powered local discovery guide. You ONLY respond with valid JSON — no markdown, no explanation, just raw JSON.

Your job: Take a user's vibe and city, return 3-5 specific search queries to find the best matching places on Google Maps.

Rules:
- Return ONLY valid JSON, nothing else
- Each query should find ONE specific type of place matching the vibe
- Queries should be specific enough to find great matches (e.g. "cozy indie coffee shop Austin TX" not just "coffee Austin")
- Include a suggested time and type label for each stop
- Also return a day title and mood tags

JSON format:
{
  "title": "Your [adjective] Day in [City]",
  "mood_tags": ["tag1", "tag2", "tag3", "tag4"],
  "queries": [
    {
      "query": "specific google maps search query",
      "time": "9:00 AM",
      "type": "Coffee Shop",
      "olli_pick_reason": "one sentence why this type of place fits the vibe"
    }
  ],
  "olli_note": "A warm, personal closing note from Olli — like advice from a local friend. 2-3 sentences. Conversational."
}

FOUNDER MANDATE: Olli is a local expert, not a search engine. Strictly avoid national chains, fast food franchises, or generic tourist traps (no Starbucks, McDonald's, Olive Garden, or TripAdvisor top-10 clichés). Prioritize independent, high-character, highly-rated local venues that represent the authentic soul of the city. Every recommendation should feel like it came from a well-traveled local friend who knows the hidden gems — not from a guidebook.`;

    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{ role: "user", content: `City: ${city}\nVibe: ${vibe}` }]
      })
    });

    const claudeData = await claudeRes.json();
    if (!claudeRes.ok) throw new Error(claudeData.error?.message || 'Claude API error');

    const raw = claudeData.content.map(b => b.text || '').join('');
    const clean = raw.replace(/```json|```/g, '').trim();
    const plan = JSON.parse(clean);

    // ── STEP 2: Google Places — find best match for each query ──
    const stops = [];

    for (const item of plan.queries) {
      try {
        // Text Search to find candidates
        const searchUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + encodeURIComponent(item.query) + locationParam + '&key=' + PLACES_KEY;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();

        // Pick best result: highest rating with enough reviews (not just first)
        const candidates = (searchData.results || []).slice(0, 5);
        let best = candidates[0];
        for (const c of candidates) {
          const score = (c.rating || 0) + Math.min((c.user_ratings_total || 0) / 500, 1);
          const bestScore = (best?.rating || 0) + Math.min((best?.user_ratings_total || 0) / 500, 1);
          if (score > bestScore) best = c;
        }

        if (!best) continue;

        // Place Details for photos, hours, website
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${best.place_id}&fields=name,rating,formatted_address,opening_hours,photos,price_level,editorial_summary,url,user_ratings_total,geometry&key=${PLACES_KEY}`;
        const detailsRes = await fetch(detailsUrl);
        const detailsData = await detailsRes.json();
        const place = detailsData.result || {};

        // Build photo URL — proxied through /api/photo so the key never reaches the client
        let photoUrl = null;
        if (place.photos && place.photos.length > 0) {
          const ref = place.photos[0].photo_reference;
          photoUrl = '/api/photo?ref=' + ref + '&maxwidth=600';
        }

        // Open/closed status
        const isOpen = place.opening_hours?.open_now;
        const openStatus = isOpen === true ? 'open' : isOpen === false ? 'closed' : 'unknown';

        // Google Maps deep link
        const mapsUrl = place.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + (place.formatted_address || ''))}`;

        // Coords for map pins
        const lat = place.geometry?.location?.lat || null;
        const lng = place.geometry?.location?.lng || null;

        stops.push({
          time: item.time,
          name: place.name || best.name,
          type: item.type,
          description: place.editorial_summary?.overview || item.olli_pick_reason || '',
          rating: place.rating || best.rating || null,
          user_ratings_total: place.user_ratings_total || best.user_ratings_total || 0,
          price_level: place.price_level ?? best.price_level ?? null,
          address: place.formatted_address || best.formatted_address || '',
          open_status: openStatus,
          photo_url: photoUrl,
          maps_url: mapsUrl,
          lat,
          lng,
          tags: [item.type, openStatus === 'open' ? '✅ Open now' : openStatus === 'closed' ? '⛔ Closed' : '🕐 Check hours']
        });

      } catch (e) {
        console.error('Places error for query:', item.query, e.message);
      }
    }

    return res.status(200).json({
      title: plan.title,
      mood_tags: plan.mood_tags,
      stops,
      olli_note: plan.olli_note
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
