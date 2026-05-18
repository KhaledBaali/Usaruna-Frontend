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

export async function enhanceDescription(description, lang = 'en') {
  const res = await fetch(`${AI_BASE}/enhance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description, lang }),
  });
  if (!res.ok) throw new Error('AI enhance failed');
  const { enhanced_description } = await res.json();
  return enhanced_description;
}

export async function getSmartReply({ product_name, product_description, product_details, customer_name, review_text }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${AI_BASE}/smart-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_name, product_description, product_details, customer_name, review_text }),
      signal: controller.signal,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(`AI smart-reply ${res.status}: ${JSON.stringify(body)}`);
    }
    const { suggested_reply } = await res.json();
    return suggested_reply;
  } finally {
    clearTimeout(timeout);
  }
}
