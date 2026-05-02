import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, User, Heart, Star, Menu, X,
  MapPin, Phone, Mail, ChevronLeft, ChevronDown, Package, Shield,
  Truck, Award, Globe, Share2, AtSign, Clock,
} from 'lucide-react';
import { PRODUCTS } from './products';

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة',
  'الدمام', 'القصيم', 'تبوك', 'أبها', 'حائل', 'ينبع',
];

const CATEGORIES = [
  { id: 0, name: 'الكل',             emoji: null,  special: false },
  { id: 1, name: 'توصيل سريع',      emoji: '⚡',  special: true  },
  { id: 2, name: 'أطباق رئيسية',    emoji: '🍛',  special: false },
  { id: 3, name: 'حلويات ومخبوزات', emoji: '🍰',  special: false },
  { id: 4, name: 'مفرزنات',         emoji: '❄️',  special: false },
  { id: 5, name: 'بهارات وعطارة',   emoji: '🌿',  special: false },
  { id: 6, name: 'مشغولات يدوية',   emoji: '🧶',  special: false },
];


const TRUST_FEATURES = [
  { Icon: Truck,   title: 'توصيل سريع',  desc: 'الأطباق الطازجة خلال 1-2 ساعة' },
  { Icon: Shield,  title: 'ضمان الجودة', desc: 'منتجات طازجة ومضمونة' },
  { Icon: Award,   title: 'أسر موثوقة',  desc: '+500 أسرة منتجة معتمدة' },
  { Icon: Package, title: 'شحن وطني',    desc: 'لجميع مدن المملكة خلال 48 ساعة' },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          className={
            n <= Math.round(rating)
              ? 'text-amber-400 fill-amber-400'
              : 'text-gray-200 fill-gray-200'
          }
        />
      ))}
    </div>
  );
}

/**
 * DeliveryTag — derived entirely from isPerishable.
 * Perishable  → green  "🕒 توصيل سريع خلال 1-2 ساعة"
 * Non-perishable → blue "📦 شحن لجميع مدن المملكة (24-48 ساعة)"
 */
function DeliveryTag({ isPerishable }) {
  if (isPerishable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 w-fit">
        <Clock size={11} className="shrink-0" />
        توصيل سريع خلال 1-2 ساعة
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 w-fit">
      📦 شحن لجميع مدن المملكة
    </span>
  );
}

function ProductCard({ product, onAddToCart }) {
  const [liked, setLiked] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const goToProduct = () => navigate(`/product/${product.id}`);

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col">
      {/* Image area */}
      <div
        onClick={goToProduct}
        className={`relative bg-gradient-to-br ${product.gradient} h-44 sm:h-48 flex items-center justify-center flex-shrink-0 cursor-pointer`}
      >
        <span className="text-6xl select-none drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
          {product.emoji}
        </span>
        {product.badge && (
          <span className={`absolute top-3.5 right-3.5 ${product.badgeColor} text-white text-[11px] font-bold px-2.5 py-1 rounded-full`}>
            {product.badge}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-3.5 left-3.5 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm hover:scale-110 transition-transform"
          aria-label="إضافة للمفضلة"
        >
          <Heart size={14} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1 gap-2.5">
        <h3
          onClick={goToProduct}
          className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-blue-700 transition-colors"
        >
          {product.name}
        </h3>

        <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
          <MapPin size={11} className="shrink-0" />
          {product.family} · {product.sellerCity}
        </p>

        {/* Tag is computed from isPerishable — no static delivery object needed */}
        <DeliveryTag isPerishable={product.isPerishable} />

        <div className="flex items-center gap-1.5">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-400">({product.reviews})</span>
        </div>

        <div className="flex items-center gap-2 mt-auto pt-0.5">
          <span className="text-lg font-extrabold text-blue-900 leading-none">
            {product.price}
            <span className="text-sm font-bold"> ر.س</span>
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {product.originalPrice} ر.س
            </span>
          )}
        </div>

        <button
          onClick={handleAdd}
          className={`w-full py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
            ${added
              ? 'bg-emerald-500 text-white scale-[0.97]'
              : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.97]'
            }`}
        >
          <ShoppingCart size={14} />
          {added ? 'تمت الإضافة ✓' : 'أضف للسلة'}
        </button>
      </div>
    </div>
  );
}

/** Divider header used between the two product groups */
function GroupHeader({ icon: Icon, title, subtitle, color }) {
  const iconBg   = color === 'emerald' ? 'bg-emerald-100' : 'bg-blue-100';
  const iconText = color === 'emerald' ? 'text-emerald-600' : 'text-blue-600';
  const subText  = color === 'emerald' ? 'text-emerald-600' : 'text-blue-500';
  return (
    <div className="flex items-center gap-4 mb-5">
      <div className="flex items-center gap-3 shrink-0">
        <div className={`w-9 h-9 rounded-2xl ${iconBg} flex items-center justify-center`}>
          <Icon size={17} className={iconText} />
        </div>
        <div>
          <h3 className="font-bold text-[15px] text-gray-800">{title}</h3>
          <p className={`text-xs font-medium mt-0.5 ${subText}`}>{subtitle}</p>
        </div>
      </div>
      {/* Fade-out rule line */}
      <div className="flex-1 h-px bg-gradient-to-l from-gray-200 to-transparent" />
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [cartCount,      setCartCount]      = useState(0);
  const [searchQuery,    setSearchQuery]    = useState('');
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  // currentCity is the single source of truth for geolocation filtering
  const [currentCity,    setCurrentCity]    = useState('جدة');
  const [locationOpen,   setLocationOpen]   = useState(false);

  const handleAddToCart = () => setCartCount((c) => c + 1);

  // ── Core Filtering Algorithm ────────────────────────────────────────────────
  // Rule 1: isPerishable === true  → show ONLY when sellerCity === currentCity
  // Rule 2: isPerishable === false → show NATIONWIDE (always visible)
  const { perishableInCity, nationwideProducts } = useMemo(() => ({
    perishableInCity:   PRODUCTS.filter((p) =>  p.isPerishable && p.sellerCity === currentCity),
    nationwideProducts: PRODUCTS.filter((p) => !p.isPerishable),
  }), [currentCity]);

  const totalVisible = perishableInCity.length + nationwideProducts.length;

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-right">

      {/* ════════════════════════════════════════════════════════
          NAVBAR  (two rows — total height ≈ 104 px)
      ════════════════════════════════════════════════════════ */}
      <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">

        {/* ── Row 1: main nav ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* Logo – rightmost in RTL */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-900 to-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-lg leading-none">أ</span>
            </div>
            <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight">أسرنا</span>
          </a>

          {/* Search – center */}
          <div className="flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <Search size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="ابحث عن أكلة، حلوى، أو أسرة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-2xl py-2.5 pr-10 pl-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Actions – leftmost in RTL */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button className="relative p-2.5 rounded-2xl hover:bg-gray-100 transition-colors" aria-label="السلة">
              <ShoppingCart size={21} className="text-blue-900" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {cartCount}
                </span>
              )}
            </button>
            <button className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors hidden sm:flex" aria-label="الحساب">
              <User size={21} className="text-blue-900" />
            </button>
            <button
              className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors sm:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="القائمة"
            >
              {menuOpen ? <X size={21} className="text-blue-900" /> : <Menu size={21} className="text-blue-900" />}
            </button>
          </div>
        </div>

        {/* ── Row 2: location bar — selecting a city re-runs the useMemo filter ── */}
        <div className="border-t border-gray-100 bg-blue-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">

            {/* City picker (right in RTL) */}
            <div className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl hover:bg-blue-100/80 transition-colors"
              >
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <span className="text-gray-500 hidden sm:inline">التوصيل إلى:</span>
                <span className="font-bold text-blue-900">{currentCity}</span>
                <ChevronDown
                  size={13}
                  className={`text-blue-400 transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {locationOpen && (
                <>
                  {/* invisible backdrop closes dropdown on outside click */}
                  <div className="fixed inset-0 z-40" onClick={() => setLocationOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 min-w-[170px] z-50 overflow-hidden">
                    {CITIES.map((city) => (
                      <button
                        key={city}
                        onClick={() => { setCurrentCity(city); setLocationOpen(false); }}
                        className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3
                          ${currentCity === city
                            ? 'text-blue-900 font-bold bg-blue-50'
                            : 'text-gray-700 hover:bg-gray-50'
                          }`}
                      >
                        <span>{city}</span>
                        {currentCity === city && (
                          <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white text-[9px] font-black">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Dynamic status — count driven by the filtered data (left in RTL) */}
            {perishableInCity.length > 0 ? (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                {perishableInCity.length} طبخة طازجة متاحة الآن في {currentCity}
              </p>
            ) : (
              <p className="text-xs text-amber-600 font-semibold hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                لا توجد أطباق طازجة في {currentCity} حالياً
              </p>
            )}
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {menuOpen && (
          <nav className="sm:hidden bg-white border-t border-gray-100 px-5 py-1">
            {['الرئيسية', 'المنتجات', 'الأسر المنتجة', 'تواصل معنا'].map((item) => (
              <button key={item} className="block w-full text-right text-gray-700 font-medium py-3 border-b border-gray-50 last:border-none hover:text-blue-600 transition-colors text-sm">
                {item}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════
          HERO  (pt-[104px] = 64 navbar + 40 location bar)
      ════════════════════════════════════════════════════════ */}
      <section className="pt-[104px] bg-gradient-to-bl from-blue-950 via-blue-900 to-blue-800 overflow-hidden relative">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-96 h-96 bg-blue-400 rounded-full opacity-[0.15] blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-52 h-52 bg-emerald-400 rounded-full opacity-[0.07] blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="flex flex-col-reverse md:flex-row items-center gap-12 md:gap-16">

            {/* Illustration – left in RTL */}
            <div className="flex-1 flex justify-center md:justify-start">
              <div className="relative w-64 h-64 md:w-[340px] md:h-[340px]">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 rounded-full blur-2xl" />
                <div className="absolute inset-5 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 shadow-inner">
                  <div className="grid grid-cols-2 gap-3 p-4">
                    {[
                      { emoji: '🍯', bg: 'bg-amber-50',  label: 'عسل طبيعي'   },
                      { emoji: '🧆', bg: 'bg-orange-50', label: 'أكلات شعبية'  },
                      { emoji: '🧶', bg: 'bg-blue-50',   label: 'مشغولات'      },
                      { emoji: '🌿', bg: 'bg-green-50',  label: 'أعشاب'        },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`${item.bg} rounded-2xl p-3.5 flex flex-col items-center gap-1.5 shadow-sm hover:scale-105 transition-transform duration-200 cursor-default`}
                      >
                        <span className="text-3xl">{item.emoji}</span>
                        <span className="text-[10px] font-bold text-gray-700 whitespace-nowrap">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Text – right in RTL */}
            <div className="flex-1 text-white">
              <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                منصة الأسر المنتجة السعودية
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.15] mb-5">
                ادعم المشاريع
                <br />
                <span className="text-emerald-400">العائلية المحلية</span>
              </h1>
              <p className="text-blue-200 text-base md:text-lg leading-relaxed mb-8 max-w-md">
                اكتشف منتجات أصيلة مصنوعة بحب وإتقان من أسر سعودية منتجة.
                طعم البيت، جودة لا تُضاهى، وقصة خلف كل منتج.
              </p>
              <div className="flex flex-wrap gap-3">
                <button className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/30 flex items-center gap-2">
                  تسوّق الآن
                  <ChevronLeft size={17} />
                </button>
                <button className="bg-white/10 hover:bg-white/[0.18] border border-white/20 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-200">
                  انضم كأسرة منتجة
                </button>
              </div>
              <div className="flex flex-wrap gap-10 mt-11 pt-8 border-t border-white/10">
                {[
                  { val: '+500',    label: 'أسرة منتجة' },
                  { val: '+8,000',  label: 'منتج متاح'  },
                  { val: '+15,000', label: 'عميل سعيد'  },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="text-[1.75rem] font-extrabold leading-none">{s.val}</div>
                    <div className="text-blue-300/80 text-sm mt-1.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Wave transition */}
        <div className="relative h-14 overflow-hidden">
          <svg viewBox="0 0 1440 56" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          TRUST STRIP
      ════════════════════════════════════════════════════════ */}
      <section className="bg-white py-10 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {TRUST_FEATURES.map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                <Icon size={22} className="text-blue-700" />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-800">{title}</div>
                <div className="text-xs text-gray-500 mt-0.5 leading-snug">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CATEGORIES STRIP
      ════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-extrabold text-gray-800">تصفح الفئات</h2>
            <button className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors">
              <ChevronLeft size={15} />
              عرض الكل
            </button>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              if (cat.special) {
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border
                      ${isActive
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                );
              }
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border
                    ${isActive
                      ? 'bg-blue-900 text-white border-blue-900 shadow-md'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-700'
                    }`}
                >
                  {cat.emoji && <span className="text-base">{cat.emoji}</span>}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          SMART PRODUCT GRID  (two groups, city-driven)
      ════════════════════════════════════════════════════════ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          {/* Section header with live product count */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-800">منتجات مميزة</h2>
              <p className="text-gray-500 text-sm mt-1">
                عرض{' '}
                <span className="font-bold text-blue-700">{totalVisible}</span>
                {' '}منتج بناءً على موقعك في {currentCity}
              </p>
            </div>
            <button className="text-blue-600 text-sm font-semibold flex items-center gap-1 hover:text-blue-800 transition-colors shrink-0">
              <ChevronLeft size={15} />
              عرض الكل
            </button>
          </div>

          {/* ── Group 1: Perishable / Local ─────────────────────────────────── */}
          <div className="mb-12">
            <GroupHeader
              icon={Clock}
              title={`أطباق طازجة في ${currentCity}`}
              subtitle="توصيل سريع خلال 1-2 ساعة فقط"
              color="emerald"
            />

            {perishableInCity.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {perishableInCity.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            ) : (
              /* Empty state when no local fresh food exists for this city */
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 py-12 px-6 text-center">
                <div className="text-5xl mb-4 opacity-50">🍽️</div>
                <h4 className="font-bold text-gray-700 text-base mb-2">
                  لا توجد أطباق طازجة في {currentCity} حالياً
                </h4>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                  نعمل على توسعة شبكة أسرنا في مدينتك. جرّب اختيار{' '}
                  <button
                    onClick={() => setCurrentCity('جدة')}
                    className="text-blue-500 font-semibold underline underline-offset-2 hover:text-blue-700 transition-colors"
                  >
                    جدة
                  </button>
                  {' '}أو{' '}
                  <button
                    onClick={() => setCurrentCity('الرياض')}
                    className="text-blue-500 font-semibold underline underline-offset-2 hover:text-blue-700 transition-colors"
                  >
                    الرياض
                  </button>
                  {' '}لرؤية الأطباق الطازجة المتاحة.
                </p>
              </div>
            )}
          </div>

          {/* ── Group 2: Non-Perishable / Nationwide ────────────────────────── */}
          <div>
            <GroupHeader
              icon={Package}
              title="منتجات تصلك أينما كنت"
              subtitle={`شحن لجميع مدن المملكة · 24-48 ساعة`}
              color="blue"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
              {nationwideProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          CTA BANNER
      ════════════════════════════════════════════════════════ */}
      <section className="py-20 bg-gradient-to-l from-emerald-600 to-blue-900 text-white text-center relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">هل أنتِ أسرة منتجة؟</h2>
          <p className="text-blue-100 text-lg mb-9 leading-relaxed">
            انضمي إلى أكثر من 500 أسرة تبيع منتجاتها عبر أسرنا وابدئي رحلة نجاحك اليوم.
            التسجيل مجاني ولا يستغرق سوى دقيقتين.
          </p>
          <button className="bg-white text-blue-900 font-extrabold px-10 py-4 rounded-2xl hover:scale-[1.03] active:scale-[0.97] transition-all shadow-2xl text-base">
            سجّلي أسرتك مجاناً ←
          </button>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════════ */}
      <footer className="bg-blue-950 text-white pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-emerald-400 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-extrabold text-lg leading-none">أ</span>
                </div>
                <span className="text-xl font-extrabold">أسرنا</span>
              </div>
              <p className="text-blue-300 text-sm leading-relaxed mb-5">
                منصة تجمع الأسر المنتجة السعودية مع المستهلكين الباحثين عن أصالة وجودة.
              </p>
              <div className="flex gap-2">
                {[Globe, Share2, AtSign].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-xl bg-blue-900 hover:bg-emerald-600 flex items-center justify-center transition-colors duration-200">
                    <Icon size={16} />
                  </button>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="font-bold text-sm mb-5">روابط سريعة</h4>
              <ul className="space-y-3">
                {['الرئيسية', 'المنتجات', 'الأسر المنتجة', 'المدونة', 'عن أسرنا'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Seller links */}
            <div>
              <h4 className="font-bold text-sm mb-5">للأسر المنتجة</h4>
              <ul className="space-y-3">
                {['سجّل أسرتك', 'لوحة التحكم', 'الشروط والأحكام', 'الدعم الفني', 'الأسئلة الشائعة'].map((link) => (
                  <li key={link}>
                    <a href="#" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm mb-5">تواصل معنا</h4>
              <ul className="space-y-3.5">
                {[
                  { Icon: Phone,  text: '+966 50 000 0000',              ltr: true  },
                  { Icon: Mail,   text: 'hello@usaruna.sa',               ltr: true  },
                  { Icon: MapPin, text: 'الرياض، المملكة العربية السعودية', ltr: false },
                ].map(({ Icon, text, ltr }) => (
                  <li key={text} className="flex items-start gap-2.5 text-blue-300 text-sm">
                    <Icon size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span dir={ltr ? 'ltr' : 'rtl'}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-400 text-sm">
            <span>© 2025 أسرنا. جميع الحقوق محفوظة.</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
