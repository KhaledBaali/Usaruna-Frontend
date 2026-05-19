import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Search, Heart, Star, Menu, X,
  MapPin, Phone, Mail, ChevronLeft, ChevronRight, ChevronDown,
  Package, Shield, Truck, Award, Globe, Share2, AtSign, Clock, Zap,
} from 'lucide-react';
// Mock data removed in favor of live DB
import { useLang } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import { useWishlist } from './contexts/WishlistContext';
import { fetchProducts } from './lib/api';
import { supabase } from './supabase';
import AccountMenu from './AccountMenu';
const logo = '/logo.webp';
const heroHouse = '/hero-house.jpg';

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={13}
          className={n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function DeliveryTag({ isPerishable }) {
  const { t } = useLang();
  if (isPerishable) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1 w-fit">
        🛵 {t('tag_sellerDelivery')}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1 w-fit">
      📦 {t('tag_nationwide')}
    </span>
  );
}

function ProductCard({ product, onAddToCart }) {
  const { lang, t } = useLang();
  const { toggle, isLiked } = useWishlist();
  const liked    = isLiked(product.id);
  const [added,        setAdded]        = useState(false);
  const [imgError,     setImgError]     = useState(false);
  const [selectedSize,  setSelectedSize]  = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const navigate = useNavigate();

  const sizes  = Array.isArray(product.sizes)  ? product.sizes  : [];
  const colors = Array.isArray(product.colors) ? product.colors : [];
  const needsSize  = sizes.length  > 0;
  const needsColor = colors.length > 0;
  const canAdd = (!needsSize || selectedSize !== null) && (!needsColor || selectedColor !== null);

  const handleAdd = (e) => {
    e.stopPropagation();
    if (!canAdd) return;
    const chosenSize  = selectedSize  !== null ? sizes.find((s) => s.id === selectedSize)   ?? null : null;
    const chosenColor = selectedColor !== null ? colors.find((c) => c.id === selectedColor) ?? null : null;
    onAddToCart(product, 1, { chosenSize, chosenColor });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const goToProduct = () => navigate(`/product/${product.id}`);
  const name   = lang === 'ar' ? product.name   : (product.nameEn   || product.name);
  const badge  = lang === 'ar' ? product.badge  : (product.badgeEn  || product.badge);
  const city   = lang === 'ar' ? product.sellerCity : (product.sellerCityEn || product.sellerCity);
  const family = lang === 'ar' ? product.family : (product.familyEn || product.family);
  const hasRealImage = product.image_url && !imgError;
  const sizeAdj = selectedSize !== null ? (sizes.find((s) => s.id === selectedSize)?.priceAdj ?? 0) : 0;

  return (
    <div className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col">
      <div
        onClick={goToProduct}
        className={`relative bg-gradient-to-br ${product.gradient ?? 'from-blue-50 to-indigo-100'} h-44 sm:h-48 flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden`}
      >
        {hasRealImage ? (
          <img src={product.image_url} alt={name} onError={() => setImgError(true)}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <span className="text-6xl select-none drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
            {product.emoji ?? '📦'}
          </span>
        )}

        {/* Wishlist + badges row — always physical left */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10 flex-wrap max-w-[85%]" dir="ltr">
          <button
            onClick={(e) => { e.stopPropagation(); toggle(product); }}
            className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-sm hover:scale-110 transition-transform shrink-0"
            aria-label={t('card_wishlist')}
          >
            <Heart size={14} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
          </button>
          {(product.rating ?? 0) >= 4 && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-white/90 backdrop-blur-sm border border-amber-200 rounded-full px-2 py-1 shadow-sm">
              ⭐ {lang === 'ar' ? 'تقييم عالٍ' : 'Top Rated'}
            </span>
          )}
          {product.isReturnable && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-white/90 backdrop-blur-sm border border-emerald-200 rounded-full px-2 py-1 shadow-sm">
              🔄 {lang === 'ar' ? 'قابل للإرجاع' : 'Returnable'}
            </span>
          )}
          {product.isPerishable ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-white/90 backdrop-blur-sm border border-blue-200 rounded-full px-2 py-1 shadow-sm">
              🛵 {lang === 'ar' ? 'توصيل البائع' : 'Seller Delivery'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-white/90 backdrop-blur-sm border border-violet-200 rounded-full px-2 py-1 shadow-sm">
              📦 {lang === 'ar' ? 'شحن وطني' : 'Nationwide'}
            </span>
          )}
        </div>

        {badge && (
          <span className={`absolute top-3.5 right-3.5 ${product.badgeColor ?? 'bg-blue-600'} text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10`}>
            {badge}
          </span>
        )}
      </div>

      <div className="p-5 flex flex-col flex-1 gap-2">
        <h3 onClick={goToProduct}
          className="font-bold text-gray-800 text-sm leading-snug line-clamp-2 cursor-pointer hover:text-blue-700 transition-colors">
          {name}
        </h3>

        <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
          <MapPin size={11} className="shrink-0" />
          <span>{city || family || '—'}</span>
          {family && city && <span className="opacity-40">·</span>}
          {family && city && <span>{family}</span>}
        </p>

        {(product.reviews ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={product.rating ?? 0} />
            <span className="text-xs text-gray-400 font-medium">
              {Number(product.rating ?? 0).toFixed(1)} ({product.reviews})
            </span>
          </div>
        )}

        {/* Size selector */}
        {needsSize && (
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1">{lang === 'ar' ? 'الحجم' : 'Size'}</p>
            <div className="flex flex-wrap gap-1">
              {sizes.map((s) => (
                <button key={s.id} type="button"
                  onClick={(e) => { e.stopPropagation(); setSelectedSize(selectedSize === s.id ? null : s.id); }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors ${
                    selectedSize === s.id
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                  }`}>
                  {lang === 'ar' ? s.label : (s.labelEn || s.label)}
                  {s.priceAdj !== 0 && (
                    <span className={`ms-0.5 ${s.priceAdj > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {s.priceAdj > 0 ? '+' : ''}{s.priceAdj}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color selector */}
        {needsColor && (
          <div>
            <p className="text-[10px] font-bold text-gray-500 mb-1">{lang === 'ar' ? 'اللون' : 'Color'}</p>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <button key={c.id} type="button" title={lang === 'ar' ? c.label : (c.labelEn || c.label)}
                  onClick={(e) => { e.stopPropagation(); setSelectedColor(selectedColor === c.id ? null : c.id); }}
                  className={`w-5 h-5 rounded-full border-2 transition-transform hover:scale-110 ${
                    selectedColor === c.id ? 'border-blue-900 scale-110' : 'border-transparent'
                  }`}
                  style={{ background: c.hex }} />
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mt-auto pt-0.5">
          <span className="text-lg font-extrabold text-blue-900 leading-none">
            {(product.price + sizeAdj).toFixed(0)}
            <span className="text-sm font-bold"> {t('card_currency')}</span>
          </span>
          {product.originalPrice && (
            <span className="text-xs text-gray-400 line-through">
              {product.originalPrice} {t('card_currency')}
            </span>
          )}
        </div>

        <button onClick={handleAdd} disabled={!canAdd}
          className={`w-full py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2
            ${added
              ? 'bg-emerald-500 text-white scale-[0.97]'
              : canAdd
                ? 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.97]'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
        >
          <ShoppingCart size={14} />
          {added ? t('card_added')
            : needsSize && selectedSize === null ? (lang === 'ar' ? 'اختر الحجم' : 'Select Size')
            : needsColor && selectedColor === null ? (lang === 'ar' ? 'اختر اللون' : 'Select Color')
            : t('card_addToCart')}
        </button>
      </div>
    </div>
  );
}

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
      <div className="flex-1 h-px bg-gradient-to-l from-gray-200 to-transparent" />
    </div>
  );
}

// ─── HOME PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const { lang, dir, toggle, t } = useLang();
  const { addItem, totalCount } = useCart();

  const [searchQuery,    setSearchQuery]    = useState('');
  const [menuOpen,       setMenuOpen]       = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [currentCityAr,  setCurrentCityAr]  = useState('الرياض');
  const [locationOpen,   setLocationOpen]   = useState(false);
  // Start empty — real data comes from Supabase; mock PRODUCTS is only a fallback inside api.js
  const [products,        setProducts]        = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Maps a category slug to its display emoji — keeps emoji out of the DB schema
  const getCategoryEmoji = (slug) => {
    const map = { food: '🍛', sweets: '🍰', frozen: '❄️', spices: '🌿', crafts: '🧶' };
    return map[slug] ?? '📦';
  };

  // ─── Live data from Supabase ────────────────────────────────────────────────
  const [cities,       setCities]       = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [loadingMeta,  setLoadingMeta]  = useState(true);
  const [showAbout,    setShowAbout]    = useState(false);

  useEffect(() => {
    const fetchMeta = async () => {
      setLoadingMeta(true);
      try {
        const [
          { data: citiesData,     error: citiesError },
          { data: categoriesData, error: categoriesError },
        ] = await Promise.all([
          supabase.from('cities').select('id, name_ar, name_en, slug').order('id'),
          supabase.from('categories').select('id, name_ar, name_en, slug').order('id'),
        ]);

        if (citiesError)     console.error('Failed to fetch cities:', citiesError.message);
        else                 setCities(citiesData ?? []);

        if (categoriesError) console.error('Failed to fetch categories:', categoriesError.message);
        else                 setDbCategories(categoriesData ?? []);
      } catch (err) {
        console.error('Unexpected error fetching metadata:', err);
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMeta();
  }, []);

  // Fetch products from Supabase (falls back to static PRODUCTS inside api.js if DB unavailable)
  useEffect(() => {
    setLoadingProducts(true);
    fetchProducts()
      .then((data) => setProducts(data ?? []))
      .finally(() => setLoadingProducts(false));
  }, []);

  // One static UI-only entry prepended to the live DB categories
  const CATEGORIES = useMemo(() => [
    { slug: 'all',  name: t('cat_all'), emoji: null, special: false },
    ...dbCategories.map((cat) => ({
      slug:    cat.slug,
      name:    lang === 'ar' ? cat.name_ar : (cat.name_en ?? cat.name_ar),
      emoji:   getCategoryEmoji(cat.slug),
      special: false,
    })),
  ], [dbCategories, lang, t]);

  const currentCity        = cities.find((c) => c.name_ar === currentCityAr) ?? { name_ar: currentCityAr, name_en: currentCityAr };
  const currentCityDisplay = lang === 'ar' ? currentCity.name_ar : currentCity.name_en;

  const handleAddToCart = (product, qty = 1, meta = {}) => addItem(product, qty, meta);

  const { perishableInCity, nationwideProducts } = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const matchesSearch = (p) =>
      !query ||
      p.name?.toLowerCase().includes(query) ||
      p.nameEn?.toLowerCase().includes(query) ||
      p.family?.toLowerCase().includes(query) ||
      p.familyEn?.toLowerCase().includes(query);

    const matchesCat = (p) =>
      activeCategory === 'all' || p.category === activeCategory;

    const perishable = products.filter(
      (p) => p.deliveryTypes?.includes('seller_delivery') && p.sellerCity === currentCityAr && matchesSearch(p) && matchesCat(p),
    );
    const nationwide = products.filter(
      (p) => p.deliveryTypes?.includes('third_party') && matchesSearch(p) && matchesCat(p),
    );

    return { perishableInCity: perishable, nationwideProducts: nationwide };
  }, [currentCityAr, products, activeCategory, searchQuery]);

  const totalVisible = perishableInCity.length + nationwideProducts.length;

  const TRUST_FEATURES = [
    { Icon: Truck,   title: t('trust1_title'), desc: t('trust1_desc') },
    { Icon: Shield,  title: t('trust2_title'), desc: t('trust2_desc') },
    { Icon: Award,   title: t('trust3_title'), desc: t('trust3_desc') },
    { Icon: Package, title: t('trust4_title'), desc: t('trust4_desc') },
  ];

  const ChevronBack  = dir === 'rtl' ? ChevronLeft  : ChevronRight;
  const ChevronFront = dir === 'rtl' ? ChevronRight : ChevronLeft;

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>

      {/* ════════════════════ NAVBAR ════════════════════ */}
      <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">

        {/* Row 1 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">

          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt={t('brand_name')} className="w-15 h-10" />
            <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight font-brand">
              {t('brand_name')}
            </span>
          </a>

          {/* Search */}
          <div className="flex-1 max-w-2xl mx-auto">
            <div className="relative">
              <Search size={17} className={`absolute ${dir === 'rtl' ? 'right-3.5' : 'left-3.5'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
              <input
                type="text"
                placeholder={t('nav_search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full bg-gray-100 rounded-2xl py-2.5 ${dir === 'rtl' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors duration-200 hidden sm:flex items-center"
              aria-label="Switch language"
            >
              {t('nav_langToggle')}
            </button>

            <Link to="/cart" className="relative p-2.5 rounded-2xl hover:bg-gray-100 transition-colors" aria-label={t('nav_cart')}>
              <ShoppingCart size={21} className="text-blue-900" />
              {totalCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-emerald-500 text-white text-[10px] font-extrabold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {totalCount}
                </span>
              )}
            </Link>
            <AccountMenu />
            <button
              className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors sm:hidden"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t('nav_menu')}
            >
              {menuOpen ? <X size={21} className="text-blue-900" /> : <Menu size={21} className="text-blue-900" />}
            </button>
          </div>
        </div>

        {/* Row 2: location bar */}
        <div className="border-t border-gray-100 bg-blue-50/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-10 flex items-center justify-between gap-4">

            <div className="relative">
              <button
                onClick={() => setLocationOpen(!locationOpen)}
                className="flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl hover:bg-blue-100/80 transition-colors"
              >
                <MapPin size={14} className="text-blue-500 shrink-0" />
                <span className="text-gray-500 hidden sm:inline">{t('nav_deliverTo')}</span>
                <span className="font-bold text-blue-900">{currentCityDisplay}</span>
                <ChevronDown
                  size={13}
                  className={`text-blue-400 transition-transform duration-200 ${locationOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {locationOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setLocationOpen(false)} />
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 min-w-[170px] z-50 overflow-hidden">
                    {loadingMeta ? (
                      <div className="px-4 py-3 flex items-center gap-2.5 text-sm text-gray-400">
                        <div className="w-4 h-4 rounded-full border-2 border-blue-300 border-t-transparent animate-spin shrink-0" />
                        {lang === 'ar' ? 'جاري التحميل…' : 'Loading…'}
                      </div>
                    ) : (
                      cities.map((city) => (
                        <button
                          key={city.id}
                          onClick={() => { setCurrentCityAr(city.name_ar); setLocationOpen(false); }}
                          className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between gap-3
                            ${currentCityAr === city.name_ar
                              ? 'text-blue-900 font-bold bg-blue-50'
                              : 'text-gray-700 hover:bg-gray-50'
                            }`}
                        >
                          <span>{lang === 'ar' ? city.name_ar : city.name_en}</span>
                          {currentCityAr === city.name_ar && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 text-white text-[9px] font-black">✓</span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            {perishableInCity.length > 0 ? (
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                {perishableInCity.length} {t('loc_freshAvailable')} {currentCityDisplay}
              </p>
            ) : (
              <p className="text-xs text-amber-600 font-semibold hidden sm:flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {t('loc_noFreshDishes')} {currentCityDisplay} {t('loc_noFreshNow')}
              </p>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="sm:hidden bg-white border-t border-gray-100 px-5 py-1">
            {[t('nav_home'), t('nav_products'), t('nav_families'), t('nav_contact')].map((item) => (
              <button key={item} className="block w-full text-right text-gray-700 font-medium py-3 border-b border-gray-50 last:border-none hover:text-blue-600 transition-colors text-sm">
                {item}
              </button>
            ))}
            <button onClick={toggle} className="block w-full text-right text-blue-900 font-bold py-3 text-sm">
              {t('nav_langToggle')} — {lang === 'ar' ? 'English' : 'العربية'}
            </button>
          </nav>
        )}
      </header>

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        className="pt-[104px] overflow-hidden relative min-h-[560px] md:min-h-[620px] flex items-center bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroHouse})`,
          backgroundSize: '100% auto',
        }}
      >
        {/* Dark overlay */}
<div className="absolute inset-0 z-0 pointer-events-none" style={{ background: 'rgba(10,20,60,0.38)' }} />

{/* شلنا سطر الـ style من هنا عشان ما يغبش الصندوق كامل */}
<div className={`relative z-10 w-full max-w-4xl px-4 sm:px-6 py-16 md:py-24 text-center flex flex-col items-center ${lang === 'ar' ? 'mr-[8%] ml-auto' : 'ml-[8%] mr-auto'}`} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
  
  {/* 🎯 هذه هي دائرة التغبيش الجديدة (تقدر تتحكم فيها من هنا) */}
  <div 
    className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[-1] rounded-full pointer-events-none"
    style={{
      width: '600px', // 1. التحكم بالحجم (العرض)
      height: '600px', // 2. التحكم بالحجم (الطول - خله نفس العرض عشان تصير دائرة)
      
      // 3. التحكم باللون: استخدمنا تدرج دائري يبدأ بلون أزرق غامق بالمنتصف ويختفي بالأطراف
      background: 'radial-gradient(circle, rgba(10,20,60,0.6) 0%, rgba(10,20,60,0) 70%)',
      
      // 4. التحكم بقوة الغباش (الـ Blur)
      backdropFilter: 'blur(5px)',
      WebkitBackdropFilter: 'blur(5px)',
    }}
  />

  <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7">
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
    {t('hero_badge')}
  </span>
  <h1 className="text-4xl md:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.15] mb-5 text-white">
    {t('hero_title1')}
    <br />
    <span className="text-emerald-400">{t('hero_title2')}</span>
  </h1>
  <p className="text-blue-100 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
    {t('hero_subtitle')}
  </p>
  <div className="flex flex-wrap gap-3 justify-center">
    <button className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-900/30 flex items-center gap-2">
      {t('hero_shopNow')}
      <ChevronBack size={17} />
    </button>
    <Link to="/login" className="bg-white/10 hover:bg-white/[0.18] border border-white/20 text-white font-semibold px-8 py-3.5 rounded-2xl transition-all duration-200">
      {t('hero_joinFamily')}
    </Link>
  </div>
  <div className="flex flex-wrap gap-10 mt-11 pt-8 border-t border-white/10 justify-center w-full">
    {[
      { val: t('hero_stat1_val'), label: t('hero_stat1_label') },
      { val: t('hero_stat2_val'), label: t('hero_stat2_label') },
      { val: t('hero_stat3_val'), label: t('hero_stat3_label') },
    ].map((s) => (
      <div key={s.label}>
        <div className="text-[1.75rem] font-extrabold leading-none text-white">{s.val}</div>
        <div className="text-blue-300/80 text-sm mt-1.5">{s.label}</div>
      </div>
    ))}
  </div>
</div>

        <div className="absolute bottom-0 left-0 right-0 h-14 overflow-hidden z-10">
          <svg viewBox="0 0 1440 56" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0,28 C240,56 480,0 720,28 C960,56 1200,0 1440,28 L1440,56 L0,56 Z" fill="#f9fafb" />
          </svg>
        </div>
      </section>

      {/* ════════════════════ TRUST STRIP ════════════════════ */}
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

      {/* ════════════════════ CATEGORIES ════════════════════ */}
      <section className="py-10 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-5">
            <h2 className="text-xl font-extrabold text-gray-800">{t('section_browseCategories')}</h2>
          </div>

          {loadingMeta ? (
            <div className="flex gap-2.5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="shrink-0 h-10 w-28 rounded-2xl bg-gray-200 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2.5 overflow-x-auto pb-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]">
              {CATEGORIES.map((cat) => {
                const isActive = activeCategory === cat.slug;
                if (cat.special) {
                  return (
                    <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                      className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border
                        ${isActive ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'}`}
                    >
                      <span className="text-base">{cat.emoji}</span>
                      <span>{cat.name}</span>
                    </button>
                  );
                }
                return (
                  <button key={cat.slug} onClick={() => setActiveCategory(cat.slug)}
                    className={`shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-200 border
                      ${isActive ? 'bg-blue-900 text-white border-blue-900 shadow-md' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-200 hover:text-blue-700'}`}
                  >
                    {cat.emoji && <span className="text-base">{cat.emoji}</span>}
                    <span>{cat.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ════════════════════ PRODUCT GRID ════════════════════ */}
      <section className="py-14 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">

          <div className="mb-10">
            <h2 className="text-2xl font-extrabold text-gray-800">{t('section_featuredProducts')}</h2>
            <p className="text-gray-500 text-sm mt-1">
              {t('products_showing')}{' '}
              <span className="font-bold text-blue-700">{totalVisible}</span>
              {' '}{t('products_basedOnCity')} {currentCityDisplay}
            </p>
          </div>

          {/* Group 1: Perishable */}
          <div className="mb-12">
            <GroupHeader
              icon={Clock}
              title={`${t('group_freshIn')} ${currentCityDisplay}`}
              subtitle={t('group_freshSubtitle')}
              color="emerald"
            />

            {perishableInCity.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {perishableInCity.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 py-12 px-6 text-center">
                <div className="text-5xl mb-4 opacity-50">🍽️</div>
                <h4 className="font-bold text-gray-700 text-base mb-2">
                  {t('empty_noFreshIn')} {currentCityDisplay} {t('empty_noFreshNow')}
                </h4>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                  {t('empty_expanding')}{' '}
                  <button onClick={() => setCurrentCityAr('جدة')} className="text-blue-500 font-semibold underline underline-offset-2 hover:text-blue-700 transition-colors">
                    {lang === 'ar' ? 'جدة' : 'Jeddah'}
                  </button>
                  {' '}{t('empty_or')}{' '}
                  <button onClick={() => setCurrentCityAr('الرياض')} className="text-blue-500 font-semibold underline underline-offset-2 hover:text-blue-700 transition-colors">
                    {lang === 'ar' ? 'الرياض' : 'Riyadh'}
                  </button>
                  {' '}{t('empty_seeFreshDishes')}
                </p>
              </div>
            )}
          </div>

          {/* Group 2: Nationwide */}
          <div>
            <GroupHeader
              icon={Package}
              title={t('group_nationwide')}
              subtitle={t('group_nationwideSubtitle')}
              color="blue"
            />
            {loadingProducts ? (
              // Skeleton grid — 6 cards pulsing while Supabase responds
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
                    <div className="h-44 sm:h-48 bg-gray-100" />
                    <div className="p-5 flex flex-col gap-3">
                      <div className="h-4 bg-gray-100 rounded-full w-3/4" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/2" />
                      <div className="h-3 bg-gray-100 rounded-full w-1/3" />
                      <div className="h-8 bg-gray-100 rounded-2xl mt-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : nationwideProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
                {nationwideProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onAddToCart={handleAddToCart} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/60 py-16 px-6 text-center">
                <div className="text-5xl mb-4 opacity-40">📦</div>
                <h4 className="font-bold text-gray-700 text-base mb-2">
                  {lang === 'ar' ? 'لا توجد منتجات متوفرة حالياً' : 'No products available right now'}
                </h4>
                <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
                  {lang === 'ar'
                    ? 'سيتم إضافة منتجات جديدة قريباً من الأسر المنتجة.'
                    : 'New products from local families will be added soon.'}
                </p>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ════════════════════ CTA BANNER ════════════════════ */}
      <section className="py-20 bg-gradient-to-l from-emerald-600 to-blue-900 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="relative max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">{t('cta_title')}</h2>
          <p className="text-blue-100 text-lg mb-9 leading-relaxed">{t('cta_subtitle')}</p>
          <Link to="/login" className="inline-block bg-white text-blue-900 font-extrabold px-10 py-4 rounded-2xl hover:scale-[1.03] active:scale-[0.97] transition-all shadow-2xl text-base">
            {t('cta_button')}
          </Link>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer className="bg-blue-950 text-white pt-14 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src={logo} alt={t('brand_name')} className="w-15 h-10" />
                <span className="text-xl font-extrabold font-brand">{t('brand_name')}</span>
              </div>
              <p className="text-blue-300 text-sm leading-relaxed mb-5">{t('footer_brandDesc')}</p>
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
              <h4 className="font-bold text-sm mb-5">{t('footer_quickLinks')}</h4>
              <ul className="space-y-3">
                <li><Link to="/" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{t('footer_home')}</Link></li>
                <li><button onClick={() => setShowAbout(true)} className="text-blue-300 hover:text-emerald-400 text-sm transition-colors text-start">{t('footer_about')}</button></li>
              </ul>
            </div>

            {/* Seller links */}
            <div>
              <h4 className="font-bold text-sm mb-5">{t('footer_forFamilies')}</h4>
              <ul className="space-y-3">
                <li><Link to="/register-family" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{t('footer_registerFam')}</Link></li>
                <li><Link to="/dashboard" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{t('footer_dashboard')}</Link></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-bold text-sm mb-5">{t('footer_contactUs')}</h4>
              <ul className="space-y-3.5">
                {[
                  { Icon: Phone,  text: t('footer_phone'),   ltr: true  },
                  { Icon: Mail,   text: t('footer_email'),   ltr: true  },
                  { Icon: MapPin, text: t('footer_address'), ltr: false },
                ].map(({ Icon, text, ltr }) => (
                  <li key={text} className="flex items-start gap-2.5 text-blue-300 text-sm">
                    <Icon size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                    <span dir={ltr ? 'ltr' : undefined}>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-400 text-sm">
            <span>{t('footer_copyright')}</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">{t('footer_privacy')}</a>
              <a href="#" className="hover:text-white transition-colors">{t('footer_usageTerms')}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* About Usaruna modal */}
      {showAbout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowAbout(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowAbout(false)} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={22} />
            </button>
            <div className="flex items-center gap-3 mb-5">
              <img src={logo} alt={t('brand_name')} className="w-10 h-10" />
              <h2 className="text-xl font-extrabold font-brand text-gray-900">{t('brand_name')}</h2>
            </div>
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              {lang === 'ar'
                ? 'اسرنا منصة سعودية تربط المتسوقين بالأسر المنتجة المحلية في جميع أنحاء المملكة. نؤمن بأن أفضل المنتجات تُصنع بحب في البيوت السعودية.'
                : 'Usaruna is a Saudi platform connecting shoppers with local family producers across the Kingdom. We believe the best products are made with love in Saudi homes.'}
            </p>
            <ul className="space-y-2.5 text-sm text-gray-600">
              {(lang === 'ar' ? [
                '🏠 منتجات منزلية أصيلة من أسر سعودية',
                '🛵 توصيل محلي سريع أو شحن لجميع المدن',
                '✅ جودة مضمونة وتقييمات حقيقية',
                '💚 دعم مباشر للمشاريع العائلية الصغيرة',
              ] : [
                '🏠 Authentic homemade products from Saudi families',
                '🛵 Fast local delivery or nationwide shipping',
                '✅ Guaranteed quality with real customer reviews',
                '💚 Direct support for small family businesses',
              ]).map((item) => (
                <li key={item} className="flex items-start gap-2">{item}</li>
              ))}
            </ul>
            <div className="mt-6 pt-5 border-t border-gray-100 flex justify-end">
              <Link to="/register-family" onClick={() => setShowAbout(false)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
                {t('footer_registerFam')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}