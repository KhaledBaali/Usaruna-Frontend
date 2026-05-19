import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ShoppingCart, Star, Heart, MapPin, Clock, Package,
  ChevronRight, ChevronLeft, Minus, Plus, Share2,
  Shield, Truck, Award, Phone, ThumbsUp, CheckCircle,
  Globe, AtSign, Mail, Filter, XCircle, RotateCcw, User,
  Wand2, Check, Loader2, Zap, MessageCircle, Trash2, Store, AlertCircle, X,
} from 'lucide-react';
import LocationPicker from './LocationPicker';
import { useLang } from './contexts/LanguageContext';
import { useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';
import { useWishlist } from './contexts/WishlistContext';
import { fetchProductById, fetchReviews, submitReview, deleteReview, replyToReview, deleteReviewReply, updateHelpfulCount, fetchQuestions, submitQuestion, deleteQuestion, answerQuestion, deleteQuestionAnswer, updateQuestionHelpful } from './lib/api';
import { summarizeReviews, getSmartReply } from './lib/aiApi';
import AccountMenu from './AccountMenu';
const logo = '/logo.webp';

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

function DeliveryTag({ deliveryTypes }) {
  const { lang } = useLang();
  const tags = [];
  if (deliveryTypes?.includes('seller_delivery'))
    tags.push(<span key="sd" className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">🛵 {lang === 'ar' ? 'توصيل البائع' : 'Seller Delivery'}</span>);
  if (deliveryTypes?.includes('third_party'))
    tags.push(<span key="tp" className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5">📦 {lang === 'ar' ? 'شحن وطني' : 'Nationwide'}</span>);
  if (deliveryTypes?.includes('pickup'))
    tags.push(<span key="pu" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">🏪 {lang === 'ar' ? 'استلام شخصي' : 'Pickup'}</span>);
  return <div className="flex flex-wrap gap-1.5">{tags}</div>;
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
  const { user } = useAuth();
  const { toggle: toggleWishlist, isLiked } = useWishlist();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch from Supabase
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchProductById(Number(id)).then((data) => {
        if (data) {
          setProduct(data);
          // Set default delivery option from product's available types
          if (data.deliveryTypes?.length) setDeliveryOption(data.deliveryTypes[0]);
        }
      }),
      fetchReviews(Number(id)).then((data) => { if (data?.length) setReviews(data); }),
      fetchQuestions(Number(id)).then((data) => { if (data?.length) setQuestions(data); }),
    ]).finally(() => setLoading(false));
  }, [id]);

  // Auto-summarize when reviews reach 10+
  useEffect(() => {
    if (reviews.length >= 10 && !aiSummary && !aiSummaryLoading) {
      setAiSummaryLoading(true);
      const texts = reviews.map((r) => lang === 'ar' ? r.comment : (r.comment_en || r.comment)).filter(Boolean);
      summarizeReviews(texts, lang)
        .then(setAiSummary)
        .catch(() => {})
        .finally(() => setAiSummaryLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviews.length]);

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

  const [selectedImage,  setSelectedImage]  = useState(0);
  const [quantity,       setQuantity]       = useState(1);
  const [added,          setAdded]          = useState(false);
  const [deliveryOption, setDeliveryOption] = useState(null);
  const [selectedSize,   setSelectedSize]   = useState(null);
  const [selectedColor,  setSelectedColor]  = useState(null);
  const [starFilter,     setStarFilter]     = useState(0);
  const [sortBy,         setSortBy]         = useState('recent');
  const [helpfulVoted,   setHelpfulVoted]   = useState(() => {
    try {
      const stored = localStorage.getItem('usaruna_helpful_voted');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [reviewRating,   setReviewRating]   = useState(5);
  const [reviewHover,    setReviewHover]    = useState(0);
  const [reviewText,     setReviewText]     = useState('');
  const [toasts,         setToasts]         = useState([]);

  // AI state
  const [aiSummary,         setAiSummary]         = useState(null);
  const [aiSummaryLoading,  setAiSummaryLoading]  = useState(false);
  const [smartReplyLoading, setSmartReplyLoading] = useState({});

  // Translate state (review comments)
  const [translatedComments,  setTranslatedComments]  = useState({});
  const [translatingComments, setTranslatingComments] = useState({});

  // Seller reply state
  const [replyDrafts,          setReplyDrafts]          = useState({});
  const [replyTranslations,    setReplyTranslations]    = useState({});
  const [translatingReply,     setTranslatingReply]     = useState({});
  const [replyEditorOpen,      setReplyEditorOpen]      = useState(new Set());
  const [replySubmitting,      setReplySubmitting]      = useState({});
  const [translatedReplies,    setTranslatedReplies]    = useState({});
  const [translatingReplies,   setTranslatingReplies]   = useState({});

  // Questions state
  const [questionText,          setQuestionText]          = useState('');
  const [questionHelpfulVoted,  setQuestionHelpfulVoted]  = useState(() => {
    try {
      const stored = localStorage.getItem('usaruna_qhelpful_voted');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [questionSortBy,        setQuestionSortBy]        = useState('recent');
  const [translatedQuestions,   setTranslatedQuestions]   = useState({});
  const [translatingQuestions,  setTranslatingQuestions]  = useState({});
  const [answerDrafts,          setAnswerDrafts]          = useState({});
  const [answerTranslations,    setAnswerTranslations]    = useState({});
  const [translatingAnswer,     setTranslatingAnswer]     = useState({});
  const [answerEditorOpen,      setAnswerEditorOpen]      = useState(new Set());
  const [answerSubmitting,      setAnswerSubmitting]      = useState({});
  const [smartAnswerLoading,    setSmartAnswerLoading]    = useState({});

  const [customerLocation,   setCustomerLocation]   = useState(null);
  const [showAbout,          setShowAbout]          = useState(false);
  const [showContactSeller,  setShowContactSeller]  = useState(false);

  const prepTimeLabel = (() => {
    const m = product?.prepTime;
    if (!m) return null;
    if (m % (60 * 24) === 0) {
      const d = m / (60 * 24);
      return lang === 'ar' ? `${d} ${d === 1 ? 'يوم' : 'أيام'}` : `${d} day${d !== 1 ? 's' : ''}`;
    }
    if (m % 60 === 0) {
      const h = m / 60;
      return lang === 'ar' ? `${h} ${h === 1 ? 'ساعة' : 'ساعات'}` : `${h} hour${h !== 1 ? 's' : ''}`;
    }
    return lang === 'ar' ? `${m} ${m === 1 ? 'دقيقة' : 'دقائق'}` : `${m} minute${m !== 1 ? 's' : ''}`;
  })();

  const sellerEta = (() => {
    const m = product?.prepTime;
    if (!m) return null;
    if (m % (60 * 24) === 0) {
      const d = m / (60 * 24);
      return lang === 'ar'
        ? `يُوصَّل بعد ${d} ${d === 1 ? 'يوم' : 'أيام'} تحضير`
        : `Delivered after ${d} day${d !== 1 ? 's' : ''} prep`;
    }
    if (m % 60 === 0) {
      const h = m / 60;
      return lang === 'ar'
        ? `يُوصَّل بعد ${h} ${h === 1 ? 'ساعة' : 'ساعات'} تحضير`
        : `Delivered after ${h} hour${h !== 1 ? 's' : ''} prep`;
    }
    return lang === 'ar'
      ? `يُوصَّل بعد ${m} ${m === 1 ? 'دقيقة' : 'دقائق'} تحضير`
      : `Delivered after ${m} minute${m !== 1 ? 's' : ''} prep`;
  })();

  const DELIVERY_OPTIONS = [
    { id: 'pickup',          emoji: '🏪', label: t('delivery_pickup_label'), desc: t('delivery_pickup_desc'), price: 0,  eta: t('delivery_pickup_eta')  },
    { id: 'seller_delivery', emoji: '🛵', label: t('delivery_seller_label'), desc: t('delivery_seller_desc'), price: 15, eta: sellerEta ?? t('delivery_seller_eta')  },
    { id: 'third_party',     emoji: '📦', label: t('delivery_3p_label'),     desc: t('delivery_3p_desc'),     price: 25, eta: t('delivery_3p_eta')      },
  ];

  const isSeller = !!(user && product?.producerUserId && user.id === product.producerUserId);

  const SORT_OPTIONS = [
    { id: 'recent',  label: t('sort_recent')  },
    { id: 'highest', label: t('sort_highest') },
    { id: 'lowest',  label: t('sort_lowest')  },
    { id: 'helpful', label: t('sort_helpful') },
  ];

  // ── Derived ────────────────────────────────────────────────────────────────
  const availableDelivery = useMemo(
    () => DELIVERY_OPTIONS.filter((o) => product?.deliveryTypes?.includes(o.id) ?? false),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product?.deliveryTypes, lang]
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

  const needsLocation = deliveryOption === 'seller_delivery' || deliveryOption === 'third_party';
  const locationConfirmed = !needsLocation || !!customerLocation?.lat;
  const needsSize  = !!(product?.sizes?.length);
  const needsColor = !!(product?.colors?.length);
  const canAddToCart = stockLevel !== 'out' && deliveryOption && locationConfirmed
    && (!needsSize  || selectedSize  !== null)
    && (!needsColor || selectedColor !== null);

  const handleAddToCart = () => {
    if (!canAddToCart) {
      if (!deliveryOption) { showToast(lang === 'ar' ? 'اختر طريقة التوصيل أولاً' : 'Please select a delivery option', '⚠️'); return; }
      if (!locationConfirmed) { showToast(lang === 'ar' ? 'يرجى تأكيد موقع التوصيل على الخريطة' : 'Please confirm your delivery location on the map', '📍'); return; }
      return;
    }
    const cappedQty = Math.min(quantity, product.stock ?? quantity);
    const chosenSize  = selectedSize  !== null ? product.sizes?.find((s) => s.id === selectedSize)  ?? null : null;
    const chosenColor = selectedColor !== null ? product.colors?.find((c) => c.id === selectedColor) ?? null : null;
    addItem(product, cappedQty, {
      deliveryOption:   deliveryOption,
      deliveryLocation: customerLocation,
      deliveryPrice:    deliveryPrice,
      chosenSize,
      chosenColor,
    });
    setAdded(true);
    showToast(`${t('toast_addedCart')} (${cappedQty})`, '🛒', 'cart');
    setTimeout(() => setAdded(false), 1800);
  };

  const handleLike = () => {
    if (!product) return;
    const next = !isLiked(product.id);
    toggleWishlist(product);
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
    const isVoted = helpfulVoted.has(reviewId);
    const delta = isVoted ? -1 : 1;

    setHelpfulVoted((prev) => {
      const next = new Set(prev);
      if (isVoted) next.delete(reviewId);
      else next.add(reviewId);
      try { localStorage.setItem('usaruna_helpful_voted', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });

    // Optimistically update the count in local state
    setReviews((prev) =>
      prev.map((r) => r.id === reviewId ? { ...r, helpful: Math.max(0, r.helpful + delta) } : r)
    );

    // Persist to DB
    updateHelpfulCount(reviewId, delta);

    if (!isVoted) showToast(t('toast_thankYou'), '👍');
  };

  const handleSmartReply = async (review) => {
    if (smartReplyLoading[review.id]) return;
    setSmartReplyLoading((prev) => ({ ...prev, [review.id]: true }));
    try {
      const reply = await getSmartReply({
        product_name:        px(product.name, product.nameEn) || 'Product',
        product_description: px(product.description, product.descriptionEn) || '-',
        product_details:     `Price: ${product.price ?? 0} SAR`,
        customer_name:       (lang === 'ar' ? review.author : (review.author_en || review.author)) || 'Customer',
        review_text:         review.comment || '-',
      });
      if (reply) {
        setReplyDrafts((prev) => ({ ...prev, [review.id]: reply }));
        setReplyEditorOpen((prev) => new Set([...prev, review.id]));
      }
    } catch (err) {
      console.error('[AI reply]', err?.message);
      showToast(
        lang === 'ar' ? 'تعذّر الاتصال بخدمة الذكاء الاصطناعي' : 'Could not reach AI service',
        '❌', 'info'
      );
    } finally {
      setSmartReplyLoading((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  const handleTranslateReplyDraft = async (reviewId) => {
    const text = (replyDrafts[reviewId] ?? '').trim();
    if (!text) return;
    const targetLang = lang === 'ar' ? 'en' : 'ar';
    setTranslatingReply((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      const translated = data[0].map((chunk) => chunk[0]).join('');
      setReplyTranslations((prev) => ({ ...prev, [reviewId]: translated }));
    } catch { /* silently fail */ } finally {
      setTranslatingReply((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleTranslateReply = async (reviewId, text) => {
    if (translatedReplies[reviewId]) {
      setTranslatedReplies((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
      return;
    }
    setTranslatingReplies((prev) => ({ ...prev, [reviewId]: true }));
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      const translated = data[0].map((chunk) => chunk[0]).join('');
      setTranslatedReplies((prev) => ({ ...prev, [reviewId]: translated }));
    } catch { /* silently fail */ } finally {
      setTranslatingReplies((prev) => ({ ...prev, [reviewId]: false }));
    }
  };

  const handleTranslate = async (review) => {
    if (translatedComments[review.id]) {
      setTranslatedComments((prev) => { const n = { ...prev }; delete n[review.id]; return n; });
      return;
    }
    const text = review.comment; // always use the stored text
    const targetLang = lang;     // translate TO the current UI language
    setTranslatingComments((prev) => ({ ...prev, [review.id]: true }));
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      const translated = data[0].map((chunk) => chunk[0]).join('');
      setTranslatedComments((prev) => ({ ...prev, [review.id]: translated }));
    } catch { /* silently fail */ } finally {
      setTranslatingComments((prev) => ({ ...prev, [review.id]: false }));
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) return;
    if (!user) {
      showToast(lang === 'ar' ? 'يجب تسجيل الدخول لإرسال تقييم' : 'Please log in to submit a review', '🔒', 'info');
      return;
    }
    const { ok, error: reviewError } = await submitReview({
      productId: Number(id),
      rating:    reviewRating,
      comment:   reviewText,
    });
    if (ok) {
      fetchReviews(Number(id)).then((data) => { if (data) setReviews(data); });
      setReviewText('');
      setReviewRating(5);
      showToast(t('toast_reviewSent'), '⭐', 'review');
    } else {
      console.error('[review submit error]', reviewError);
      showToast(
        reviewError === 'not_logged_in'
          ? (lang === 'ar' ? 'يجب تسجيل الدخول لإرسال تقييم' : 'Please log in to submit a review')
          : (lang === 'ar' ? `خطأ: ${reviewError}` : `Error: ${reviewError}`),
        '❌', 'info'
      );
    }
  };

  const handleDeleteReview = async (reviewId) => {
    const { ok } = await deleteReview(reviewId);
    if (ok) setReviews((prev) => prev.filter((r) => r.id !== reviewId));
  };

  const handleSubmitReply = async (reviewId) => {
    const text = (replyDrafts[reviewId] ?? '').trim();
    if (!text) return;
    setReplySubmitting((prev) => ({ ...prev, [reviewId]: true }));
    const ok = await replyToReview(reviewId, text);
    if (ok) {
      setReviews((prev) => prev.map((r) =>
        r.id === reviewId
          ? { ...r, seller_reply: text, seller_reply_en: null, seller_reply_at: new Date().toISOString() }
          : r
      ));
      setReplyEditorOpen((prev) => { const n = new Set(prev); n.delete(reviewId); return n; });
      setReplyDrafts((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
      setReplyTranslations((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
    }
    setReplySubmitting((prev) => ({ ...prev, [reviewId]: false }));
  };

  const handleDeleteReply = async (reviewId) => {
    const ok = await deleteReviewReply(reviewId);
    if (ok) setReviews((prev) => prev.map((r) =>
      r.id === reviewId ? { ...r, seller_reply: null, seller_reply_en: null, seller_reply_at: null } : r
    ));
  };

  const openReplyEditor = (reviewId, prefill = '') => {
    setReplyDrafts((prev) => ({ ...prev, [reviewId]: prefill }));
    setReplyEditorOpen((prev) => new Set([...prev, reviewId]));
  };

  const closeReplyEditor = (reviewId) => {
    setReplyEditorOpen((prev) => { const n = new Set(prev); n.delete(reviewId); return n; });
    setReplyDrafts((prev) => { const n = { ...prev }; delete n[reviewId]; return n; });
  };

  // ── Question Handlers ──────────────────────────────────────────────────────

  const filteredQuestions = useMemo(() => {
    const q = [...questions];
    if (questionSortBy === 'helpful') q.sort((a, b) => b.helpful - a.helpful);
    return q;
  }, [questions, questionSortBy]);

  const handleQuestionHelpful = (questionId) => {
    const isVoted = questionHelpfulVoted.has(questionId);
    const delta = isVoted ? -1 : 1;
    setQuestionHelpfulVoted((prev) => {
      const next = new Set(prev);
      if (isVoted) next.delete(questionId);
      else next.add(questionId);
      try { localStorage.setItem('usaruna_qhelpful_voted', JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
    setQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, helpful: Math.max(0, q.helpful + delta) } : q)
    );
    updateQuestionHelpful(questionId, delta);
    if (!isVoted) showToast(t('toast_thankYou'), '👍');
  };

  const handleTranslateQuestion = async (question) => {
    if (translatedQuestions[question.id]) {
      setTranslatedQuestions((prev) => { const n = { ...prev }; delete n[question.id]; return n; });
      return;
    }
    const targetLang = lang;
    setTranslatingQuestions((prev) => ({ ...prev, [question.id]: true }));
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(question.question)}`
      );
      const data = await res.json();
      const translated = data[0].map((chunk) => chunk[0]).join('');
      setTranslatedQuestions((prev) => ({ ...prev, [question.id]: translated }));
    } catch { /* silently fail */ } finally {
      setTranslatingQuestions((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  const handleSmartAnswer = async (question) => {
    if (smartAnswerLoading[question.id]) return;
    setSmartAnswerLoading((prev) => ({ ...prev, [question.id]: true }));
    try {
      const reply = await getSmartReply({
        product_name:        px(product.name, product.nameEn) || 'Product',
        product_description: px(product.description, product.descriptionEn) || '-',
        product_details:     `Price: ${product.price ?? 0} SAR`,
        customer_name:       question.author || 'Customer',
        review_text:         question.question || '-',
      });
      if (reply) {
        setAnswerDrafts((prev) => ({ ...prev, [question.id]: reply }));
        setAnswerEditorOpen((prev) => new Set([...prev, question.id]));
      }
    } catch (err) {
      console.error('[AI answer]', err?.message);
      showToast(
        lang === 'ar' ? 'تعذّر الاتصال بخدمة الذكاء الاصطناعي' : 'Could not reach AI service',
        '❌', 'info'
      );
    } finally {
      setSmartAnswerLoading((prev) => ({ ...prev, [question.id]: false }));
    }
  };

  const handleTranslateAnswerDraft = async (questionId) => {
    const text = (answerDrafts[questionId] ?? '').trim();
    if (!text) return;
    const targetLang = lang === 'ar' ? 'en' : 'ar';
    setTranslatingAnswer((prev) => ({ ...prev, [questionId]: true }));
    try {
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
      );
      const data = await res.json();
      const translated = data[0].map((chunk) => chunk[0]).join('');
      setAnswerTranslations((prev) => ({ ...prev, [questionId]: translated }));
    } catch { /* silently fail */ } finally {
      setTranslatingAnswer((prev) => ({ ...prev, [questionId]: false }));
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    const text = (answerDrafts[questionId] ?? '').trim();
    if (!text) return;
    setAnswerSubmitting((prev) => ({ ...prev, [questionId]: true }));
    const translatedText = answerTranslations[questionId] ?? null;
    const ok = await answerQuestion(questionId, text, translatedText);
    if (ok) {
      setQuestions((prev) => prev.map((q) =>
        q.id === questionId
          ? { ...q, seller_answer: text, seller_answer_en: translatedText, seller_answer_at: new Date().toISOString() }
          : q
      ));
      setAnswerEditorOpen((prev) => { const n = new Set(prev); n.delete(questionId); return n; });
      setAnswerDrafts((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
      setAnswerTranslations((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
    }
    setAnswerSubmitting((prev) => ({ ...prev, [questionId]: false }));
  };

  const handleDeleteAnswer = async (questionId) => {
    const ok = await deleteQuestionAnswer(questionId);
    if (ok) setQuestions((prev) => prev.map((q) =>
      q.id === questionId ? { ...q, seller_answer: null, seller_answer_en: null, seller_answer_at: null } : q
    ));
  };

  const handleDeleteQuestion = async (questionId) => {
    const { ok } = await deleteQuestion(questionId);
    if (ok) setQuestions((prev) => prev.filter((q) => q.id !== questionId));
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) return;
    if (!user) {
      showToast(lang === 'ar' ? 'يجب تسجيل الدخول لإرسال سؤال' : 'Please log in to submit a question', '🔒', 'info');
      return;
    }
    const { ok, error: qError } = await submitQuestion({
      productId: Number(id),
      question:  questionText,
    });
    if (ok) {
      fetchQuestions(Number(id)).then((data) => { if (data) setQuestions(data); });
      setQuestionText('');
      showToast(lang === 'ar' ? 'تم إرسال سؤالك بنجاح!' : 'Question submitted!', '❓', 'review');
    } else {
      showToast(
        qError === 'not_logged_in'
          ? (lang === 'ar' ? 'يجب تسجيل الدخول' : 'Please log in')
          : (lang === 'ar' ? `خطأ: ${qError}` : `Error: ${qError}`),
        '❌', 'info'
      );
    }
  };

  const openAnswerEditor = (questionId, prefill = '') => {
    setAnswerDrafts((prev) => ({ ...prev, [questionId]: prefill }));
    setAnswerEditorOpen((prev) => new Set([...prev, questionId]));
  };

  const closeAnswerEditor = (questionId) => {
    setAnswerEditorOpen((prev) => { const n = new Set(prev); n.delete(questionId); return n; });
    setAnswerDrafts((prev) => { const n = { ...prev }; delete n[questionId]; return n; });
  };

  // ── 404 / Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div dir={dir} className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 size={40} className="text-blue-900 animate-spin" />
      </div>
    );
  }

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

  const images         = product.images?.length ? product.images : [product.image_url ?? product.emoji];
  const relatedProducts = []; // To be fetched dynamically later if needed

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
            <AccountMenu />
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
              {typeof images[selectedImage] === 'string' && images[selectedImage].startsWith('http') ? (
                <img 
                  src={images[selectedImage]} 
                  alt={product.name} 
                  className="w-full h-full object-cover z-10 hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <span className="text-[7rem] sm:text-[8.5rem] select-none drop-shadow-lg z-10 hover:scale-110 transition-transform duration-300">
                  {images[selectedImage]}
                </span>
              )}
              {(lang === 'ar' ? product.badge : product.badgeEn || product.badge) && (
                <span className={`absolute top-4 right-4 ${product.badgeColor} text-white text-xs font-bold px-3 py-1.5 rounded-full z-10 shadow-sm`}>
                  {lang === 'ar' ? product.badge : (product.badgeEn || product.badge)}
                </span>
              )}
              <button onClick={handleLike} className="absolute top-4 left-4 bg-white rounded-full p-2.5 shadow-md hover:scale-110 transition-transform z-10">
                <Heart size={17} className={isLiked(product?.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
              </button>
              <button onClick={handleShare} className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2.5 shadow-md hover:scale-110 transition-transform z-10">
                <Share2 size={16} className="text-gray-600" />
              </button>
              {/* Rating pill on image */}
              {reviews.length > 0 && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md z-10">
                  <Star size={13} className="text-amber-400 fill-amber-400 shrink-0" />
                  <span className="font-extrabold text-gray-800 text-sm leading-none">{avgRating}</span>
                  <span className="text-gray-400 text-xs leading-none">({reviews.length})</span>
                </div>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 mt-4 justify-center flex-wrap">
                {images.map((img, i) => {
                  const isHttp = typeof img === 'string' && img.startsWith('http');
                  return (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${product.gradient} flex items-center justify-center text-2xl transition-all duration-200 border-2 overflow-hidden
                        ${selectedImage === i ? 'border-blue-900 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-90 hover:scale-105'}`}
                    >
                      {isHttp ? (
                        <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        img
                      )}
                    </button>
                  );
                })}
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
                <span>{px(product.sellerCity, product.sellerCityEn)}</span>
                <span className="text-gray-300">·</span>
                <span>{px(product.family, product.familyEn)}</span>
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
                <StarRating rating={Number(avgRating)} size={16} />
                <span className="font-bold text-gray-800 text-sm">{avgRating}</span>
                <span className="text-gray-400 text-sm">({reviews.length} {t('pd_reviews')})</span>
              </div>
              <DeliveryTag deliveryTypes={product.deliveryTypes} />
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
            <div>
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
              <p className="text-[11px] text-gray-400 mt-1">
                {lang === 'ar' ? 'شامل ضريبة القيمة المضافة' : 'VAT included'}
              </p>
            </div>

            {/* Size selector */}
            {product.sizes?.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm">{t('pd_sizeLabel')}</h3>
                    {selectedSize === null && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        {lang === 'ar' ? 'مطلوب' : 'Required'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 font-semibold">{px(sizeObj?.label, sizeObj?.labelEn)}</span>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize === size.id;
                    return (
                      <button key={size.id} onClick={() => setSelectedSize(isSelected ? null : size.id)}
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-800 text-sm">
                      {product.isPerishable ? t('pd_flavorLabel') : t('pd_packagingLabel')}
                    </h3>
                    {selectedColor === null && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                        {lang === 'ar' ? 'مطلوب' : 'Required'}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 font-semibold">
                    {px(product.colors.find((c) => c.id === selectedColor)?.label, product.colors.find((c) => c.id === selectedColor)?.labelEn)}
                  </span>
                </div>
                <div className="flex gap-3 flex-wrap items-center">
                  {product.colors.map((color) => {
                    const isSelected = selectedColor === color.id;
                    return (
                      <button key={color.id} onClick={() => setSelectedColor(isSelected ? null : color.id)}
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

            {/* Description — Arabic */}
            {product.description && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 text-sm mb-2.5">{lang === 'ar' ? 'عن المنتج' : 'About (Arabic)'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed" dir="rtl">{product.description}</p>
              </div>
            )}

            {/* Description — English */}
            {product.descriptionEn && (
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-bold text-gray-800 text-sm mb-2.5">{lang === 'ar' ? 'عن المنتج (إنجليزي)' : 'About Product'}</h3>
                <p className="text-gray-600 text-sm leading-relaxed" dir="ltr">{product.descriptionEn}</p>
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

            {/* Return policy */}
            {product.isReturnable ? (
              <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                <RotateCcw size={15} className="text-emerald-600 shrink-0" />
                <p className="text-xs font-semibold text-emerald-800">
                  {lang === 'ar'
                    ? '✅ قابل للإرجاع — يمكن إرجاع المنتج بشرط أن يكون بحالته الأصلية دون استخدام'
                    : '✅ Returnable — product can be returned as long as it is unused and in its original condition'}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 rounded-2xl px-4 py-3">
                <XCircle size={15} className="text-red-500 shrink-0" />
                <p className="text-xs font-semibold text-red-700">
                  {lang === 'ar'
                    ? '🚫 غير قابل للإرجاع — يرجى مراجعة جميع تفاصيل المنتج بعناية قبل الشراء'
                    : '🚫 Not returnable — please review all product details carefully before purchasing'}
                </p>
              </div>
            )}

            {/* Prep time */}
            {prepTimeLabel && (
              <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <Clock size={15} className="text-amber-600 shrink-0" />
                <p className="text-xs font-semibold text-amber-800">
                  {lang === 'ar' ? `وقت التحضير: ${prepTimeLabel}` : `Prep time: ${prepTimeLabel}`}
                </p>
              </div>
            )}

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

              {/* Seller delivery: customer confirms their delivery address — must be same city */}
              {deliveryOption === 'seller_delivery' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className={`text-xs font-bold text-gray-500 mb-1.5 flex items-center gap-1.5 ${dir === 'ltr' ? 'flex-row-reverse' : ''}`}>
                    <MapPin size={12} className="text-blue-600 shrink-0" />
                    {lang === 'ar' ? 'حدد موقعك لتوصيل البائع' : 'Set your location for seller delivery'}
                  </p>
                  <div className="flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-xl p-2.5 mb-2.5 text-[11px] text-amber-800 font-semibold">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    {lang === 'ar'
                      ? `يجب أن يكون موقعك في ${product.sellerCity ?? 'نفس مدينة البائع'} — إذا كنت في مدينة أخرى اختر شركة الشحن أو الاستلام الشخصي`
                      : `Your location must be in ${product.sellerCityEn ?? product.sellerCity ?? 'the seller\'s city'} — for other cities choose Shipping Co. or Pickup`}
                  </div>
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
                <button onClick={handleAddToCart} disabled={!canAddToCart}
                  className={`flex-1 py-3.5 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
                    ${!canAddToCart ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : added ? 'bg-emerald-500 text-white scale-[0.98]'
                      : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.97]'}`}
                >
                  <ShoppingCart size={15} />
                  {stockLevel === 'out'
                    ? t('btn_outOfStock')
                    : needsSize && selectedSize === null
                      ? (lang === 'ar' ? 'اختر الحجم أولاً' : 'Select Size First')
                      : needsColor && selectedColor === null
                        ? (lang === 'ar' ? 'اختر الخيار أولاً' : 'Select Option First')
                        : !deliveryOption
                          ? (lang === 'ar' ? 'اختر طريقة التوصيل' : 'Select Delivery')
                          : needsLocation && !locationConfirmed
                            ? (lang === 'ar' ? 'أكد موقعك أولاً' : 'Confirm Location First')
                            : added
                              ? t('btn_addedToCart')
                              : `${t('btn_addWithPrice')} ${totalPrice} ${t('card_currency')}`}
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
              <div className="flex items-center gap-1.5 font-extrabold text-gray-900 text-base">
                <MapPin size={13} className="text-blue-400 shrink-0" />
                <span>{px(product.sellerCity, product.sellerCityEn)}</span>
                <span className="text-gray-300 font-normal">·</span>
                <span className="text-gray-500 font-semibold text-sm">{px(product.family, product.familyEn)}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div className="flex items-center gap-1.5">
                  <StarRating rating={product.rating} size={12} />
                  <span className="text-xs text-gray-500">{avgRating} ({reviews.length} {t('pd_reviews')})</span>
                </div>
                {product.partnerSince && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                    {t('pd_partnerSince')} {px(product.partnerSince, product.partnerSinceEn)}
                  </span>
                )}
              </div>
            </div>
            <button onClick={() => setShowContactSeller(true)}
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

          {/* AI Review Summary — only appears when reviews reach 10+ */}
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
                          {lang === 'ar' ? review.author : review.author_en}
                        </span>
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
                <p className="text-sm text-gray-700 leading-relaxed mb-1" dir={review.lang === 'en' ? 'ltr' : 'rtl'}>
                  {review.comment}
                </p>
                {translatedComments[review.id] && (
                  <div className="mt-1.5 mb-2 pt-2 border-t border-gray-100">
                    <p className="text-sm text-gray-600 leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                      {translatedComments[review.id]}
                    </p>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                      <Globe size={9} /> Google Translate
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4 flex-wrap mt-2">
                  <button onClick={() => handleHelpful(review.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${helpfulVoted.has(review.id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                  >
                    <ThumbsUp size={12} className={helpfulVoted.has(review.id) ? 'fill-blue-600' : ''} />
                    {t('pd_helpful')} ({review.helpful})
                  </button>
                  {/* Translate: only show when review lang differs from UI lang */}
                  {review.lang !== lang && (
                    <button
                      onClick={() => handleTranslate(review)}
                      disabled={translatingComments[review.id]}
                      className="flex items-center gap-1.5 text-xs font-semibold text-sky-500 hover:text-sky-700 transition-colors disabled:opacity-50"
                    >
                      {translatingComments[review.id]
                        ? <><Loader2 size={12} className="animate-spin" />{lang === 'ar' ? 'جاري الترجمة...' : 'Translating...'}</>
                        : translatedComments[review.id]
                          ? <><Globe size={12} />{lang === 'ar' ? 'إخفاء الترجمة' : 'Hide translation'}</>
                          : <><Globe size={12} />{lang === 'ar' ? 'ترجمة' : 'Translate'}</>
                      }
                    </button>
                  )}
                  {/* Seller: reply button (only when no existing reply and editor closed) */}
                  {isSeller && !review.seller_reply && !replyEditorOpen.has(review.id) && (
                    <button onClick={() => openReplyEditor(review.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      <MessageCircle size={12} />{lang === 'ar' ? 'رد على التقييم' : 'Reply'}
                    </button>
                  )}
                  {/* Delete review: owner or seller */}
                  {(isSeller || (user && review.user_id === user.id)) && (
                    <button onClick={() => handleDeleteReview(review.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
                      <Trash2 size={11} />{lang === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  )}
                </div>

                {/* Seller reply editor */}
                {isSeller && replyEditorOpen.has(review.id) && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyDrafts[review.id] ?? ''}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))}
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder={lang === 'ar' ? 'اكتب ردك هنا...' : 'Write your reply here...'}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* AI suggest */}
                      <button onClick={() => handleSmartReply(review)} disabled={smartReplyLoading[review.id]}
                        className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
                        {smartReplyLoading[review.id]
                          ? <><Loader2 size={11} className="animate-spin" />{lang === 'ar' ? 'جاري توليد الرد...' : 'Generating...'}</>
                          : <><Wand2 size={11} />{lang === 'ar' ? 'اقتراح رد بالذكاء الاصطناعي' : 'AI Suggest'}</>}
                      </button>
                      {/* Post reply */}
                      <button onClick={() => handleSubmitReply(review.id)}
                        disabled={replySubmitting[review.id] || !(replyDrafts[review.id] ?? '').trim()}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
                        {replySubmitting[review.id] && <Loader2 size={11} className="animate-spin" />}
                        {lang === 'ar' ? 'نشر الرد' : 'Post Reply'}
                      </button>
                      <button onClick={() => closeReplyEditor(review.id)}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-xl transition-colors">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Seller reply display — shows the right language version */}
                {review.seller_reply && (() => {
                  const displayReply = review.seller_reply;
                  return (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-blue-700 flex items-center gap-1">
                          <Store size={10} />{lang === 'ar' ? 'رد البائع' : "Seller's Reply"}
                        </span>
                        {isSeller && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => openReplyEditor(review.id, review.seller_reply)}
                              className="text-[10px] font-bold text-blue-400 hover:text-blue-700 transition-colors">
                              {lang === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button onClick={() => handleDeleteReply(review.id)}
                              className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors">
                              {lang === 'ar' ? 'حذف الرد' : 'Delete reply'}
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{displayReply}</p>
                      {translatedReplies[review.id] && (
                        <div className="mt-2 pt-2 border-t border-blue-100">
                          <p className="text-xs text-gray-600 leading-relaxed">{translatedReplies[review.id]}</p>
                          <span className="text-[10px] text-blue-400 flex items-center gap-1 mt-1">
                            <Globe size={9} /> Google Translate
                          </span>
                        </div>
                      )}
                      {!isSeller && (
                        <button
                          onClick={() => handleTranslateReply(review.id, displayReply)}
                          disabled={translatingReplies[review.id]}
                          className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-sky-500 hover:text-sky-700 transition-colors disabled:opacity-50"
                        >
                          {translatingReplies[review.id]
                            ? <><Loader2 size={10} className="animate-spin" />{lang === 'ar' ? 'جاري الترجمة...' : 'Translating...'}</>
                            : translatedReplies[review.id]
                              ? <><Globe size={10} />{lang === 'ar' ? 'إخفاء الترجمة' : 'Hide translation'}</>
                              : <><Globe size={10} />{lang === 'ar' ? 'ترجمة' : 'Translate'}</>
                          }
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Write a review */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">{t('pd_writeReview')}</h3>
            {!user ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                <span className="text-lg">🔒</span>
                <span className="font-semibold">
                  {lang === 'ar' ? 'يجب ' : 'You need to '}
                  <Link to="/login" className="underline font-bold hover:text-amber-900">
                    {lang === 'ar' ? 'تسجيل الدخول' : 'log in'}
                  </Link>
                  {lang === 'ar' ? ' لكتابة تقييم' : ' to write a review'}
                </span>
              </div>
            ) : (
              <>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} onMouseEnter={() => setReviewHover(n)} onMouseLeave={() => setReviewHover(0)} onClick={() => setReviewRating(n)}>
                      <Star size={26} className={`transition-colors duration-100 ${n <= (reviewHover || reviewRating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-100'}`} />
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 self-center ms-2">{reviewHover || reviewRating} {t('pd_outOf5')}</span>
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
              </>
            )}
          </div>
        </section>

        {/* ════════ QUESTIONS ════════ */}
        <section className="mt-6 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-extrabold text-gray-800 mb-6 text-base flex items-center gap-2">
            <span className="w-1 h-5 bg-sky-400 rounded-full" />
            {lang === 'ar' ? 'الأسئلة والأجوبة' : 'Questions & Answers'}
            <span className="text-xs font-semibold text-gray-400 ms-1">({questions.length})</span>
          </h2>

          {/* Sort */}
          {questions.length > 1 && (
            <div className="flex items-center gap-1.5 mb-5">
              <Filter size={13} className="text-gray-400 shrink-0" />
              <select value={questionSortBy} onChange={(e) => setQuestionSortBy(e.target.value)}
                className="text-xs font-semibold text-gray-600 bg-gray-100 rounded-xl px-3 py-2 border-none outline-none cursor-pointer hover:bg-gray-200 transition-colors"
              >
                <option value="recent">{lang === 'ar' ? 'الأحدث' : 'Most Recent'}</option>
                <option value="helpful">{lang === 'ar' ? 'الأكثر فائدة' : 'Most Helpful'}</option>
              </select>
            </div>
          )}

          {/* Question cards */}
          <div className="flex flex-col gap-4 mb-8">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                {lang === 'ar' ? 'لا توجد أسئلة بعد — كن أول من يسأل!' : 'No questions yet — be the first to ask!'}
              </div>
            ) : filteredQuestions.map((question) => (
              <div key={question.id} className="border border-gray-100 rounded-2xl p-5 hover:border-gray-200 transition-colors">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center text-lg shrink-0">
                    ❓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-bold text-sm text-gray-800">{question.author}</span>
                      <span className="text-xs text-gray-400">{lang === 'ar' ? question.date : question.date_en}</span>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed" dir={question.lang === 'en' ? 'ltr' : 'rtl'}>
                      {question.question}
                    </p>
                    {translatedQuestions[question.id] && (
                      <div className="mt-1.5 pt-2 border-t border-gray-100">
                        <p className="text-sm text-gray-600 leading-relaxed" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                          {translatedQuestions[question.id]}
                        </p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                          <Globe size={9} /> Google Translate
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap mt-2">
                  <button onClick={() => handleQuestionHelpful(question.id)}
                    className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${questionHelpfulVoted.has(question.id) ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
                  >
                    <ThumbsUp size={12} className={questionHelpfulVoted.has(question.id) ? 'fill-blue-600' : ''} />
                    {lang === 'ar' ? 'مفيد' : 'Helpful'} ({question.helpful})
                  </button>
                  {/* Translate: only when question lang differs from UI lang */}
                  {question.lang !== lang && (
                    <button
                      onClick={() => handleTranslateQuestion(question)}
                      disabled={translatingQuestions[question.id]}
                      className="flex items-center gap-1.5 text-xs font-semibold text-sky-500 hover:text-sky-700 transition-colors disabled:opacity-50"
                    >
                      {translatingQuestions[question.id]
                        ? <><Loader2 size={12} className="animate-spin" />{lang === 'ar' ? 'جاري الترجمة...' : 'Translating...'}</>
                        : translatedQuestions[question.id]
                          ? <><Globe size={12} />{lang === 'ar' ? 'إخفاء الترجمة' : 'Hide translation'}</>
                          : <><Globe size={12} />{lang === 'ar' ? 'ترجمة' : 'Translate'}</>
                      }
                    </button>
                  )}
                  {/* Seller: answer button */}
                  {isSeller && !question.seller_answer && !answerEditorOpen.has(question.id) && (
                    <button onClick={() => openAnswerEditor(question.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                      <MessageCircle size={12} />{lang === 'ar' ? 'إجابة' : 'Answer'}
                    </button>
                  )}
                  {/* Delete: owner or seller */}
                  {(isSeller || (user && question.user_id === user.id)) && (
                    <button onClick={() => handleDeleteQuestion(question.id)}
                      className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors font-medium">
                      <Trash2 size={11} />{lang === 'ar' ? 'حذف' : 'Delete'}
                    </button>
                  )}
                </div>

                {/* Answer editor */}
                {isSeller && answerEditorOpen.has(question.id) && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={answerDrafts[question.id] ?? ''}
                      onChange={(e) => {
                        setAnswerDrafts((prev) => ({ ...prev, [question.id]: e.target.value }));
                        setAnswerTranslations((prev) => { const n = { ...prev }; delete n[question.id]; return n; });
                      }}
                      rows={3}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                      placeholder={lang === 'ar' ? 'اكتب إجابتك هنا...' : 'Write your answer here...'}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button onClick={() => handleSmartAnswer(question)} disabled={smartAnswerLoading[question.id]}
                        className="flex items-center gap-1.5 text-xs font-bold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
                        {smartAnswerLoading[question.id]
                          ? <><Loader2 size={11} className="animate-spin" />{lang === 'ar' ? 'جاري توليد الإجابة...' : 'Generating...'}</>
                          : <><Wand2 size={11} />{lang === 'ar' ? 'اقتراح إجابة بالذكاء الاصطناعي' : 'AI Suggest'}</>}
                      </button>
                      <button onClick={() => handleSubmitAnswer(question.id)}
                        disabled={answerSubmitting[question.id] || !(answerDrafts[question.id] ?? '').trim()}
                        className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50">
                        {answerSubmitting[question.id] && <Loader2 size={11} className="animate-spin" />}
                        {lang === 'ar' ? 'نشر الإجابة' : 'Post Answer'}
                      </button>
                      <button onClick={() => closeAnswerEditor(question.id)}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-xl transition-colors">
                        {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Seller answer display */}
                {(question.seller_answer || question.seller_answer_en) && (() => {
                  const displayAnswer = lang === 'ar'
                    ? (question.seller_answer || question.seller_answer_en)
                    : (question.seller_answer_en || question.seller_answer);
                  const needsTranslate = lang === 'ar' ? !question.seller_answer : !question.seller_answer_en;
                  return (
                    <div className="mt-3 p-3 bg-sky-50 border border-sky-100 rounded-xl">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
                          <Store size={10} />{lang === 'ar' ? 'إجابة البائع' : "Seller's Answer"}
                        </span>
                        {isSeller && (
                          <div className="flex items-center gap-3">
                            <button onClick={() => openAnswerEditor(question.id, question.seller_answer || '')}
                              className="text-[10px] font-bold text-sky-400 hover:text-sky-700 transition-colors">
                              {lang === 'ar' ? 'تعديل' : 'Edit'}
                            </button>
                            <button onClick={() => handleDeleteAnswer(question.id)}
                              className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors">
                              {lang === 'ar' ? 'حذف الإجابة' : 'Delete answer'}
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 leading-relaxed">{displayAnswer}</p>
                      {translatedReplies[`q_${question.id}`] && (
                        <div className="mt-2 pt-2 border-t border-sky-100">
                          <p className="text-xs text-gray-600 leading-relaxed">{translatedReplies[`q_${question.id}`]}</p>
                          <span className="text-[10px] text-sky-400 flex items-center gap-1 mt-1">
                            <Globe size={9} /> Google Translate
                          </span>
                        </div>
                      )}
                      {needsTranslate && (
                        <button
                          onClick={() => handleTranslateReply(`q_${question.id}`, displayAnswer)}
                          disabled={translatingReplies[`q_${question.id}`]}
                          className="flex items-center gap-1 mt-2 text-[10px] font-semibold text-sky-500 hover:text-sky-700 transition-colors disabled:opacity-50"
                        >
                          {translatingReplies[`q_${question.id}`]
                            ? <><Loader2 size={10} className="animate-spin" />{lang === 'ar' ? 'جاري الترجمة...' : 'Translating...'}</>
                            : translatedReplies[`q_${question.id}`]
                              ? <><Globe size={10} />{lang === 'ar' ? 'إخفاء الترجمة' : 'Hide translation'}</>
                              : <><Globe size={10} />{lang === 'ar' ? 'ترجمة' : 'Translate'}</>
                          }
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            ))}
          </div>

          {/* Ask a question */}
          <div className="border-t border-gray-100 pt-6">
            <h3 className="font-bold text-gray-800 mb-4 text-sm">
              {lang === 'ar' ? 'اطرح سؤالاً' : 'Ask a Question'}
            </h3>
            {!user ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800">
                <span className="text-lg">🔒</span>
                <span className="font-semibold">
                  {lang === 'ar' ? 'يجب ' : 'You need to '}
                  <Link to="/login" className="underline font-bold hover:text-amber-900">
                    {lang === 'ar' ? 'تسجيل الدخول' : 'log in'}
                  </Link>
                  {lang === 'ar' ? ' لطرح سؤال' : ' to ask a question'}
                </span>
              </div>
            ) : (
              <>
                <textarea
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب سؤالك هنا...' : 'Write your question here...'}
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all placeholder-gray-400"
                />
                <button onClick={handleSubmitQuestion} disabled={!questionText.trim()}
                  className="mt-3 bg-blue-900 hover:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold px-7 py-2.5 rounded-2xl text-sm transition-colors"
                >
                  {lang === 'ar' ? 'إرسال السؤال' : 'Submit Question'}
                </button>
              </>
            )}
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
                <li><Link to="/" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{t('footer_home')}</Link></li>
                <li><button onClick={() => setShowAbout(true)} className="text-blue-300 hover:text-emerald-400 text-sm transition-colors text-start">{t('footer_about')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-5">{t('footer_forFamilies')}</h4>
              <ul className="space-y-3">
                <li><Link to="/register-family" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{t('footer_registerFam')}</Link></li>
                <li><Link to="/dashboard" className="text-blue-300 hover:text-emerald-400 text-sm transition-colors">{t('footer_dashboard')}</Link></li>
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
          <button onClick={handleAddToCart} disabled={!canAddToCart}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm transition-all duration-200 flex items-center justify-center gap-2
              ${!canAddToCart ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : added ? 'bg-emerald-500 text-white' : 'bg-blue-900 hover:bg-blue-800 text-white active:scale-[0.98]'}`}
          >
            <ShoppingCart size={15} />
            {stockLevel === 'out'
              ? t('btn_outOfStock')
              : needsSize && selectedSize === null
                ? (lang === 'ar' ? 'اختر الحجم أولاً' : 'Select Size First')
                : needsColor && selectedColor === null
                  ? (lang === 'ar' ? 'اختر الخيار أولاً' : 'Select Option First')
                  : !deliveryOption
                    ? (lang === 'ar' ? 'اختر التوصيل' : 'Select Delivery')
                    : needsLocation && !locationConfirmed
                      ? (lang === 'ar' ? 'أكد موقعك' : 'Confirm Location')
                      : added
                        ? t('btn_addedToCart')
                        : `${t('btn_addWithPrice')} ${totalPrice} ${t('card_currency')}`}
          </button>
        </div>
      </div>

      {/* Contact Seller modal */}
      {showContactSeller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactSeller(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowContactSeller(false)} className="absolute top-4 end-4 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
            <h3 className="font-extrabold text-gray-900 text-base mb-4 flex items-center gap-2">
              <Phone size={16} className="text-blue-700 shrink-0" />
              {lang === 'ar' ? 'معلومات التواصل' : 'Contact Info'}
            </h3>
            <div className="space-y-3">
              {/* Family name */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Store size={14} className="text-blue-700" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                    {lang === 'ar' ? 'اسم الأسرة' : 'Family Name'}
                  </p>
                  <p className="text-sm font-bold text-gray-800 truncate">
                    {lang === 'ar' ? product.family : (product.familyEn || product.family)}
                  </p>
                </div>
              </div>
              {/* Email */}
              {product.sellerEmail && (
                <a href={`mailto:${product.sellerEmail}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                    <Mail size={14} className="text-blue-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                      {lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}
                    </p>
                    <p className="text-sm font-semibold text-blue-700 group-hover:underline truncate" dir="ltr">
                      {product.sellerEmail}
                    </p>
                  </div>
                </a>
              )}
              {/* Phone */}
              {(product.sellerPhone || product.whatsapp) && (
                <a href={`tel:${product.sellerPhone || product.whatsapp}`}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                    <Phone size={14} className="text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">
                      {lang === 'ar' ? 'رقم الجوال' : 'Phone'}
                    </p>
                    <p className="text-sm font-semibold text-emerald-700 group-hover:underline truncate" dir="ltr">
                      {product.sellerPhone || product.whatsapp}
                    </p>
                  </div>
                </a>
              )}
              {/* WhatsApp — only if separate from phone */}
              {product.whatsapp && product.sellerPhone && product.whatsapp !== product.sellerPhone && (
                <a href={`https://wa.me/${product.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700 font-bold text-sm">
                    W
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">WhatsApp</p>
                    <p className="text-sm font-semibold text-emerald-700 group-hover:underline truncate" dir="ltr">
                      {product.whatsapp}
                    </p>
                  </div>
                </a>
              )}
              {!product.sellerEmail && !product.sellerPhone && !product.whatsapp && (
                <p className="text-sm text-gray-400 text-center py-3">
                  {lang === 'ar' ? 'لا توجد معلومات تواصل متاحة' : 'No contact info available'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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
