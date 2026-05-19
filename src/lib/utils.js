/**
 * Returns 'ar' if the string contains Arabic characters, 'en' otherwise.
 * Unicode range U+0600–U+06FF covers Arabic script.
 */
export function detectLang(text) {
  return /[؀-ۿ]/.test(text ?? '') ? 'ar' : 'en';
}

/**
 * Parses the delivery_type DB column into a normalised string array.
 * Migrates legacy names: 'fast' → 'seller_delivery', 'nationwide' → 'third_party', 'local' → 'seller_delivery'
 */
export function parseDeliveryTypes(delivery_type, is_perishable) {
  const migrate = (d) =>
    d === 'fast' || d === 'local' ? 'seller_delivery'
    : d === 'nationwide'          ? 'third_party'
    : d;

  if (!delivery_type) {
    return is_perishable ? ['seller_delivery'] : ['third_party'];
  }
  try {
    const parsed = JSON.parse(delivery_type);
    if (Array.isArray(parsed) && parsed.length) return parsed.map(migrate);
  } catch { /* fall through to string fallback */ }
  return [migrate(delivery_type)];
}

/**
 * Serialises a delivery-types array back to the DB column format.
 * Single-item arrays are stored as a plain string; multi-item as JSON.
 */
export function serializeDeliveryTypes(arr) {
  return arr.length === 1 ? arr[0] : JSON.stringify(arr);
}

/**
 * Converts a prep-time value + unit to total minutes.
 */
export function toMinutes(value, unit) {
  const v = parseInt(value) || 0;
  if (unit === 'hours') return v * 60;
  if (unit === 'days')  return v * 60 * 24;
  return v;
}

/**
 * Converts total minutes back to the most readable { value, unit } pair.
 */
export function fromMinutes(minutes) {
  if (!minutes) return { value: '', unit: 'minutes' };
  if (minutes % (60 * 24) === 0) return { value: String(minutes / (60 * 24)), unit: 'days' };
  if (minutes % 60 === 0)        return { value: String(minutes / 60),        unit: 'hours' };
  return { value: String(minutes), unit: 'minutes' };
}

/**
 * Transforms a Supabase storage URL to the WebP render endpoint.
 * No-ops for non-storage URLs. Requires Supabase Pro image transformations.
 */
export function toWebP(url, width = 600) {
  if (!url || typeof url !== 'string') return url;
  if (!url.includes('/storage/v1/object/public/')) return url;
  return url.replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    + `?width=${width}&quality=80&format=webp`;
}
