import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing URL' });
  }

  try {
    const prompt = `
You are a UX expert AI trained on thousands of heuristics, usability principles, and real-world audits.

Perform a heuristic UX audit of this website: ${url}

Return the following in JSON format:
{
  "usabilityScore": [0-100],
  "issues": ["..."],
  "recommendations": ["..."]
}

Only respond in raw JSON. Do not add any explanation or headings.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const json = completion.choices[0].message.content.trim();

    const result = JSON.parse(json);

    res.status(200).json(result);
  } catch (error) {
    console.error('💥 Audit Error:', error);
    res.status(500).json({
      error: 'Failed to run heuristic audit. Please try again.',
      message: error.message
    });
  }
}
