import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from './supabase';
import {
  User, ShoppingBag, Heart, LogOut, Globe, ChevronLeft, ChevronRight,
  Package, MapPin, Star, ArrowLeft, ArrowRight, Clock, CheckCircle,
  Loader2, ShoppingCart,
} from 'lucide-react';
import { useLang } from './contexts/LanguageContext';
import { useAuth } from './contexts/AuthContext';
import { useWishlist } from './contexts/WishlistContext';
import { useCart } from './contexts/CartContext';
import AccountMenu from './AccountMenu';
import logo from './assets/logo.png';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

const T = {
  ar: {
    brand: 'اسرنا', pageTitle: 'حسابي',
    tab_profile: 'ملفي الشخصي', tab_orders: 'طلباتي', tab_wishlist: 'المفضلة',
    profile_title: 'معلومات الحساب',
    profile_name: 'الاسم', profile_email: 'البريد الإلكتروني',
    profile_member: 'عضو منذ',
    orders_title: 'طلباتي', orders_empty: 'لا توجد طلبات بعد',
    orders_emptyDesc: 'لم تُكمل أي طلب بعد. تصفح المنتجات وابدأ التسوق.',
    orders_num: 'رقم الطلب', orders_date: 'التاريخ',
    orders_total: 'المجموع', orders_status: 'الحالة',
    orders_confirmed: 'مؤكد', orders_items: 'منتج',
    wishlist_title: 'المفضلة', wishlist_empty: 'قائمة المفضلة فارغة',
    wishlist_emptyDesc: 'اضغط على أيقونة القلب في أي منتج لحفظه هنا.',
    addToCart: 'أضف للسلة', sar: 'ر.س',
    browse: 'تصفح المنتجات', logout: 'تسجيل الخروج',
    backToSite: 'العودة للموقع', langBtn: 'English',
  },
  en: {
    brand: 'Usaruna', pageTitle: 'My Account',
    tab_profile: 'Profile', tab_orders: 'Orders', tab_wishlist: 'Wishlist',
    profile_title: 'Account Information',
    profile_name: 'Name', profile_email: 'Email',
    profile_member: 'Member since',
    orders_title: 'My Orders', orders_empty: 'No orders yet',
    orders_emptyDesc: "You haven't completed any orders yet. Browse products and start shopping.",
    orders_num: 'Order #', orders_date: 'Date',
    orders_total: 'Total', orders_status: 'Status',
    orders_confirmed: 'Confirmed', orders_items: 'item(s)',
    wishlist_title: 'Wishlist', wishlist_empty: 'Your wishlist is empty',
    wishlist_emptyDesc: 'Tap the heart icon on any product to save it here.',
    addToCart: 'Add to Cart', sar: 'SAR',
    browse: 'Browse Products', logout: 'Sign Out',
    backToSite: 'Back to site', langBtn: 'العربية',
  },
};

// ─── NAVBAR ───────────────────────────────────────────────────────────────────

function Navbar({ lang, dir, toggleLang, t, totalCount }) {
  const isRtl = dir === 'rtl';
  const ChevBack = isRtl ? ChevronLeft : ChevronRight;
  return (
    <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt={t.brand} className="w-9 h-9 object-contain" />
          <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight font-brand">
            {t.brand}
          </span>
        </Link>

        <div className="flex-1 flex items-center gap-2">
          <User size={17} className="text-blue-900 shrink-0" />
          <h1 className="font-extrabold text-gray-800 text-base">{t.pageTitle}</h1>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors duration-200 hidden sm:flex items-center gap-1.5"
          >
            <Globe size={13} />
            {t.langBtn}
          </button>
          <Link to="/cart" className="relative p-2.5 rounded-2xl hover:bg-gray-100 transition-colors">
            <ShoppingCart size={21} className="text-blue-900" />
            {totalCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                {totalCount}
              </span>
            )}
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}

// ─── PROFILE TAB ──────────────────────────────────────────────────────────────

function ProfileTab({ user, displayName, t, lang }) {
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : '—';

  return (
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6">{t.profile_title}</h2>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Avatar banner */}
        <div className="bg-gradient-to-l from-blue-900 to-blue-800 h-24 flex items-end px-7 pb-0 relative">
          <div className="absolute -bottom-8 w-16 h-16 rounded-2xl bg-white shadow-md flex items-center justify-center border-4 border-white" style={{ [lang === 'ar' ? 'right' : 'left']: 28 }}>
            <User size={28} className="text-blue-900" />
          </div>
        </div>

        <div className="pt-12 px-7 pb-7 flex flex-col gap-5">
          <div className="flex flex-col gap-4">
            <Row label={t.profile_name}  value={displayName ?? '—'} />
            <Row label={t.profile_email} value={user?.email ?? '—'} />
            <Row label={t.profile_member} value={joinedDate} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-sm font-bold text-gray-800">{value}</p>
    </div>
  );
}

// ─── SHARED STATUS META ───────────────────────────────────────────────────────

const ORDER_STATUS_META = {
  pending:    { arLabel: 'معلق',         enLabel: 'Pending',    dotCls: 'bg-gray-400',    badgeCls: 'bg-gray-100 text-gray-600 border-gray-200' },
  confirmed:  { arLabel: 'مؤكد',         enLabel: 'Confirmed',  dotCls: 'bg-blue-500',    badgeCls: 'bg-blue-50 text-blue-700 border-blue-200'   },
  processing: { arLabel: 'قيد التجهيز', enLabel: 'Processing', dotCls: 'bg-amber-500',   badgeCls: 'bg-amber-50 text-amber-700 border-amber-200' },
  shipped:    { arLabel: 'تم الشحن',    enLabel: 'Shipped',    dotCls: 'bg-indigo-500',  badgeCls: 'bg-indigo-50 text-indigo-700 border-indigo-200'},
  delivered:  { arLabel: 'تم التوصيل', enLabel: 'Delivered',  dotCls: 'bg-emerald-500', badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200'},
  cancelled:  { arLabel: 'ملغي',        enLabel: 'Cancelled',  dotCls: 'bg-red-400',     badgeCls: 'bg-red-50 text-red-600 border-red-200'      },
};

const DELIVERY_OPTION_ICON = { fast: '⚡', pickup: '🏠', nationwide: '🚚', seller_delivery: '🛵', third_party: '📦' };

// Status priority for deriving the 'worst' status across all items in one order
// Used to tint the order-card top stripe without a single canonical status
const STATUS_PRIORITY = {
  cancelled: 0, pending: 1, processing: 2, confirmed: 3, shipped: 4, delivered: 5,
};
function deriveOrderStripeStatus(items) {
  if (!items?.length) return 'confirmed';
  // Show the 'lowest priority' (least complete) item status
  return items.reduce((worst, item) => {
    const itemStatus = item.status ?? 'confirmed';
    return (STATUS_PRIORITY[itemStatus] ?? 3) < (STATUS_PRIORITY[worst] ?? 3)
      ? itemStatus : worst;
  }, 'delivered');
}

function OrderStatusBadge({ status, lang }) {
  const m = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.confirmed;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${m.badgeCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dotCls} shrink-0`} />
      {lang === 'ar' ? m.arLabel : m.enLabel}
    </span>
  );
}

// ─── ORDERS TAB ───────────────────────────────────────────────────────────────

function OrdersTab({ t, lang, isRtl, user }) {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const toggleExpand = (id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={28} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-6">{t.orders_title}</h2>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
            <ShoppingBag size={32} className="text-blue-200" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-700 mb-2">{t.orders_empty}</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">{t.orders_emptyDesc}</p>
          <Link to="/" className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-7 py-3 rounded-2xl transition-colors flex items-center gap-2">
            {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            {t.browse}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6">{t.orders_title}</h2>
      <div className="flex flex-col gap-4">
        {orders.map((order) => {
          const date = new Date(order.created_at).toLocaleDateString(
            lang === 'ar' ? 'ar-SA' : 'en-US',
            { year: 'numeric', month: 'short', day: 'numeric' }
          );
          const stripeStatus = deriveOrderStripeStatus(order.order_items);
          const statusMeta = ORDER_STATUS_META[stripeStatus] ?? ORDER_STATUS_META.confirmed;
          const isOpen     = !!expanded[order.id];
          const itemCount  = order.order_items?.length ?? 0;

          return (
            <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

              {/* Status stripe */}
              <div className={`h-1 w-full ${statusMeta.dotCls}`} />

              {/* Order header */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-xs font-bold text-blue-700 mb-0.5">
                      {t.orders_num}{order.order_number}
                    </p>
                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />{date}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* No single order-level badge — per-item badges shown inside */}
                    <span className="text-[11px] text-gray-400 font-medium">
                      {lang === 'ar' ? `${itemCount} منتج` : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                    </span>
                    <span className="text-base font-extrabold text-blue-900">
                      {Number(order.total_amount ?? 0).toFixed(0)}
                      <span className="text-sm font-bold ms-1">{t.sar}</span>
                    </span>
                  </div>
                </div>

                {/* Expand/collapse items */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                >
                  {isOpen
                    ? (lang === 'ar' ? 'إخفاء المنتجات' : 'Hide items')
                    : (lang === 'ar' ? `عرض ${itemCount} منتج` : `Show ${itemCount} item${itemCount !== 1 ? 's' : ''}`)}
                  <ChevronRight
                    size={13}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : (isRtl ? '' : '')}`}
                  />
                </button>
              </div>

              {/* Items list — collapsible */}
              {isOpen && (
                <div className="border-t border-gray-50 px-5 pb-5 pt-4 flex flex-col gap-3">
                  {order.order_items?.map((item) => {
                    const name      = lang === 'ar' ? item.name_ar : (item.name_en || item.name_ar);
                    const lineTotal = (item.price_at_purchase ?? 0) * (item.quantity ?? 1);
                    const delivOpt  = item.delivery_option;
                    const delivIcon = delivOpt ? (DELIVERY_OPTION_ICON[delivOpt] ?? '📦') : null;
                    const delivLabel = delivOpt === 'fast'
                      ? (lang === 'ar' ? 'توصيل سريع' : 'Fast Delivery')
                      : delivOpt === 'pickup'
                      ? (lang === 'ar' ? 'استلام شخصي' : 'Pickup')
                      : delivOpt
                      ? (lang === 'ar' ? 'شحن وطني' : 'Nationwide')
                      : null;

                    return (
                      <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                        {/* Emoji thumbnail */}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${item.gradient ?? 'from-blue-50 to-indigo-100'} flex items-center justify-center text-lg shrink-0 mt-0.5`}>
                          {item.emoji ?? '📦'}
                        </div>

                        {/* Product info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-xs text-gray-500">
                              ×{item.quantity} · {Number(item.price_at_purchase ?? 0).toFixed(0)} {t.sar}
                            </span>
                            {delivLabel && (
                              <span className="text-[10px] text-gray-400 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                                {delivIcon} {delivLabel}
                              </span>
                            )}
                          </div>
                          {/* ← Per-item status badge */}
                          <div className="mt-1.5">
                            <OrderStatusBadge status={item.status ?? 'confirmed'} lang={lang} />
                          </div>
                        </div>

                        {/* Line total */}
                        <p className="text-sm font-extrabold text-blue-900 shrink-0 mt-0.5">
                          {lineTotal.toFixed(0)} <span className="text-xs font-bold">{t.sar}</span>
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── WISHLIST TAB ─────────────────────────────────────────────────────────────

function WishlistTab({ t, lang, isRtl }) {
  const { items, toggle } = useWishlist();
  const { addItem } = useCart();
  const [added, setAdded] = useState({});

  const handleAdd = (product) => {
    addItem(product);
    setAdded((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAdded((prev) => ({ ...prev, [product.id]: false })), 1600);
  };

  if (!items.length) {
    return (
      <div className="max-w-xl mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-800 mb-6">{t.wishlist_title}</h2>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center mb-5">
            <Heart size={32} className="text-rose-200" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-700 mb-2">{t.wishlist_empty}</h3>
          <p className="text-sm text-gray-400 mb-6 max-w-xs leading-relaxed">{t.wishlist_emptyDesc}</p>
          <Link
            to="/"
            className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-7 py-3 rounded-2xl transition-colors flex items-center gap-2"
          >
            {isRtl ? <ArrowRight size={15} /> : <ArrowLeft size={15} />}
            {t.browse}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-6">{t.wishlist_title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((product) => {
          const name    = lang === 'ar' ? product.name    : (product.nameEn    || product.name);
          const family  = lang === 'ar' ? product.family  : (product.familyEn  || product.family);
          const city    = lang === 'ar' ? product.sellerCity : (product.sellerCityEn || product.sellerCity);
          const isAdded = added[product.id];

          return (
            <div key={product.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
              {/* Thumbnail */}
              <Link to={`/product/${product.id}`} className={`relative h-36 bg-gradient-to-br ${product.gradient ?? 'from-blue-50 to-indigo-100'} flex items-center justify-center`}>
                {product.image_url ? (
                  <img src={product.image_url} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl">{product.emoji ?? '📦'}</span>
                )}
                <button
                  onClick={(e) => { e.preventDefault(); toggle(product); }}
                  className="absolute top-3 right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
                >
                  <Heart size={14} className="fill-red-500 text-red-500" />
                </button>
              </Link>

              {/* Info */}
              <div className="p-4 flex flex-col gap-2 flex-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 hover:text-blue-700 transition-colors">
                    {name}
                  </h3>
                </Link>
                {(family || city) && (
                  <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                    <MapPin size={10} className="shrink-0" />
                    {[family, city].filter(Boolean).join(' · ')}
                  </p>
                )}
                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-lg font-extrabold text-blue-900">
                    {product.price} <span className="text-sm font-bold">{t.sar}</span>
                  </span>
                  <button
                    onClick={() => handleAdd(product)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200
                      ${isAdded ? 'bg-emerald-500 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white'}`}
                  >
                    <ShoppingCart size={12} />
                    {isAdded ? '✓' : t.addToCart}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

export default function CustomerDashboard() {
  const { lang, dir, toggle: toggleLang, t: globalT } = useLang();
  const { user, logout, displayName, loadingAuth } = useAuth();
  const { totalCount } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const dashLang = lang;
  const t        = T[dashLang] ?? T.ar;
  const isRtl    = dir === 'rtl';

  const TAB_PARAM = searchParams.get('tab') ?? 'profile';
  const setTab    = (tab) => setSearchParams({ tab }, { replace: true });

  const TABS = [
    { id: 'profile',  label: t.tab_profile,  Icon: User        },
    { id: 'orders',   label: t.tab_orders,   Icon: ShoppingBag },
    { id: 'wishlist', label: t.tab_wishlist,  Icon: Heart       },
  ];

  useEffect(() => {
    if (!loadingAuth && !user) navigate('/login');
  }, [loadingAuth, user, navigate]);

  if (loadingAuth) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 size={32} className="animate-spin text-blue-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${isRtl ? 'text-right' : 'text-left'}`}>
      <Navbar lang={lang} dir={dir} toggleLang={toggleLang} t={t} totalCount={totalCount} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 flex flex-col md:flex-row gap-6 items-start">

        {/* ── Sidebar ── */}
        <aside className="w-full md:w-60 shrink-0">
          {/* User card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 mb-4">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-14 h-14 bg-blue-900 rounded-2xl flex items-center justify-center">
                <User size={26} className="text-white" />
              </div>
              <div>
                <p className="font-extrabold text-gray-800 text-sm truncate max-w-[150px]">{displayName}</p>
                <p className="text-[11px] text-gray-400 truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Nav tabs */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {TABS.map(({ id, label, Icon }) => {
              const active = TAB_PARAM === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold transition-colors text-start
                    ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                >
                  <Icon size={15} className={active ? 'text-blue-600' : 'text-gray-400'} />
                  {label}
                </button>
              );
            })}
            <div className="border-t border-gray-100">
              <button
                onClick={async () => { await logout(); navigate('/'); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors text-start"
              >
                <LogOut size={15} className="text-red-400" />
                {t.logout}
              </button>
            </div>
          </div>

          <Link
            to="/"
            className="mt-4 flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium px-1"
          >
            {isRtl ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
            {t.backToSite}
          </Link>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 pt-4">
          {TAB_PARAM === 'profile'  && <ProfileTab  user={user} displayName={displayName} t={t} lang={lang} />}
          {TAB_PARAM === 'orders'   && <OrdersTab   t={t} lang={lang} isRtl={isRtl} user={user} />}
          {TAB_PARAM === 'wishlist' && <WishlistTab  t={t} lang={lang} isRtl={isRtl} />}
        </main>
      </div>
    </div>
  );
}
