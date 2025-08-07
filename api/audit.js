import axios from 'axios';
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
    // Fetch website HTML with a browser-like User-Agent
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    const htmlContent = response.data;

    const prompt = `
You are a UX expert AI. Analyze the following HTML and provide:
1. A usability score out of 100
2. A list of major UX issues (bullet points)
3. A list of recommendations to fix those issues

HTML:
${htmlContent}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    });

    const resultText = completion.choices[0].message.content;

    // Extract UX insights using regex
    const usabilityScoreMatch = resultText.match(/usability score.*?(\d{1,3})/i);
    const issuesMatch = resultText.match(/issues:\s*([\s\S]*?)recommendations:/i);
    const recommendationsMatch = resultText.match(/recommendations:\s*([\s\S]*)/i);

    const usabilityScore = usabilityScoreMatch ? parseInt(usabilityScoreMatch[1]) : null;
    const issues = issuesMatch
      ? issuesMatch[1].trim().split('\n').filter(Boolean).map(i => i.replace(/^[-•]\s*/, ''))
      : [];
    const recommendations = recommendationsMatch
      ? recommendationsMatch[1].trim().split('\n').filter(Boolean).map(r => r.replace(/^[-•]\s*/, ''))
      : [];

    if (!usabilityScore || issues.length === 0 || recommendations.length === 0) {
      throw new Error('Incomplete response from OpenAI');
    }

    res.status(200).json({
      usabilityScore,
      issues,
      recommendations
    });

  } catch (error) {
    console.error('💥 FULL ERROR STACK:', error); // Logs everything in Vercel dashboard
    res.status(500).json({
      error: 'Failed to audit URL. Please check the input or try again later.',
      message: error.message // This helps us debug directly in curl
    });
  }
}
