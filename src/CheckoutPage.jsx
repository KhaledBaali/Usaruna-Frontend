import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, ArrowLeft, ArrowRight, Shield, Globe,
  ChevronLeft, ChevronRight, MapPin, Check, Loader2, CreditCard,
  Smartphone, Banknote, Package, Lock,
} from 'lucide-react';
import { useLang } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabase';
import AccountMenu from './AccountMenu';
import logo from './assets/logo.png';

// ─── DELIVERY META ────────────────────────────────────────────────────────────

const DELIVERY_META = {
  pickup:          { emoji: '🏪', arLabel: 'استلام شخصي',    enLabel: 'Pickup'          },
  seller_delivery: { emoji: '🛵', arLabel: 'توصيل من البائع', enLabel: 'Seller Delivery' },
  third_party:     { emoji: '📦', arLabel: 'شركة شحن',        enLabel: 'Shipping Co.'    },
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

function Navbar({ t, dir, isRtl, toggle, step }) {
  return (
    <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt={t('brand_name')} className="w-9 h-9 object-contain" />
          <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight font-brand">
            {t('brand_name')}
          </span>
        </Link>

        <div className="flex-1 flex items-center gap-2">
          <Lock size={17} className="text-blue-900 shrink-0" />
          <h1 className="font-extrabold text-gray-800 text-base">{t('checkout_title')}</h1>
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

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-blue-700 to-emerald-500 transition-all duration-700"
          style={{ width: step === 'form' ? '50%' : '100%' }}
        />
      </div>
    </header>
  );
}

// ─── ORDER ITEM ROW ───────────────────────────────────────────────────────────

function OrderItemRow({ item, t, lang }) {
  const name     = lang === 'ar' ? item.name   : (item.nameEn   || item.name);
  const delivMeta = item.deliveryOption ? DELIVERY_META[item.deliveryOption] : null;
  const delivLabel = delivMeta ? (lang === 'ar' ? delivMeta.arLabel : delivMeta.enLabel) : null;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-none">
      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shrink-0 text-xl select-none`}>
        {item.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-gray-800 leading-snug line-clamp-1">{name}</p>
        {delivMeta && (
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
            <span>{delivMeta.emoji}</span>{delivLabel}
            {item.deliveryPrice > 0 && <span>· {item.deliveryPrice} {t('cart_sar')}</span>}
            {item.deliveryPrice === 0 && <span className="text-emerald-600">{lang === 'ar' ? '· مجاناً' : '· Free'}</span>}
          </p>
        )}
        {item.deliveryLocation?.address && (
          <p className="text-[11px] text-gray-400 mt-0.5 flex items-start gap-1 leading-snug">
            <MapPin size={10} className="shrink-0 mt-0.5" />
            <span className="line-clamp-2">{item.deliveryLocation.address}</span>
          </p>
        )}
      </div>
      <div className="shrink-0 text-end">
        <p className="text-sm font-extrabold text-blue-900">
          {((item.price + (item.chosenSize?.priceAdj ?? 0)) * item.qty).toFixed(0)}{' '}
          <span className="text-xs font-bold">{t('cart_sar')}</span>
        </p>
        <p className="text-[11px] text-gray-400">×{item.qty}</p>
      </div>
    </div>
  );
}

// ─── ORDER SUMMARY PANEL ──────────────────────────────────────────────────────

function OrderSummaryPanel({ t, lang, items, subtotal, deliveryTotal }) {
  const grandTotal = subtotal + deliveryTotal;
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-extrabold text-gray-800 text-base mb-4 flex items-center gap-2">
        <ShoppingCart size={16} className="text-blue-700" />
        {t('checkout_orderSummary')}
      </h2>

      <div className="mb-4">
        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} t={t} lang={lang} />
        ))}
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('cart_subtotal')}</span>
          <span className="font-bold">{subtotal.toFixed(0)} {t('cart_sar')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('cart_delivery')}</span>
          <span className="font-bold">
            {deliveryTotal === 0
              ? <span className="text-emerald-600">{lang === 'ar' ? 'مجاناً' : 'Free'}</span>
              : <>{deliveryTotal.toFixed(0)} {t('cart_sar')}</>
            }
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-100">
          <span className="font-extrabold text-gray-800">{t('cart_total')}</span>
          <span className="text-xl font-extrabold text-blue-900">
            {grandTotal.toFixed(0)} <span className="text-base font-bold">{t('cart_sar')}</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-2xl p-3 mt-4">
        <div className="w-7 h-7 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
          <Shield size={13} className="text-emerald-600" />
        </div>
        <div>
          <p className="text-xs font-bold text-emerald-800">{t('cart_protection')}</p>
          <p className="text-[11px] text-emerald-600 mt-0.5">{t('cart_protectionDesc')}</p>
        </div>
      </div>
    </div>
  );
}

// ─── PAYMENT METHOD SELECTOR ──────────────────────────────────────────────────

function PaymentSelector({ t, lang, method, setMethod }) {
  const isRtl = lang === 'ar';

  const options = [
    {
      id: 'cod',
      icon: <Banknote size={22} className="text-emerald-600" />,
      label:  isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery',
      sublabel: isRtl ? 'ادفع نقداً عند استلام طلبك' : 'Pay cash when you receive your order',
      bg: 'bg-emerald-50',
      border: 'border-emerald-500',
    },
    {
      id: 'apple',
      icon: <Smartphone size={22} className="text-gray-800" />,
      label:  isRtl ? 'Apple Pay' : 'Apple Pay',
      sublabel: isRtl ? 'ادفع بسرعة عبر محفظة Apple' : 'Pay instantly with your Apple Wallet',
      bg: 'bg-gray-900',
      border: 'border-gray-900',
      dark: true,
    },
    {
      id: 'card',
      icon: <CreditCard size={22} className="text-blue-600" />,
      label:  isRtl ? 'بطاقة ائتمانية / مدى' : 'Credit / Debit Card',
      sublabel: isRtl ? 'ادفع ببطاقتك الائتمانية أو بطاقة مدى' : 'Pay with your credit or debit card',
      bg: 'bg-blue-50',
      border: 'border-blue-600',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
      <h2 className="font-extrabold text-gray-800 text-base mb-4 flex items-center gap-2">
        <CreditCard size={16} className="text-blue-700" />
        {t('checkout_paymentMethod')}
      </h2>

      <div className="space-y-3">
        {options.map((opt) => {
          const selected = method === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMethod(opt.id)}
              className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-150 text-start
                ${selected
                  ? `${opt.border} ${opt.dark ? 'bg-gray-900 text-white' : opt.bg}`
                  : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                ${selected && opt.dark ? 'bg-white/10' : selected ? opt.bg : 'bg-gray-100'}`}>
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold leading-none mb-0.5 ${selected && opt.dark ? 'text-white' : 'text-gray-800'}`}>
                  {opt.label}
                </p>
                <p className={`text-[11px] ${selected && opt.dark ? 'text-gray-300' : 'text-gray-400'}`}>
                  {opt.sublabel}
                </p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                ${selected ? `${opt.dark ? 'border-white bg-white' : `${opt.border} ${opt.bg}`}` : 'border-gray-300'}`}>
                {selected && (
                  <Check size={11} className={opt.dark ? 'text-gray-900' : 'text-blue-700'} strokeWidth={3} />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── CARD FIELDS ──────────────────────────────────────────────────────────────

function DemoCardFields({ t, lang, card, setCard }) {
  const isRtl = lang === 'ar';

  const update = (field) => (e) => setCard((c) => ({ ...c, [field]: e.target.value }));

  const formatCardNum = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const inputCls = `w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50`;

  return (
    <div className="mt-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl space-y-3">
      <p className="text-[11px] font-bold text-blue-700 uppercase tracking-wide">
        {isRtl ? 'بيانات البطاقة' : 'Card Details'}
      </p>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {isRtl ? 'رقم البطاقة' : 'Card Number'}
        </label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="4111 1111 1111 1111"
          value={card.number}
          onChange={(e) => setCard((c) => ({ ...c, number: formatCardNum(e.target.value) }))}
          className={inputCls}
          dir="ltr"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">
          {isRtl ? 'الاسم على البطاقة' : 'Cardholder Name'}
        </label>
        <input
          type="text"
          placeholder={isRtl ? 'الاسم كما هو مطبوع على البطاقة' : 'Name as on card'}
          value={card.name}
          onChange={update('name')}
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">
            {isRtl ? 'تاريخ الانتهاء' : 'Expiry'}
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="MM/YY"
            value={card.expiry}
            onChange={(e) => setCard((c) => ({ ...c, expiry: formatExpiry(e.target.value) }))}
            className={inputCls}
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">CVV</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="123"
            maxLength={4}
            value={card.cvv}
            onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            className={inputCls}
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
}

// ─── SUCCESS SCREEN ───────────────────────────────────────────────────────────

function SuccessScreen({ t, lang, isRtl, orderNum }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {/* Animated checkmark */}
      <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 shadow-md">
        <Check size={44} className="text-emerald-600" strokeWidth={2.5} />
      </div>

      <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-extrabold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wide">
        <Package size={13} /> {t('checkout_statusConfirmed')}
      </span>

      <h2 className="text-2xl font-extrabold text-gray-800 mb-2">
        {t('checkout_successTitle')}
      </h2>
      <p className="text-gray-400 text-sm mb-2 max-w-xs leading-relaxed">
        {t('checkout_successDesc')}
      </p>
      <p className="text-xs text-gray-400 mb-8">
        {t('checkout_orderNum')}{' '}
        <span className="font-bold text-blue-700">#{orderNum}</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to="/"
          className="bg-blue-900 hover:bg-blue-800 active:scale-95 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-sm"
        >
          {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
          {t('checkout_continueShopping')}
        </Link>
      </div>
    </div>
  );
}

// ─── CHECKOUT PAGE ────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { lang, dir, toggle, t } = useLang();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRtl = dir === 'rtl';

  const [payMethod, setPayMethod] = useState('cod');
  const [card, setCard]           = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [orderNum, setOrderNum]   = useState('');
  const [orderError, setOrderError] = useState(null);

  const deliveryTotal = items.reduce((s, i) => s + (i.deliveryPrice ?? 0), 0);
  const grandTotal    = subtotal + deliveryTotal;

  if (items.length === 0 && !done) {
    return (
      <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${isRtl ? 'text-right' : 'text-left'}`}>
        <Navbar t={t} dir={dir} isRtl={isRtl} toggle={toggle} step="form" />
        <main className="max-w-4xl mx-auto px-4 pt-24 pb-16 flex flex-col items-center justify-center py-32 text-center">
          <ShoppingCart size={48} className="text-blue-200 mb-4" />
          <h2 className="text-xl font-extrabold text-gray-700 mb-2">{t('cart_empty')}</h2>
          <Link to="/" className="mt-4 text-blue-700 font-bold text-sm hover:underline">
            {isRtl ? <ArrowRight size={14} className="inline me-1" /> : <ArrowLeft size={14} className="inline me-1" />}
            {t('checkout_continueShopping')}
          </Link>
        </main>
      </div>
    );
  }

  // ── Parse RPC error into a user-friendly message ──────────
  const parseRpcError = (msg, isRtl) => {
    if (!msg) return isRtl ? 'حدث خطأ غير متوقع' : 'Unexpected error occurred';
    if (msg.includes('OUT_OF_STOCK')) {
      // Extract product name from the error message
      const match = msg.match(/product "([^"]+)"/);
      const productName = match?.[1] ?? (isRtl ? 'أحد المنتجات' : 'a product');
      return isRtl
        ? `نفدت الكمية: "${productName}" غير متوفر بالكمية المطلوبة`
        : `Out of stock: "${productName}" doesn't have enough quantity`;
    }
    if (msg.includes('PRODUCT_NOT_FOUND')) {
      return isRtl
        ? 'أحد المنتجات في سلتك لم يعد متاحاً. يرجى تحديث السلة.'
        : 'A product in your cart is no longer available. Please update your cart.';
    }
    if (msg.includes('EMPTY_CART')) {
      return isRtl ? 'السلة فارغة' : 'Your cart is empty';
    }
    if (msg.includes('UNAUTHORIZED')) {
      return isRtl ? 'يرجى تسجيل الدخول أولاً' : 'Please log in first';
    }
    return msg;
  };

  const handlePay = async () => {
    // Guest guard — redirect to login
    if (!user) {
      navigate('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    setOrderError(null);

    const num = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: rpcData, error } = await supabase.rpc('place_order', {
      p_user_id:        user.id,
      p_order_number:   num,
      p_total:          grandTotal,
      p_delivery_total: deliveryTotal,
      p_pay_method:     payMethod,
      p_items:          items.map((i) => ({
        product_id:      i.id,
        name_ar:         i.name       ?? null,
        name_en:         i.nameEn     ?? null,
        price:           i.price + (i.chosenSize?.priceAdj ?? 0),
        qty:             i.qty,
        emoji:           i.emoji      ?? null,
        gradient:        i.gradient   ?? null,
        delivery_option: i.deliveryOption ?? null,
        delivery_price:  i.deliveryPrice  ?? 0,
      })),
    });

    if (error) {
      console.error('[Checkout] place_order RPC failed:', error);
      setOrderError(parseRpcError(error.message, isRtl));
      setLoading(false);
      return;
    }

    // Stamp producer_id on each order_item so sellers see it in their dashboard
    const orderId = rpcData?.order_id ?? null;
    const resolveOrderId = async () => {
      if (orderId) return orderId;
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', num)
        .single();
      return data?.id ?? null;
    };

    const resolvedOrderId = await resolveOrderId();
    if (resolvedOrderId) {
      await Promise.all(
        items
          .filter((i) => i.producerUserId)
          .map((i) =>
            supabase
              .from('order_items')
              .update({ producer_id: i.producerUserId })
              .eq('order_id', resolvedOrderId)
              .eq('product_id', i.id)
          )
      );
    }

    // RPC succeeded — cart was cleared server-side; clear local state too
    clearCart();
    setOrderNum(rpcData?.order_number ?? num);
    setDone(true);
    setLoading(false);
  };


  const canPay = payMethod !== 'card' || (
    card.number.replace(/\s/g, '').length >= 12 &&
    card.name.trim().length >= 2 &&
    card.expiry.length === 5 &&
    card.cvv.length >= 3
  );

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${isRtl ? 'text-right' : 'text-left'}`}>
      <Navbar t={t} dir={dir} isRtl={isRtl} toggle={toggle} step={done ? 'done' : 'form'} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16">
        {done ? (
          <SuccessScreen t={t} lang={lang} isRtl={isRtl} orderNum={orderNum} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start pt-6">

            {/* Left: payment section */}
            <div className="space-y-4">
              {/* Back to cart */}
              <Link
                to="/cart"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-700 font-semibold transition-colors"
              >
                {isRtl ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {t('checkout_backToCart')}
              </Link>

              {/* Payment method */}
              <PaymentSelector t={t} lang={lang} method={payMethod} setMethod={setPayMethod} />

              {/* Demo card fields */}
              {payMethod === 'card' && (
                <DemoCardFields t={t} lang={lang} card={card} setCard={setCard} />
              )}

              {/* Apple Pay note */}
              {payMethod === 'apple' && (
                <div className="bg-gray-900 text-white rounded-2xl p-4 flex items-center gap-3">
                  <Smartphone size={20} className="shrink-0" />
                  <p className="text-xs leading-relaxed">
                    {isRtl
                      ? 'سيتم توجيهك إلى Apple Pay عند تأكيد الطلب.'
                      : 'You will be redirected to Apple Pay on confirmation.'}
                  </p>
                </div>
              )}

              {/* Pay now button */}
              <button
                onClick={handlePay}
                disabled={loading || !canPay}
                className={`w-full py-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
                  ${loading || !canPay
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-sm'
                  }`}
              >
                {loading
                  ? <><Loader2 size={18} className="animate-spin" /> {t('checkout_processing')}</>
                  : <><Lock size={16} /> {t('checkout_payNow')} · {grandTotal.toFixed(0)} {t('cart_sar')}</>
                }
              </button>

              <p className="text-center text-[11px] text-gray-400 flex items-center justify-center gap-1">
                <Shield size={11} /> {t('checkout_secureNote')}
              </p>

              {orderError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-sm text-red-600 font-medium text-center">
                  {isRtl ? 'فشل في تسجيل الطلب: ' : 'Order failed: '}{orderError}
                </div>
              )}
            </div>

            {/* Right: order summary */}
            <div>
              <OrderSummaryPanel
                t={t}
                lang={lang}
                items={items}
                subtotal={subtotal}
                deliveryTotal={deliveryTotal}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
