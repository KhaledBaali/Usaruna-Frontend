import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, Package, MapPin, User, LogOut,
  CheckCircle, AlertCircle, Loader2, PlusCircle,
  ShoppingBag, Layers, Truck, Archive, ChevronRight,
  Settings, LayoutDashboard, TrendingUp, ClipboardList, ImagePlus, X, Trash2, Star,
  Printer, Plus, Globe, Pencil, Zap, Home, Inbox, ChevronDown,
  Clock, Circle, RefreshCw, Check, CreditCard, Search, Phone, MessageCircle,
  Upload, FileImage, Wand2, RotateCcw,
} from 'lucide-react';
import { supabase } from './supabase';
import { useAuth } from './contexts/AuthContext';
import { enhanceDescription } from './lib/aiApi';
import logo from './assets/logo.png';
import LocationPicker from './LocationPicker';

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
    ap_prepTime: 'وقت التحضير', ap_prepTimePlaceholder: 'مثال: 20',
    unit_minutes: 'دقائق', unit_hours: 'ساعات', unit_days: 'أيام',
    ap_classification: 'التصنيف والموقع',
    ap_category: 'الفئة', ap_city: 'المدينة',
    ap_shipping: 'الشحن والتوصيل',
    ap_deliveryType: 'نوع التوصيل', ap_nature: 'طبيعة المنتج',
    ap_perishable: 'منتج طازج (يتطلب توصيل في نفس اليوم)',
    ap_perishableNote: 'سيظهر هذا المنتج فقط للعملاء في نفس مدينتك',
    ap_returnable: 'قابل للإرجاع',
    ap_returnableNote: 'يمكن للعميل إرجاع المنتج بشرط أن يكون بحالته الأصلية',
    ap_notReturnable: 'غير قابل للإرجاع',
    ap_notReturnableNote: 'لا يمكن للعميل إرجاع المنتج',
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
    ap_del_fast: '🛵 توصيل من البائع (خلال ساعة-ساعتين)',
    ap_del_fast_sub: 'حصراً لنفس المدينة — يظهر فقط لعملاء مدينتك',
    ap_del_pickup: '🏠 استلام شخصي (من مقر الأسرة)',
    ap_del_pickup_sub: 'حصراً لنفس المدينة — يحضر العميل لاستلام الطلب',
    ap_del_ship: '📦 شحن لجميع مدن المملكة',
    ap_del_ship_sub: 'يظهر لجميع العملاء بغض النظر عن مدينتهم',
    ap_deliveryHint: 'اختر طريقة واحدة أو أكثر (بحد أقصى ثلاث)',
    ap_errDelivery: 'يرجى اختيار طريقة توصيل واحدة على الأقل',
    mp_delete:        'حذف المنتج',
    mp_deleteConfirm: 'تأكيد الحذف',
    mp_deleting:      'جاري الحذف...',
    mp_deleteSuccess: 'تم حذف المنتج بنجاح',
    mp_deleteError:   'خطأ في الحذف: ',
    mp_deleteWarning: 'هذا الإجراء لا يمكن التراجع عنه. سيُحذف المنتج نهائياً.',



    st_title: 'إعدادات المتجر', st_info: 'معلومات المتجر',
    st_nameAr: 'اسم المتجر ', st_city: 'المدينة', st_locationLabel: 'الموقع الجغرافي',
    st_editLocation: 'تعديل الموقع', st_saveLocation: 'حفظ الموقع الجديد',
    st_locationSaved: 'تم تحديث الموقع بنجاح', st_locationError: 'خطأ في تحديث الموقع: ',
    st_locationCityOk_riyadh: 'الرياض — الخدمة متاحة ✓',
    st_locationCityOk_jeddah: 'جدة — الخدمة متاحة ✓',
    st_locationCityOther: '⚠️ الخدمة غير متوفرة حالياً في منطقتك، لكن قريباً سنكون في منطقتك',
    st_detectingCity: 'جاري التحقق من المدينة...',
    st_cancelEdit: 'إلغاء',
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

    nav_orders: 'الطلبات الواردة',
    ord_title: 'الطلبات الواردة', ord_empty: 'لا توجد طلبات بعد',
    ord_emptyDesc: 'ستظهر هنا عند استلام أول طلب من عملائك',
    ord_orderNum: 'طلب رقم', ord_date: 'التاريخ', ord_product: 'المنتج',
    ord_qty: 'الكمية', ord_price: 'السعر', ord_delivery: 'طريقة التوصيل',
    ord_status: 'الحالة', ord_updateStatus: 'تحديث الحالة',
    ord_sar: 'ر.س',
    ord_s_pending: 'معلق', ord_s_confirmed: 'مؤكد',
    ord_s_processing: 'قيد التجهيز', ord_s_shipped: 'تم الشحن',
    ord_s_delivered: 'تم التوصيل', ord_s_cancelled: 'ملغي',
    ord_updateOk: 'تم تحديث الحالة ✓', ord_updateErr: 'خطأ في التحديث: ',
    ord_del_fast: 'توصيل من البائع', ord_del_pickup: 'استلام شخصي', ord_del_ship: 'شركة شحن',
    ord_loading: 'جاري تحميل الطلبات…',
    ord_s_preparing:       'قيد التحضير',
    ord_s_ready:           'جاهز للاستلام',
    ord_s_out_for_delivery:'خرج للتوصيل',
    ord_stats_today:     'طلبات اليوم',
    ord_stats_pending:   'قيد الانتظار',
    ord_stats_preparing: 'قيد التحضير',
    ord_stats_done:      'مكتملة',
    ord_stats_revenue:   'أرباح اليوم',
    ord_accept:    'قبول الطلب',
    ord_reject:    'رفض الطلب',
    ord_contact:   'تواصل مع العميل',
    ord_details:   'التفاصيل',
    ord_search:    'ابحث برقم الطلب أو اسم العميل...',
    ord_filterAll: 'جميع الحالات',
    ord_customer:  'اسم العميل',
    ord_phone:     'رقم الجوال',
    ord_payment:   'طريقة الدفع',
    ord_address:   'عنوان التوصيل',
    ord_prepTime:  'مدة التحضير',
    ord_refresh:   'تحديث',
    ord_results:   'نتيجة',
    ord_noResults: 'لا توجد نتائج',
    ord_noResultsDesc: 'حاول تغيير معايير البحث',
    ord_hide:      'إخفاء',
    ord_clearFilters: 'مسح',
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
    ap_prepTime: 'Preparation Time', ap_prepTimePlaceholder: 'e.g. 20',
    unit_minutes: 'Minutes', unit_hours: 'Hours', unit_days: 'Days',
    ap_classification: 'Classification & Location',
    ap_category: 'Category', ap_city: 'City',
    ap_shipping: 'Shipping & Delivery',
    ap_deliveryType: 'Delivery Type', ap_nature: 'Product Nature',
    ap_perishable: 'Fresh / Perishable',
    ap_perishableNote: 'This product will only be visible to customers in your city',
    ap_returnable: 'Returnable',
    ap_returnableNote: 'Customer can return the product as long as it is in its original condition',
    ap_notReturnable: 'Not Returnable',
    ap_notReturnableNote: 'Customer can not return the product',
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
    ap_del_fast: '🛵 Seller Delivery (within 1-2 hours)',
    ap_del_fast_sub: 'Same city only — visible only to customers in your city',
    ap_del_pickup: '🏠 Personal Pickup (from family premises)',
    ap_del_pickup_sub: 'Same city only — customer comes to pick up the order',
    ap_del_ship: '📦 Shipping to all KSA cities',
    ap_del_ship_sub: 'Visible to all customers regardless of their city',
    ap_deliveryHint: 'Choose one or more options (up to three)',
    ap_errDelivery: 'Please select at least one delivery method',
    mp_delete:        'Delete Product',
    mp_deleteConfirm: 'Confirm Delete',
    mp_deleting:      'Deleting...',
    mp_deleteSuccess: 'Product deleted successfully',
    mp_deleteError:   'Error deleting: ',
    mp_deleteWarning: 'This action cannot be undone. The product will be permanently deleted.',



    st_title: 'Store Settings', st_info: 'Store Information',
    st_nameAr: 'Store Name', st_city: 'City', st_locationLabel: 'Location',
    st_editLocation: 'Edit Location', st_saveLocation: 'Save New Location',
    st_locationSaved: 'Location updated successfully', st_locationError: 'Error updating location: ',
    st_locationCityOk_riyadh: 'Riyadh — Service available ✓',
    st_locationCityOk_jeddah: 'Jeddah — Service available ✓',
    st_locationCityOther: '⚠️ Service not available in your area yet — coming soon!',
    st_detectingCity: 'Checking city...',
    st_cancelEdit: 'Cancel',
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

    nav_orders: 'Incoming Orders',
    ord_title: 'Incoming Orders', ord_empty: 'No orders yet',
    ord_emptyDesc: 'Orders will appear here once customers start buying your products',
    ord_orderNum: 'Order #', ord_date: 'Date', ord_product: 'Product',
    ord_qty: 'Qty', ord_price: 'Price', ord_delivery: 'Delivery',
    ord_status: 'Status', ord_updateStatus: 'Update Status',
    ord_sar: 'SAR',
    ord_s_pending: 'Pending', ord_s_confirmed: 'Confirmed',
    ord_s_processing: 'Processing', ord_s_shipped: 'Shipped',
    ord_s_delivered: 'Delivered', ord_s_cancelled: 'Cancelled',
    ord_updateOk: 'Status updated ✓', ord_updateErr: 'Update error: ',
    ord_del_fast: 'Seller Delivery', ord_del_pickup: 'Pickup', ord_del_ship: 'Shipping Co.',
    ord_loading: 'Loading orders…',
    ord_s_preparing:       'Preparing',
    ord_s_ready:           'Ready',
    ord_s_out_for_delivery:'Out for Delivery',
    ord_stats_today:     "Today's Orders",
    ord_stats_pending:   'Pending',
    ord_stats_preparing: 'Preparing',
    ord_stats_done:      'Completed',
    ord_stats_revenue:   "Today's Revenue",
    ord_accept:    'Accept Order',
    ord_reject:    'Reject Order',
    ord_contact:   'Contact Customer',
    ord_details:   'Details',
    ord_search:    'Search by order # or customer name...',
    ord_filterAll: 'All Statuses',
    ord_customer:  'Customer Name',
    ord_phone:     'Phone Number',
    ord_payment:   'Payment Method',
    ord_address:   'Delivery Address',
    ord_prepTime:  'Prep Time',
    ord_refresh:   'Refresh',
    ord_results:   'results',
    ord_noResults: 'No results',
    ord_noResultsDesc: 'Try changing your search criteria',
    ord_hide:      'Hide',
    ord_clearFilters: 'Clear',
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

// ─── Delivery helpers ──────────────────────────────────────────────────────────

// Parses delivery_type from DB — supports legacy single string and new JSON array.
// Migrates legacy names: 'fast'→'seller_delivery', 'nationwide'→'third_party'
function parseDeliveryTypes(p) {
  const dt = p?.delivery_type;
  const migrate = (d) =>
    d === 'fast' ? 'seller_delivery' : d === 'nationwide' ? 'third_party' : d === 'local' ? 'seller_delivery' : d;

  if (!dt) return p?.is_perishable ? ['seller_delivery'] : ['third_party'];
  try {
    const arr = JSON.parse(dt);
    if (Array.isArray(arr) && arr.length > 0) return arr.map(migrate);
  } catch { /* legacy string fallback below */ }
  return [migrate(dt)];
}

// Serialises the delivery types array → stored as JSON string in delivery_type column.
function serializeDeliveryTypes(arr) {
  return arr.length === 1 ? arr[0] : JSON.stringify(arr);
}

// ─── Prep time unit helpers ───────────────────────────────────────────────────
function toMinutes(value, unit) {
  const v = parseInt(value) || 0;
  if (unit === 'hours') return v * 60;
  if (unit === 'days')  return v * 60 * 24;
  return v;
}

function fromMinutes(minutes) {
  if (!minutes) return { value: '', unit: 'minutes' };
  if (minutes % (60 * 24) === 0) return { value: String(minutes / (60 * 24)), unit: 'days' };
  if (minutes % 60 === 0)        return { value: String(minutes / 60),        unit: 'hours' };
  return { value: String(minutes), unit: 'minutes' };
}

// ─── DeliveryCheckCard — shared checkbox card for add & edit ──────────────────

function DeliveryCheckCard({ checked, onToggle, disabled, Icon, iconColor, label, sub, activeBorder, activeBg }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={`flex items-start gap-4 rounded-2xl border-2 px-5 py-4 text-start transition-all duration-150 w-full
        ${checked ? `${activeBorder} ${activeBg}` : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <Icon size={20} className={`mt-0.5 shrink-0 ${checked ? iconColor : 'text-gray-400'}`} />
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${checked ? 'text-gray-800' : 'text-gray-600'}`}>{label}</p>
        <p className="text-xs text-gray-400 mt-0.5 leading-snug">{sub}</p>
      </div>
      {/* Checkbox indicator */}
      <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all
        ${checked ? `${activeBorder} bg-current` : 'border-gray-300 bg-white'}`}
        style={checked ? { backgroundColor: 'currentColor' } : {}}>
        {checked && (
          <span className={`w-5 h-5 rounded-md flex items-center justify-center ${activeBorder.replace('border-', 'bg-')}`}>
            <Check size={11} className="text-white" strokeWidth={3} />
          </span>
        )}
      </span>
    </button>
  );
}

// ─── Edit Product Modal ─────────────────────────────────────────────────────────

function EditProductModal({ product, t, onClose, onSaved, onDeleted, showToast }) {
  const isRtl = t.dir === 'rtl';

  // Existing images from DB (URLs as strings)
  const existingImages = (() => {
    if (Array.isArray(product.images) && product.images.length) return product.images;
    try {
      const parsed = JSON.parse(product.images ?? '[]');
      if (Array.isArray(parsed) && parsed.length) return parsed;
    } catch { /* ignore */ }
    return product.image_url ? [product.image_url] : [];
  })();

  const [nameAr,         setNameAr]         = useState(product.name_ar        ?? '');
  const [nameEn,         setNameEn]         = useState(product.name_en        ?? '');
  const [descAr,         setDescAr]         = useState(product.description_ar ?? '');
  const [descEn,         setDescEn]         = useState(product.description_en ?? '');
  const [price,          setPrice]          = useState(String(product.price ?? ''));
  const [stock,          setStock]          = useState(String(product.stock ?? ''));
  const _initPrep = fromMinutes(product.prep_time);
  const [prepTime,       setPrepTime]       = useState(_initPrep.value);
  const [prepTimeUnit,   setPrepTimeUnit]   = useState(_initPrep.unit);
  const [deliveryTypes,  setDeliveryTypes]  = useState(parseDeliveryTypes(product));
  const [saving,         setSaving]         = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [confirmDelete,  setConfirmDelete]  = useState(false);
  const [enhancingAr,    setEnhancingAr]    = useState(false);
  const [enhancingEn,    setEnhancingEn]    = useState(false);
  // Images: mix of URL strings (existing) and File objects (new uploads)
  const [images,         setImages]         = useState(existingImages);

  const busy = saving || deleting;

  // Toggle a delivery type in the multi-select (min 1, max 3)
  const toggleDelivery = (type) => {
    setDeliveryTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((d) => d !== type) : prev; // keep at least 1
      }
      return prev.length < 3 ? [...prev, type] : prev; // max 3
    });
  };

  const handleEnhanceAr = async () => {
    const raw = descAr.trim();
    if (!raw || enhancingAr) return;
    setEnhancingAr(true);
    try {
      const result = await enhanceDescription(raw, 'ar');
      if (result) setDescAr(result);
    } catch { } finally { setEnhancingAr(false); }
  };

  const handleEnhanceEn = async () => {
    const raw = descEn.trim();
    if (!raw || enhancingEn) return;
    setEnhancingEn(true);
    try {
      const result = await enhanceDescription(raw, 'en');
      if (result) setDescEn(result);
    } catch { } finally { setEnhancingEn(false); }
  };

  const handleSave = async () => {
    const priceVal = parseFloat(price);
    const stockVal = parseInt(stock);
    if (isNaN(priceVal) || priceVal < 0) {
      showToast(isRtl ? 'يرجى إدخال سعر صحيح' : 'Please enter a valid price', 'error');
      return;
    }
    if (isNaN(stockVal) || stockVal < 0) {
      showToast(isRtl ? 'يرجى إدخال كمية صحيحة' : 'Please enter a valid stock', 'error');
      return;
    }
    if (deliveryTypes.length === 0) {
      showToast(t.ap_errDelivery, 'error');
      return;
    }

    setSaving(true);
    // Upload any new File objects; keep existing URL strings as-is
    const finalUrls = [];
    for (const img of images) {
      if (typeof img === 'string') {
        finalUrls.push(img);
      } else {
        const compressed = await compressImage(img);
        const filePath   = `${product.producer_id}/${crypto.randomUUID()}.jpg`;
        const { error: uploadErr } = await supabase.storage
          .from('product-images')
          .upload(filePath, compressed, { upsert: false, contentType: 'image/jpeg' });
        if (uploadErr) {
          showToast(`${t.ap_errUpload}${uploadErr.message}`, 'error');
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
        finalUrls.push(urlData.publicUrl);
      }
    }

    const updatePayload = {
      price:          priceVal,
      stock:          stockVal,
      is_perishable:  deliveryTypes.some((d) => d !== 'third_party'),
      delivery_type:  serializeDeliveryTypes(deliveryTypes),
      name_ar:        nameAr.trim() || product.name_ar,
      name_en:        nameEn.trim()  || null,
      description_ar: descAr.trim() || null,
      description_en: descEn.trim() || null,
      prep_time:      prepTime ? toMinutes(prepTime, prepTimeUnit) : null,
    };
    if (finalUrls.length > 0) {
      updatePayload.image_url = finalUrls[0];
      updatePayload.images    = finalUrls;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', product.id)
      .select('id, name_ar, name_en, description_ar, description_en, price, stock, is_perishable, delivery_type, image_url, prep_time')
      .single();

    setSaving(false);
    if (error) {
      console.error('[EditProduct]', error);
      showToast(`${t.mp_editError}${error.message}`, 'error');
    } else {
      showToast(t.mp_editSuccess, 'success');
      onSaved(data);
      onClose();
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    setDeleting(false);
    if (error) {
      showToast(`${t.mp_deleteError}${error.message}`, 'error');
    } else {
      showToast(t.mp_deleteSuccess, 'success');
      onDeleted?.(product.id);
      onClose();
    }
  };

  const inputCls = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all';

  const DELIVERY_OPTIONS = [
    { value: 'seller_delivery', Icon: Zap,   iconColor: 'text-amber-500',   label: t.ap_del_fast,   sub: t.ap_del_fast_sub,   activeBorder: 'border-amber-400',   activeBg: 'bg-amber-50'   },
    { value: 'pickup',          Icon: Home,  iconColor: 'text-emerald-600', label: t.ap_del_pickup, sub: t.ap_del_pickup_sub, activeBorder: 'border-emerald-400', activeBg: 'bg-emerald-50' },
    { value: 'third_party',     Icon: Truck, iconColor: 'text-blue-500',    label: t.ap_del_ship,   sub: t.ap_del_ship_sub,   activeBorder: 'border-blue-400',    activeBg: 'bg-blue-50'    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-gray-800">{t.mp_editTitle}</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[260px]">
              {isRtl ? product.name_ar : (product.name_en || product.name_ar)}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={busy}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Names */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.ap_nameAr} <span className="text-red-400">*</span></label>
              <input type="text" value={nameAr} onChange={(e) => setNameAr(e.target.value)}
                className={inputCls} disabled={busy} placeholder="اسم المنتج" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.ap_nameEn}</label>
              <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)}
                className={inputCls} disabled={busy} placeholder="Product name" dir="ltr" />
            </div>
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.ap_descAr}</label>
              <textarea rows={3} value={descAr} onChange={(e) => setDescAr(e.target.value)}
                className={`${inputCls} resize-none`} disabled={busy} placeholder="وصف المنتج" />
              <button type="button" onClick={handleEnhanceAr}
                disabled={busy || enhancingAr || !descAr.trim()}
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {enhancingAr
                  ? <><Loader2 size={11} className="animate-spin" />{isRtl ? 'جاري التحسين…' : 'Enhancing…'}</>
                  : <><Wand2 size={11} />{isRtl ? '✨ تحسين بالذكاء الاصطناعي' : '✨ Enhance with AI'}</>
                }
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.ap_descEn}</label>
              <textarea rows={3} value={descEn} onChange={(e) => setDescEn(e.target.value)}
                className={`${inputCls} resize-none`} disabled={busy} placeholder="Product description" dir="ltr" />
              <button type="button" onClick={handleEnhanceEn}
                disabled={busy || enhancingEn || !descEn.trim()}
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {enhancingEn
                  ? <><Loader2 size={11} className="animate-spin" />{'Enhancing…'}</>
                  : <><Wand2 size={11} />{'✨ Enhance with AI'}</>
                }
              </button>
            </div>
          </div>

          {/* Price + Stock + Prep Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.mp_editPrice}</label>
              <input type="number" min="0" step="0.01" value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputCls} disabled={busy} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.mp_editStock}</label>
              <input type="number" min="0" step="1" value={stock}
                onChange={(e) => setStock(e.target.value)}
                className={inputCls} disabled={busy} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">{t.ap_prepTime}</label>
              <div className="flex gap-2">
                <input type="number" min="0" step="1" value={prepTime}
                  onChange={(e) => setPrepTime(e.target.value)}
                  className={`${inputCls} flex-1`} disabled={busy} placeholder="0" />
                <select value={prepTimeUnit} onChange={(e) => setPrepTimeUnit(e.target.value)}
                  disabled={busy}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all">
                  <option value="minutes">{t.unit_minutes}</option>
                  <option value="hours">{t.unit_hours}</option>
                  <option value="days">{t.unit_days}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-2">
              {isRtl ? 'صور المنتج' : 'Product Images'}
            </label>
            <MultiImageDropZone
              files={images}
              onAdd={(newFiles) => setImages((prev) => [...prev, ...newFiles].slice(0, MAX_IMAGES))}
              onRemove={(i) => setImages((prev) => prev.filter((_, j) => j !== i))}
              disabled={busy}
              t={t}
              isRtl={isRtl}
            />
          </div>

          {/* Delivery — multi-select checkboxes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-600">{t.mp_editDelivery}</label>
              <span className="text-[11px] text-gray-400 font-medium">{t.ap_deliveryHint}</span>
            </div>
            <div className="flex flex-col gap-2">
              {DELIVERY_OPTIONS.map((opt) => (
                <DeliveryCheckCard
                  key={opt.value}
                  checked={deliveryTypes.includes(opt.value)}
                  onToggle={() => toggleDelivery(opt.value)}
                  disabled={busy}
                  Icon={opt.Icon}
                  iconColor={opt.iconColor}
                  label={opt.label}
                  sub={opt.sub}
                  activeBorder={opt.activeBorder}
                  activeBg={opt.activeBg}
                />
              ))}
            </div>
            {/* Selected count indicator */}
            <p className="mt-2 text-[11px] text-gray-400 text-center">
              {isRtl
                ? `${deliveryTypes.length} / 3 طرق مختارة`
                : `${deliveryTypes.length} / 3 methods selected`}
            </p>
          </div>

          {/* ── Danger Zone — Delete ── */}
          <div className="pt-2 border-t border-gray-100">
            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-red-200 text-red-500 text-sm font-bold hover:bg-red-50 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                <Trash2 size={14} /> {t.mp_delete}
              </button>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold text-red-700 leading-snug">{t.mp_deleteWarning}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {t.mp_cancel}
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.98] text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {deleting
                      ? <><Loader2 size={13} className="animate-spin" />{t.mp_deleting}</>
                      : <><Trash2 size={13} />{t.mp_deleteConfirm}</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer — Save / Cancel ── */}
        <div className="flex items-center gap-3 px-6 py-5 border-t border-gray-100 shrink-0">
          <button
            onClick={onClose}
            disabled={busy}
            className="flex-1 py-3 rounded-2xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {t.mp_cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={busy || deliveryTypes.length === 0}
            className="flex-1 py-3 rounded-2xl bg-blue-900 text-white text-sm font-bold hover:bg-blue-800 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving
              ? <><Loader2 size={14} className="animate-spin" />{t.mp_editSaving}</>
              : t.mp_editSave}
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
      .select('id, name_ar, name_en, description_ar, description_en, price, stock, is_active, image_url, is_perishable, delivery_type, prep_time')
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

  // Live-patch list on save
  const handleSaved = (updated) => {
    setProducts((prev) => prev.map((p) => p.id === updated.id ? { ...p, ...updated } : p));
  };

  // Remove product from list after delete
  const handleDeleted = (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setEditTarget(null);
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
              {/* Delivery badges — supports multiple */}
              <div className="flex flex-wrap gap-1 mt-1">
                {parseDeliveryTypes(p).map((dt) => {
                  if (dt === 'pickup') return (
                    <span key="pickup" className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      <Home size={9} />{t.dir === 'rtl' ? 'استلام شخصي' : 'Pickup'}
                    </span>
                  );
                  if (dt === 'seller_delivery') return (
                    <span key="seller_delivery" className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      <Zap size={9} />{t.dir === 'rtl' ? 'توصيل من البائع' : 'Seller Delivery'}
                    </span>
                  );
                  if (dt === 'third_party') return (
                    <span key="third_party" className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      <Truck size={9} />{t.dir === 'rtl' ? 'شركة شحن' : 'Shipping Co.'}
                    </span>
                  );
                  return null;
                })}
              </div>

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
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}


// ─── Multi-Image Upload Drop Zone (1-5 images, JPEG/JPG/PNG only) ─────────────

const MAX_IMAGES = 5;
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'];

// Compress + resize an image file via canvas before uploading
async function compressImage(file, maxPx = 1920, quality = 0.82) {
  return new Promise((resolve) => {
    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      let { width, height } = img;
      if (width > maxPx || height > maxPx) {
        if (width >= height) { height = Math.round(height * maxPx / width); width = maxPx; }
        else                  { width  = Math.round(width  * maxPx / height); height = maxPx; }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob
          ? new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })
          : file),
        'image/jpeg', quality,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

function MultiImageDropZone({ files, onAdd, onRemove, disabled, t, isRtl }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);
  const canAdd = files.length < MAX_IMAGES;

  const acceptFiles = useCallback((rawFiles) => {
    const valid = Array.from(rawFiles).filter((f) => {
      const ext = f.name.split('.').pop().toLowerCase();
      const typeOk = f.type.startsWith('image/') || ALLOWED_EXTS.includes(ext);
      return typeOk && f.size <= 10 * 1024 * 1024; // 10 MB
    });
    onAdd(valid);
  }, [onAdd]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    acceptFiles(e.dataTransfer.files);
  }, [acceptFiles]);

  return (
    <div className="flex flex-col gap-3">
      {/* Thumbnails row */}
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => {
            const url = f instanceof File ? URL.createObjectURL(f) : f;
            return (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onRemove(i)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} />
                </button>
                {i === 0 && (
                  <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-blue-600 text-white px-1 rounded font-bold">
                    {isRtl ? 'رئيسية' : 'Main'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Drop zone — only shown when more images can be added */}
      {canAdd && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          onClick={() => !disabled && inputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed h-32 transition-all duration-200 select-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${drag ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'}`}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="sr-only"
            disabled={disabled}
            onChange={(e) => { acceptFiles(e.target.files); e.target.value = ''; }}
          />
          <div className="flex flex-col items-center gap-2 px-6 text-center pointer-events-none">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${drag ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <ImagePlus size={20} className={drag ? 'text-blue-500' : 'text-gray-400'} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600">{drag ? t.img_drop : t.img_click}</p>
              <p className="text-xs text-gray-400 mt-0.5">{isRtl ? 'JPEG · PNG · WebP — بحد أقصى 10 MB' : 'JPEG · PNG · WebP — max 10 MB'}</p>
              <p className="text-[11px] text-blue-500 font-medium mt-0.5">
                {isRtl ? `${files.length} / ${MAX_IMAGES} صور` : `${files.length} / ${MAX_IMAGES} images`}
              </p>
            </div>
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
  price: '', category_id: '',
  delivery_types: ['third_party'],
  stock: '',
  prep_time: '', prep_time_unit: 'minutes',
  sizes: [], colors: [], specs: [],
  is_returnable: false,
};

const PHASE_LABELS = (t) => ({ idle: null, uploading: t.ap_uploading, saving: t.ap_saving });

function AddProductForm({ profile, cities, categories, showToast, t }) {
  const [form,         setForm]         = useState(EMPTY_PRODUCT);
  const [imageFiles,   setImageFiles]   = useState([]);
  const [phase,        setPhase]        = useState('idle');
  const [fieldErrs,    setFieldErrs]    = useState({});
  const [enhancingAr,  setEnhancingAr]  = useState(false);
  const [enhancingEn,  setEnhancingEn]  = useState(false);
  const isRtl = t.dir === 'rtl';

  const handleEnhanceAr = async () => {
    const raw = form.description_ar.trim();
    if (!raw || enhancingAr) return;
    setEnhancingAr(true);
    try {
      const result = await enhanceDescription(raw, 'ar');
      if (result) set('description_ar', result);
    } catch { /* silently fail */ } finally { setEnhancingAr(false); }
  };

  const handleEnhanceEn = async () => {
    const raw = form.description_en.trim();
    if (!raw || enhancingEn) return;
    setEnhancingEn(true);
    try {
      const result = await enhanceDescription(raw, 'en');
      if (result) set('description_en', result);
    } catch { /* silently fail */ } finally { setEnhancingEn(false); }
  };

  const submitting = phase !== 'idle';
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const errs = {};
    if (!form.name_ar.trim())          errs.name_ar      = t.ap_errNameAr;
    if (!form.price)                   errs.price        = t.ap_errPrice;
    else if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0) errs.price = t.ap_errPriceBad;
    if (!form.stock)                   errs.stock        = t.ap_errStock;
    if (!form.category_id)             errs.category_id  = t.ap_errCat;
    if (!form.delivery_types?.length)  errs.delivery     = t.ap_errDelivery;
    if (imageFiles.length === 0)       errs.images       = isRtl ? 'يرجى إضافة صورة واحدة على الأقل' : 'At least 1 image is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrs(errs); return; }
    setFieldErrs({});
    let image_url = null;
    let images_urls = [];
    try {
      if (imageFiles.length > 0) {
        setPhase('uploading');
        for (const file of imageFiles) {
          const compressed = await compressImage(file);
          const filePath   = `${profile.user_id}/${crypto.randomUUID()}.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, compressed, { upsert: false, contentType: 'image/jpeg' });
          if (uploadError) { showToast(`${t.ap_errUpload}${uploadError.message}`, 'error'); return; }
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
          images_urls.push(urlData.publicUrl);
        }
        image_url = images_urls[0]; // first image is the primary
      }
      setPhase('saving');
      // ── ARCHITECTURE: producer_id = producer_profiles.id (the profile PK)
      // products.producer_id FK references producer_profiles.id
      // The INSERT RLS policy is a subquery:
      //   WITH CHECK (producer_id IN (
      //     SELECT id FROM producer_profiles WHERE user_id = auth.uid()
      //   ))
      // So we send profile.id (the PK of the profile owned by the current auth user).
      const delivTypes = form.delivery_types ?? ['third_party'];
      const isLocal    = delivTypes.some((d) => d !== 'third_party');
      const payload = {
        producer_id:   profile.id,
        category_id:   parseInt(form.category_id),
        city_id:       profile.city_id,
        name_ar:       form.name_ar.trim(),
        price:         parseFloat(form.price),
        is_perishable: isLocal,
        delivery_type: serializeDeliveryTypes(delivTypes),
        stock:         parseInt(form.stock),
        image_url,
        images:        images_urls.length > 0 ? images_urls : undefined,
        is_active:     true,
      };
      // Optional text columns — only include when the column exists in your schema
      // (run supabase/patch_v2_complete_schema_fix.sql to add them)
      const nameEn       = form.name_en.trim();
      const descAr       = form.description_ar.trim();
      const descEn       = form.description_en.trim();
      const prepTimeVal  = form.prep_time ? toMinutes(form.prep_time, form.prep_time_unit) : null;
      if (nameEn)                  payload.name_en        = nameEn;
      if (descAr)                  payload.description_ar = descAr;
      if (descEn)                  payload.description_en = descEn;
      if (prepTimeVal !== null)    payload.prep_time      = prepTimeVal;
      if (form.sizes.length)       payload.sizes          = form.sizes;
      if (form.colors.length)      payload.colors         = form.colors;
      if (form.specs.length)       payload.specs          = form.specs;
      payload.is_returnable = form.is_returnable ?? false;

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
        setImageFiles([]);
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

        {/* Images */}
        <section>
          <SectionTitle icon={ImagePlus} label={t.ap_image} />
          <div className="mt-4">
            <MultiImageDropZone
              files={imageFiles}
              onAdd={(newFiles) => setImageFiles((prev) => [...prev, ...newFiles].slice(0, MAX_IMAGES))}
              onRemove={(i) => setImageFiles((prev) => prev.filter((_, j) => j !== i))}
              disabled={submitting}
              t={t}
              isRtl={isRtl}
            />
            {fieldErrs.images && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrs.images}</p>}
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
                rows={3} className={`${inputCls} resize-none`} disabled={submitting} />
              <button type="button" onClick={handleEnhanceAr}
                disabled={submitting || enhancingAr || !form.description_ar.trim()}
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {enhancingAr
                  ? <><Loader2 size={11} className="animate-spin" />{isRtl ? 'جاري التحسين…' : 'Enhancing…'}</>
                  : <><Wand2 size={11} />{isRtl ? '✨ تحسين بالذكاء الاصطناعي' : '✨ Enhance with AI'}</>
                }
              </button>
            </Field>
            <Field label={t.ap_descEn}>
              <textarea placeholder="Describe your product in English…" value={form.description_en}
                onChange={(e) => set('description_en', e.target.value)}
                rows={3} className={`${inputCls} resize-none`} disabled={submitting} dir="ltr" />
              <button type="button" onClick={handleEnhanceEn}
                disabled={submitting || enhancingEn || !form.description_en.trim()}
                className="mt-1.5 flex items-center gap-1.5 text-[11px] font-bold text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                {enhancingEn
                  ? <><Loader2 size={11} className="animate-spin" />{isRtl ? 'جاري التحسين…' : 'Enhancing…'}</>
                  : <><Wand2 size={11} />{isRtl ? '✨ تحسين بالذكاء الاصطناعي' : '✨ Enhance with AI'}</>
                }
              </button>
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

            {/* Preparation time */}
            <div className="grid grid-cols-2 gap-4">
              <Field label={t.ap_prepTime}>
                <div className="flex gap-2">
                  <input
                    type="number" min="0" step="1"
                    placeholder={t.ap_prepTimePlaceholder}
                    value={form.prep_time}
                    onChange={(e) => set('prep_time', e.target.value)}
                    className={`${inputCls} flex-1`}
                    disabled={submitting}
                  />
                  <select
                    value={form.prep_time_unit}
                    onChange={(e) => set('prep_time_unit', e.target.value)}
                    disabled={submitting}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all"
                  >
                    <option value="minutes">{t.unit_minutes}</option>
                    <option value="hours">{t.unit_hours}</option>
                    <option value="days">{t.unit_days}</option>
                  </select>
                </div>
              </Field>
            </div>
          </div>
        </section>

        <Divider />

        {/* Classification */}
        <section>
          <SectionTitle icon={Layers} label={t.ap_classification} />
          <div className="flex flex-col gap-4 mt-4">
            <Field label={t.ap_category} required>
              <select value={form.category_id} onChange={(e) => set('category_id', e.target.value)}
                className={inputErr('category_id')} disabled={submitting}>
                <option value="">{t.ap_selectCat}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{pickName(c, t.dir === 'rtl')}</option>)}
              </select>
              {fieldErrs.category_id && <p className="text-xs text-red-500 font-medium">{fieldErrs.category_id}</p>}
            </Field>
            {/* City is taken automatically from seller's profile — no manual selection needed */}
            {profile.city_id && (() => {
              const profileCity = cities.find((c) => c.id === profile.city_id);
              return profileCity ? (
                <p className="text-xs text-gray-500 flex items-center gap-1.5">
                  <MapPin size={12} className="text-blue-400" />
                  {t.dir === 'rtl' ? 'مدينة المنتج:' : 'Product city:'}{' '}
                  <span className="font-semibold text-gray-700">{pickName(profileCity, t.dir === 'rtl')}</span>
                </p>
              ) : null;
            })()}
          </div>
        </section>

        <Divider />

        {/* Delivery Types — multi-select checkbox cards */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle icon={Truck} label={t.ap_shipping} />
            <span className="text-[11px] text-gray-400 font-medium">{t.ap_deliveryHint}</span>
          </div>

          {fieldErrs.delivery && (
            <p className="text-xs text-red-500 font-semibold mb-2">{fieldErrs.delivery}</p>
          )}

          <div className="flex flex-col gap-3">
            {[
              { value: 'seller_delivery', Icon: Zap,   iconColor: 'text-amber-500',   label: t.ap_del_fast,   sub: t.ap_del_fast_sub,   activeBorder: 'border-amber-400',   activeBg: 'bg-amber-50'   },
              { value: 'pickup',          Icon: Home,  iconColor: 'text-emerald-600', label: t.ap_del_pickup, sub: t.ap_del_pickup_sub, activeBorder: 'border-emerald-400', activeBg: 'bg-emerald-50' },
              { value: 'third_party',     Icon: Truck, iconColor: 'text-blue-500',    label: t.ap_del_ship,   sub: t.ap_del_ship_sub,   activeBorder: 'border-blue-400',    activeBg: 'bg-blue-50'    },
            ].map((opt) => {
              const checked = (form.delivery_types ?? []).includes(opt.value);
              const toggle = () => {
                const prev = form.delivery_types ?? [];
                const next = checked
                  ? prev.filter((d) => d !== opt.value)
                  : prev.length < 3 ? [...prev, opt.value] : prev;
                if (next.length > 0) set('delivery_types', next);
              };
              return (
                <DeliveryCheckCard
                  key={opt.value}
                  checked={checked}
                  onToggle={toggle}
                  disabled={submitting}
                  Icon={opt.Icon}
                  iconColor={opt.iconColor}
                  label={opt.label}
                  sub={opt.sub}
                  activeBorder={opt.activeBorder}
                  activeBg={opt.activeBg}
                />
              );
            })}
          </div>

          {/* Selected count */}
          <p className="mt-2 text-[11px] text-gray-400 text-center">
            {(form.delivery_types ?? []).length} / 3 {t.dir === 'rtl' ? 'طرق مختارة' : 'methods selected'}
          </p>

          {/* Pickup location preview — shows seller's exact registered location */}
          {(form.delivery_types ?? []).includes('pickup') && (() => {
            const profileCity = cities.find((c) => c.id === profile.city_id);
            if (!profileCity) return null;
            const pickupPos = profile.location_lat && profile.location_lng
              ? { lat: profile.location_lat, lng: profile.location_lng, address: profile.location_address ?? '' }
              : undefined;
            return (
              <div className="mt-4">
                <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1.5">
                  <MapPin size={12} className="text-emerald-500" />
                  {t.dir === 'rtl' ? 'موقع نقطة الاستلام (مقر الأسرة)' : 'Pickup location (family premises)'}
                </p>
                <LocationPicker
                  mode="pickup"
                  sellerCity={pickupPos ? '' : pickName(profileCity, t.dir === 'rtl')}
                  initialPos={pickupPos}
                  lang={t.dir === 'rtl' ? 'ar' : 'en'}
                  mapHeight={180}
                />
              </div>
            );
          })()}
        </section>

        <Divider />

        {/* Return Policy */}
        <section>
          <SectionTitle icon={RotateCcw} label={t.dir === 'rtl' ? 'سياسة الإرجاع' : 'Return Policy'} />
          <div className="flex flex-col gap-3 mt-4">
            {[
              { value: true,  label: t.ap_returnable,    note: t.ap_returnableNote,    icon: '✅', border: 'border-emerald-400', bg: 'bg-emerald-50', text: 'text-emerald-700' },
              { value: false, label: t.ap_notReturnable, note: t.ap_notReturnableNote, icon: '🚫', border: 'border-red-300',     bg: 'bg-red-50',     text: 'text-red-600'   },
            ].map((opt) => {
              const selected = form.is_returnable === opt.value;
              return (
                <button key={String(opt.value)} type="button"
                  onClick={() => set('is_returnable', opt.value)}
                  className={`flex items-start gap-3 p-4 rounded-2xl border-2 transition-all text-start
                    ${selected ? `${opt.border} ${opt.bg}` : 'border-gray-100 bg-gray-50 hover:border-gray-200'}`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-sm ${selected ? opt.text : 'text-gray-700'}`}>{opt.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.note}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 mt-1 flex items-center justify-center transition-colors
                    ${selected ? `${opt.border} ${opt.bg.replace('50', '500')}` : 'border-gray-300'}`}>
                    {selected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                  </div>
                </button>
              );
            })}
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
                <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden self-stretch">
                  <button
                    type="button"
                    onClick={() => updateSize(i, 'price_adj', -(size.price_adj || 0))}
                    className={`px-2 self-stretch flex items-center text-xs font-bold border-e border-gray-200 whitespace-nowrap transition-colors ${
                      size.price_adj < 0
                        ? 'text-red-700 bg-red-50 hover:bg-red-100'
                        : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                    }`}
                  >
                    {size.price_adj < 0
                      ? (t.dir === 'rtl' ? '− ر.س' : '− SAR')
                      : (t.dir === 'rtl' ? '+ ر.س' : '+ SAR')}
                  </button>
                  <input type="number" placeholder="0" value={Math.abs(size.price_adj) || ''}
                    onChange={(e) => {
                      const abs = parseFloat(e.target.value) || 0;
                      updateSize(i, 'price_adj', size.price_adj < 0 ? -abs : abs);
                    }}
                    className="w-16 px-2 py-2 text-sm focus:outline-none" />
                </div>
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

function SettingsTab({ profile, cities, showToast, t, navigate, onProfileUpdate }) {
  const [showModal,    setShowModal]    = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [editingLoc,   setEditingLoc]   = useState(false);
  const [newLoc,       setNewLoc]       = useState(null);
  const [newLocCity,   setNewLocCity]   = useState(null);   // 'riyadh' | 'jeddah' | 'other'
  const [detectingCity,setDetectingCity]= useState(false);
  const [savingLoc,    setSavingLoc]    = useState(false);
  const profileCity = cities.find((c) => c.id === profile.city_id);
  const isRtl = t.dir === 'rtl';
  const lang  = isRtl ? 'ar' : 'en';

  // Derive stored position from the profile row (source of truth)
  const storedPos = profile.location_lat && profile.location_lng
    ? { lat: profile.location_lat, lng: profile.location_lng, address: profile.location_address ?? '' }
    : null;

  const detectCityFromLatLng = async (lat, lng) => {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1&accept-language=ar`;
    const res  = await fetch(url, { headers: { 'User-Agent': 'Usaruna/1.0' } });
    const data = await res.json();
    const addr = data.address ?? {};
    const text = [addr.city, addr.county, addr.state_district, addr.town, addr.municipality].filter(Boolean).join(' ');
    if (/الرياض|Riyadh/i.test(text)) return 'riyadh';
    if (/جدة|Jeddah|Jiddah/i.test(text)) return 'jeddah';
    return 'other';
  };

  const handleNewLocConfirm = async (loc) => {
    setNewLoc(loc);
    setNewLocCity(null);
    setDetectingCity(true);
    try {
      const city = await detectCityFromLatLng(loc.lat, loc.lng);
      setNewLocCity(city);
    } catch {
      setNewLocCity('other');
    } finally {
      setDetectingCity(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!newLoc || !newLocCity || newLocCity === 'other' || detectingCity) return;
    setSavingLoc(true);
    try {
      const cityRecord = cities.find((c) => {
        const n = c.name_ar ?? '';
        if (newLocCity === 'riyadh') return /الرياض/.test(n);
        if (newLocCity === 'jeddah') return /جدة/.test(n);
        return false;
      });

      // 1. Save to auth metadata (always works — no DB columns required)
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { location_lat: newLoc.lat, location_lng: newLoc.lng, location_address: newLoc.address },
      });
      if (metaErr) throw metaErr;

      // 2. Save to producer_profiles table so customers can see the precise location.
      //    If the location_lat/lng/address columns don't exist yet the error is caught
      //    silently — run the SQL migration to enable this:
      //    ALTER TABLE public.producer_profiles
      //      ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION,
      //      ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION,
      //      ADD COLUMN IF NOT EXISTS location_address TEXT;
      const profileUpdate = {
        ...(cityRecord ? { city_id: cityRecord.id } : {}),
        location_lat:     newLoc.lat,
        location_lng:     newLoc.lng,
        location_address: newLoc.address,
      };
      const { error: dbErr } = await supabase
        .from('producer_profiles')
        .update(profileUpdate)
        .eq('id', profile.id);
      if (dbErr && !dbErr.message?.toLowerCase().includes('column')) throw dbErr;

      // Update parent profile state so the whole dashboard reflects the change
      onProfileUpdate?.((prev) => ({
        ...prev,
        location_lat:     newLoc.lat,
        location_lng:     newLoc.lng,
        location_address: newLoc.address,
        ...(cityRecord ? { city_id: cityRecord.id } : {}),
      }));

      setEditingLoc(false);
      setNewLoc(null);
      setNewLocCity(null);
      showToast(t.st_locationSaved, 'success');
    } catch (err) {
      showToast(`${t.st_locationError}${err.message}`, 'error');
    } finally {
      setSavingLoc(false);
    }
  };

  const cancelEditLoc = () => { setEditingLoc(false); setNewLoc(null); setNewLocCity(null); };

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
        <div className="flex flex-col gap-5">

          {/* Store name */}
          <div>
            <p className="text-xs font-semibold text-gray-400 mb-1">{t.st_nameAr}</p>
            <p className="text-sm font-bold text-gray-800">
              {isRtl ? profile.business_name_ar : (profile.business_name_en || profile.business_name_ar)}
            </p>
          </div>

          {/* Location section */}
          {profileCity && (
            <div>
              {/* Header row: label + edit button */}
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-400">{t.st_locationLabel}</p>
                {!editingLoc && (
                  <button
                    type="button"
                    onClick={() => setEditingLoc(true)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-3 py-1.5 transition-colors"
                  >
                    <MapPin size={11} /> {t.st_editLocation}
                  </button>
                )}
              </div>

              {/* City name */}
              <p className="text-sm font-bold text-gray-800 flex items-center gap-1.5 mb-3">
                <MapPin size={13} className="text-blue-500" />{pickName(profileCity, isRtl)}
              </p>

              {/* Read-only map or edit mode */}
              {!editingLoc ? (
                <LocationPicker
                  mode="pickup"
                  sellerCity={storedPos ? '' : pickName(profileCity, isRtl)}
                  initialPos={storedPos ?? undefined}
                  lang={lang}
                  mapHeight={180}
                />
              ) : (
                <div className="space-y-3">
                  <LocationPicker
                    mode="customer"
                    onConfirm={handleNewLocConfirm}
                    lang={lang}
                    mapHeight={200}
                  />

                  {/* City detection feedback */}
                  {detectingCity && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-100 rounded-xl">
                      <Loader2 size={13} className="animate-spin text-blue-500 shrink-0" />
                      <span className="text-xs font-semibold text-blue-600">{t.st_detectingCity}</span>
                    </div>
                  )}
                  {!detectingCity && newLocCity === 'riyadh' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <Check size={13} className="text-emerald-600 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">{t.st_locationCityOk_riyadh}</p>
                    </div>
                  )}
                  {!detectingCity && newLocCity === 'jeddah' && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
                      <Check size={13} className="text-emerald-600 shrink-0" />
                      <p className="text-xs font-bold text-emerald-700">{t.st_locationCityOk_jeddah}</p>
                    </div>
                  )}
                  {!detectingCity && newLocCity === 'other' && (
                    <div className="px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                      <p className="text-xs font-bold text-amber-700">{t.st_locationCityOther}</p>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={cancelEditLoc}
                      disabled={savingLoc}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {t.st_cancelEdit}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveLocation}
                      disabled={!newLoc || !newLocCity || newLocCity === 'other' || detectingCity || savingLoc}
                      className="flex-1 py-2.5 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {savingLoc && <Loader2 size={13} className="animate-spin" />}
                      {t.st_saveLocation}
                    </button>
                  </div>
                </div>
              )}
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

      const [{ data: citiesData }, { data: catsData }, { data: { user: authUser } }] = await Promise.all([
        supabase.from('cities').select('id, name_ar, name_en').order('id'),
        supabase.from('categories').select('id, name_ar, name_en, slug').order('id'),
        supabase.auth.getUser(),
      ]);

      // Merge location from auth metadata into profile (no DB columns needed)
      const meta = authUser?.user_metadata ?? {};
      const profileWithLocation = {
        ...profileData,
        location_lat:     meta.location_lat     ?? profileData.location_lat     ?? null,
        location_lng:     meta.location_lng     ?? profileData.location_lng     ?? null,
        location_address: meta.location_address ?? profileData.location_address ?? null,
      };

      if (!cancelled) {
        setCities(citiesData   ?? []);
        setCategories(catsData ?? []);
        setProfile(profileWithLocation);
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

// ─── Producer Orders Tab ────────────────────────────────────────────────────────

const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped',
];

const STATUS_META = {
  pending:          { ar: 'قيد الانتظار',    en: 'Pending',          dot: 'bg-yellow-400',  badge: 'bg-yellow-50 text-yellow-700 border-yellow-300',  card: 'border-yellow-200'  },
  confirmed:        { ar: 'تم التأكيد',      en: 'Confirmed',        dot: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700 border-blue-300',        card: 'border-blue-200'    },
  processing:       { ar: 'قيد التحضير',    en: 'Preparing',        dot: 'bg-orange-500',  badge: 'bg-orange-50 text-orange-700 border-orange-300',  card: 'border-orange-200'  },
  shipped:          { ar: 'جاهز للاستلام',  en: 'Ready',            dot: 'bg-purple-500',  badge: 'bg-purple-50 text-purple-700 border-purple-300',  card: 'border-purple-200'  },
  delivered:        { ar: 'تم التسليم',     en: 'Delivered',        dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-300',card: 'border-emerald-200' },
  cancelled:        { ar: 'ملغي',           en: 'Cancelled',        dot: 'bg-red-400',     badge: 'bg-red-50 text-red-600 border-red-200',           card: 'border-red-200'     },
};

const DELIVERY_ICONS = { seller_delivery: '🛵', pickup: '🏠', third_party: '📦', fast: '🛵', nationwide: '📦' };

function StatusBadge({ status, lang }) {
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${m.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot} shrink-0`} />
      {lang === 'ar' ? m.ar : m.en}
    </span>
  );
}

function StatusDropdown({ currentStatus, onUpdate, lang, t }) {
  const [open, setOpen] = useState(false);
  const m = STATUS_META[currentStatus] ?? STATUS_META.pending;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${m.badge} hover:opacity-80 transition-opacity`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${m.dot} shrink-0`} />
        {lang === 'ar' ? m.ar : m.en}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div className={`absolute z-50 mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 py-1 min-w-[150px]
          ${lang === 'ar' ? 'right-0' : 'left-0'}`}>
          {ORDER_STATUSES.map((s) => {
            const sm = STATUS_META[s];
            return (
              <button
                type="button"
                key={s}
                onClick={() => { setOpen(false); onUpdate(s); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors
                  text-${lang === 'ar' ? 'right' : 'left'} ${
                    s === currentStatus ? 'text-blue-700 bg-blue-50' : 'text-gray-700'
                  }`}
              >
                <span className={`w-2 h-2 rounded-full ${sm.dot} shrink-0`} />
                {lang === 'ar' ? sm.ar : sm.en}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── InfoCard helper ─────────────────────────────────────────────────────────

function InfoCard({ icon, label, value, isRtl, ltr = false }) {
  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2.5 flex items-start gap-2">
      <span className="text-gray-400 shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-400 font-semibold">{label}</p>
        <p className={`text-xs font-bold text-gray-700 break-words ${ltr ? 'dir-ltr' : ''}`}>{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── ProducerOrdersTab ───────────────────────────────────────────────────────

function ProducerOrdersTab({ t, showToast, profile }) {
  const isRtl = t.dir === 'rtl';
  const lang  = isRtl ? 'ar' : 'en';

  const [orderItems,    setOrderItems]    = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [expandedId,    setExpandedId]    = useState(null);

  const fetchOrders = useCallback(() => {
    if (!profile?.id) return;
    setLoading(true);
    supabase
      .from('order_items')
      .select('*, orders(id, order_number, created_at, total_amount, delivery_total, pay_method, status)')
      .eq('producer_id', profile.user_id)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('[ProducerOrdersTab]', error);
        setOrderItems(data ?? []);
        setLoading(false);
      });
  }, [profile?.id]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const getStatus = (i) => i.orders?.status ?? 'pending';

  const handleStatusUpdate = async (itemId, newStatus) => {
    // status lives on the orders row; find the order_id for this item
    const item = orderItems.find((i) => i.id === itemId);
    if (!item?.order_id) return;
    setOrderItems((prev) => prev.map((i) =>
      i.order_id === item.order_id ? { ...i, orders: { ...i.orders, status: newStatus } } : i
    ));
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', item.order_id);
    if (error) {
      showToast(t.ord_updateErr + error.message, 'error');
      fetchOrders();
    } else {
      showToast(t.ord_updateOk, 'success');
    }
  };

  // ── Stats ──────────────────────────────────────────────────────────────────
  const todayStr   = new Date().toDateString();
  const todayItems = orderItems.filter((i) =>
    new Date(i.orders?.created_at ?? i.created_at ?? 0).toDateString() === todayStr
  );
  const pendingCount   = orderItems.filter((i) => getStatus(i) === 'pending').length;
  const preparingCount = orderItems.filter((i) => getStatus(i) === 'processing').length;
  const doneCount      = orderItems.filter((i) => getStatus(i) === 'shipped').length;
  const dailyRevenue   = todayItems
    .filter((i) => getStatus(i) === 'shipped')
    .reduce((s, i) => s + (i.price_at_purchase ?? 0) * (i.quantity ?? 1), 0);

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filtered = orderItems.filter((item) => {
    const order   = item.orders ?? {};
    const name    = isRtl ? (item.name_ar ?? '') : (item.name_en ?? item.name_ar ?? '');
    const orderNum = String(order.order_number ?? item.id ?? '');
    const custName = '';
    const q = search.toLowerCase();
    const matchSearch = !q || name.toLowerCase().includes(q) || orderNum.toLowerCase().includes(q) || custName.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'all' || getStatus(item) === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32 gap-3 text-gray-400">
        <Loader2 size={22} className="animate-spin text-blue-400" />
        <span className="text-sm">{t.ord_loading}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-extrabold text-gray-800 flex items-center gap-2">
          <Inbox size={20} className="text-blue-700" />
          {t.ord_title}
          {orderItems.length > 0 && (
            <span className="text-sm font-bold text-blue-500 bg-blue-50 rounded-full px-2.5 py-0.5">
              {orderItems.length}
            </span>
          )}
        </h2>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-700 font-semibold transition-colors border border-gray-200 hover:border-blue-300 rounded-xl px-3 py-1.5"
        >
          <RefreshCw size={13} /> {t.ord_refresh}
        </button>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: t.ord_stats_today,     value: todayItems.length,                           icon: '📋', bg: 'bg-blue-50',    text: 'text-blue-700'    },
          { label: t.ord_stats_pending,   value: pendingCount,                                icon: '⏳', bg: 'bg-yellow-50',  text: 'text-yellow-700'  },
          { label: t.ord_stats_preparing, value: preparingCount,                              icon: '👨‍🍳', bg: 'bg-orange-50',  text: 'text-orange-700'  },
          { label: t.ord_stats_done,      value: doneCount,                                   icon: '✅', bg: 'bg-emerald-50', text: 'text-emerald-700' },
          { label: t.ord_stats_revenue,   value: `${dailyRevenue.toFixed(0)} ${t.ord_sar}`,  icon: '💰', bg: 'bg-violet-50',  text: 'text-violet-700'  },
        ].map(({ label, value, icon, bg, text }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 flex flex-col gap-1`}>
            <span className="text-xl">{icon}</span>
            <p className={`text-lg font-extrabold leading-none ${text}`}>{value}</p>
            <p className={`text-[11px] font-semibold opacity-70 leading-snug ${text}`}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search + filter bar ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[180px] relative">
          <Search
            size={14}
            className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.ord_search}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`w-full border border-gray-200 rounded-xl py-2.5 text-sm placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50
              ${isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
        >
          <option value="all">{t.ord_filterAll}</option>
          {ORDER_STATUSES.filter((s) => s !== 'processing' && s !== 'shipped').map((s) => {
            const sm = STATUS_META[s];
            return <option key={s} value={s}>{lang === 'ar' ? sm.ar : sm.en}</option>;
          })}
        </select>

        {(search || filterStatus !== 'all') && (
          <button
            onClick={() => { setSearch(''); setFilterStatus('all'); }}
            className="text-xs text-gray-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-1 border border-gray-200 hover:border-red-200 rounded-xl px-2.5 py-2"
          >
            <X size={12} /> {t.ord_clearFilters}
          </button>
        )}

        <p className="text-xs text-gray-400 ms-auto">
          {filtered.length} {t.ord_results}
        </p>
      </div>

      {/* ── Empty state ── */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
            <Inbox size={32} className="text-blue-200" />
          </div>
          <h3 className="text-lg font-extrabold text-gray-700 mb-2">
            {search || filterStatus !== 'all' ? t.ord_noResults : t.ord_empty}
          </h3>
          <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
            {search || filterStatus !== 'all' ? t.ord_noResultsDesc : t.ord_emptyDesc}
          </p>
        </div>
      )}

      {/* ── Order cards ── */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const name      = isRtl ? (item.name_ar ?? '—') : (item.name_en ?? item.name_ar ?? '—');
          const order     = item.orders ?? {};
          const status    = getStatus(item);
          const sm        = STATUS_META[status] ?? STATUS_META.pending;
          const isExpanded = expandedId === item.id;

          const dateStr = (order.created_at ?? item.created_at)
            ? new Date(order.created_at ?? item.created_at).toLocaleString(
                isRtl ? 'ar-SA' : 'en-US',
                { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
              )
            : '—';

          const delivOpt  = item.delivery_option ?? 'third_party';
          const delivIcon = DELIVERY_ICONS[delivOpt] ?? '📦';
          const delivLabel = {
            seller_delivery:  isRtl ? 'توصيل من البائع' : 'Seller Delivery',
            fast:             isRtl ? 'توصيل من البائع' : 'Seller Delivery',
            pickup:           isRtl ? 'استلام شخصي' : 'Self Pickup',
            third_party:      isRtl ? 'شركة شحن' : 'Shipping Co.',
            nationwide:       isRtl ? 'شركة شحن' : 'Shipping Co.',
          }[delivOpt] ?? (isRtl ? 'توصيل' : 'Delivery');

          const payLabel = {
            cod:   isRtl ? 'الدفع عند الاستلام' : 'Cash on Delivery',
            apple: 'Apple Pay',
            card:  isRtl ? 'بطاقة تجريبية' : 'Demo Card',
          }[order.pay_method ?? ''] ?? (order.pay_method ?? '—');

          const lineTotal = (item.price_at_purchase ?? 0) * (item.quantity ?? 1);

          // Status flow for "advance to next" button
          const FLOW = ['pending', 'confirmed', 'processing', 'shipped'];
          const currentIdx = FLOW.indexOf(status);
          const nextStatus = currentIdx >= 0 && currentIdx < FLOW.length - 1 ? FLOW[currentIdx + 1] : null;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-3xl border-2 shadow-sm transition-all duration-200 overflow-hidden ${sm.card ?? 'border-gray-200'}`}
            >
              {/* ── Card header ── */}
              <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap border-b border-gray-50">
                <div className="flex items-center gap-3 flex-wrap">
                  <p className="text-sm font-extrabold text-blue-800">
                    {t.ord_orderNum}{order.order_number ?? item.id?.slice(0,8) ?? '—'}
                  </p>
                  <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${sm.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} shrink-0`} />
                    {lang === 'ar' ? sm.ar : sm.en}
                  </span>
                  <p className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock size={10} />{dateStr}
                  </p>
                </div>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  className="text-xs text-gray-400 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                >
                  {isExpanded ? t.ord_hide : t.ord_details}
                  <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* ── Product row (always visible) ── */}
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.gradient ?? 'from-blue-50 to-indigo-100'} flex items-center justify-center text-2xl shrink-0 select-none`}>
                    {item.emoji ?? '📦'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">
                        ×{item.quantity ?? 1} · {Number(item.price_at_purchase ?? 0).toFixed(0)} {t.ord_sar}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
                        {delivIcon} {delivLabel}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <p className="text-xl font-extrabold text-blue-900">{lineTotal.toFixed(0)}</p>
                    <p className="text-[10px] text-gray-400">{t.ord_sar}</p>
                  </div>
                </div>
              </div>

              {/* ── Expanded details ── */}
              {isExpanded && (
                <div className="px-5 pb-4 space-y-3 border-t border-gray-100 pt-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">
                    {isRtl ? 'تفاصيل العميل والتوصيل' : 'Customer & Delivery Details'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <InfoCard icon={<CreditCard size={13} />} label={t.ord_payment}  value={payLabel} isRtl={isRtl} />
                  </div>
                </div>
              )}

              {/* ── Action buttons ── */}
              <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 flex-wrap bg-gray-50/50">
                {/* Accept (pending only) */}
                {status === 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(item.id, 'confirmed')}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  >
                    <Check size={13} /> {t.ord_accept}
                  </button>
                )}

                {/* Advance to next status */}
                {nextStatus && status !== 'pending' && (
                  <button
                    type="button"
                    onClick={() => handleStatusUpdate(item.id, nextStatus)}
                    className="flex items-center gap-1.5 bg-blue-900 hover:bg-blue-800 active:scale-95 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                  >
                    <RefreshCw size={13} />
                    {isRtl
                      ? `→ ${STATUS_META[nextStatus]?.ar}`
                      : `→ ${STATUS_META[nextStatus]?.en}`}
                  </button>
                )}

                {/* Full status dropdown (manual override) */}
                <StatusDropdown
                  currentStatus={status}
                  onUpdate={(s) => handleStatusUpdate(item.id, s)}
                  lang={lang}
                  t={t}
                />

                {/* Contact via WhatsApp — phone not stored in orders table */}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

  // ── Restore scoping — the above function was intentionally placed at module scope ──
  // (JSX for the dashboard render continues below)


  const profileCity = cities.find((c) => c.id === profile.city_id);

  const NAV_ITEMS = [
    { id: 'overview',    label: t.nav_overview,    Icon: LayoutDashboard },
    { id: 'sales',       label: t.nav_sales,        Icon: TrendingUp      },
    { id: 'orders',      label: t.nav_orders,       Icon: Inbox           },
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
          <button onClick={async () => { await logout(); navigate('/'); }}
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
          {activeTab === 'orders'      && <ProducerOrdersTab profile={profile} t={t} showToast={showToast} />}
          {activeTab === 'add-product' && <AddProductForm profile={profile} cities={cities} categories={categories} showToast={showToast} t={t} />}
          {activeTab === 'my-products' && <MyProductsTab  profile={profile} t={t} showToast={showToast} />}
          {activeTab === 'settings'    && <SettingsTab    profile={profile} cities={cities} showToast={showToast} t={t} navigate={navigate} onProfileUpdate={setProfile} />}
        </main>
      </div>
    </div>
  );
}
