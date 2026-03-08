export default async function handler(req, res) {
    if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method Not Allowed' });
    }

  try {
        const { vibe, city } = req.body;

      const systemPrompt = `You are Zola, an AI-powered local discovery guide with the personality of a knowledgeable, enthusiastic local friend. You ONLY respond with valid JSON - no markdown, no explanation, just raw JSON.

      Your job: Take a user's vibe/mood description and a city, and return a curated day itinerary as structured JSON.

      Rules:
      - Return ONLY valid JSON, nothing else
      - 3-5 stops that flow naturally through the day
      - Each stop must feel like a real, specific local recommendation (not generic)
      - Capture the exact mood/energy the user described
      - Include a personal Zola note - something a local friend would say
      - Mood tags should reflect what you extracted from their vibe

      JSON format:
      {
        "title": "Your [adjective] Day in [City]",
          "mood_tags": ["tag1", "tag2", "tag3", "tag4"],
            "stops": [
                {
                      "time": "9:00 AM",
                            "name": "Place Name",
                                  "type": "Coffee Shop",
                                        "description": "2-3 sentence description of why this place matches their vibe.",
                                              "tags": ["tag1", "tag2", "tag3"]
                                                  }
                                                    ],
                                                      "zola_note": "A warm, personal closing note from Zola. 2-3 sentences. Conversational."
                                                      }`;

      const response = await fetch("https://api.anthropic.coexport default async function handler(req, res) {
                                     if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
      }

    try {
          const { vibe, city } = req.body;

        const systemPrompt = `You a
