export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { vibe, city } = req.body;

    // ── STEP 1: Claude interprets the vibe into search queries ──
    const interpretPrompt = `You are Zola, an AI local discovery guide. A user has described their vibe for ${city}.

Vibe: "${vibe}"

Extract 3-5 specific place search queries from this vibe. Each query should be a Google Places search term.
Also extract mood tags and a title.

Respond ONLY with valid JSON, no markdown:
{
  "title": "Your [adjective] Day in [City]",
  "mood_tags": ["tag1", "tag2", "tag3"],
  "searches": [
    { "query": "cozy coffee shop", "time": "9:00 AM", "vibe_note": "why this fits their mood" },
    { "query": "best tacos", "time": "12:30 PM", "vibe_note": "why this fits their mood" }
  ],
  "zola_note": "A warm, personal closing note like advice from a local friend. 2-3 sentences."
}`;

    const interpretRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        messages: [{ role: "user", content: interpretPrompt }]
      })
    });

    const interpretData = await interpretRes.json();
    if (!interpretRes.ok) throw new Error(interpretData.error?.message || 'Claude API error');

    const rawInterpret = interpretData.content.map(b => b.text || '').join('');
    const cleanInterpret = rawInterpret.replace(/```json|```/g, '').trim();
    const interpreted = JSON.parse(cleanInterpret);

    // ── STEP 2: Search Google Places for each query ──
    const placesKey = process.env.GOOGLE_PLACES_API_KEY;
    const stops = [];

    for (const search of (interpreted.searches || []).slice(0, 5)) {
      try {
        const searchQuery = `${search.query} in ${city}`;
        const placesUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${placesKey}`;

        const placesRes = await fetch(placesUrl);
        const placesData = await placesRes.json();

        if (placesData.results && placesData.results.length > 0) {
          const place = placesData.results[0];

          // Get details for the top result
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,rating,formatted_address,opening_hours,price_level,editorial_summary,types,website&key=${placesKey}`;
          const detailsRes = await fetch(detailsUrl);
          const detailsData = await detailsRes.json();
          const details = detailsData.result || {};

          const priceLevel = ['', '$', '$$', '$$$', '$$$$'][details.price_level] || '';
          const isOpen = details.opening_hours?.open_now;
          const openStatus = isOpen === true ? '🟢 Open now' : isOpen === false ? '🔴 Closed now' : '';
          const summary = details.editorial_summary?.overview || '';

          stops.push({
            time: search.time,
            name: details.name || place.name,
            type: formatType(details.types || place.types || []),
            description: summary || search.vibe_note,
            address: details.formatted_address || place.formatted_address || '',
            rating: details.rating || place.rating || null,
            price: priceLevel,
            open_status: openStatus,
            tags: buildTags(details, search),
            place_id: place.place_id
          });
        } else {
          stops.push({
            time: search.time,
            name: search.query,
            type: 'Local Spot',
            description: search.vibe_note,
            tags: ['📍 Local Pick']
          });
        }
      } catch (placeErr) {
        console.error('Place search error:', placeErr.message);
      }
    }

    // ── STEP 3: Return assembled itinerary ──
    return res.status(200).json({
      title: interpreted.title,
      mood_tags: interpreted.mood_tags,
      stops,
      zola_note: interpreted.zola_note
    });

  } catch (err) {
    console.error('Zola error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function formatType(types) {
  const typeMap = {
    restaurant: '🍽️ Restaurant',
    cafe: '☕ Café',
    bar: '🍸 Bar',
    night_club: '🎵 Nightlife',
    museum: '🏛️ Museum',
    art_gallery: '🎨 Art Gallery',
    park: '🌿 Park',
    shopping_mall: '🛍️ Shopping',
    store: '🛍️ Shop',
    gym: '💪 Fitness',
    spa: '💆 Spa',
    movie_theater: '🎬 Cinema',
    book_store: '📚 Bookstore',
    bakery: '🥐 Bakery',
    food: '🍴 Food',
    tourist_attraction: '⭐ Attraction',
    point_of_interest: '📍 Local Spot'
  };
  for (const t of types) {
    if (typeMap[t]) return typeMap[t];
  }
  return '📍 Local Spot';
}

function buildTags(details, search) {
  const tags = [];
  if (details.rating >= 4.5) tags.push('⭐ Top Rated');
  if (details.price_level === 1) tags.push('💰 Budget Friendly');
  if (details.price_level >= 3) tags.push('✨ Upscale');
  if (details.opening_hours?.open_now) tags.push('🟢 Open Now');
  tags.push('📍 Real Spot');
  return tags.slice(0, 3);
}
