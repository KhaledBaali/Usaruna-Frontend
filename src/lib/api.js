import { supabase } from '../supabase';

// ── Category visual maps (slug-based + id-based fallback) ──────────────────────
const CATEGORY_EMOJI = { food:'🍛', sweets:'🍰', frozen:'❄️', spices:'🌿', crafts:'🧶' };
const CATEGORY_GRADIENT = {
  food:'from-amber-50 to-orange-100', sweets:'from-pink-50 to-rose-100',
  frozen:'from-sky-50 to-blue-100',  spices:'from-green-50 to-emerald-100',
  crafts:'from-violet-50 to-purple-100',
};
const CATEGORY_EMOJI_BY_ID     = { 1:'🍛', 2:'🍰', 3:'❄️', 4:'🌿', 5:'🧶' };
const CATEGORY_GRADIENT_BY_ID  = {
  1:'from-amber-50 to-orange-100', 2:'from-pink-50 to-rose-100',
  3:'from-sky-50 to-blue-100',     4:'from-green-50 to-emerald-100',
  5:'from-violet-50 to-purple-100',
};
const DEFAULT_GRADIENT = 'from-blue-50 to-indigo-100';

// ── Parse delivery_type column → normalised array ─────────────────────────────
// Migrates legacy names: 'fast' → 'seller_delivery', 'nationwide' → 'third_party'
function parseDeliveryTypes(delivery_type, is_perishable) {
  let arr;
  if (!delivery_type) {
    arr = is_perishable ? ['seller_delivery'] : ['third_party'];
  } else {
    try {
      const parsed = JSON.parse(delivery_type);
      arr = Array.isArray(parsed) && parsed.length ? parsed : [delivery_type];
    } catch {
      arr = [delivery_type];
    }
  }
  return arr.map((d) =>
    d === 'fast' ? 'seller_delivery' : d === 'nationwide' ? 'third_party' : d
  );
}

// ── Normalise a Supabase product row into the UI shape ────────────────────────
function normaliseProduct(row) {
  if (!row) return null;
  const p       = row.producer_profiles;
  const catSlug = row.category?.slug ?? '';
  const catId   = row.category_id;

  const emoji    = CATEGORY_EMOJI[catSlug]    ?? CATEGORY_EMOJI_BY_ID[catId]    ?? row.emoji    ?? '📦';
  const gradient = CATEGORY_GRADIENT[catSlug] ?? CATEGORY_GRADIENT_BY_ID[catId] ?? row.gradient ?? DEFAULT_GRADIENT;

  const sellerCityAr = row.cities?.name_ar ?? p?.city_ar ?? p?.city ?? row.sellerCity ?? null;
  const sellerCityEn = row.cities?.name_en ?? p?.city_en ?? row.sellerCityEn ?? sellerCityAr;

  const deliveryTypes = parseDeliveryTypes(row.delivery_type, row.is_perishable);

  // Multiple images: use images JSONB array; fall back to single image_url
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
    name:          row.name_ar        ?? row.name,
    nameEn:        row.name_en        ?? row.nameEn        ?? row.name_ar ?? row.name,
    description:   row.description_ar ?? row.description,
    descriptionEn: row.description_en ?? row.descriptionEn,
    image:         row.image_url      ?? row.image,
    images:        imagesArr,
    isPerishable:  row.is_perishable  ?? row.isPerishable  ?? false,
    gradient,
    emoji,
    family:        p?.business_name_ar ?? p?.name_ar ?? row.family,
    familyEn:      p?.business_name_en ?? p?.name_en ?? row.familyEn,
    sellerCity:    sellerCityAr,
    sellerCityEn:  sellerCityEn,
    whatsapp:      p?.whatsapp       ?? row.whatsapp,
    partnerSince:  p?.partner_since  ?? row.partnerSince,
    weight:        row.weight        ?? null,
    rating:        row.rating        ?? 0,
    reviews:       row.reviews       ?? 0,
    deliveryTypes,
    producerUserId: p?.user_id ?? null,
  };
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, producer_profiles(*), cities(*)')
      .eq('is_active', true)
      .gt('stock', 0);
    if (error) throw error;
    return data.map(normaliseProduct);
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
      author:          r.author_name_ar ?? r.author_name,
      author_en:       r.author_name_en ?? r.author_name,
      rating:          r.rating,
      date:            r.created_at_label_ar ?? new Date(r.created_at).toLocaleDateString('ar-SA'),
      date_en:         r.created_at_label_en ?? new Date(r.created_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }),
      verified:        r.is_verified_purchase ?? false,
      helpful:         r.helpful_count ?? 0,
      comment:         r.comment_ar ?? r.comment,
      comment_en:      r.comment_en ?? r.comment,
      seller_reply:    r.seller_reply    ?? null,
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
    const { error } = await supabase
      .from('reviews')
      .insert({ product_id: productId, rating, comment_ar: comment, user_id: user?.id ?? null });
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}

export async function deleteReview(reviewId) {
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch { return false; }
}

export async function replyToReview(reviewId, reply) {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ seller_reply: reply, seller_reply_at: new Date().toISOString() })
      .eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch { return false; }
}

export async function deleteReviewReply(reviewId) {
  try {
    const { error } = await supabase
      .from('reviews')
      .update({ seller_reply: null, seller_reply_at: null })
      .eq('id', reviewId);
    if (error) throw error;
    return true;
  } catch { return false; }
}
