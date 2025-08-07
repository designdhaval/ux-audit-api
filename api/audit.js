export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing URL' });
  }

  // Simulated audit result
  return res.status(200).json({
    usabilityScore: 76,
    issues: [
      "Poor contrast on CTA button",
      "Confusing navigation labels",
      "Missing alt text for images"
    ],
    recommendations: [
      "Increase color contrast for accessibility",
      "Use clearer, action-based menu labels",
      "Add descriptive alt text to all images"
    ]
  });
}
