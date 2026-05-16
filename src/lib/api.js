import { supabase } from '../supabase';
// Removed MOCK_REVIEWS to ensure strict live data only

// ── Category → emoji/gradient maps (keeps emoji/colour out of the DB) ─────────
// Keyed on slug (used for mock PRODUCTS) and on numeric id (used for DB rows).
const CATEGORY_EMOJI = {
  food:    '🍛',
  sweets:  '🍰',
  frozen:  '❄️',
  spices:  '🌿',
  crafts:  '🧶',
};
const CATEGORY_GRADIENT = {
  food:    'from-amber-50 to-orange-100',
  sweets:  'from-pink-50 to-rose-100',
  frozen:  'from-sky-50 to-blue-100',
  spices:  'from-green-50 to-emerald-100',
  crafts:  'from-violet-50 to-purple-100',
};
// Numeric id maps — update these if your categories table rows differ.
// DB default insert order: 1=food, 2=sweets, 3=frozen, 4=spices, 5=crafts
const CATEGORY_EMOJI_BY_ID = { 1: '🍛', 2: '🍰', 3: '❄️', 4: '🌿', 5: '🧶' };
const CATEGORY_GRADIENT_BY_ID = {
  1: 'from-amber-50 to-orange-100',
  2: 'from-pink-50 to-rose-100',
  3: 'from-sky-50 to-blue-100',
  4: 'from-green-50 to-emerald-100',
  5: 'from-violet-50 to-purple-100',
};
const DEFAULT_GRADIENT = 'from-blue-50 to-indigo-100';

// ── Normalise a Supabase product row into the shape the UI expects ────────────
// Maps DB column names → field names consumed by ProductCard / ProductDetailsPage.
function normaliseProduct(row) {
  if (!row) return null;
  const p       = row.producer_profiles;          // may be null if no profile exists yet
  const catSlug = row.category?.slug ?? '';        // present only if the join succeeded
  const catId   = row.category_id;                // always present

  // Prefer slug-based lookup (accurate), fall back to id-based lookup, then row default
  const emoji    = CATEGORY_EMOJI[catSlug]    ?? CATEGORY_EMOJI_BY_ID[catId]    ?? row.emoji    ?? '📦';
  const gradient = CATEGORY_GRADIENT[catSlug] ?? CATEGORY_GRADIENT_BY_ID[catId] ?? row.gradient ?? DEFAULT_GRADIENT;

  return {
    ...row,
    // ── Display name (ProductCard reads `name` / `nameEn`) ──
    name:         row.name_ar   ?? row.name,
    nameEn:       row.name_en   ?? row.nameEn   ?? row.name_ar ?? row.name,
    // ── Image: use Supabase URL; fall back to emoji thumbnail ──
    image:        row.image_url ?? row.image,
    // ── Delivery / freshness ──
    isPerishable: row.is_perishable ?? row.isPerishable ?? false,
    // ── Visual chrome ──
    gradient,
    emoji,
    // ── Producer / seller metadata ──
    family:       p?.business_name_ar ?? p?.name_ar ?? row.family,
    familyEn:     p?.business_name_en ?? p?.name_en ?? row.familyEn,
    sellerCity:   row.cities?.name_ar ?? p?.city_ar       ?? p?.city       ?? row.sellerCity,
    sellerCityEn: row.cities?.name_en ?? p?.city_en       ?? row.sellerCityEn,
    whatsapp:     p?.whatsapp      ?? row.whatsapp,
    partnerSince: p?.partner_since ?? row.partnerSince,
    // ── Review defaults (DB products won’t have these yet) ──
    rating:       row.rating  ?? 0,
    reviews:      row.reviews ?? 0,
  };
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      // Only join producer_profiles (safe via FK producer_id → auth.users → producer_profiles).
      // The category join is intentionally omitted: we derive emoji/gradient from category_id
      // using the local CATEGORY_EMOJI_BY_ID / CATEGORY_GRADIENT_BY_ID maps instead,
      // avoiding any RLS or FK-registration issues on the categories table.
      .select('*, producer_profiles(*), cities(*)')
      .eq('is_active', true);
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
      id:        r.id,
      author:    r.author_name_ar ?? r.author_name,
      author_en: r.author_name_en ?? r.author_name,
      rating:    r.rating,
      date:      r.created_at_label_ar ?? new Date(r.created_at).toLocaleDateString('ar-SA'),
      date_en:   r.created_at_label_en ?? new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      verified:  r.is_verified_purchase ?? false,
      helpful:   r.helpful_count ?? 0,
      comment:   r.comment_ar ?? r.comment,
      comment_en:r.comment_en ?? r.comment,
    }));
  } catch (err) {
    console.warn('[api] fetchReviews failed:', err?.message);
    return [];
  }
}

export async function submitReview({ productId, rating, comment }) {
  try {
    const { error } = await supabase
      .from('reviews')
      .insert({ product_id: productId, rating, comment_ar: comment });
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
}
