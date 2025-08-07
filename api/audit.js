import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  try {
    // 1. Fetch the raw HTML of the target URL
    const response = await axios.get(url);
    const html = response.data;

    // 2. Use OpenAI to analyze the HTML
    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are a UX expert. Analyze the HTML of a website and return a JSON response with a usabilityScore (out of 100), issues (array of 3 UX issues), and recommendations (array of 3 UX improvements).'
          },
          {
            role: 'user',
            content: `Here is the HTML:\n\n${html}`
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // 3. Extract GPT's reply and try to parse it
    const reply = openaiResponse.data.choices[0].message.content;

    // Try to parse JSON block from GPT's response
    const jsonStart = reply.indexOf('{');
    const jsonEnd = reply.lastIndexOf('}');
    const jsonString = reply.slice(jsonStart, jsonEnd + 1);

    const auditResult = JSON.parse(jsonString);

    res.status(200).json(auditResult);
  } catch (error) {
    console.error('Error auditing URL:', error.message);

    res.status(500).json({
      error: 'Failed to audit URL. Please check the input or try again later.'
    });
  }
}
