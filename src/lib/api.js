import { supabase } from '../supabase';
import { detectLang, parseDeliveryTypes, toWebP } from './utils';

// ── Category visual maps (slug-based + id-based fallback) ──────────────────────
const CATEGORY_EMOJI = { food:'🍛', sweets:'🍰', frozen:'❄️', spices:'🌿', crafts:'🧶' };
const CATEGORY_GRADIENT = {
  food:'from-amber-50 to-orange-100', sweets:'from-pink-50 to-rose-100',
  frozen:'from-sky-50 to-blue-100',  spices:'from-green-50 to-emerald-100',
  crafts:'from-violet-50 to-purple-100',
};
const CATEGORY_EMOJI_BY_ID     = { 1:'🍛', 2:'🍰', 4:'❄️', 5:'🌿', 3:'🧶' };
const CATEGORY_GRADIENT_BY_ID  = {
  1:'from-amber-50 to-orange-100', 2:'from-pink-50 to-rose-100',
  3:'from-sky-50 to-blue-100',     4:'from-green-50 to-emerald-100',
  5:'from-violet-50 to-purple-100',
};
const CATEGORY_SLUG_BY_ID = { 1: 'food', 2: 'sweets', 4: 'frozen', 5: 'spices', 3: 'crafts' };
const DEFAULT_GRADIENT = 'from-blue-50 to-indigo-100';


// ── Normalise a Supabase product row into the UI shape ────────────────────────
function normaliseProduct(row) {
  if (!row) return null;
  const p       = row.producer_profiles;
  const catId   = row.category_id;
  const catSlug = row.category?.slug ?? CATEGORY_SLUG_BY_ID[catId] ?? '';

  const emoji    = CATEGORY_EMOJI[catSlug]    ?? CATEGORY_EMOJI_BY_ID[catId]    ?? row.emoji    ?? '📦';
  const gradient = CATEGORY_GRADIENT[catSlug] ?? CATEGORY_GRADIENT_BY_ID[catId] ?? row.gradient ?? DEFAULT_GRADIENT;

  const sellerCityAr = row.cities?.name_ar ?? p?.city_ar ?? p?.city ?? row.sellerCity ?? null;
  const sellerCityEn = row.cities?.name_en ?? p?.city_en ?? row.sellerCityEn ?? sellerCityAr;

  const deliveryTypes = parseDeliveryTypes(row.delivery_type, row.is_perishable);

  const sizes = (Array.isArray(row.sizes) ? row.sizes : []).map((s, i) => ({
    id:       i,
    label:    s.label_ar  ?? s.label   ?? '',
    labelEn:  s.label_en  ?? s.labelEn ?? s.label_ar ?? s.label ?? '',
    priceAdj: s.price_adj ?? s.priceAdj ?? 0,
  }));

  const colors = (Array.isArray(row.colors) ? row.colors : []).map((c, i) => ({
    id:      i,
    label:   c.label_ar  ?? c.label   ?? '',
    labelEn: c.label_en  ?? c.labelEn ?? c.label_ar ?? c.label ?? '',
    hex:     c.hex ?? '#000000',
  }));

  // Multiple images: use images JSONB array; fall back to single image_url
  // Keep original URLs — toWebP render endpoint requires Supabase Pro
  const imagesArr = (() => {
    if (Array.isArray(row.images) && row.images.length) return row.images;
    try {
      const parsed = JSON.parse(row.images ?? '[]');
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch { /* ignore */ }
    return row.image_url ? [row.image_url] : [];
  })();

  return {
    ...row,
    category:      catSlug,
    name:          row.name_ar        ?? row.name,
    nameEn:        row.name_en        ?? row.nameEn        ?? row.name_ar ?? row.name,
    description:   row.description_ar ?? row.description,
    descriptionEn: row.description_en ?? row.descriptionEn,
    image:         row.image_url ?? row.image,
    images:        imagesArr,
    isPerishable:  row.is_perishable  ?? row.isPerishable  ?? false,
    gradient,
    emoji,
    family:        p?.business_name_ar ?? p?.name_ar ?? row.family,
    familyEn:      p?.business_name_en ?? p?.name_en ?? row.familyEn,
    sellerCity:            sellerCityAr,
    sellerCityEn:          sellerCityEn,
    sellerLocationLat:     p?.location_lat     ?? null,
    sellerLocationLng:     p?.location_lng     ?? null,
    sellerLocationAddress: p?.location_address ?? null,
    whatsapp:      p?.whatsapp       ?? row.whatsapp,
    sellerPhone:   p?.phone          ?? null,
    sellerEmail:   p?.email          ?? null,
    partnerSince:  p?.partner_since  ?? row.partnerSince,
    weight:        row.weight        ?? null,
    prepTime:      row.prep_time     ?? null,
    isReturnable:  row.is_returnable ?? false,
    rating:        row.rating        ?? 0,
    reviews:       row.reviews       ?? 0,
    deliveryTypes,
    sizes,
    colors,
    producerUserId:   p?.user_id ?? null,
    producerProfileId: p?.id     ?? null,
  };
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function fetchProducts() {
  try {
    const [{ data: products, error }, { data: reviewStats }] = await Promise.all([
      supabase
        .from('products')
        .select('*, producer_profiles(*), cities(*)')
        .eq('is_active', true)
        .gt('stock', 0),
      supabase
        .from('reviews')
        .select('product_id, rating'),
    ]);
    if (error) throw error;

    // Build per-product rating map from reviews
    const ratingMap = {};
    for (const r of (reviewStats ?? [])) {
      if (!ratingMap[r.product_id]) ratingMap[r.product_id] = { sum: 0, count: 0 };
      ratingMap[r.product_id].sum   += r.rating;
      ratingMap[r.product_id].count += 1;
    }

    return products.map((row) => {
      const stats = ratingMap[row.id];
      return normaliseProduct({
        ...row,
        rating:  stats ? stats.sum / stats.count : 0,
        reviews: stats ? stats.count             : 0,
      });
    });
  } catch (err) {
    console.warn('[api] fetchProducts failed:', err?.message);
    return [];
  }
}

export async function fetchProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, producer_profiles(*), cities(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return normaliseProduct(data);
  } catch (err) {
    console.warn('[api] fetchProductById failed:', err?.message);
    return null;
  }
}

// ── Reviews ───────────────────────────────────────────────────────────────────
export async function fetchReviews(productId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data?.length) return [];
    return data.map((r) => ({
      id:              r.id,
      user_id:         r.user_id ?? null,
      author:          r.author_name_ar ?? r.author_name_en ?? 'مجهول',
      author_en:       r.author_name_en ?? r.author_name_ar ?? 'Anonymous',
      rating:          r.rating,
      date:            r.created_at_label_ar ?? new Date(r.created_at).toLocaleDateString('ar-SA'),
      date_en:         r.created_at_label_en ?? new Date(r.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
      verified:        r.is_verified_purchase ?? false,
      helpful:         r.helpful_count ?? 0,
      comment:         r.comment_ar ?? r.comment,
      comment_en:      r.comment_en ?? r.comment,
      lang:            detectLang(r.comment_ar ?? r.comment),
      seller_reply:    r.seller_reply    ?? null,
      seller_reply_en: r.seller_reply_en ?? null,
      seller_reply_at: r.seller_reply_at ?? null,
    }));
  } catch (err) {
    console.warn('[api] fetchReviews failed:', err?.message);
    return [];
  }
}

export async function submitReview({ productId, rating, comment }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'not_logged_in' };

    // Try to get author name — fail gracefully if blocked by RLS
    let authorName = user.user_metadata?.full_name
      || user.user_metadata?.family_name
      || null;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.full_name) authorName = profile.full_name;
    } catch { /* use metadata fallback */ }

    const { error } = await supabase
      .from('reviews')
      .insert({
        product_id:     productId,
        rating,
        comment_ar:     comment,
        user_id:        user.id,
        author_name_ar: authorName,
      });
    if (error) {
      console.error('[submitReview] insert error:', error.message, error.details, error.hint);
      throw error;
    }
    return { ok: true };
  } catch (err) {
    console.error('[submitReview] failed:', err?.message);
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}

export async function deleteReview(reviewId) {
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    return { ok: true };
  } catch (err) { return { ok: false, error: err?.message }; }
}

export async function replyToReview(reviewId, reply) {
  try {
    const update = { seller_reply: reply, seller_reply_en: null, seller_reply_at: new Date().toISOString() };
    const { error } = await supabase.from('reviews').update(update).eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch { return false; }
}

export async function updateHelpfulCount(reviewId, delta) {
  try {
    const { error } = await supabase.rpc('update_helpful_count', {
      p_review_id: String(reviewId),
      p_delta:     delta,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[api] updateHelpfulCount failed:', err?.message);
    return false;
  }
}

export async function deleteReviewReply(reviewId) {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ seller_reply: null, seller_reply_en: null, seller_reply_at: null })
      .eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch { return false; }
}

// ── Questions ─────────────────────────────────────────────────────────────────
export async function fetchQuestions(productId) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data?.length) return [];
    return data.map((q) => ({
      id:              q.id,
      user_id:         q.user_id ?? null,
      author:          q.author_name_ar ?? 'مجهول',
      helpful:         q.helpful_count ?? 0,
      question:        q.question,
      lang:            detectLang(q.question),
      seller_answer:   q.seller_answer    ?? null,
      seller_answer_en: q.seller_answer_en ?? null,
      seller_answer_at: q.seller_answer_at ?? null,
      date:            new Date(q.created_at).toLocaleDateString('ar-SA'),
      date_en:         new Date(q.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
    }));
  } catch (err) {
    console.warn('[api] fetchQuestions failed:', err?.message);
    return [];
  }
}

export async function submitQuestion({ productId, question }) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: 'not_logged_in' };

    let authorName = user.user_metadata?.full_name || user.user_metadata?.family_name || null;
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();
      if (profile?.full_name) authorName = profile.full_name;
    } catch { /* use metadata fallback */ }

    const { error } = await supabase
      .from('questions')
      .insert({
        product_id:     productId,
        question,
        user_id:        user.id,
        author_name_ar: authorName,
      });
    if (error) {
      console.error('[submitQuestion] insert error:', error.message, error.details, error.hint);
      throw error;
    }
    return { ok: true };
  } catch (err) {
    console.error('[submitQuestion] failed:', err?.message);
    return { ok: false, error: err?.message ?? 'unknown' };
  }
}

export async function deleteQuestion(questionId) {
  try {
    const { error } = await supabase.from('questions').delete().eq('id', questionId);
    if (error) throw error;
    return { ok: true };
  } catch (err) { return { ok: false, error: err?.message }; }
}

export async function answerQuestion(questionId, answer, answerEn = null) {
  try {
    const update = { seller_answer: answer, seller_answer_at: new Date().toISOString() };
    if (answerEn !== null) update.seller_answer_en = answerEn;
    const { error } = await supabase.from('questions').update(update).eq('id', questionId);
    if (error) throw error;
    return true;
  } catch { return false; }
}

export async function deleteQuestionAnswer(questionId) {
  try {
    const { error } = await supabase
      .from('questions')
      .update({ seller_answer: null, seller_answer_en: null, seller_answer_at: null })
      .eq('id', questionId);
    if (error) throw error;
    return true;
  } catch { return false; }
}

export async function updateQuestionHelpful(questionId, delta) {
  try {
    const { error } = await supabase.rpc('update_question_helpful', {
      p_question_id: String(questionId),
      p_delta:       delta,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('[api] updateQuestionHelpful failed:', err?.message);
    return false;
  }
}
