import { Link } from 'react-router-dom';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, ArrowRight,
  Shield, Globe, MapPin, User, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useLang } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import logo from './assets/logo.png';

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
          <Link to="/login" className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors hidden sm:flex" aria-label={t('nav_account')}>
            <User size={21} className="text-blue-900" />
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── CART ITEM ────────────────────────────────────────────────────────────────

function CartItem({ item, t, lang, isRtl, onRemove, onUpdateQty }) {
  const name   = lang === 'ar' ? item.name   : (item.nameEn   || item.name);
  const family = lang === 'ar' ? item.family : (item.familyEn || item.family);
  const city   = lang === 'ar' ? item.sellerCity : (item.sellerCityEn || item.sellerCity);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 flex gap-4 items-start">
      {/* Emoji thumbnail */}
      <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 text-3xl sm:text-4xl select-none`}>
        {item.emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-gray-800 text-sm sm:text-base leading-snug line-clamp-2 mb-1">
          {name}
        </h3>
        <p className="text-xs text-blue-600 font-medium flex items-center gap-1 mb-3">
          <MapPin size={11} className="shrink-0" />
          {family} · {city}
        </p>

        {/* Price + controls row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <span className="text-lg font-extrabold text-blue-900 leading-none">
            {(item.price * item.qty).toFixed(0)}
            <span className="text-sm font-bold ms-1">{t('cart_sar')}</span>
          </span>

          <div className="flex items-center gap-1">
            {/* Remove */}
            <button
              onClick={() => onRemove(item.id)}
              className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={t('cart_remove')}
            >
              <Trash2 size={15} />
            </button>

            {/* Qty controls */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => onUpdateQty(item.id, item.qty - 1)}
                className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700"
              >
                <Minus size={13} />
              </button>
              <span className="w-7 text-center text-sm font-bold text-gray-800">{item.qty}</span>
              <button
                onClick={() => onUpdateQty(item.id, item.qty + 1)}
                className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700"
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Per-unit price */}
        {item.qty > 1 && (
          <p className="text-[11px] text-gray-400 mt-1">
            {item.price} {t('cart_sar')} × {item.qty}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── ORDER SUMMARY ────────────────────────────────────────────────────────────

function OrderSummary({ t, subtotal, isRtl }) {
  const hasItems = subtotal > 0;

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
          <span className="text-gray-400 text-xs">{t('cart_deliveryNote')}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 mb-6">
        <div className="flex items-center justify-between">
          <span className="font-extrabold text-gray-800">{t('cart_total')}</span>
          <span className="text-xl font-extrabold text-blue-900">
            {subtotal.toFixed(0)} <span className="text-base font-bold">{t('cart_sar')}</span>
          </span>
        </div>
      </div>

      {/* Checkout button */}
      <button
        disabled={!hasItems}
        className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 mb-3
          ${hasItems
            ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
      >
        {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
        {t('cart_checkout')}
      </button>

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
  const { items, removeItem, updateQty, totalCount, subtotal } = useCart();
  const isRtl = dir === 'rtl';

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
              <OrderSummary t={t} subtotal={subtotal} isRtl={isRtl} />
            </div>
          </div>
        )}

        {/* Mobile order summary (shown below items) */}
        {items.length > 0 && (
          <div className="lg:hidden mt-6">
            <OrderSummary t={t} subtotal={subtotal} isRtl={isRtl} />
          </div>
        )}
      </main>
    </div>
  );
}
