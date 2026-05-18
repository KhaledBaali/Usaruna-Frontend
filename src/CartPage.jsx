import { Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  Shield, Globe, MapPin, ChevronLeft, ChevronRight, AlertCircle,
} from 'lucide-react';
import { useLang } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import LocationPicker from './LocationPicker';
import AccountMenu from './AccountMenu';
import logo from './assets/logo.png';

const DELIVERY_PRICES = { pickup: 0, seller_delivery: 15, third_party: 25 };

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

function Navbar({ t, dir, isRtl, toggle, totalCount }) {
  const ChevronBack = isRtl ? ChevronLeft : ChevronRight;
  return (
    <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt={t('brand_name')} className="w-9 h-9 object-contain" />
          <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight font-brand">
            {t('brand_name')}
          </span>
        </Link>

        <div className="flex-1 flex items-center gap-2">
          <ShoppingCart size={19} className="text-blue-900 shrink-0" />
          <h1 className="font-extrabold text-gray-800 text-base">
            {t('cart_title')}
            {totalCount > 0 && (
              <span className="text-blue-500 font-bold text-sm ms-1.5">
                ({totalCount} {totalCount === 1 ? t('cart_itemCount1') : t('cart_itemCount')})
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggle}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors duration-200 hidden sm:flex items-center gap-1.5"
          >
            <Globe size={13} />
            {t('nav_langToggle')}
          </button>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

// ─── DELIVERY OPTION META ─────────────────────────────────────────────────────

const DELIVERY_META = {
  pickup:          { emoji: '🏪', arLabel: 'استلام شخصي',    enLabel: 'Pickup'          },
  seller_delivery: { emoji: '🛵', arLabel: 'توصيل من البائع', enLabel: 'Seller Delivery' },
  third_party:     { emoji: '📦', arLabel: 'شركة شحن',        enLabel: 'Shipping Co.'    },
};

// ─── MINI MAP (OSM iframe embed — no extra library needed in cart) ─────────────

function MiniMap({ location, title }) {
  if (!location?.lat || !location?.lng) return null;
  const { lat, lng } = location;
  const d = 0.012;
  const src =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${lng - d},${lat - d},${lng + d},${lat + d}` +
    `&layer=mapnik&marker=${lat},${lng}`;
  return (
    <div className="mt-2 rounded-xl overflow-hidden border border-gray-200" style={{ height: 120 }}>
      <iframe
        title={title}
        src={src}
        style={{ width: '100%', height: '100%', border: 'none' }}
        loading="lazy"
      />
    </div>
  );
}

// ─── CART ITEM ────────────────────────────────────────────────────────────────

function CartItem({ item, t, lang, isRtl, onRemove, onUpdateQty, onUpdateMeta }) {
  const name   = lang === 'ar' ? item.name   : (item.nameEn   || item.name);
  const family = lang === 'ar' ? item.family : (item.familyEn || item.family);
  const city   = lang === 'ar' ? item.sellerCity : (item.sellerCityEn || item.sellerCity);

  const delivMeta  = item.deliveryOption ? DELIVERY_META[item.deliveryOption] : null;
  const delivLabel = delivMeta ? (lang === 'ar' ? delivMeta.arLabel : delivMeta.enLabel) : null;
  const needsLocation = ['seller_delivery', 'third_party'].includes(item.deliveryOption);
  const hasLocation   = !!item.deliveryLocation?.lat;
  const maxQty = item.stock ?? 99;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 flex gap-4 items-start">
      {/* Thumbnail */}
      <Link to={`/product/${item.id}`} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 overflow-hidden`}>
        {item.image_url
          ? <img src={item.image_url} alt={name} className="w-full h-full object-cover" />
          : <span className="text-3xl sm:text-4xl select-none">{item.emoji}</span>
        }
      </Link>

      <div className="flex-1 min-w-0">
        <Link to={`/product/${item.id}`} className="font-bold text-gray-800 text-sm sm:text-base leading-snug line-clamp-2 mb-1 hover:text-blue-700 transition-colors block">
          {name}
        </Link>
        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mb-2">
          <MapPin size={11} className="shrink-0" />
          <span>{city || family || '—'}</span>
          {family && city && <span className="opacity-40">·</span>}
          {family && city && <span>{family}</span>}
        </p>

        {/* No delivery chosen yet: show selector */}
        {!item.deliveryOption && item.deliveryTypes?.length > 0 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-xs font-bold text-amber-800 flex items-center gap-1.5 mb-2">
              <AlertCircle size={12} />{lang === 'ar' ? 'اختر طريقة التوصيل' : 'Choose delivery method'}
            </p>
            <div className="flex flex-col gap-1.5">
              {item.deliveryTypes.map((type) => {
                const meta = DELIVERY_META[type];
                if (!meta) return null;
                const price = DELIVERY_PRICES[type] ?? 0;
                return (
                  <button key={type}
                    onClick={() => onUpdateMeta(item.id, { deliveryOption: type, deliveryPrice: price })}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 rounded-xl px-3 py-2 transition-colors text-start">
                    <span>{meta.emoji}</span>
                    <span className="flex-1">{lang === 'ar' ? meta.arLabel : meta.enLabel}</span>
                    <span className="text-gray-500">{price === 0 ? (lang === 'ar' ? 'مجاناً' : 'Free') : `${price} ${t('cart_sar')}`}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Delivery badge (when chosen) */}
        {delivMeta && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
              <span>{delivMeta.emoji}</span>{delivLabel}
              {item.deliveryPrice > 0
                ? <span className="text-gray-400 font-normal">· {item.deliveryPrice} {t('cart_sar')}</span>
                : <span className="text-emerald-600 font-bold">· {lang === 'ar' ? 'مجاناً' : 'Free'}</span>
              }
            </span>
            {/* Location address */}
            {item.deliveryLocation?.address && (
              <div className="mt-1.5 flex items-start gap-1.5">
                <MapPin size={11} className="text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">{item.deliveryLocation.address}</p>
              </div>
            )}
            {item.deliveryLocation?.lat && item.deliveryLocation?.lng && (
              <MiniMap location={item.deliveryLocation} title={`location-${item.id}`} />
            )}
            {/* Location picker for delivery needing it */}
            {needsLocation && !hasLocation && (
              <div className="mt-2">
                <p className="text-[11px] font-bold text-blue-600 mb-1.5 flex items-center gap-1">
                  <MapPin size={10} />{lang === 'ar' ? 'حدد موقع التوصيل على الخريطة' : 'Set delivery location on map'}
                </p>
                <LocationPicker
                  key={`cart-loc-${item.id}`}
                  mode="customer"
                  lang={lang}
                  onConfirm={(loc) => onUpdateMeta(item.id, { deliveryLocation: loc })}
                />
              </div>
            )}
          </div>
        )}

        {/* Price + controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-lg font-extrabold text-blue-900 leading-none">
            {(item.price * item.qty).toFixed(0)}<span className="text-sm font-bold ms-1">{t('cart_sar')}</span>
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => onRemove(item.id)}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 size={15} />
            </button>
            <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
              <button onClick={() => onUpdateQty(item.id, item.qty - 1)}
                className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700">
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-bold text-gray-800">{item.qty}</span>
              <button onClick={() => onUpdateQty(item.id, Math.min(item.qty + 1, maxQty))}
                disabled={item.qty >= maxQty}
                className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>
        {item.qty > 1 && <p className="text-[11px] text-gray-400 mt-1">{item.price} {t('cart_sar')} × {item.qty}</p>}
        {item.qty >= maxQty && maxQty < 99 && (
          <p className="text-[11px] text-amber-600 mt-1 font-semibold">{lang === 'ar' ? `الحد الأقصى المتاح: ${maxQty}` : `Max available: ${maxQty}`}</p>
        )}
      </div>
    </div>
  );
}

// ─── ORDER SUMMARY ────────────────────────────────────────────────────────────

function OrderSummary({ t, lang, subtotal, deliveryTotal, isRtl, canCheckout }) {
  const hasItems = subtotal > 0;
  const grandTotal = subtotal + deliveryTotal;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sticky top-24">
      <h2 className="font-extrabold text-gray-800 text-base mb-5">{t('cart_summary')}</h2>

      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{t('cart_subtotal')}</span>
          <span className="font-bold text-gray-800">
            {subtotal.toFixed(0)} <span className="font-semibold">{t('cart_sar')}</span>
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">{t('cart_delivery')}</span>
          {deliveryTotal === 0 ? (
            <span className="text-emerald-600 font-bold text-xs">
              {lang === 'ar' ? 'مجاناً' : 'Free'}
            </span>
          ) : (
            <span className="font-bold text-gray-800">
              {deliveryTotal.toFixed(0)} <span className="font-semibold">{t('cart_sar')}</span>
            </span>
          )}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-gray-800">{t('cart_total')}</span>
          <span className="text-xl font-extrabold text-blue-900">
            {grandTotal.toFixed(0)} <span className="text-base font-bold">{t('cart_sar')}</span>
          </span>
        </div>
      </div>

      {/* Checkout button */}
      {hasItems && canCheckout ? (
        <Link
          to="/checkout"
          className="w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mb-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-sm"
        >
          {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
          {t('cart_checkout')}
        </Link>
      ) : (
        <button
          disabled
          className="w-full py-3.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 mb-3 bg-gray-100 text-gray-400 cursor-not-allowed"
        >
          {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
          {!hasItems
            ? t('cart_checkout')
            : lang === 'ar'
              ? 'أكمل خيارات التوصيل أولاً'
              : 'Complete delivery options first'}
        </button>
      )}

      <Link
        to="/"
        className="w-full py-3 rounded-2xl text-sm font-bold border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
        {t('cart_continueShopping')}
      </Link>

      {/* Trust badge */}
      <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 mt-5">
        <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield size={15} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-800">{t('cart_protection')}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{t('cart_protectionDesc')}</p>
        </div>
      </div>
    </div>
  );
}

// ─── EMPTY STATE ──────────────────────────────────────────────────────────────

function EmptyCart({ t, isRtl }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
        <ShoppingCart size={40} className="text-blue-300" />
      </div>
      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">{t('cart_empty')}</h2>
      <p className="text-gray-400 text-sm mb-8 max-w-xs leading-relaxed">{t('cart_emptyDesc')}</p>
      <Link
        to="/"
        className="bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-sm"
      >
        {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
        {t('cart_browseProducts')}
      </Link>
    </div>
  );
}

// ─── CART PAGE ────────────────────────────────────────────────────────────────

export default function CartPage() {
  const { lang, dir, toggle, t } = useLang();
  const { items, removeItem, updateQty, updateItemMeta, totalCount, subtotal } = useCart();
  const isRtl = dir === 'rtl';
  const deliveryTotal = items.reduce((s, i) => s + (i.deliveryPrice ?? 0), 0);

  const allDeliverySet = items.every((item) => !!item.deliveryOption);
  const allLocationSet = items.every((item) => {
    const needs = ['seller_delivery', 'third_party'].includes(item.deliveryOption);
    return !needs || !!item.deliveryLocation?.lat;
  });
  const canCheckout = items.length > 0 && allDeliverySet && allLocationSet;

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${isRtl ? 'text-right' : 'text-left'}`}>

      <Navbar t={t} dir={dir} isRtl={isRtl} toggle={toggle} totalCount={totalCount} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {items.length === 0 ? (
          <EmptyCart t={t} isRtl={isRtl} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

            {/* Items list */}
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  t={t}
                  lang={lang}
                  isRtl={isRtl}
                  onRemove={removeItem}
                  onUpdateQty={updateQty}
                  onUpdateMeta={updateItemMeta}
                />
              ))}

              {/* Continue shopping — mobile only */}
              <Link
                to="/"
                className="lg:hidden w-full py-3 rounded-2xl text-sm font-bold border border-gray-200 bg-white text-gray-600 hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
                {t('cart_continueShopping')}
              </Link>
            </div>

            {/* Summary — desktop sidebar */}
            <div className="hidden lg:block">
              <OrderSummary t={t} lang={lang} subtotal={subtotal} deliveryTotal={deliveryTotal} isRtl={isRtl} canCheckout={canCheckout} />
            </div>
          </div>
        )}

        {/* Mobile order summary (shown below items) */}
        {items.length > 0 && (
          <div className="lg:hidden mt-6">
            <OrderSummary t={t} lang={lang} subtotal={subtotal} deliveryTotal={deliveryTotal} isRtl={isRtl} canCheckout={canCheckout} />
          </div>
        )}
      </main>
    </div>
  );
}
