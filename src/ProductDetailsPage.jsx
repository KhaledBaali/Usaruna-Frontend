import { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Star, Heart, MapPin, Clock, Package,
  ChevronRight, ChevronLeft, Minus, Plus, Share2,
  Shield, Truck, Award, Phone, ThumbsUp, CheckCircle,
  Globe, AtSign, Mail, Filter, XCircle, RotateCcw,
} from 'lucide-react';
import { PRODUCTS } from './products';

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const DELIVERY_OPTIONS = [
  { id: 'pickup',          emoji: '🏪', label: 'استلام شخصي',    desc: 'استلم طلبك مباشرة من موقع البائع', price: 0,  eta: 'حسب الاتفاق' },
  { id: 'seller_delivery', emoji: '🛵', label: 'توصيل من البائع', desc: 'البائع يوصل الطلب بنفسه',          price: 15, eta: '1-3 ساعات'    },
  { id: 'third_party',     emoji: '📦', label: 'شركة شحن',        desc: 'أرامكس · SMSA · DHL',              price: 25, eta: '24-48 ساعة'  },
];

const MOCK_REVIEWS = [
  { id: 1, author: 'سارة أحمد',     rating: 5, date: '28 أبريل 2025',  verified: true,  helpful: 14, comment: 'منتج رائع جداً! الطعم أصيل ومميز تماماً. التوصيل كان في الوقت المحدد والتغليف ممتاز. سأطلب مرة أخرى بالتأكيد!' },
  { id: 2, author: 'محمد العتيبي',   rating: 5, date: '22 أبريل 2025',  verified: true,  helpful: 9,  comment: 'أفضل منتج اشتريته من المنصة. الجودة عالية جداً والكمية كافية. أنصح به بشدة لكل من يريد طعاماً منزلياً أصيلاً.' },
  { id: 3, author: 'نورة الشمري',   rating: 4, date: '15 أبريل 2025',  verified: true,  helpful: 6,  comment: 'جيد جداً ويستحق السعر. الطعم لذيذ لكن الكمية كانت أقل قليلاً من المتوقع. بشكل عام تجربة ممتازة.' },
  { id: 4, author: 'خالد الزهراني', rating: 5, date: '10 أبريل 2025',  verified: false, helpful: 8,  comment: 'طلبت للعائلة وكلهم أعجبهم كثيراً. الطعم منزلي وأصيل. الله يبارك في أسرة البائع ويزيدهم من فضله.' },
  { id: 5, author: 'فاطمة القحطاني',rating: 3, date: '5 أبريل 2025',   verified: true,  helpful: 3,  comment: 'المنتج جيد لكن كنت أتوقع طعماً أقوى. الكمية كافية والتوصيل كان في الوقت. ربما أجرب مرة أخرى.' },
  { id: 6, author: 'عبدالله المطيري',rating: 4, date: '28 مارس 2025',   verified: true,  helpful: 5,  comment: 'ممتاز! البائع محترم جداً وتواصله سريع. التوصيل جاء في الوقت والمنتج بحالة ممتازة. جودة تستحق السعر.' },
  { id: 7, author: 'ريم السلمي',    rating: 5, date: '20 مارس 2025',   verified: true,  helpful: 11, comment: 'شكراً لأسرة البائع على هذا المنتج الرائع! يذكرني بطبخ والدتي رحمها الله. سأطلب دائماً من هذا المتجر.' },
  { id: 8, author: 'أحمد الغامدي',  rating: 2, date: '15 مارس 2025',   verified: false, helpful: 1,  comment: 'المنتج وصل متأخراً عن الموعد المحدد ولم يكن بأفضل حال. آمل أن تتحسن الخدمة في المستقبل.' },
];

const SORT_OPTIONS = [
  { id: 'recent',  label: 'الأحدث'         },
  { id: 'highest', label: 'الأعلى تقييماً'  },
  { id: 'lowest',  label: 'الأقل تقييماً'  },
  { id: 'helpful', label: 'الأكثر إفادة'   },
];

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
  return isPerishable ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5 w-fit">
      <Clock size={13} className="shrink-0" />توصيل سريع خلال 1-2 ساعة
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 w-fit">
      📦 شحن لجميع مدن المملكة (24-48 ساعة)
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
          <span dir="rtl" className="leading-snug">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────

export default function ProductDetailsPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const product  = PRODUCTS.find((p) => p.id === Number(id));

  // initialise size to the variant with priceAdj === 0 (the "default" size)
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

  // ── derived ──────────────────────────────────────────────────────────────
  const availableDelivery = useMemo(
    () => DELIVERY_OPTIONS.filter((o) =>
      product?.isPerishable ? o.id !== 'third_party' : o.id !== 'seller_delivery'
    ),
    [product?.isPerishable]
  );

  const filteredReviews = useMemo(() => {
    let r = starFilter === 0 ? [...MOCK_REVIEWS] : MOCK_REVIEWS.filter((r) => r.rating === starFilter);
    if (sortBy === 'highest') r.sort((a, b) => b.rating - a.rating);
    else if (sortBy === 'lowest') r.sort((a, b) => a.rating - b.rating);
    else if (sortBy === 'helpful') r.sort((a, b) => b.helpful - a.helpful);
    return r;
  }, [starFilter, sortBy]);

  const ratingDist = useMemo(() =>
    [5, 4, 3, 2, 1].map((star) => {
      const count = MOCK_REVIEWS.filter((r) => r.rating === star).length;
      return { star, count, pct: Math.round(count / MOCK_REVIEWS.length * 100) };
    }), []
  );

  const avgRating = (MOCK_REVIEWS.reduce((s, r) => s + r.rating, 0) / MOCK_REVIEWS.length).toFixed(1);

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
    out:      { label: 'نفد المخزون',                       cls: 'text-red-600 bg-red-50 border-red-200'          },
    critical: { label: `آخر ${product?.stock} قطع!`,        cls: 'text-red-600 bg-red-50 border-red-200'          },
    low:      { label: `${product?.stock} قطعة متبقية`,     cls: 'text-amber-600 bg-amber-50 border-amber-200'    },
    ok:       { label: 'متوفر في المخزون',                   cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  };
  const stockInfo = STOCK_MAP[stockLevel];

  const whatsappUrl = product?.whatsapp
    ? `https://wa.me/${product.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`مرحباً، أريد طلب: ${product.name}${sizeObj ? ` (${sizeObj.label})` : ''}`)}`
    : null;

  // ── handlers ─────────────────────────────────────────────────────────────
  const showToast = (message, icon, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, icon, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  };

  const handleAddToCart = () => {
    if (stockLevel === 'out') return;
    setAdded(true);
    showToast(`تمت الإضافة للسلة (${quantity})`, '🛒', 'cart');
    setTimeout(() => setAdded(false), 1800);
  };

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    showToast(
      next ? 'تمت الإضافة للمفضلة' : 'تمت الإزالة من المفضلة',
      next ? '❤️' : '🤍',
      next ? 'wishlist' : 'info'
    );
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    showToast('تم نسخ رابط المنتج', '🔗', 'share');
  };

  const handleHelpful = (reviewId) => {
    if (helpfulVoted.has(reviewId)) return;
    setHelpfulVoted((prev) => new Set([...prev, reviewId]));
    showToast('شكراً لتقييمك!', '👍');
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    setReviewText('');
    setReviewRating(5);
    showToast('تم إرسال تقييمك بنجاح', '⭐', 'review');
  };

  // ── 404 ──────────────────────────────────────────────────────────────────
  if (!product) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-7xl">😕</div>
        <h1 className="text-2xl font-extrabold text-gray-800">المنتج غير موجود</h1>
        <p className="text-gray-500 text-sm">ربما تم حذف المنتج أو الرابط غير صحيح.</p>
        <Link to="/" className="mt-2 bg-blue-900 text-white font-bold px-7 py-3 rounded-2xl hover:bg-blue-800 transition-colors">
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  const images = product.images ?? [product.emoji];
  const relatedProducts = PRODUCTS
    .filter((p) => p.id !== product.id && p.isPerishable === product.isPerishable)
    .slice(0, 3);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-right pb-28 lg:pb-0">
      <ToastContainer toasts={toasts} />

      {/* ════════ NAVBAR ════════ */}
      <header className="bg-white shadow-sm fixed top-0 inset-x-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-900 to-emerald-500 rounded-2xl flex items-center justify-center shadow-sm">
              <span className="text-white font-extrabold text-lg leading-none">أ</span>
            </div>
            <span className="text-xl font-extrabold text-blue-900 hidden sm:block tracking-tight">أسرنا</span>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-400 flex-1 min-w-0">
            <Link to="/" className="hover:text-blue-600 transition-colors shrink-0 font-medium">الرئيسية</Link>
            <ChevronLeft size={13} className="shrink-0 text-gray-300" />
            <span className="text-gray-700 font-semibold truncate">{product.name}</span>
          </div>
          <button className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors shrink-0">
            <ShoppingCart size={21} className="text-blue-900" />
          </button>
        </div>
      </header>

      {/* ════════ MAIN ════════ */}
      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 py-8">

        <button onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors mb-7 group"
        >
          <ChevronRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
          رجوع للمنتجات
        </button>

        {/* ════════ PRODUCT SECTION ════════ */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">

          {/* ── Left: Image gallery ── */}
          <div className="w-full lg:w-[400px] shrink-0">
            <div className={`relative bg-gradient-to-br ${product.gradient} rounded-3xl h-72 sm:h-80 lg:h-[380px] flex items-center justify-center overflow-hidden`}>
              <div className="absolute inset-0 bg-white/10" />
              <span className="text-[7rem] sm:text-[8.5rem] select-none drop-shadow-lg z-10 hover:scale-110 transition-transform duration-300">
                {images[selectedImage]}
              </span>
              {product.badge && (
                <span className={`absolute top-4 right-4 ${product.badgeColor} text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm`}>
                  {product.badge}
                </span>
              )}
              <button onClick={handleLike}
                className="absolute top-4 left-4 bg-white rounded-full p-2.5 shadow-md hover:scale-110 transition-transform z-10"
              >
                <Heart size={17} className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
              </button>
              <button onClick={handleShare}
                className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:scale-110 transition-transform z-10"
              >
                <Share2 size={16} className="text-gray-600" />
              </button>
            </div>

            {/* Thumbnails — up to 5 */}
            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4 justify-center flex-wrap">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)}
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center text-2xl transition-all duration-200 border-2
                      ${selectedImage === i
                        ? 'border-blue-900 scale-105 shadow-md'
                        : 'border-transparent opacity-60 hover:opacity-90 hover:scale-105'
                      }`}
                  >
                    {img}
                  </button>
                ))}
              </div>
            )}

            {/* Trust badges */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { Icon: Shield, label: 'منتج مضمون',  color: 'text-blue-700'    },
                { Icon: Truck,  label: 'توصيل آمن',   color: 'text-emerald-600' },
                { Icon: Award,  label: 'أسرة معتمدة', color: 'text-amber-600'   },
              ].map(({ Icon, label, color }) => (
                <div key={label} className="bg-white rounded-2xl py-3 px-2 flex flex-col items-center gap-1.5 shadow-sm border border-gray-50">
                  <Icon size={18} className={color} />
                  <span className="text-[10px] font-bold text-gray-600 text-center leading-tight">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Details panel ── */}
          <div className="flex-1 flex flex-col gap-5 min-w-0">

            {/* Name */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm mb-3">
                <MapPin size={14} className="shrink-0" />
                <span>{product.family}</span>
                <span className="text-gray-300">·</span>
                <span>{product.sellerCity}</span>
              </div>

              {/* Certifications */}
              {product.certifications?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {product.certifications.map((cert) => (
                    <span key={cert}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2.5 py-1"
                    >
                      <CheckCircle size={9} />
                      {cert}
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
                <span className="text-gray-400 text-sm">({product.reviews} تقييم)</span>
              </div>
              <DeliveryTag isPerishable={product.isPerishable} />
            </div>

            {/* Order cutoff alert — perishable only */}
            {product.isPerishable && product.orderCutoff && (
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <Clock size={16} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800">
                  اطلب قبل الساعة {product.orderCutoff} لضمان التوصيل اليوم
                </p>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-extrabold text-blue-900 leading-none">
                {effectivePrice}
                <span className="text-xl font-bold"> ر.س</span>
              </span>
              {product.originalPrice && (
                <span className="text-base text-gray-400 line-through">{product.originalPrice} ر.س</span>
              )}
              {savings && (
                <span className="bg-red-50 text-red-600 text-xs font-bold px-2.5 py-1 rounded-full border border-red-100">
                  وفّر {savings} ر.س
                </span>
              )}
              {sizeAdj !== 0 && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sizeAdj > 0 ? 'text-blue-600 bg-blue-50 border-blue-100' : 'text-emerald-700 bg-emerald-50 border-emerald-100'}`}>
                  {sizeAdj > 0 ? `+${sizeAdj}` : sizeAdj} ر.س (الحجم)
                </span>
              )}
            </div>

            {/* ── Size selector ── */}
            {product.sizes?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-gray-800 text-sm">الحجم</h3>
                  <span className="text-xs text-blue-600 font-semibold">{sizeObj?.label}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size.id;
                    return (
                      <button key={size.id} onClick={() => setSelectedSize(size.id)}
                        className={`px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200
                          ${isSelected
                            ? 'border-blue-900 bg-blue-900 text-white shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:text-blue-700'
                          }`}
                      >
                        {size.label}
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

            {/* ── Color selector ── */}
            {product.colors?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h3 className="font-bold text-gray-800 text-sm">
                    {product.isPerishable ? 'النكهة' : 'لون التغليف / النوع'}
                  </h3>
                  <span className="text-xs text-blue-600 font-semibold">
                    {product.colors.find((c) => c.id === selectedColor)?.label}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color.id;
                    return (
                      <button
                        key={color.id}
                        onClick={() => setSelectedColor(color.id)}
                        title={color.label}
                        className={`w-9 h-9 rounded-full transition-all duration-200 border-[3px] flex items-center justify-center
                          ${isSelected
                            ? 'border-blue-900 scale-110 shadow-lg'
                            : 'border-gray-200 hover:scale-105 hover:border-gray-400'
                          }`}
                        style={{ backgroundColor: color.hex }}
                      >
                        {isSelected && (
                          <span className="text-white text-xs font-extrabold drop-shadow">✓</span>
                        )}
                      </button>
                    );
                  })}
                  <span className="text-sm font-semibold text-gray-700 mr-1">
                    {product.colors.find((c) => c.id === selectedColor)?.label}
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 mb-2.5 text-sm">عن هذا المنتج</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Meta (weight / prep time) */}
            {(product.weight || product.preparationTime) && (
              <div className="grid grid-cols-2 gap-3">
                {product.weight && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-[11px] text-gray-400 font-medium mb-1">الوزن / الكمية</div>
                    <div className="font-bold text-sm text-gray-800">{product.weight}</div>
                  </div>
                )}
                {product.preparationTime && (
                  <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-[11px] text-gray-400 font-medium mb-1">وقت التحضير</div>
                    <div className="font-bold text-sm text-gray-800">{product.preparationTime}</div>
                  </div>
                )}
              </div>
            )}

            {/* Stock indicator */}
            <span className={`inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full border w-fit ${stockInfo.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                stockLevel === 'ok' ? 'bg-emerald-500' : stockLevel === 'out' ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              {stockInfo.label}
            </span>

            {/* ── Delivery options ── */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3.5 text-sm">خيارات الاستلام والتوصيل</h3>
              <div className="flex flex-col gap-2.5">
                {availableDelivery.map((opt) => {
                  const isSelected = (deliveryOption ?? availableDelivery[0].id) === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setDeliveryOption(opt.id)}
                      className={`flex items-center gap-3.5 p-3.5 rounded-2xl border-2 transition-all duration-200 text-right
                        ${isSelected ? 'border-blue-900 bg-blue-50' : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                    >
                      <span className="text-2xl shrink-0">{opt.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{opt.label}</span>
                          {opt.price === 0 && (
                            <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">مجاناً</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <span className={`font-extrabold text-sm ${opt.price > 0 ? 'text-gray-800' : 'text-emerald-600'}`}>
                          {opt.price > 0 ? `${opt.price} ر.س` : 'مجاناً'}
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
            </div>

            {/* ── Desktop: qty + cart + whatsapp ── */}
            <div className="hidden lg:flex flex-col gap-2.5 mt-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="px-4 py-3 font-extrabold text-gray-800 min-w-[3rem] text-center text-sm">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(q + 1, product.stock || 99))}
                    className="px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button onClick={handleAddToCart} disabled={stockLevel === 'out'}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
                    ${stockLevel === 'out'
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : added
                        ? 'bg-emerald-500 text-white scale-[0.98]'
                        : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.97]'
                    }`}
                >
                  <ShoppingCart size={15} />
                  {stockLevel === 'out' ? 'نفد المخزون' : added ? `تمت الإضافة ✓` : `أضف للسلة · ${totalPrice} ر.س`}
                </button>
              </div>

              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  onClick={() => showToast('سيتم التواصل معك عبر واتساب', '💬', 'info')}
                  className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1DAA55] text-white font-bold py-3 rounded-2xl text-sm transition-colors shadow-sm"
                >
                  <span className="text-base">💬</span>
                  اطلب عبر واتساب
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ════════ SPECIFICATIONS ════════ */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <section className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-extrabold text-gray-800 mb-5 text-base flex items-center gap-2">
              <span className="w-1 h-5 bg-blue-900 rounded-full" />
              المواصفات والتفاصيل
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y divide-gray-50 sm:divide-y-0">
              {Object.entries(product.specifications).map(([key, value], i) => (
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
            سياسة الإرجاع والاسترداد
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
                {product.isRefundable ? 'قابل للإرجاع' : 'غير قابل للإرجاع'}
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">{product.refundPolicy}</p>
            </div>
          </div>
        </section>

        {/* ════════ SELLER CARD ════════ */}
        <section className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-800 mb-5 text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-emerald-500 rounded-full" />
            عن البائع
          </h2>
          <div className="flex items-start gap-4 flex-wrap">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">
              🏠
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-extrabold text-gray-900 text-base">{product.family}</div>
              <div className="flex items-center gap-1.5 text-gray-500 text-sm mt-0.5">
                <MapPin size={12} className="shrink-0" />{product.sellerCity}
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} size={12} />
                  <span className="text-xs text-gray-500">{product.rating} ({product.reviews} تقييم)</span>
                </div>
                {product.partnerSince && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                    شريك منذ {product.partnerSince}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => showToast('جاري التواصل مع البائع…', '📞', 'info')}
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-5 py-2.5 rounded-2xl text-sm transition-colors shrink-0"
            >
              <Phone size={14} />
              تواصل مع البائع
            </button>
          </div>
        </section>

        {/* ════════ REVIEWS ════════ */}
        <section className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-800 mb-6 text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-400 rounded-full" />
            التقييمات والمراجعات
          </h2>

          {/* Rating summary */}
          <div className="flex flex-col sm:flex-row gap-6 mb-7 p-5 bg-gray-50 rounded-2xl">
            <div className="text-center shrink-0">
              <div className="text-5xl font-extrabold text-gray-900 leading-none">{avgRating}</div>
              <div className="flex gap-0.5 justify-center mt-2"><StarRating rating={Number(avgRating)} size={15} /></div>
              <div className="text-xs text-gray-400 mt-1.5">{MOCK_REVIEWS.length} تقييم</div>
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              {ratingDist.map(({ star, count, pct }) => (
                <button key={star} onClick={() => setStarFilter(starFilter === star ? 0 : star)}
                  className="flex items-center gap-2 group w-full"
                >
                  <span className="text-xs text-gray-500 w-3 shrink-0">{star}</span>
                  <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${starFilter === star ? 'bg-amber-400' : 'bg-amber-300 group-hover:bg-amber-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-4 shrink-0 text-left">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filter + sort */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
              <button onClick={() => setStarFilter(0)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${starFilter === 0 ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                الكل ({MOCK_REVIEWS.length})
              </button>
              {[5, 4, 3, 2, 1].map((s) => {
                const cnt = MOCK_REVIEWS.filter((r) => r.rating === s).length;
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
              <div className="text-center py-10 text-gray-400 text-sm">لا توجد تقييمات بهذا التصفية</div>
            ) : filteredReviews.map((review) => (
              <div key={review.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-emerald-100 rounded-full flex items-center justify-center text-lg shrink-0">
                      👤
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-gray-800">{review.author}</span>
                        {review.verified && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
                            <CheckCircle size={9} />مشترٍ موثوق
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} size={12} />
                        <span className="text-xs text-gray-400">{review.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-3">{review.comment}</p>
                <button onClick={() => handleHelpful(review.id)} disabled={helpfulVoted.has(review.id)}
                  className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${helpfulVoted.has(review.id) ? 'text-blue-600 cursor-default' : 'text-gray-400 hover:text-blue-500'}`}
                >
                  <ThumbsUp size={12} />
                  مفيد ({review.helpful + (helpfulVoted.has(review.id) ? 1 : 0)})
                </button>
              </div>
            ))}
          </div>

          {/* Write a review */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">أضف تقييمك</h3>
            <div className="flex gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n}
                  onMouseEnter={() => setReviewHover(n)}
                  onMouseLeave={() => setReviewHover(0)}
                  onClick={() => setReviewRating(n)}
                >
                  <Star size={26} className={`transition-colors duration-100 ${n <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'}`} />
                </button>
              ))}
              <span className="text-xs text-gray-400 self-center mr-2">{reviewHover || reviewRating} من 5</span>
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="شاركنا تجربتك مع هذا المنتج…"
              rows={4}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400"
            />
            <button onClick={handleSubmitReview} disabled={!reviewText.trim()}
              className="mt-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-7 py-2.5 rounded-2xl text-sm transition-colors"
            >
              إرسال التقييم
            </button>
          </div>
        </section>

        {/* ════════ RELATED PRODUCTS ════════ */}
        {relatedProducts.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center gap-4 mb-6">
              <h2 className="font-extrabold text-xl text-gray-800 shrink-0">منتجات مشابهة</h2>
              <div className="flex-1 h-px bg-gradient-to-l from-gray-200 to-transparent" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedProducts.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`}
                  className="bg-white rounded-3xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group"
                >
                  <div className={`bg-gradient-to-br ${p.gradient} h-36 flex items-center justify-center relative`}>
                    <span className="text-5xl group-hover:scale-110 transition-transform duration-300 select-none">{p.emoji}</span>
                    {p.badge && (
                      <span className={`absolute top-3 right-3 ${p.badgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>{p.badge}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold text-sm text-gray-800 line-clamp-2 mb-1.5 leading-snug">{p.name}</p>
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <MapPin size={10} className="shrink-0" />{p.family}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-base font-extrabold text-blue-900">{p.price} <span className="text-xs font-bold">ر.س</span></span>
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
            <div>
              <h4 className="font-bold text-sm mb-5">روابط سريعة</h4>
              <ul className="space-y-3">
                {['الرئيسية', 'المنتجات', 'الأسر المنتجة', 'المدونة', 'عن أسرنا'].map((link) => (
                  <li key={link}><a href="#" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5">للأسر المنتجة</h4>
              <ul className="space-y-3">
                {['سجّل أسرتك', 'لوحة التحكم', 'الشروط والأحكام', 'الدعم الفني', 'الأسئلة الشائعة'].map((link) => (
                  <li key={link}><a href="#" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5">تواصل معنا</h4>
              <ul className="space-y-3.5">
                {[
                  { Icon: Phone,  text: '+966 50 000 0000',               ltr: true  },
                  { Icon: Mail,   text: 'hello@usaruna.sa',                ltr: true  },
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
          <div className="border-t border-blue-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-blue-400 text-sm">
            <span>© 2025 أسرنا. جميع الحقوق محفوظة.</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white transition-colors">سياسة الخصوصية</a>
              <a href="#" className="hover:text-white transition-colors">شروط الاستخدام</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ════════ MOBILE STICKY CTA ════════ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-3.5 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden shrink-0">
            <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="px-3.5 py-2.5 hover:bg-gray-200 transition-colors text-gray-600"
            >
              <Minus size={13} />
            </button>
            <span className="px-3 py-2.5 font-extrabold text-gray-800 min-w-[2.5rem] text-center text-sm">{quantity}</span>
            <button onClick={() => setQuantity((q) => Math.min(q + 1, product.stock || 99))}
              className="px-3.5 py-2.5 hover:bg-gray-200 transition-colors text-gray-600"
            >
              <Plus size={13} />
            </button>
          </div>
          <button onClick={handleAddToCart} disabled={stockLevel === 'out'}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
              ${stockLevel === 'out'
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : added ? 'bg-emerald-500 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.98]'
              }`}
          >
            <ShoppingCart size={15} />
            {stockLevel === 'out' ? 'نفد المخزون' : added ? 'تمت الإضافة ✓' : `أضف للسلة · ${totalPrice} ر.س`}
          </button>
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
              onClick={() => showToast('سيتم التواصل معك عبر واتساب', '💬')}
              className="w-12 h-12 bg-[#25D366] hover:bg-[#1DAA55] rounded-2xl flex items-center justify-center text-xl shrink-0 transition-colors"
            >
              💬
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
