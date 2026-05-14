import { supabase } from '../supabase';
import { PRODUCTS } from '../products';

// ── Static fallback reviews (used when Supabase is unavailable) ───────────────
export const MOCK_REVIEWS = [
  { id: 1,  lang: 'ar', author: 'سارة أحمد',      author_en: 'Sara Ahmed',         rating: 5, date: '28 أبريل 2025', date_en: 'April 28, 2025',  verified: true,  helpful: 14, comment: 'منتج رائع جداً! الطعم أصيل ومميز تماماً. التوصيل كان في الوقت المحدد والتغليف ممتاز. سأطلب مرة أخرى بالتأكيد!', comment_en: 'Excellent product! The taste is authentic and unique. Delivery was on time and packaging was great. I will definitely order again!' },
  { id: 2,  lang: 'ar', author: 'محمد العتيبي',    author_en: 'Mohammed Al-Otaibi', rating: 5, date: '22 أبريل 2025', date_en: 'April 22, 2025', verified: true,  helpful: 9,  comment: 'أفضل منتج اشتريته من المنصة. الجودة عالية جداً والكمية كافية. أنصح به بشدة لكل من يريد طعاماً منزلياً أصيلاً.', comment_en: 'Best product I have bought from the platform. Quality is very high and quantity is sufficient. I highly recommend it for anyone looking for authentic home cooking.' },
  { id: 3,  lang: 'ar', author: 'نورة الشمري',    author_en: 'Noura Al-Shamri',    rating: 4, date: '15 أبريل 2025', date_en: 'April 15, 2025', verified: true,  helpful: 6,  comment: 'جيد جداً ويستحق السعر. الطعم لذيذ لكن الكمية كانت أقل قليلاً من المتوقع. بشكل عام تجربة ممتازة.', comment_en: 'Very good and worth the price. The taste is delicious but the quantity was slightly less than expected. Overall an excellent experience.' },
  { id: 4,  lang: 'ar', author: 'خالد الزهراني',  author_en: 'Khalid Al-Zahrani',  rating: 5, date: '10 أبريل 2025', date_en: 'April 10, 2025', verified: false, helpful: 8,  comment: 'طلبت للعائلة وكلهم أعجبهم كثيراً. الطعم منزلي وأصيل. الله يبارك في أسرة البائع ويزيدهم من فضله.', comment_en: 'I ordered for the family and everyone loved it. The taste is homemade and authentic. Blessings to the seller\'s family.' },
  { id: 5,  lang: 'ar', author: 'فاطمة القحطاني', author_en: 'Fatima Al-Qahtani',  rating: 3, date: '5 أبريل 2025',  date_en: 'April 5, 2025',  verified: true,  helpful: 3,  comment: 'المنتج جيد لكن كنت أتوقع طعماً أقوى. الكمية كافية والتوصيل كان في الوقت. ربما أجرب مرة أخرى.', comment_en: 'The product is good but I expected a stronger taste. Quantity is sufficient and delivery was on time. Maybe I will try again.' },
  { id: 6,  lang: 'ar', author: 'عبدالله المطيري', author_en: 'Abdullah Al-Mutairi', rating: 4, date: '28 مارس 2025', date_en: 'March 28, 2025', verified: true,  helpful: 5,  comment: 'ممتاز! البائع محترم جداً وتواصله سريع. التوصيل جاء في الوقت والمنتج بحالة ممتازة.', comment_en: 'Excellent! The seller is very professional with fast communication. Delivery arrived on time and the product was in great condition.' },
  { id: 7,  lang: 'ar', author: 'ريم السلمي',     author_en: 'Reem Al-Salmi',      rating: 5, date: '20 مارس 2025', date_en: 'March 20, 2025', verified: true,  helpful: 11, comment: 'شكراً لأسرة البائع على هذا المنتج الرائع! يذكرني بطبخ والدتي رحمها الله. سأطلب دائماً من هذا المتجر.', comment_en: 'Thank you to the seller\'s family for this wonderful product! It reminds me of my late mother\'s cooking. I will always order from this store.' },
  { id: 8,  lang: 'ar', author: 'أحمد الغامدي',   author_en: 'Ahmed Al-Ghamdi',    rating: 2, date: '15 مارس 2025', date_en: 'March 15, 2025', verified: false, helpful: 1,  comment: 'المنتج وصل متأخراً عن الموعد المحدد ولم يكن بأفضل حال. آمل أن تتحسن الخدمة في المستقبل.', comment_en: 'The product arrived late and was not in the best condition. I hope the service improves in the future.' },
  { id: 9,  lang: 'en', author: 'ليام ماكنزي',    author_en: 'Liam McKenzie',      rating: 5, date: '10 مايو 2025',  date_en: 'May 10, 2025',   verified: true,  helpful: 7,  comment: '', comment_en: 'Absolutely love this product! My wife and I discovered it through a friend and we have been ordering every week since. The quality is consistent and the flavors are unlike anything you find in stores. Fast delivery too!' },
  { id: 10, lang: 'en', author: 'إيما كلارك',      author_en: 'Emma Clarke',        rating: 4, date: '2 مايو 2025',   date_en: 'May 2, 2025',    verified: true,  helpful: 4,  comment: '', comment_en: 'Really impressed with this purchase. You can tell it is made with care — the ingredients are fresh and the presentation is lovely. Knocked one star only because the packaging could be a bit sturdier for long-distance shipping, but the product itself is fantastic.' },
];

// ── Normalise a Supabase product row into the shape the UI expects ────────────
function normaliseProduct(row) {
  if (!row) return null;
  const p = row.producer_profiles;
  return {
    ...row,
    family:       p?.name_ar      ?? row.family,
    familyEn:     p?.name_en      ?? row.familyEn,
    sellerCity:   p?.city_ar      ?? row.sellerCity,
    sellerCityEn: p?.city_en      ?? row.sellerCityEn,
    whatsapp:     p?.whatsapp     ?? row.whatsapp,
    partnerSince: p?.partner_since ?? row.partnerSince,
  };
}

// ── Products ──────────────────────────────────────────────────────────────────
export async function fetchProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, producer_profiles(name_ar, name_en, city_ar, city_en)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(normaliseProduct);
  } catch {
    return PRODUCTS;
  }
}

export async function fetchProductById(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, producer_profiles(name_ar, name_en, city_ar, city_en, whatsapp, partner_since)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return normaliseProduct(data);
  } catch {
    return PRODUCTS.find((p) => p.id === id) ?? null;
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
    if (!data?.length) return MOCK_REVIEWS;
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
  } catch {
    return MOCK_REVIEWS;
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
