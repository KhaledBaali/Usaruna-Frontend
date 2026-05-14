import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Star, Heart, MapPin, Clock, Package,
  ChevronRight, ChevronLeft, Minus, Plus, Share2,
  Shield, Truck, Award, Phone, ThumbsUp, CheckCircle,
  Globe, AtSign, Mail, Filter, XCircle, RotateCcw, User,
  Wand2, Copy, Check, Loader2,
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import { PRODUCTS } from './products';
import { useLang } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';
import { fetchProductById, fetchReviews, submitReview, MOCK_REVIEWS } from './lib/api';
import { summarizeReviews, getSmartReply, enhanceDescription } from './lib/aiApi';
import logo from './assets/logo.png';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function StarRating({ rating, size = 14 }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size}
          className={n <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </div>
  );
}

function DeliveryTag({ isPerishable }) {
  const { t } = useLang();
  return isPerishable ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 w-fit">
      <Clock size={13} className="shrink-0" />{t('tag_fastDelivery')}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 w-fit">
      📦 {t('tag_nationwide')}
    </span>
  );
}

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-6 left-6 z-[200] flex flex-col gap-2 pointer-events-none" dir="ltr">
      {toasts.slice(-4).map((t) => (
        <div key={t.id}
          className={`toast-in pointer-events-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-white text-sm font-bold min-w-[200px] max-w-[290px]
            ${t.type === 'cart'     ? 'bg-blue-900'
            : t.type === 'wishlist' ? 'bg-rose-500'
            : t.type === 'review'   ? 'bg-emerald-600'
            : t.type === 'share'    ? 'bg-gray-700'
            :                         'bg-emerald-500'}`}
        >
          <span className="text-base leading-none shrink-0">{t.icon}</span>
          <span className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const { id }           = useParams();
  const navigate         = useNavigate();
  const { lang, dir, toggle, t } = useLang();
  const { addItem, totalCount } = useCart();
  const { user, logout, displayName } = useAuth();

  const staticProduct = PRODUCTS.find((p) => p.id === Number(id));
  const [product, setProduct] = useState(staticProduct);
  const [reviews, setReviews] = useState(MOCK_REVIEWS);

  // Fetch from Supabase; fall back to static data
  useEffect(() => {
    fetchProductById(Number(id)).then((data) => { if (data) setProduct(data); });
    fetchReviews(Number(id)).then((data)    => { if (data?.length) setReviews(data); });
  }, [id]);

  // AI: summarize reviews on demand (also called after reset)
  const handleSummarize = () => {
    if (aiSummaryLoading) return;
    setAiSummaryLoading(true);
    const texts = reviews.map((r) => lang === 'ar' ? r.comment : (r.comment_en || r.comment)).filter(Boolean);
    summarizeReviews(texts, lang)
      .then(setAiSummary)
      .catch(() => {})
      .finally(() => setAiSummaryLoading(false));
  };

  // Helper: pick Arabic or English value
  const px = (ar, en) => (lang === 'ar' ? ar : (en || ar));

  // Size/color defaults — must run before hooks
  const defaultSize  = product?.sizes?.find((s) => s.priceAdj === 0)?.id ?? product?.sizes?.[0]?.id ?? null;
  const defaultColor = product?.colors?.[0]?.id ?? null;

  const [selectedImage,  setSelectedImage]  = useState(0);
  const [liked,          setLiked]          = useState(false);
  const [quantity,       setQuantity]       = useState(1);
  const [added,          setAdded]          = useState(false);
  const [deliveryOption, setDeliveryOption] = useState(
    product?.isPerishable ? 'seller_delivery' : 'third_party'
  );
  const [selectedSize,   setSelectedSize]   = useState(defaultSize);
  const [selectedColor,  setSelectedColor]  = useState(defaultColor);
  const [starFilter,     setStarFilter]     = useState(0);
  const [sortBy,         setSortBy]         = useState('recent');
  const [helpfulVoted,   setHelpfulVoted]   = useState(new Set());
  const [reviewRating,   setReviewRating]   = useState(5);
  const [reviewHover,    setReviewHover]    = useState(0);
  const [reviewText,     setReviewText]     = useState('');
  const [toasts,         setToasts]         = useState([]);

  // AI state
  const [aiSummary,         setAiSummary]         = useState(null);
  const [aiSummaryLoading,  setAiSummaryLoading]  = useState(false);
  const [smartReplies,      setSmartReplies]      = useState({});
  const [smartReplyLoading, setSmartReplyLoading] = useState({});
  const [copiedReply,       setCopiedReply]       = useState(null);

  const DELIVERY_OPTIONS = [
    { id: 'pickup',          emoji: '🏪', label: t('delivery_pickup_label'), desc: t('delivery_pickup_desc'), price: 0,  eta: t('delivery_pickup_eta')  },
    { id: 'seller_delivery', emoji: '🛵', label: t('delivery_seller_label'), desc: t('delivery_seller_desc'), price: 15, eta: t('delivery_seller_eta')  },
    { id: 'third_party',     emoji: '📦', label: t('delivery_3p_label'),     desc: t('delivery_3p_desc'),     price: 25, eta: t('delivery_3p_eta')      },
  ];

  const SORT_OPTIONS = [
    { id: 'recent',  label: t('sort_recent')  },
    { id: 'highest', label: t('sort_highest') },
    { id: 'lowest',  label: t('sort_lowest')  },
    { id: 'helpful', label: t('sort_helpful') },
  ];

  // ── Derived ────────────────────────────────────────────────────────────────
  const availableDelivery = useMemo(
    () => DELIVERY_OPTIONS.filter((o) =>
      product?.isPerishable ? o.id !== 'third_party' : o.id !== 'seller_delivery'
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?.isPerishable, lang]
  );

  const filteredReviews = useMemo(() => {
    let r = starFilter === 0 ? [...reviews] : reviews.filter((rv) => rv.rating === starFilter);
    if (sortBy === 'highest') r.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'lowest') r.sort((a, b) => a.rating - b.rating);
    else if (sortBy === 'helpful') r.sort((a, b) => b.helpful - a.helpful);
    return r;
  }, [starFilter, sortBy, reviews]);

  const ratingDist = useMemo(() =>
    [5, 4, 3, 2, 1].map((star) => {
      const count = reviews.filter((rv) => rv.rating === star).length;
      return { star, count, pct: Math.round(count / reviews.length * 100) };
    }), [reviews]);

  const avgRating = reviews.length
    ? (reviews.reduce((s, rv) => s + rv.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const selectedDelivery = availableDelivery.find((o) => o.id === deliveryOption) ?? availableDelivery[0];
  const deliveryPrice    = selectedDelivery?.price ?? 0;
  const sizeObj          = product?.sizes?.find((s) => s.id === selectedSize);
  const sizeAdj          = sizeObj?.priceAdj ?? 0;
  const effectivePrice   = product ? product.price + sizeAdj : 0;
  const savings          = product?.originalPrice ? product.originalPrice - product.price : null;
  const totalPrice       = effectivePrice * quantity + deliveryPrice;

  const stockLevel =
    !product?.stock || product.stock === 0 ? 'out'
    : product.stock <= 5                    ? 'critical'
    : product.stock <= 15                   ? 'low'
    :                                         'ok';

  const STOCK_MAP = {
    out:      { label: t('stock_out'),                                                       cls: 'text-red-600 bg-red-50 border-red-200'             },
    critical: { label: `${t('stock_critical_pre')} ${product?.stock} ${t('stock_critical_suf')}`, cls: 'text-red-600 bg-red-50 border-red-200'    },
    low:      { label: `${product?.stock} ${t('stock_low_suf')}`,                            cls: 'text-amber-600 bg-amber-50 border-amber-200'       },
    ok:       { label: t('stock_ok'),                                                        cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  };
  const stockInfo = STOCK_MAP[stockLevel];


  const ChevronBack = dir === 'rtl' ? ChevronRight : ChevronLeft;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const showToast = (message, icon, type = 'info') => {
    const toastId = Date.now();
    setToasts((prev) => [...prev, { id: toastId, message, icon, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((toast) => toast.id !== toastId)), 3200);
  };

  const handleAddToCart = () => {
    if (stockLevel === 'out') return;
    addItem(product, quantity, {
      deliveryOption:   deliveryOption,
      deliveryLocation: customerLocation,
      deliveryPrice:    deliveryPrice,
    });
    setAdded(true);
    showToast(`${t('toast_addedCart')} (${quantity})`, '🛒', 'cart');
    setTimeout(() => setAdded(false), 1800);
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    showToast(
      next ? t('toast_addedWishlist') : t('toast_removedWishlist'),
      next ? '❤️' : '🤍',
      next ? 'wishlist' : 'info'
    );
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast(t('toast_linkCopied'), '🔗', 'share');
  };

  const handleHelpful = (reviewId) => {
    setHelpfulVoted((prev) => {
      const next = new Set(prev);
      if (next.has(reviewId)) {
        next.delete(reviewId);
      } else {
        next.add(reviewId);
        showToast(t('toast_thankYou'), '👍');
      }
      return next;
    });
  };

  const handleSmartReply = async (review) => {
    if (smartReplies[review.id] || smartReplyLoading[review.id]) return;
    setSmartReplyLoading((prev) => ({ ...prev, [review.id]: true }));
    try {
      const reply = await getSmartReply({
        product_name:        px(product.name, product.nameEn),
        product_description: px(product.description, product.descriptionEn),
        product_details:     `Weight: ${px(product.weight, product.weightEn)}, Price: ${product.price} SAR`,
        customer_name:       lang === 'ar' ? review.author : (review.author_en || review.author),
        review_text:         lang === 'ar' ? review.comment : (review.comment_en || review.comment),
      });
      setSmartReplies((prev) => ({ ...prev, [review.id]: reply }));
    } catch { /* silently fail */ } finally {
      setSmartReplyLoading((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  const [customerLocation, setCustomerLocation] = useState(null);

  const [enhancedDesc,   setEnhancedDesc]   = useState(null);
  const [enhancingDesc,  setEnhancingDesc]  = useState(false);

  const handleEnhanceDesc = async () => {
    const raw = px(product?.description, product?.descriptionEn);
    if (!raw || enhancingDesc) return;
    setEnhancingDesc(true);
    try {
      const enhanced = await enhanceDescription(raw);
      setEnhancedDesc(enhanced);
    } catch { /* silently fail */ } finally {
      setEnhancingDesc(false);
    }
  };

  const handleCopyReply = (reviewId, text) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedReply(reviewId);
    setTimeout(() => setCopiedReply(null), 2000);
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    await submitReview({ productId: Number(id), rating: reviewRating, comment: reviewText });
    setReviewText('');
    setReviewRating(5);
    showToast(t('toast_reviewSent'), '⭐', 'review');
  };

  // ── 404 ────────────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div dir={dir} className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-7xl">😕</div>
        <h1 className="text-2xl font-extrabold text-gray-800">{t('pd_notFound')}</h1>
        <p className="text-gray-500 text-sm">{t('pd_notFoundDesc')}</p>
        <Link to="/" className="mt-2 bg-blue-900 text-white font-bold px-7 py-3 rounded-2xl hover:bg-blue-800 transition-colors">
          {t('pd_backHome')}
        </Link>
      </div>
    );
  }

  const images         = product.images ?? [product.emoji];
  const relatedProducts = PRODUCTS
    .filter((p) => p.id !== product.id && p.isPerishable === product.isPerishable)
    .slice(0, 3);

  const certifications = lang === 'ar'
    ? product.certifications
    : (product.certificationsEn || product.certifications);

  const specs = lang === 'ar'
    ? product.specifications
    : (product.specificationsEn || product.specifications);

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${dir === 'rtl' ? 'text-right' : 'text-left'} pb-28 lg:pb-0`}>
      <ToastContainer toasts={toasts} />

      {/* ════════ NAVBAR ════════ */}
      <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src={logo} alt={t('brand_name')} className="w-15 h-10" />
            <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight font-brand">
              {t('brand_name')}
            </span>
          </Link>

          <div className="flex items-center gap-1 text-sm text-gray-400 flex-1 min-w-0">
            <Link to="/" className="hover:text-blue-600 transition-colors shrink-0 font-medium">
              {t('nav_home')}
            </Link>
            {dir === 'rtl'
              ? <ChevronLeft size={13} className="shrink-0 text-gray-300" />
              : <ChevronRight size={13} className="shrink-0 text-gray-300" />
            }
            <span className="text-gray-700 font-semibold truncate">
              {px(product.name, product.nameEn)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 border-blue-900 text-blue-900 hover:bg-blue-900 hover:text-white transition-colors duration-200 hidden sm:flex items-center"
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
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                  <User size={16} className="text-blue-700" />
                  {displayName}
                </span>
                <button onClick={logout} className="text-xs font-bold text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 bg-white rounded-xl px-3 py-1.5 transition-colors">
                  {t('nav_logout')}
                </button>
              </div>
            ) : (
              <Link to="/login" className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors hidden sm:flex" aria-label={t('nav_account')}>
                <User size={21} className="text-blue-900" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-7 group"
        >
          <ChevronBack size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          {t('pd_backToProducts')}
        </button>

        {/* ════════ PRODUCT SECTION ════════ */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* ── Image gallery ── */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className={`relative bg-gradient-to-br ${product.gradient} rounded-3xl h-72 sm:h-80 lg:h-[380px] flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10" />
              <span className="text-[7rem] sm:text-[8.5rem] select-none drop-shadow-lg z-10 hover:scale-110 transition-transform duration-300">
                {images[selectedImage]}
              </span>
              {(lang === 'ar' ? product.badge : product.badgeEn || product.badge) && (
                <span className={`absolute top-4 right-4 ${product.badgeColor} text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm`}>
                  {lang === 'ar' ? product.badge : (product.badgeEn || product.badge)}
                </span>
              )}
              <button onClick={handleLike} className="absolute top-4 left-4 bg-white rounded-full p-2.5 shadow-md hover:scale-110 transition-transform z-10">
                <Heart size={17} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
              </button>
              <button onClick={handleShare} className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:scale-110 transition-transform z-10">
                <Share2 size={16} className="text-gray-600" />
              </button>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4 justify-center flex-wrap">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center text-2xl transition-all duration-200 border-2
                      ${selectedImage === i ? 'border-blue-900 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-90 hover:scale-105'}`}
                  >
                    {img}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { Icon: Shield, label: t('badge_guaranteed'),  color: 'text-blue-700'    },
                { Icon: Truck,  label: t('badge_safeDelivery'), color: 'text-emerald-600' },
                { Icon: Award,  label: t('badge_certified'),   color: 'text-amber-600'   },
              ].map(({ Icon, label, color }) => (
                <div key={label} className="bg-white rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 shadow-sm border border-gray-50">
                  <Icon size={18} className={color} />
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Details panel ── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-2">
                {px(product.name, product.nameEn)}
              </h1>
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-3">
                <MapPin size={14} className="shrink-0" />
                <span>{px(product.family, product.familyEn)}</span>
                <span className="text-gray-300">·</span>
                <span>{px(product.sellerCity, product.sellerCityEn)}</span>
              </div>

              {certifications?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {certifications.map((cert) => (
                    <span key={cert} className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1">
                      <CheckCircle size={9} />{cert}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Rating + delivery tag */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <StarRating rating={product.rating} size={16} />
                <span className="font-bold text-gray-800 text-sm">{product.rating}</span>
                <span className="text-gray-400 text-sm">({product.reviews} {t('pd_reviews')})</span>
              </div>
              <DeliveryTag isPerishable={product.isPerishable} />
            </div>

            {/* Order cutoff */}
            {product.isPerishable && product.orderCutoff && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800">
                  {t('pd_orderBefore')} {product.orderCutoff} {t('pd_todayDelivery')}
                </p>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-blue-900 leading-none">
                {effectivePrice}
                <span className="text-xl font-bold"> {t('card_currency')}</span>
              </span>
              {product.originalPrice && (
                <span className="text-base text-gray-400 line-through">{product.originalPrice} {t('card_currency')}</span>
              )}
              {savings && (
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">
                  {t('pd_save')} {savings} {t('card_currency')}
                </span>
              )}
              {sizeAdj !== 0 && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sizeAdj > 0 ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                  {sizeAdj > 0 ? `+${sizeAdj}` : sizeAdj} {t('card_currency')} ({lang === 'ar' ? 'الحجم' : 'size'})
                </span>
              )}
            </div>

            {/* Size selector */}
            {product.sizes?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-gray-800 text-sm">{t('pd_sizeLabel')}</h3>
                  <span className="text-xs text-blue-600 font-semibold">{px(sizeObj?.label, sizeObj?.labelEn)}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size.id;
                    return (
                      <button key={size.id} onClick={() => setSelectedSize(size.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200
                          ${isSelected ? 'border-blue-900 bg-blue-900 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:text-blue-700'}`}
                      >
                        {px(size.label, size.labelEn)}
                        {size.priceAdj !== 0 && (
                          <span className={`text-[11px] mr-1.5 ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                            {size.priceAdj > 0 ? `+${size.priceAdj}` : size.priceAdj}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Color selector */}
            {product.colors?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-gray-800 text-sm">
                    {product.isPerishable ? t('pd_flavorLabel') : t('pd_packagingLabel')}
                  </h3>
                  <span className="text-xs text-blue-600 font-semibold">
                    {px(product.colors.find((c) => c.id === selectedColor)?.label, product.colors.find((c) => c.id === selectedColor)?.labelEn)}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color.id;
                    return (
                      <button key={color.id} onClick={() => setSelectedColor(color.id)}
                        title={px(color.label, color.labelEn)}
                        className={`w-9 h-9 rounded-full transition-all duration-200 border-[3px] flex items-center justify-center
                          ${isSelected ? 'border-blue-900 scale-110 shadow-lg' : 'border-gray-200 hover:scale-105 hover:border-gray-400'}`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && <span className="text-white text-xs font-extrabold drop-shadow">✓</span>}
                      </button>
                    );
                  })}
                  <span className="text-sm font-semibold text-gray-700 mr-1">
                    {px(product.colors.find((c) => c.id === selectedColor)?.label, product.colors.find((c) => c.id === selectedColor)?.labelEn)}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-gray-800 text-sm">{t('pd_aboutProduct')}</h3>
                  <div className="flex items-center gap-2">
                    {enhancedDesc && (
                      <button onClick={() => setEnhancedDesc(null)} className="text-[10px] font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                        <RotateCcw size={10} /> {lang === 'ar' ? 'الأصلي' : 'Original'}
                      </button>
                    )}
                    <button
                      onClick={handleEnhanceDesc}
                      disabled={enhancingDesc}
                      className="flex items-center gap-1.5 text-[11px] font-bold text-violet-500 hover:text-violet-700 transition-colors disabled:opacity-50"
                    >
                      {enhancingDesc
                        ? <><Loader2 size={11} className="animate-spin" />{t('ai_enhancing')}</>
                        : <><Wand2 size={11} />{t('ai_enhance')}</>
                      }
                    </button>
                  </div>
                </div>
                {enhancedDesc ? (
                  <div>
                    <p className="text-gray-600 text-sm leading-relaxed">{enhancedDesc}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-500 bg-violet-50 rounded-full px-2 py-0.5 mt-2">
                      <Wand2 size={9} /> {lang === 'ar' ? 'محسّن بالذكاء الاصطناعي' : 'AI Enhanced'}
                    </span>
                  </div>
                ) : (
                  <p className="text-gray-600 text-sm leading-relaxed">{px(product.description, product.descriptionEn)}</p>
                )}
              </div>
            )}

            {/* Weight / prep time */}
            {(product.weight || product.preparationTime) && (
              <div className="grid grid-cols-2 gap-3">
                {product.weight && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-[11px] text-gray-400 font-medium mb-1">{t('pd_weight')}</div>
                    <div className="font-bold text-sm text-gray-800">{px(product.weight, product.weightEn)}</div>
                  </div>
                )}
                {product.preparationTime && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-[11px] text-gray-400 font-medium mb-1">{t('pd_prepTime')}</div>
                    <div className="font-bold text-sm text-gray-800">{px(product.preparationTime, product.preparationTimeEn)}</div>
                  </div>
                )}
              </div>
            )}

            {/* Stock */}
            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border w-fit ${stockInfo.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${stockLevel === 'ok' ? 'bg-emerald-500' : stockLevel === 'out' ? 'bg-red-500' : 'bg-amber-500'}`} />
              {stockInfo.label}
            </span>

            {/* Delivery options */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3.5 text-sm">{t('pd_deliveryTitle')}</h3>
              <div className="flex flex-col gap-2.5">
                {availableDelivery.map((opt) => {
                  const isSelected = (deliveryOption ?? availableDelivery[0].id) === opt.id;
                  return (
                    <button key={opt.id} onClick={() => { setDeliveryOption(opt.id); setCustomerLocation(null); }}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all duration-200 text-right
                        ${isSelected ? 'border-blue-900 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                    >
                      <span className="text-2xl shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{opt.label}</span>
                          {opt.price === 0 && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{t('pd_free')}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className={`font-extrabold text-sm ${opt.price > 0 ? 'text-gray-800' : 'text-emerald-600'}`}>
                          {opt.price > 0 ? `${opt.price} ${t('card_currency')}` : t('pd_free')}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">{opt.eta}</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors
                        ${isSelected ? 'border-blue-900 bg-blue-900' : 'border-gray-300'}`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* ── Location section (appears below selected option) ── */}

              {/* Pickup: show seller's location on map (readonly) */}
              {deliveryOption === 'pickup' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className={`text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5 ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}>
                    <MapPin size={12} className="text-emerald-600 shrink-0" />
                    {lang === 'ar' ? 'موقع الاستلام من الأسرة المنتجة' : 'Pickup location from family seller'}
                  </p>
                  <LocationPicker
                    key={`pickup-${product.id}`}
                    mode="pickup"
                    sellerCity={lang === 'ar' ? product.sellerCity : (product.sellerCityEn || product.sellerCity)}
                    lang={lang}
                  />
                </div>
              )}

              {/* Seller delivery: customer confirms their delivery address */}
              {deliveryOption === 'seller_delivery' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className={`text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5 ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}>
                    <MapPin size={12} className="text-blue-600 shrink-0" />
                    {lang === 'ar' ? 'حدد موقعك لتوصيل البائع' : 'Set your location for seller delivery'}
                  </p>
                  <LocationPicker
                    key="seller-delivery-picker"
                    mode="customer"
                    onConfirm={setCustomerLocation}
                    lang={lang}
                  />
                </div>
              )}

              {/* Third-party shipping: customer confirms their shipping address */}
              {deliveryOption === 'third_party' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className={`text-xs font-bold text-gray-500 mb-2.5 flex items-center gap-1.5 ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}>
                    <MapPin size={12} className="text-blue-600 shrink-0" />
                    {lang === 'ar' ? 'حدد عنوان الشحن على الخريطة' : 'Pin your shipping address on the map'}
                  </p>
                  <LocationPicker
                    key="third-party-picker"
                    mode="customer"
                    onConfirm={setCustomerLocation}
                    lang={lang}
                  />
                </div>
              )}

              {/* Confirmed location badge */}
              {customerLocation && (deliveryOption === 'seller_delivery' || deliveryOption === 'third_party') && (
                <div className="mt-3 flex items-start gap-2 bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                  <Check size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-emerald-800">
                      {lang === 'ar' ? 'موقع التوصيل مؤكد' : 'Delivery location confirmed'}
                    </p>
                    <p className="text-[11px] text-emerald-600 mt-0.5 leading-snug line-clamp-2">
                      {customerLocation.address}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop CTA */}
            <div className="hidden lg:flex flex-col gap-2.5 mt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600">
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-3 font-extrabold text-gray-800 min-w-[3rem] text-center text-sm">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(q + 1, product.stock || 99))} className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600">
                    <Plus size={14} />
                  </button>
                </div>
                <button onClick={handleAddToCart} disabled={stockLevel === 'out'}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
                    ${stockLevel === 'out' ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : added ? 'bg-emerald-500 text-white scale-[0.98]'
                      : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.97]'}`}
                >
                  <ShoppingCart size={15} />
                  {stockLevel === 'out' ? t('btn_outOfStock') : added ? t('btn_addedToCart') : `${t('btn_addWithPrice')} ${totalPrice} ${t('card_currency')}`}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ════════ SPECIFICATIONS ════════ */}
        {specs && Object.keys(specs).length > 0 && (
          <section className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-extrabold text-gray-800 mb-5 text-base flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-900 rounded-full" />
              {t('pd_specTitle')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50 sm:divide-y-0">
              {Object.entries(specs).map(([key, value], i) => (
                <div key={key} className={`flex gap-4 py-3.5 px-2 border-b border-gray-50 ${i % 2 === 0 ? 'sm:border-l sm:border-gray-50' : ''}`}>
                  <span className="text-xs font-bold text-gray-400 shrink-0 w-28 pt-0.5">{key}</span>
                  <span className="text-sm font-semibold text-gray-800 leading-relaxed">{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════════ REFUND POLICY ════════ */}
        <section className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-800 mb-4 text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-violet-500 rounded-full" />
            {t('pd_refundTitle')}
          </h2>
          <div className={`flex items-start gap-4 p-4 rounded-2xl border ${product.isRefundable ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${product.isRefundable ? 'bg-emerald-100' : 'bg-red-100'}`}>
              {product.isRefundable
                ? <RotateCcw size={18} className="text-emerald-600" />
                : <XCircle   size={18} className="text-red-500"     />
              }
            </div>
            <div>
              <p className={`font-bold text-sm ${product.isRefundable ? 'text-emerald-800' : 'text-red-700'}`}>
                {product.isRefundable ? t('pd_refundable') : t('pd_notRefundable')}
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {px(product.refundPolicy, product.refundPolicyEn)}
              </p>
            </div>
          </div>
        </section>

        {/* ════════ SELLER CARD ════════ */}
        <section className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-800 mb-5 text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full" />
            {t('pd_sellerTitle')}
          </h2>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🏠
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-gray-900 text-base">{px(product.family, product.familyEn)}</div>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                <MapPin size={12} className="shrink-0" />{px(product.sellerCity, product.sellerCityEn)}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} size={12} />
                  <span className="text-xs text-gray-500">{product.rating} ({product.reviews} {t('pd_reviews')})</span>
                </div>
                {product.partnerSince && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                    {t('pd_partnerSince')} {px(product.partnerSince, product.partnerSinceEn)}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => showToast(t('toast_contacting'), '📞', 'info')}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors shrink-0"
            >
              <Phone size={14} />
              {t('pd_contactSeller')}
            </button>
          </div>
        </section>

        {/* ════════ REVIEWS ════════ */}
        <section className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-800 mb-6 text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-400 rounded-full" />
            {t('pd_reviewsTitle')}
          </h2>

          {/* Rating summary */}
          <div className="flex flex-col sm:flex-row gap-6 mb-7 p-5 bg-gray-50 rounded-2xl">
            <div className="text-center shrink-0">
              <div className="text-5xl font-extrabold text-gray-900 leading-none">{avgRating}</div>
              <div className="flex gap-0.5 justify-center mt-2"><StarRating rating={Number(avgRating)} size={15} /></div>
              <div className="text-xs text-gray-400 mt-1.5">{reviews.length} {t('pd_totalReviews')}</div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {ratingDist.map(({ star, count, pct }) => (
                <button key={star} onClick={() => setStarFilter(starFilter === star ? 0 : star)}
                  className="flex items-center gap-2 group w-full"
                >
                  <span className="text-xs text-gray-500 w-3 shrink-0">{star}</span>
                  <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${starFilter === star ? 'bg-amber-400' : 'bg-amber-300 group-hover:bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-4 shrink-0 text-left">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI Review Summary */}
          {!aiSummary && !aiSummaryLoading && reviews.length > 0 && (
            <button
              onClick={handleSummarize}
              className="mb-5 w-full flex items-center gap-2.5 p-3.5 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-2xl transition-colors text-sm font-semibold text-violet-600"
            >
              <Wand2 size={15} className="shrink-0" />
              {t('ai_summary_title')}
              <span className="font-normal text-violet-400 text-xs ms-auto">{lang === 'ar' ? 'اضغط للتوليد' : 'Click to generate'}</span>
            </button>
          )}
          {(aiSummaryLoading || aiSummary) && (
            <div className="mb-5 p-4 bg-gradient-to-r from-violet-50 to-blue-50 border border-violet-100 rounded-2xl flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                <Wand2 size={15} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="text-xs font-bold text-violet-600 uppercase tracking-wide">{t('ai_summary_title')}</div>
                  {aiSummary && !aiSummaryLoading && (
                    <button
                      onClick={() => { setAiSummary(null); }}
                      className="text-[10px] font-bold text-violet-400 hover:text-violet-700 transition-colors flex items-center gap-1"
                    >
                      <RotateCcw size={10} />
                      {lang === 'ar' ? 'إعادة التوليد' : 'Regenerate'}
                    </button>
                  )}
                </div>
                {aiSummaryLoading ? (
                  <div className="flex items-center gap-2 text-xs text-violet-400">
                    <Loader2 size={13} className="animate-spin" />
                    {t('ai_summary_loading')}
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 leading-relaxed">{aiSummary}</p>
                )}
              </div>
            </div>
          )}

          {/* Filter + sort */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              <button onClick={() => setStarFilter(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${starFilter === 0 ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {t('pd_filterAll')} ({reviews.length})
              </button>
              {[5, 4, 3, 2, 1].map((s) => {
                const cnt = reviews.filter((rv) => rv.rating === s).length;
                if (!cnt) return null;
                return (
                  <button key={s} onClick={() => setStarFilter(starFilter === s ? 0 : s)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${starFilter === s ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                  >
                    {s} <Star size={10} className="fill-amber-400 text-amber-400" /> ({cnt})
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1.5 mr-auto">
              <Filter size={13} className="text-gray-400 shrink-0" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl px-3 py-2 border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                {SORT_OPTIONS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Review cards */}
          <div className="flex flex-col gap-4 mb-8">
            {filteredReviews.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">{t('pd_noReviews')}</div>
            ) : filteredReviews.map((review) => (
              <div key={review.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${review.lang === 'en' ? 'bg-gradient-to-br from-amber-100 to-orange-100' : 'bg-gradient-to-br from-blue-100 to-emerald-100'}`}>
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-800">
                          {review.lang === 'en' ? review.author_en : review.author}
                        </span>
                        {review.lang === 'en' && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">EN</span>
                        )}
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <CheckCircle size={9} />{t('pd_verifiedBuyer')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size={12} />
                        <span className="text-xs text-gray-400">
                          {lang === 'ar' ? review.date : review.date_en}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3" dir={review.lang === 'en' ? 'ltr' : 'rtl'}>
                  {review.lang === 'en' ? review.comment_en : review.comment}
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <button onClick={() => handleHelpful(review.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${helpfulVoted.has(review.id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                  >
                    <ThumbsUp size={12} className={helpfulVoted.has(review.id) ? 'fill-blue-600' : ''} />
                    {t('pd_helpful')} ({review.helpful + (helpfulVoted.has(review.id) ? 1 : 0)})
                  </button>
                  <button
                    onClick={() => handleSmartReply(review)}
                    disabled={!!smartReplies[review.id] || smartReplyLoading[review.id]}
                    className="flex items-center gap-1.5 text-xs font-semibold text-violet-500 hover:text-violet-700 transition-colors disabled:opacity-50 disabled:cursor-default"
                  >
                    {smartReplyLoading[review.id]
                      ? <><Loader2 size={12} className="animate-spin" />{t('ai_smartReply_loading')}</>
                      : <><Wand2 size={12} />{t('ai_smartReply')}</>
                    }
                  </button>
                </div>
                {smartReplies[review.id] && (
                  <div className="mt-3 p-3 bg-violet-50 border border-violet-100 rounded-xl text-xs text-gray-700 leading-relaxed">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wide">{t('ai_smartReply')}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSmartReplies((prev) => { const n = { ...prev }; delete n[review.id]; return n; });
                            setTimeout(() => handleSmartReply(review), 0);
                          }}
                          className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-700 transition-colors"
                        >
                          <RotateCcw size={10} />
                          {lang === 'ar' ? 'إعادة' : 'Redo'}
                        </button>
                        <button
                          onClick={() => handleCopyReply(review.id, smartReplies[review.id])}
                          className="flex items-center gap-1 text-[10px] font-bold text-violet-400 hover:text-violet-700 transition-colors"
                        >
                          {copiedReply === review.id
                            ? <><Check size={10} />{t('ai_smartReply_copied')}</>
                            : <><Copy size={10} />{t('ai_smartReply_copy')}</>
                          }
                        </button>
                      </div>
                    </div>
                    {smartReplies[review.id]}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Write a review */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">{t('pd_writeReview')}</h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onMouseEnter={() => setReviewHover(n)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(n)}>
                  <Star size={26} className={`transition-colors duration-100 ${n <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'}`} />
                </button>
              ))}
              <span className="text-xs text-gray-400 self-center mr-2">{reviewHover || reviewRating} {t('pd_outOf5')}</span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t('pd_reviewPlaceholder')}
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400"
            />
            <button onClick={handleSubmitReview} disabled={!reviewText.trim()}
              className="mt-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-7 py-2.5 rounded-2xl text-sm transition-colors"
            >
              {t('pd_submitReview')}
            </button>
          </div>
        </section>

        {/* ════════ RELATED PRODUCTS ════════ */}
        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-extrabold text-xl text-gray-800 shrink-0">{t('pd_related')}</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-gray-200 to-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                >
                  <div className={`bg-gradient-to-br ${p.gradient} h-36 flex items-center justify-center relative`}>
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300 select-none">{p.emoji}</span>
                    {(lang === 'ar' ? p.badge : p.badgeEn || p.badge) && (
                      <span className={`absolute top-3 right-3 ${p.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {lang === 'ar' ? p.badge : (p.badgeEn || p.badge)}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm text-gray-800 line-clamp-2 mb-1.5 leading-snug">
                      {lang === 'ar' ? p.name : (p.nameEn || p.name)}
                    </p>
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />
                      {lang === 'ar' ? p.family : (p.familyEn || p.family)}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-extrabold text-blue-900">{p.price} <span className="text-xs font-bold">{t('card_currency')}</span></span>
                      <StarRating rating={p.rating} size={11} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ════════ FOOTER ════════ */}
      <footer className="bg-blue-950 text-white pt-14 pb-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <img src={logo} alt={t('brand_name')} className="w-9 h-9" />
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
            <div>
              <h4 className="font-bold text-sm mb-5">{t('footer_quickLinks')}</h4>
              <ul className="space-y-3">
                {[t('footer_home'), t('footer_products'), t('footer_families'), t('footer_blog'), t('footer_about')].map((link) => (
                  <li key={link}><a href="#" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5">{t('footer_forFamilies')}</h4>
              <ul className="space-y-3">
                {[t('footer_registerFam'), t('footer_dashboard'), t('footer_terms'), t('footer_support'), t('footer_faq')].map((link) => (
                  <li key={link}><a href="#" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
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

      {/* ════════ MOBILE STICKY CTA ════════ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-3.5 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden shrink-0">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3.5 py-2.5 hover:bg-gray-200 transition-colors text-gray-600">
              <Minus size={13} />
            </button>
            <span className="px-3 py-2.5 font-extrabold text-gray-800 min-w-[2.5rem] text-center text-sm">{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(q + 1, product.stock || 99))} className="px-3.5 py-2.5 hover:bg-gray-200 transition-colors text-gray-600">
              <Plus size={13} />
            </button>
          </div>
          <button onClick={handleAddToCart} disabled={stockLevel === 'out'}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
              ${stockLevel === 'out' ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : added ? 'bg-emerald-500 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.98]'}`}
          >
            <ShoppingCart size={15} />
            {stockLevel === 'out' ? t('btn_outOfStock') : added ? t('btn_addedToCart') : `${t('btn_addWithPrice')} ${totalPrice} ${t('card_currency')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
