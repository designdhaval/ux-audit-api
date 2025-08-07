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
You are a UX expert AI trained on thousands of real-world heuristic evaluations.

Perform a heuristic UX audit for this website: ${url}

Respond in the following raw JSON format:
{
  "usabilityScore": [number between 0-100],
  "issues": ["List of major UX issues"],
  "recommendations": ["List of specific improvement suggestions"]
}

Do not add any extra commentary, only return raw valid JSON.
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // ✅ Fallback to available model
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
