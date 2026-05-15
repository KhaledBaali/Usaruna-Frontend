const AI_BASE = 'https://usaruna-ai.onrender.com';

export async function summarizeReviews(reviews, lang = 'en') {
  const res = await fetch(`${AI_BASE}/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reviews, lang }),
  });
  if (!res.ok) throw new Error('AI summarize failed');
  const { summary } = await res.json();
  return summary;
}

export async function enhanceDescription(description) {
  const res = await fetch(`${AI_BASE}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!res.ok) throw new Error('AI enhance failed');
  const { enhanced_description } = await res.json();
  return enhanced_description;
}

export async function getSmartReply({ product_name, product_description, product_details, customer_name, review_text }) {
  const res = await fetch(`${AI_BASE}/smart-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product_name, product_description, product_details, customer_name, review_text }),
  });
  if (!res.ok) throw new Error('AI smart-reply failed');
  const { suggested_reply } = await res.json();
  return suggested_reply;
}
