import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, Package, MapPin, User, LogOut,
  CheckCircle, AlertCircle, Loader2, PlusCircle,
  ShoppingBag, Layers, Truck, Archive, ChevronRight,
  Settings, LayoutDashboard, TrendingUp, ClipboardList, ImagePlus, X, Trash2, Star,
  Printer, Plus, Globe, Pencil, Zap,
} from 'lucide-react';
import { supabase } from './supabase';
import { useAuth } from './contexts/AuthContext';
import logo from './assets/logo.png';

// ─── Translations ──────────────────────────────────────────────────────────────

const T = {
  ar: {
    dir: 'rtl', langBtn: 'English',
    brand: 'اسرنا', dashboard: 'لوحة تحكم البائع',
    welcome: 'أهلاً', storeActive: 'متجر نشط',
    backToSite: 'العودة للموقع', logout: 'خروج',
    storeReadyMsg: 'متجرك نشط وجاهز للبيع. ابدأ بإضافة منتجاتك الآن.',

    nav_overview: 'الرئيسية', nav_sales: 'المبيعات',
    nav_addProduct: 'إضافة منتج', nav_myProducts: 'منتجاتي', nav_settings: 'الإعدادات',

    stat_products: 'المنتجات المنشورة', stat_orders: 'الطلبات الواردة',
    stat_revenue: 'إجمالي المبيعات', stat_rating: 'تقييم المتجر',
    quickActions: 'إجراءات سريعة', addNewProduct: 'إضافة منتج جديد',
    viewMyProducts: 'عرض منتجاتي', storeSettings: 'إعدادات المتجر',

    sales_title: 'تقرير المبيعات', sales_period: 'الفترة',
    sales_week: 'أسبوع', sales_month: 'شهر', sales_year: 'سنة',
    sales_print: 'طباعة', sales_revenue: 'إجمالي الإيرادات',
    sales_orders: 'عدد الطلبات', sales_avgRating: 'متوسط التقييم',
    sales_totalReviews: 'إجمالي التقييمات',
    sales_noData: 'لا توجد بيانات مبيعات بعد',
    sales_noDataDesc: 'ستظهر هنا بمجرد استلام أول طلب',
    sales_ratingDist: 'توزيع التقييمات',
    sales_outOf: 'من 5',

    ap_title: 'إضافة منتج جديد', ap_subtitle: 'سيُضاف المنتج إلى متجر',
    ap_image: 'صورة المنتج', ap_info: 'معلومات المنتج',
    ap_nameAr: 'اسم المنتج (عربي)', ap_nameEn: 'اسم المنتج (إنجليزي)',
    ap_descAr: 'وصف المنتج (عربي)', ap_descEn: 'وصف المنتج (إنجليزي)',
    ap_price: 'السعر (ريال سعودي)', ap_stock: 'الكمية المتاحة',
    ap_weight: 'الوزن (كجم)', ap_weightPlaceholder: 'مثال: 0.500',
    ap_classification: 'التصنيف والموقع',
    ap_category: 'الفئة', ap_city: 'المدينة',
    ap_shipping: 'الشحن والتوصيل',
    ap_deliveryType: 'نوع التوصيل', ap_nature: 'طبيعة المنتج',
    ap_perishable: 'منتج طازج (يتطلب توصيل في نفس اليوم)',
    ap_perishableNote: 'سيظهر هذا المنتج فقط للعملاء في نفس مدينتك',
    ap_nationwide: '🚚 لجميع المناطق', ap_local: '📍 محلي فقط',
    ap_selectCat: '— اختر الفئة —', ap_selectCity: '— اختر المدينة —',
    ap_sizes: 'الأحجام والخيارات (اختياري)',
    ap_addSize: '+ إضافة حجم', ap_sizeName: 'اسم الحجم (مثال: كبير)',
    ap_sizeNameEn: 'اسم الحجم (إنجليزي)', ap_sizePriceAdj: 'فرق السعر (ريال)',
    ap_colors: 'الألوان (اختياري)',
    ap_addColor: '+ إضافة لون', ap_colorName: 'اسم اللون',
    ap_colorNameEn: 'اسم اللون (إنجليزي)', ap_colorHex: 'رمز اللون',
    ap_specs: 'المواصفات التفصيلية (اختياري)',
    ap_addSpec: '+ إضافة مواصفة', ap_specKey: 'الخاصية', ap_specVal: 'القيمة',
    ap_publish: 'نشر المنتج', ap_uploading: 'جاري رفع الصورة…', ap_saving: 'جاري حفظ المنتج…',
    ap_success: 'تم نشر المنتج بنجاح ✓',
    ap_errNameAr: 'اسم المنتج مطلوب', ap_errPrice: 'السعر مطلوب',
    ap_errPriceBad: 'يرجى إدخال سعر صحيح', ap_errStock: 'الكمية مطلوبة',
    ap_errCat: 'يرجى اختيار الفئة', ap_errCity: 'يرجى اختيار المدينة',
    ap_errUpload: 'خطأ في رفع الصورة: ', ap_errSave: 'خطأ في حفظ المنتج: ',
    img_drop: 'أفلت الصورة هنا', img_click: 'اسحب صورة أو انقر للرفع',
    img_formats: 'JPEG · PNG · WebP · GIF — بحد أقصى 5 MB',
    img_optional: 'الصورة اختيارية — يمكنك إضافتها لاحقاً',
    img_delete: 'حذف الصورة', img_replace: 'استبدال',

    mp_title: 'منتجاتي', mp_empty: 'لا توجد منتجات بعد',
    mp_emptyDesc: 'ابدأ بإضافة أول منتج لمتجرك',
    mp_active: 'نشط', mp_inactive: 'غير نشط', mp_sar: 'ر.س',
    mp_edit: 'تعديل',
    mp_editTitle: 'تعديل المنتج',
    mp_editPrice: 'السعر (ريال سعودي)',
    mp_editStock: 'الكمية المتاحة',
    mp_editDelivery: 'نوع التوصيل',
    mp_editSave: 'حفظ التغييرات', mp_editSaving: 'جاري الحفظ…',
    mp_editSuccess: 'تم تحديث المنتج ✓', mp_editError: 'خطأ في التحديث: ',
    mp_cancel: 'إلغاء',
    ap_del_fast: '⚡ توصيل سريع (خلال ساعة-ساعتين)',
    ap_del_fast_sub: 'حصراً لنفس المدينة — يظهر فقط لعملاء مدينتك',
    ap_del_ship: '🚚 شحن لجميع المدن',
    ap_del_ship_sub: 'يظهر لجميع العملاء بغض النظر عن مدينتهم',


    st_title: 'إعدادات المتجر', st_info: 'معلومات المتجر',
    st_nameAr: 'اسم المتجر ', st_city: 'المدينة',
    st_dangerZone: 'منطقة الخطر',
    st_deleteTitle: 'حذف المتجر',
    st_deleteDesc: 'سيؤدي هذا إلى حذف متجرك وجميع منتجاتك بشكل نهائي.',
    st_deleteBtn: 'حذف المتجر نهائياً',
    st_modalTitle: 'تأكيد حذف المتجر',
    st_modalDesc: 'هذا الإجراء لا يمكن التراجع عنه. سيتم حذف متجرك وجميع المنتجات المنشورة.',
    st_modalType: 'اكتب "حذف" للتأكيد',
    st_modalWord: 'حذف',
    st_cancel: 'إلغاء', st_confirmDelete: 'نعم، احذف المتجر',
    st_deleting: 'جاري الحذف…',
    st_deleteSuccess: 'تم حذف المتجر بنجاح',
    st_deleteError: 'خطأ في الحذف: ',
    noData: '—',
  },
  en: {
    dir: 'ltr', langBtn: 'العربية',
    brand: 'Usaruna', dashboard: 'Seller Dashboard',
    welcome: 'Hello', storeActive: 'Active Store',
    backToSite: 'Back to site', logout: 'Sign out',
    storeReadyMsg: 'Your store is active and ready to sell. Start adding your products.',

    nav_overview: 'Overview', nav_sales: 'Sales',
    nav_addProduct: 'Add Product', nav_myProducts: 'My Products', nav_settings: 'Settings',

    stat_products: 'Published Products', stat_orders: 'Incoming Orders',
    stat_revenue: 'Total Revenue', stat_rating: 'Store Rating',
    quickActions: 'Quick Actions', addNewProduct: 'Add New Product',
    viewMyProducts: 'View My Products', storeSettings: 'Store Settings',

    sales_title: 'Sales Report', sales_period: 'Period',
    sales_week: 'Week', sales_month: 'Month', sales_year: 'Year',
    sales_print: 'Print', sales_revenue: 'Total Revenue',
    sales_orders: 'Total Orders', sales_avgRating: 'Avg. Rating',
    sales_totalReviews: 'Total Reviews',
    sales_noData: 'No sales data yet',
    sales_noDataDesc: 'Orders will appear here once you receive your first order',
    sales_ratingDist: 'Rating Distribution',
    sales_outOf: 'out of 5',

    ap_title: 'Add New Product', ap_subtitle: 'Product will be added to',
    ap_image: 'Product Image', ap_info: 'Product Information',
    ap_nameAr: 'Product Name (Arabic)', ap_nameEn: 'Product Name (English)',
    ap_descAr: 'Description (Arabic)', ap_descEn: 'Description (English)',
    ap_price: 'Price (SAR)', ap_stock: 'Available Stock',
    ap_weight: 'Weight (kg)', ap_weightPlaceholder: 'e.g. 0.500',
    ap_classification: 'Classification & Location',
    ap_category: 'Category', ap_city: 'City',
    ap_shipping: 'Shipping & Delivery',
    ap_deliveryType: 'Delivery Type', ap_nature: 'Product Nature',
    ap_perishable: 'Fresh / Perishable',
    ap_perishableNote: 'This product will only be visible to customers in your city',
    ap_nationwide: '🚚 Nationwide', ap_local: '📍 Local Only',
    ap_selectCat: '— Select Category —', ap_selectCity: '— Select City —',
    ap_sizes: 'Sizes & Options (optional)',
    ap_addSize: '+ Add Size', ap_sizeName: 'Size Name (e.g. Large)',
    ap_sizeNameEn: 'Size Name (English)', ap_sizePriceAdj: 'Price Difference (SAR)',
    ap_colors: 'Colors (optional)',
    ap_addColor: '+ Add Color', ap_colorName: 'Color Name (Arabic)',
    ap_colorNameEn: 'Color Name (English)', ap_colorHex: 'Color Code',
    ap_specs: 'Detailed Specifications (optional)',
    ap_addSpec: '+ Add Spec', ap_specKey: 'Property', ap_specVal: 'Value',
    ap_publish: 'Publish Product', ap_uploading: 'Uploading image…', ap_saving: 'Saving product…',
    ap_success: 'Product published successfully ✓',
    ap_errNameAr: 'Product name (Arabic) is required', ap_errPrice: 'Price is required',
    ap_errPriceBad: 'Please enter a valid price', ap_errStock: 'Stock quantity is required',
    ap_errCat: 'Please select a category', ap_errCity: 'Please select a city',
    ap_errUpload: 'Image upload error: ', ap_errSave: 'Error saving product: ',
    img_drop: 'Drop image here', img_click: 'Drag an image or click to upload',
    img_formats: 'JPEG · PNG · WebP · GIF — max 5 MB',
    img_optional: 'Image is optional — you can add it later',
    img_delete: 'Remove Image', img_replace: 'Replace',

    mp_title: 'My Products', mp_empty: 'No products yet',
    mp_emptyDesc: 'Start by adding your first product',
    mp_active: 'Active', mp_inactive: 'Inactive', mp_sar: 'SAR',
    mp_edit: 'Edit',
    mp_editTitle: 'Edit Product',
    mp_editPrice: 'Price (SAR)',
    mp_editStock: 'Available Stock',
    mp_editDelivery: 'Delivery Type',
    mp_editSave: 'Save Changes', mp_editSaving: 'Saving…',
    mp_editSuccess: 'Product updated ✓', mp_editError: 'Update error: ',
    mp_cancel: 'Cancel',
    ap_del_fast: '⚡ Fast Delivery (within 1-2 hours)',
    ap_del_fast_sub: 'Same city only — visible only to customers in your city',
    ap_del_ship: '🚚 Nationwide Shipping',
    ap_del_ship_sub: 'Visible to all customers regardless of their city',


    st_title: 'Store Settings', st_info: 'Store Information',
    st_nameAr: 'Store Name', st_city: 'City',
    st_dangerZone: 'Danger Zone',
    st_deleteTitle: 'Delete Store',
    st_deleteDesc: 'This will permanently delete your store and all your products. This action cannot be undone.',
    st_deleteBtn: 'Permanently Delete Store',
    st_modalTitle: 'Confirm Store Deletion',
    st_modalDesc: 'This action cannot be undone. Your store and all published products will be deleted permanently.',
    st_modalType: 'Type "delete" to confirm',
    st_modalWord: 'delete',
    st_cancel: 'Cancel', st_confirmDelete: 'Yes, Delete My Store',
    st_deleting: 'Deleting…',
    st_deleteSuccess: 'Store deleted successfully',
    st_deleteError: 'Error deleting store: ',
    noData: '—',
  },
};

// Helper: pick Arabic or English from a DB row that has name_ar / name_en
const pickName = (obj, isRtl) =>
  isRtl ? (obj?.name_ar ?? '') : (obj?.name_en ?? obj?.name_ar ?? '');

// ─── Shared helpers ────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200';

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-red-400 ms-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

function SectionTitle({ icon: Icon, label }) {
  return (
    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
      <Icon size={13} />{label}
    </p>
  );
}

function Divider() { return <div className="h-px bg-gray-100" />; }

// ─── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ toast }) {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-2.5 px-5 py-3.5
      rounded-2xl shadow-2xl text-white text-sm font-semibold pointer-events-none
      ${ok ? 'bg-emerald-500' : 'bg-red-500'}`}
    >
      {ok ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
      {toast.message}
    </div>
  );
}

// ─── Simple SVG Bar Chart ──────────────────────────────────────────────────────

function BarChart({ data, height = 100 }) {
  if (!data?.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const barW = 100 / data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      {data.map((d, i) => {
        const barH = (d.value / max) * (height - 20);
        const x = i * barW + barW * 0.15;
        const w = barW * 0.7;
        const y = height - 20 - barH;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={barH} rx="2"
              className="fill-blue-500 opacity-80 hover:opacity-100 transition-opacity" />
            <text x={x + w / 2} y={height - 5} textAnchor="middle"
              className="fill-gray-400" style={{ fontSize: 5 }}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ profile, onNavigate, t, cities }) {
  const [productCount, setProductCount] = useState(null);
  const [avgRating,    setAvgRating]    = useState(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('producer_id', profile.id)
      .then(({ count }) => { if (count !== null) setProductCount(count); });

    supabase
      .from('products')
      .select('id')
      .eq('producer_id', profile.id)
      .then(async ({ data: prods }) => {
        if (!prods?.length) return;
        const ids = prods.map((p) => p.id);
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', ids);
        if (reviews?.length) {
          const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
          setAvgRating(avg);
        }
      });
  }, [profile.id]);

  const profileCity = cities.find((c) => c.id === profile.city_id);

  const STATS = [
    { label: t.stat_products, value: productCount ?? t.noData, Icon: Package,       color: 'bg-blue-50    text-blue-600'    },
    { label: t.stat_orders,   value: t.noData,                 Icon: ClipboardList, color: 'bg-amber-50   text-amber-600'   },
    { label: t.stat_revenue,  value: t.noData,                 Icon: TrendingUp,    color: 'bg-emerald-50 text-emerald-600' },
    { label: t.stat_rating,   value: avgRating ? `${avgRating} ★` : t.noData, Icon: Store, color: 'bg-violet-50 text-violet-600' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-gradient-to-l from-blue-900 to-blue-800 rounded-3xl p-7 mb-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -right-6 w-52 h-52 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          <p className="text-blue-300 text-sm font-medium mb-1">{t.dashboard}</p>
          <h1 className="text-2xl font-extrabold mb-1">
            {t.welcome}، {t.dir === 'rtl' ? profile.business_name_ar : (profile.business_name_en || profile.business_name_ar)} 👋
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">{t.storeReadyMsg}</p>
          {profileCity && (
            <p className="text-blue-300 text-xs mt-2 flex items-center gap-1">
              <MapPin size={11} />{pickName(profileCity, t.dir === 'rtl')}
            </p>
          )}
          <button
            onClick={() => onNavigate('add-product')}
            className="mt-5 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400
              active:scale-[0.97] text-white font-bold text-sm px-5 py-2.5 rounded-2xl
              transition-all duration-200 shadow-lg shadow-emerald-900/30"
          >
            <PlusCircle size={15} />{t.addNewProduct}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ label, value, Icon, color }) => {
          const [bg, text] = color.split(' ');
          return (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={18} className={text} />
              </div>
              <div>
                <p className="text-2xl font-extrabold text-gray-800">{value}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-snug">{label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">{t.quickActions}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: t.addNewProduct,    Icon: PlusCircle, tab: 'add-product', cls: 'border-blue-200   hover:bg-blue-50   hover:border-blue-400   text-blue-700'   },
            { label: t.viewMyProducts,   Icon: Package,    tab: 'my-products', cls: 'border-gray-200   hover:bg-gray-50   hover:border-gray-400   text-gray-700'   },
            { label: t.storeSettings,    Icon: Settings,   tab: 'settings',    cls: 'border-violet-200 hover:bg-violet-50 hover:border-violet-400 text-violet-700' },
          ].map(({ label, Icon, tab, cls }) => (
            <button key={tab} onClick={() => onNavigate(tab)}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm font-semibold transition-all duration-200 ${cls}`}
            >
              <Icon size={16} />{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Sales tab ─────────────────────────────────────────────────────────────────

function SalesTab({ profile, t }) {
  const [period,     setPeriod]     = useState('month');
  const [reviews,    setReviews]    = useState([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('products')
      .select('id')
      .eq('producer_id', profile.id)
      .then(async ({ data: prods }) => {
        if (!prods?.length) { setLoading(false); return; }
        const ids = prods.map((p) => p.id);
        const { data } = await supabase
          .from('reviews')
          .select('rating, created_at')
          .in('product_id', ids)
          .order('created_at', { ascending: true });
        setReviews(data ?? []);
        setLoading(false);
      });
  }, [profile.id]);

  const now = new Date();
  const filtered = reviews.filter((r) => {
    const d = new Date(r.created_at);
    if (period === 'week')  return now - d < 7  * 86400000;
    if (period === 'month') return now - d < 30 * 86400000;
    if (period === 'year')  return now - d < 365 * 86400000;
    return true;
  });

  const avgRating = filtered.length
    ? (filtered.reduce((s, r) => s + r.rating, 0) / filtered.length).toFixed(1)
    : null;

  const ratingDist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: filtered.filter((r) => r.rating === star).length,
  }));

  const chartData = ratingDist.reverse().map((d) => ({
    label: `${d.star}★`,
    value: d.count,
  }));

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-extrabold text-gray-800">{t.sales_title}</h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {[
              { id: 'week', label: t.sales_week },
              { id: 'month', label: t.sales_month },
              { id: 'year', label: t.sales_year },
            ].map(({ id, label }) => (
              <button key={id} onClick={() => setPeriod(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                  ${period === id ? 'bg-white text-blue-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:border-gray-400 transition-colors"
          >
            <Printer size={13} />{t.sales_print}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-400" /></div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">{t.sales_revenue}</p>
              <p className="text-2xl font-extrabold text-gray-800">{t.noData}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">{t.sales_orders}</p>
              <p className="text-2xl font-extrabold text-gray-800">{t.noData}</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 mb-1">{t.sales_avgRating}</p>
              <p className="text-2xl font-extrabold text-gray-800">
                {avgRating ? `${avgRating} ★` : t.noData}
              </p>
              {filtered.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">{filtered.length} {t.sales_totalReviews}</p>
              )}
            </div>
          </div>

          {/* Rating distribution */}
          {filtered.length > 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-bold text-gray-700 text-sm mb-5">{t.sales_ratingDist}</h3>
              <div className="mb-4">
                <BarChart data={chartData} height={120} />
              </div>
              <div className="flex flex-col gap-2 mt-4">
                {ratingDist.slice().reverse().map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-6 shrink-0">{star}</span>
                    <Star size={11} className="text-amber-400 fill-amber-400 shrink-0" />
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all duration-500"
                        style={{ width: filtered.length ? `${(count / filtered.length) * 100}%` : '0%' }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 w-4 shrink-0">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4">
                <TrendingUp size={28} className="text-blue-200" />
              </div>
              <p className="font-extrabold text-gray-700 mb-1">{t.sales_noData}</p>
              <p className="text-sm text-gray-400 max-w-xs">{t.sales_noDataDesc}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Edit Product Modal ─────────────────────────────────────────────────────────

function EditProductModal({ product, t, onClose, onSaved, showToast }) {
  const [price,        setPrice]       = useState(String(product.price ?? ''));
  const [stock,        setStock]       = useState(String(product.stock ?? ''));
  const [isPerishable, setIsPerishable] = useState(product.is_perishable ?? false);
  const [saving,       setSaving]      = useState(false);

  // Derive delivery type from is_perishable for display
  const deliveryLabel = isPerishable ? t.ap_del_fast : t.ap_del_ship;

  const handleSave = async () => {
    const priceVal = parseFloat(price);
    const stockVal = parseInt(stock);
    if (isNaN(priceVal) || priceVal < 0) { showToast('يرجى إدخال سعر صحيح', 'error'); return; }
    if (isNaN(stockVal) || stockVal < 0) { showToast('يرجى إدخال كمية صحيحة', 'error'); return; }

    setSaving(true);
    const { data, error } = await supabase
      .from('products')
      .update({
        price:         priceVal,
        stock:         stockVal,
        is_perishable: isPerishable,
        delivery_type: isPerishable ? 'local' : 'nationwide',
      })
      .eq('id', product.id)
      .select('id, price, stock, is_perishable, delivery_type')
      .single();

    setSaving(false);
    if (error) {
      console.error('[EditProduct] Update failed:', error);
      showToast(`${t.mp_editError}${error.message}`, 'error');
    } else {
      showToast(t.mp_editSuccess, 'success');
      onSaved(data);
      onClose();
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all';

  return (
    /* backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-[fadeInUp_0.2s_ease]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">{t.mp_editTitle}</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px]">{product.name_ar}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">

          {/* Price + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.mp_editPrice}</label>
              <input type="number" min="0" step="0.01" value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls} disabled={saving} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.mp_editStock}</label>
              <input type="number" min="0" step="1" value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputCls} disabled={saving} />
            </div>
          </div>

          {/* Delivery Type — radio cards */}
          <div>
            <label className="block text-xs font-bold text-gray-600 mb-2">{t.mp_editDelivery}</label>
            <div className="flex flex-col gap-2">
              {/* Fast delivery */}
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsPerishable(true)}
                className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-start transition-all duration-150
                  ${isPerishable
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
              >
                <Zap size={18} className={`mt-0.5 shrink-0 ${isPerishable ? 'text-amber-500' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-bold ${isPerishable ? 'text-amber-800' : 'text-gray-700'}`}>
                    {t.ap_del_fast}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.ap_del_fast_sub}</p>
                </div>
                {isPerishable && (
                  <CheckCircle size={16} className="ms-auto mt-0.5 shrink-0 text-amber-500" />
                )}
              </button>

              {/* Nationwide shipping */}
              <button
                type="button"
                disabled={saving}
                onClick={() => setIsPerishable(false)}
                className={`flex items-start gap-3 rounded-2xl border-2 px-4 py-3 text-start transition-all duration-150
                  ${!isPerishable
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'}`}
              >
                <Truck size={18} className={`mt-0.5 shrink-0 ${!isPerishable ? 'text-blue-500' : 'text-gray-400'}`} />
                <div>
                  <p className={`text-sm font-bold ${!isPerishable ? 'text-blue-800' : 'text-gray-700'}`}>
                    {t.ap_del_ship}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{t.ap_del_ship_sub}</p>
                </div>
                {!isPerishable && (
                  <CheckCircle size={16} className="ms-auto mt-0.5 shrink-0 text-blue-500" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t.mp_cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <><Loader2 size={14} className="animate-spin" />{t.mp_editSaving}</> : t.mp_editSave}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── My Products tab ───────────────────────────────────────────────────────────

function MyProductsTab({ profile, t, showToast }) {
  const [products,    setProducts]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [editTarget,  setEditTarget]  = useState(null);   // product being edited

  useEffect(() => {
    supabase
      .from('products')
      .select('id, name_ar, name_en, price, stock, is_active, image_url, is_perishable, delivery_type')
      .eq('producer_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data ?? []);
        setLoading(false);
      });
  }, [profile.id]);

  const toggleActive = async (product) => {
    const { error } = await supabase
      .from('products')
      .update({ is_active: !product.is_active })
      .eq('id', product.id);
    if (!error) {
      setProducts((prev) =>
        prev.map((p) => p.id === product.id ? { ...p, is_active: !p.is_active } : p)
      );
    }
  };

  // Called by EditProductModal on successful save — live-patch the list row
  const handleSaved = (updated) => {
    setProducts((prev) =>
      prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p)
    );
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-400" /></div>;

  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
          <Archive size={32} className="text-blue-200" />
        </div>
        <h2 className="text-xl font-extrabold text-gray-700 mb-2">{t.mp_empty}</h2>
        <p className="text-sm text-gray-400">{t.mp_emptyDesc}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-6">{t.mp_title}</h1>
      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
              {p.image_url
                ? <img src={p.image_url} alt={p.name_ar} className="w-full h-full object-cover" />
                : <Package size={22} className="text-gray-300" />
              }
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">
                {t.dir === 'rtl' ? p.name_ar : (p.name_en || p.name_ar)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {p.price} {t.mp_sar} · {p.stock} {t.dir === 'rtl' ? 'وحدة' : 'units'}
              </p>
              {/* Delivery badge */}
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full
                ${p.is_perishable
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-blue-100 text-blue-700'}`}
              >
                {p.is_perishable
                  ? <><Zap size={9} />{t.dir === 'rtl' ? 'توصيل سريع' : 'Fast Delivery'}</>
                  : <><Truck size={9} />{t.dir === 'rtl' ? 'شحن وطني' : 'Nationwide'}</>
                }
              </span>
            </div>

            {/* Edit button */}
            <button
              onClick={() => setEditTarget(p)}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 transition-colors"
            >
              <Pencil size={11} />{t.mp_edit}
            </button>

            {/* Active toggle */}
            <button
              onClick={() => toggleActive(p)}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-colors
                ${p.is_active
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
              {p.is_active ? t.mp_active : t.mp_inactive}
            </button>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditProductModal
          product={editTarget}
          t={t}
          showToast={showToast}
          onClose={() => setEditTarget(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}


// ─── Image Upload Drop Zone ─────────────────────────────────────────────────────

function ImageDropZone({ file, onFile, onClear, disabled, t }) {
  const inputRef  = useRef(null);
  const [drag, setDrag] = useState(false);

  const accept = (f) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) return;
    if (f.size > 5 * 1024 * 1024) return;
    onFile(f);
  };

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    accept(e.dataTransfer.files[0]);
  }, []);

  const preview = file ? URL.createObjectURL(file) : null;

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
        transition-all duration-200 overflow-hidden select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${drag ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'}
        ${file ? 'h-52' : 'h-44'}`}
    >
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only" disabled={disabled} onChange={(e) => accept(e.target.files[0])} />
      {file ? (
        <>
          <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">
              <X size={12} /> {t.img_delete}
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors">
              <Upload size={12} /> {t.img_replace}
            </button>
          </div>
          <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
            <FileImage size={9} /> {(file.size / 1024).toFixed(0)} KB
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 px-6 text-center pointer-events-none">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${drag ? 'bg-blue-100' : 'bg-gray-100'}`}>
            <ImagePlus size={22} className={drag ? 'text-blue-500' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-600">{drag ? t.img_drop : t.img_click}</p>
            <p className="text-xs text-gray-400 mt-0.5">{t.img_formats}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add-Product form ──────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  name_ar: '', name_en: '',
  description_ar: '', description_en: '',
  price: '', category_id: '', city_id: '',
  is_perishable: false, delivery_type: 'nationwide', stock: '',
  weight: '',       // الوزن — optional, numeric (kg)
  sizes: [], colors: [], specs: [],
};

const PHASE_LABELS = (t) => ({ idle: null, uploading: t.ap_uploading, saving: t.ap_saving });

function AddProductForm({ profile, cities, categories, showToast, t }) {
  const [form,      setForm]      = useState(EMPTY_PRODUCT);
  const [imageFile, setImageFile] = useState(null);
  const [phase,     setPhase]     = useState('idle');
  const [fieldErrs, setFieldErrs] = useState({});

  const submitting = phase !== 'idle';
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.name_ar.trim())  errs.name_ar    = t.ap_errNameAr;
    if (!form.price)           errs.price       = t.ap_errPrice;
    else if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) errs.price = t.ap_errPriceBad;
    if (!form.stock)           errs.stock       = t.ap_errStock;
    if (!form.category_id)     errs.category_id = t.ap_errCat;
    if (!form.city_id)         errs.city_id     = t.ap_errCity;
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrs(errs); return; }
    setFieldErrs({});
    let image_url = null;
    try {
      if (imageFile) {
        setPhase('uploading');
        const ext      = imageFile.name.split('.').pop();
        const filePath = `${profile.user_id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, { upsert: false, contentType: imageFile.type });
        if (uploadError) { showToast(`${t.ap_errUpload}${uploadError.message}`, 'error'); return; }
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        image_url = urlData.publicUrl;
      }
      setPhase('saving');
      // ── ARCHITECTURE: producer_id = producer_profiles.id (the profile PK)
      // products.producer_id FK references producer_profiles.id
      // The INSERT RLS policy is a subquery:
      //   WITH CHECK (producer_id IN (
      //     SELECT id FROM producer_profiles WHERE user_id = auth.uid()
      //   ))
      // So we send profile.id (the PK of the profile owned by the current auth user).
      const payload = {
        producer_id:   profile.id,               // ← producer_profiles PK (FK target)
        category_id:   parseInt(form.category_id),
        city_id:       parseInt(form.city_id),
        name_ar:       form.name_ar.trim(),
        price:         parseFloat(form.price),
        is_perishable: form.is_perishable,
        delivery_type: form.is_perishable ? 'local' : form.delivery_type,
        stock:         parseInt(form.stock),
        image_url,
        is_active:     true,
      };
      // Optional text columns — only include when the column exists in your schema
      // (run supabase/patch_v2_complete_schema_fix.sql to add them)
      const nameEn       = form.name_en.trim();
      const descAr       = form.description_ar.trim();
      const descEn       = form.description_en.trim();
      const weightVal    = form.weight ? parseFloat(form.weight) : null;
      if (nameEn)                  payload.name_en        = nameEn;
      if (descAr)                  payload.description_ar = descAr;
      if (descEn)                  payload.description_en = descEn;
      if (weightVal !== null)      payload.weight         = weightVal;
      if (form.sizes.length)       payload.sizes          = form.sizes;
      if (form.colors.length)      payload.colors         = form.colors;
      if (form.specs.length)       payload.specs          = form.specs;

      const { data: insertData, error: insertError } = await supabase
        .from('products')
        .insert(payload)
        .select('id, name_ar, producer_id')
        .single();

      if (insertError) {
        // Log full error for debugging (visible in browser DevTools console)
        console.error('[AddProduct] Insert failed:', {
          code: insertError.code, message: insertError.message,
          details: insertError.details, hint: insertError.hint,
          payload,
        });
        showToast(`${t.ap_errSave}${insertError.message}`, 'error');
      } else {
        console.log('[AddProduct] Insert success — id:', insertData?.id);
        showToast(t.ap_success, 'success');
        setForm(EMPTY_PRODUCT);
        setImageFile(null);
      }
    } catch (err) {
      showToast(`${t.ap_errSave}${err.message}`, 'error');
    } finally {
      setPhase('idle');
    }
  };

  const inputErr = (key) =>
    `${inputCls} ${fieldErrs[key] ? 'ring-2 ring-red-300 border-red-300 focus:ring-red-400' : ''}`;

  const addSize  = () => set('sizes',  [...form.sizes,  { label_ar: '', label_en: '', price_adj: 0 }]);
  const addColor = () => set('colors', [...form.colors, { label_ar: '', label_en: '', hex: '#000000' }]);
  const addSpec  = () => set('specs',  [...form.specs,  { key: '', value: '' }]);

  const updateSize  = (i, field, val) => set('sizes',  form.sizes.map((s, j) => j === i ? { ...s, [field]: val } : s));
  const updateColor = (i, field, val) => set('colors', form.colors.map((c, j) => j === i ? { ...c, [field]: val } : c));
  const updateSpec  = (i, field, val) => set('specs',  form.specs.map((s, j) => j === i ? { ...s, [field]: val } : s));

  const removeSize  = (i) => set('sizes',  form.sizes.filter((_, j) => j !== i));
  const removeColor = (i) => set('colors', form.colors.filter((_, j) => j !== i));
  const removeSpec  = (i) => set('specs',  form.specs.filter((_, j) => j !== i));

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800">{t.ap_title}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.ap_subtitle} <span className="font-bold text-blue-700">{t.dir === 'rtl' ? profile.business_name_ar : (profile.business_name_en || profile.business_name_ar)}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-7">

        {/* Image */}
        <section>
          <SectionTitle icon={ImagePlus} label={t.ap_image} />
          <div className="mt-4">
            <ImageDropZone file={imageFile} onFile={setImageFile} onClear={() => setImageFile(null)} disabled={submitting} t={t} />
            <p className="text-xs text-gray-400 mt-2 text-center">{t.img_optional}</p>
          </div>
        </section>

        <Divider />

        {/* Names */}
        <section>
          <SectionTitle icon={ShoppingBag} label={t.ap_info} />
          <div className="flex flex-col gap-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.ap_nameAr} required>
                <input type="text" placeholder="مثال: مجبوس دجاج" value={form.name_ar}
                  onChange={(e) => set('name_ar', e.target.value)} className={inputErr('name_ar')} disabled={submitting} />
                {fieldErrs.name_ar && <p className="text-xs text-red-500 font-medium">{fieldErrs.name_ar}</p>}
              </Field>
              <Field label={t.ap_nameEn}>
                <input type="text" placeholder="e.g. Chicken Machboos" value={form.name_en}
                  onChange={(e) => set('name_en', e.target.value)} className={inputCls} disabled={submitting} dir="ltr" />
              </Field>
            </div>

            <Field label={t.ap_descAr}>
              <textarea placeholder="صف منتجك — المكونات، الوزن، إلخ…" value={form.description_ar}
                onChange={(e) => set('description_ar', e.target.value)}
                rows={2} className={`${inputCls} resize-none`} disabled={submitting} />
            </Field>
            <Field label={t.ap_descEn}>
              <textarea placeholder="Describe your product in English…" value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
                rows={2} className={`${inputCls} resize-none`} disabled={submitting} dir="ltr" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t.ap_price} required>
                <input type="number" min="0" step="0.01" placeholder="0.00" value={form.price}
                  onChange={(e) => set('price', e.target.value)} className={inputErr('price')} disabled={submitting} />
                {fieldErrs.price && <p className="text-xs text-red-500 font-medium">{fieldErrs.price}</p>}
              </Field>
              <Field label={t.ap_stock} required>
                <input type="number" min="0" placeholder="0" value={form.stock}
                  onChange={(e) => set('stock', e.target.value)} className={inputErr('stock')} disabled={submitting} />
                {fieldErrs.stock && <p className="text-xs text-red-500 font-medium">{fieldErrs.stock}</p>}
              </Field>
            </div>

            {/* Weight — الوزن */}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.ap_weight}>
                <div className="relative">
                  <input
                    type="number" min="0" step="0.001"
                    placeholder={t.ap_weightPlaceholder}
                    value={form.weight}
                    onChange={(e) => set('weight', e.target.value)}
                    className={inputCls}
                    disabled={submitting}
                  />
                  <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400 pointer-events-none">
                    kg
                  </span>
                </div>
              </Field>
            </div>
          </div>
        </section>

        <Divider />

        {/* Classification */}
        <section>
          <SectionTitle icon={Layers} label={t.ap_classification} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label={t.ap_category} required>
              <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}
                className={inputErr('category_id')} disabled={submitting}>
                <option value="">{t.ap_selectCat}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{pickName(c, t.dir === 'rtl')}</option>)}
              </select>
              {fieldErrs.category_id && <p className="text-xs text-red-500 font-medium">{fieldErrs.category_id}</p>}
            </Field>
            <Field label={t.ap_city} required>
              <select value={form.city_id} onChange={(e) => set('city_id', e.target.value)}
                className={inputErr('city_id')} disabled={submitting}>
                <option value="">{t.ap_selectCity}</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{pickName(c, t.dir === 'rtl')}</option>)}
              </select>
              {fieldErrs.city_id && <p className="text-xs text-red-500 font-medium">{fieldErrs.city_id}</p>}
            </Field>
          </div>
        </section>

        <Divider />

        {/* Delivery Type — radio cards */}
        <section>
          <SectionTitle icon={Truck} label={t.ap_shipping} />
          <div className="flex flex-col gap-3 mt-4">

            {/* ⚡ Fast Delivery card */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => { set('is_perishable', true); set('delivery_type', 'local'); }}
              className={`flex items-start gap-4 rounded-2xl border-2 px-5 py-4 text-start transition-all duration-150
                ${form.is_perishable
                  ? 'border-amber-400 bg-amber-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
                ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Zap size={20} className={`mt-0.5 shrink-0 ${form.is_perishable ? 'text-amber-500' : 'text-gray-400'}`} />
              <div className="flex-1">
                <p className={`text-sm font-bold ${form.is_perishable ? 'text-amber-800' : 'text-gray-700'}`}>
                  {t.ap_del_fast}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{t.ap_del_fast_sub}</p>
              </div>
              {/* Radio indicator */}
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                ${form.is_perishable ? 'border-amber-500 bg-amber-500' : 'border-gray-300 bg-white'}`}>
                {form.is_perishable && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>

            {/* 🚚 Nationwide Shipping card */}
            <button
              type="button"
              disabled={submitting}
              onClick={() => { set('is_perishable', false); set('delivery_type', 'nationwide'); }}
              className={`flex items-start gap-4 rounded-2xl border-2 px-5 py-4 text-start transition-all duration-150
                ${!form.is_perishable
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
                ${submitting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <Truck size={20} className={`mt-0.5 shrink-0 ${!form.is_perishable ? 'text-blue-500' : 'text-gray-400'}`} />
              <div className="flex-1">
                <p className={`text-sm font-bold ${!form.is_perishable ? 'text-blue-800' : 'text-gray-700'}`}>
                  {t.ap_del_ship}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{t.ap_del_ship_sub}</p>
              </div>
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
                ${!form.is_perishable ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}`}>
                {!form.is_perishable && <span className="w-2 h-2 rounded-full bg-white" />}
              </span>
            </button>

          </div>
        </section>


        <Divider />

        {/* Sizes */}
        <section>
          <SectionTitle icon={Archive} label={t.ap_sizes} />
          <div className="flex flex-col gap-3 mt-4">
            {form.sizes.map((size, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <input type="text" placeholder={t.ap_sizeName} value={size.label_ar}
                  onChange={(e) => updateSize(i, 'label_ar', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <input type="text" placeholder={t.ap_sizeNameEn} value={size.label_en}
                  onChange={(e) => updateSize(i, 'label_en', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" dir="ltr" />
                <input type="number" placeholder="0" value={size.price_adj}
                  onChange={(e) => updateSize(i, 'price_adj', parseFloat(e.target.value) || 0)}
                  className="w-20 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <button type="button" onClick={() => removeSize(i)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addSize}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              <Plus size={14} />{t.ap_addSize}
            </button>
          </div>
        </section>

        <Divider />

        {/* Colors */}
        <section>
          <SectionTitle icon={Archive} label={t.ap_colors} />
          <div className="flex flex-col gap-3 mt-4">
            {form.colors.map((color, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <input type="text" placeholder={t.ap_colorName} value={color.label_ar}
                  onChange={(e) => updateColor(i, 'label_ar', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <input type="text" placeholder={t.ap_colorNameEn} value={color.label_en}
                  onChange={(e) => updateColor(i, 'label_en', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" dir="ltr" />
                <div className="flex items-center gap-1.5">
                  <input type="color" value={color.hex}
                    onChange={(e) => updateColor(i, 'hex', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1 bg-white" />
                </div>
                <button type="button" onClick={() => removeColor(i)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addColor}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              <Plus size={14} />{t.ap_addColor}
            </button>
          </div>
        </section>

        <Divider />

        {/* Specs */}
        <section>
          <SectionTitle icon={Archive} label={t.ap_specs} />
          <div className="flex flex-col gap-3 mt-4">
            {form.specs.map((spec, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <input type="text" placeholder={t.ap_specKey} value={spec.key}
                  onChange={(e) => updateSpec(i, 'key', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <input type="text" placeholder={t.ap_specVal} value={spec.value}
                  onChange={(e) => updateSpec(i, 'value', e.target.value)}
                  className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" />
                <button type="button" onClick={() => removeSpec(i)} className="text-red-400 hover:text-red-600 p-1 transition-colors">
                  <X size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addSpec}
              className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
              <Plus size={14} />{t.ap_addSpec}
            </button>
          </div>
        </section>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-900 hover:bg-blue-800 active:scale-[0.97] text-white font-bold py-3.5 rounded-2xl
            transition-all duration-200 flex items-center justify-center gap-2.5 text-sm
            disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/15 mt-1">
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> {PHASE_LABELS(t)[phase]}</>
            : <><PlusCircle size={16} /> {t.ap_publish}</>}
        </button>
      </form>
    </div>
  );
}

// ─── Delete Confirmation Modal ──────────────────────────────────────────────────

function DeleteConfirmModal({ t, onCancel, onConfirm, deleting }) {
  const [typed, setTyped] = useState('');
  const confirmed = typed.toLowerCase() === t.st_modalWord.toLowerCase();

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-7">
        <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
          <Trash2 size={24} className="text-red-500" />
        </div>
        <h2 className="text-lg font-extrabold text-gray-800 mb-2">{t.st_modalTitle}</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-5">{t.st_modalDesc}</p>
        <p className="text-xs font-bold text-gray-700 mb-2">{t.st_modalType}</p>
        <input
          type="text"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          className={inputCls + ' mb-5'}
          placeholder={t.st_modalWord}
          dir="ltr"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-bold text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50">
            {t.st_cancel}
          </button>
          <button onClick={onConfirm} disabled={!confirmed || deleting}
            className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
            {deleting ? <><Loader2 size={14} className="animate-spin" />{t.st_deleting}</> : t.st_confirmDelete}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Settings tab ──────────────────────────────────────────────────────────────

function SettingsTab({ profile, cities, showToast, t, navigate }) {
  const [showModal, setShowModal] = useState(false);
  const [deleting,  setDeleting]  = useState(false);
  const profileCity = cities.find((c) => c.id === profile.city_id);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await supabase.from('products').delete().eq('producer_id', profile.id);
      const { error } = await supabase.from('producer_profiles').delete().eq('id', profile.id);
      if (error) throw error;
      await supabase.auth.signOut();
      navigate('/');
    } catch (err) {
      showToast(`${t.st_deleteError}${err.message}`, 'error');
      setDeleting(false);
      setShowModal(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {showModal && (
        <DeleteConfirmModal t={t} onCancel={() => setShowModal(false)} onConfirm={handleDelete} deleting={deleting} />
      )}

      <h1 className="text-2xl font-extrabold text-gray-800 mb-6">{t.st_title}</h1>

      {/* Store Info */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="font-bold text-gray-700 text-sm uppercase tracking-wider mb-5">{t.st_info}</h2>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">{t.st_nameAr}</p>
            <p className="text-sm font-bold text-gray-800">
              {t.dir === 'rtl' ? profile.business_name_ar : (profile.business_name_en || profile.business_name_ar)}
            </p>
          </div>
          {profileCity && (
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-1">{t.st_city}</p>
              <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                <MapPin size={13} className="text-blue-500" />{pickName(profileCity, t.dir === 'rtl')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete shop */}
      <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-800 text-sm mb-1">{t.st_deleteTitle}</p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{t.st_deleteDesc}</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-400
              font-bold text-sm px-5 py-2.5 rounded-2xl transition-colors shrink-0">
            <Trash2 size={14} />{t.st_deleteBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const navigate                = useNavigate();
  const { logout, displayName } = useAuth();

  const [isChecking,   setIsChecking]   = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dbError,      setDbError]      = useState(null);
  const [profile,      setProfile]      = useState(null);
  const [cities,       setCities]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [toast,        setToast]        = useState(null);
  const [dashLang,     setDashLang]     = useState('ar');

  const t = T[dashLang];

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { if (!cancelled) navigate('/login'); return; }

      const { data: profileData, error: profileError } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError) { if (!cancelled) setDbError(profileError.message); return; }
      if (!profileData) { if (!cancelled) navigate('/'); return; }

      const [{ data: citiesData }, { data: catsData }] = await Promise.all([
        supabase.from('cities').select('id, name_ar, name_en').order('id'),
        supabase.from('categories').select('id, name_ar, name_en, slug').order('id'),
      ]);

      if (!cancelled) {
        setCities(citiesData   ?? []);
        setCategories(catsData ?? []);
        setProfile(profileData);
        setIsAuthorized(true);
        setIsChecking(false);
      }
    };
    run();
    return () => { cancelled = true; };
  }, [navigate]);

  if (isChecking) {
    if (dbError) {
      return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 text-center px-6">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-lg font-bold text-gray-700">تعذّر تحميل بيانات المتجر</p>
          <p className="text-sm text-gray-400 max-w-sm">{dbError}</p>
          <button onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2.5 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors">
            إعادة المحاولة
          </button>
        </div>
      );
    }
    return (
      <div className="flex h-screen items-center justify-center gap-3 text-gray-400">
        <Loader2 size={22} className="animate-spin text-blue-500" />
        <span className="text-sm font-medium">جاري التحقق من صلاحيات الوصول…</span>
      </div>
    );
  }

  if (!isAuthorized || !profile) return null;

  const profileCity = cities.find((c) => c.id === profile.city_id);

  const NAV_ITEMS = [
    { id: 'overview',    label: t.nav_overview,    Icon: LayoutDashboard },
    { id: 'sales',       label: t.nav_sales,        Icon: TrendingUp      },
    { id: 'add-product', label: t.nav_addProduct,   Icon: PlusCircle      },
    { id: 'my-products', label: t.nav_myProducts,   Icon: Package         },
    { id: 'settings',    label: t.nav_settings,     Icon: Settings        },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir={t.dir}>
      <Toast toast={toast} />

      {/* Navbar */}
      <header className="bg-blue-950 text-white h-16 px-6 flex items-center justify-between shrink-0 shadow-lg z-30">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt={t.brand} className="w-12 h-8 object-contain" />
          <span className="font-extrabold text-lg hidden sm:block">{t.brand}</span>
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDashLang((l) => l === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white text-xs font-semibold
              border border-blue-800 hover:border-blue-500 rounded-xl px-3 py-1.5 transition-all"
          >
            <Globe size={13} />{t.langBtn}
          </button>
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-blue-300">
            <User size={14} />{displayName}
          </span>
          <button onClick={logout}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white text-xs font-semibold
              border border-blue-800 hover:border-blue-500 rounded-xl px-3 py-1.5 transition-all">
            <LogOut size={13} />{t.logout}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-l border-gray-100 shrink-0 flex-col shadow-sm">
          <div className="bg-gradient-to-b from-blue-900 to-blue-800 text-white px-5 py-6 shrink-0">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-3">
              <Store size={22} className="text-emerald-400" />
            </div>
            <h2 className="font-extrabold text-[15px] leading-snug">
              {t.dir === 'rtl' ? profile.business_name_ar : (profile.business_name_en || profile.business_name_ar)}
            </h2>
            {profileCity && (
              <p className="text-blue-300 text-xs mt-1 flex items-center gap-1">
                <MapPin size={11} />{pickName(profileCity, t.dir === 'rtl')}
              </p>
            )}
            <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30
              rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t.storeActive}
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold w-full text-${t.dir === 'rtl' ? 'right' : 'left'} transition-all duration-150
                    ${active ? 'bg-blue-50 text-blue-900' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                >
                  <Icon size={16} className={active ? 'text-blue-600' : 'text-gray-400'} />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <Link to="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-600 transition-colors font-medium">
              <ChevronRight size={14} />{t.backToSite}
            </Link>
          </div>
        </aside>

        {/* Mobile tab strip */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20 flex">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors
                  ${active ? 'text-blue-700' : 'text-gray-400'}`}
              >
                <Icon size={18} />{label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-10 pb-20 md:pb-10">
          {activeTab === 'overview'    && <OverviewTab    profile={profile} onNavigate={setActiveTab} t={t} cities={cities} />}
          {activeTab === 'sales'       && <SalesTab       profile={profile} t={t} />}
          {activeTab === 'add-product' && <AddProductForm profile={profile} cities={cities} categories={categories} showToast={showToast} t={t} />}
          {activeTab === 'my-products' && <MyProductsTab  profile={profile} t={t} showToast={showToast} />}
          {activeTab === 'settings'    && <SettingsTab    profile={profile} cities={cities} showToast={showToast} t={t} navigate={navigate} />}
        </main>
      </div>
    </div>
  );
}
