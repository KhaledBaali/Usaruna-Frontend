import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, Package, MapPin, User, LogOut,
  CheckCircle, AlertCircle, Loader2, PlusCircle,
  ShoppingBag, Layers, Truck, Archive, ChevronRight,
  Settings, LayoutDashboard, TrendingUp, ClipboardList,
  ImagePlus, FileImage, X, Upload,
} from 'lucide-react';
import { supabase } from './supabase';
import { useAuth } from './contexts/AuthContext';
import logo from './assets/logo.png';

// ─── Shared helpers ────────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 ' +
  'placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200';

function Field({ label, required, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">
        {label}{required && <span className="text-red-400 mr-0.5">*</span>}
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

function Placeholder({ icon: Icon, title, desc }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 bg-blue-50 rounded-3xl flex items-center justify-center mb-5">
        <Icon size={32} className="text-blue-200" />
      </div>
      <h2 className="text-xl font-extrabold text-gray-700 mb-2">{title}</h2>
      <p className="text-sm text-gray-400 max-w-xs leading-relaxed">{desc}</p>
    </div>
  );
}

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

// ─── Overview tab ──────────────────────────────────────────────────────────────

function OverviewTab({ profile, onNavigate }) {
  const STATS = [
    { label: 'المنتجات المنشورة', value: '—', Icon: Package,       color: 'bg-blue-50    text-blue-600'    },
    { label: 'الطلبات الواردة',   value: '—', Icon: ClipboardList, color: 'bg-amber-50   text-amber-600'   },
    { label: 'إجمالي المبيعات',   value: '—', Icon: TrendingUp,    color: 'bg-emerald-50 text-emerald-600' },
    { label: 'تقييم المتجر',      value: '—', Icon: Store,         color: 'bg-violet-50  text-violet-600'  },
  ];

  return (
    <div className="max-w-3xl mx-auto">

      {/* Welcome banner */}
      <div className="bg-gradient-to-l from-blue-900 to-blue-800 rounded-3xl p-7 mb-8 text-white relative overflow-hidden">
        <div className="absolute -top-8 -left-8 w-40 h-40 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-10 -right-6 w-52 h-52 bg-white/5 rounded-full pointer-events-none" />
        <div className="relative z-10">
          <p className="text-blue-300 text-sm font-medium mb-1">لوحة تحكم البائع</p>
          <h1 className="text-2xl font-extrabold mb-1">
            أهلاً، {profile.business_name_ar} 👋
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed">
            متجرك نشط وجاهز للبيع. ابدأ بإضافة منتجاتك الآن.
          </p>
          <button
            onClick={() => onNavigate('add-product')}
            className="mt-5 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400
              active:scale-[0.97] text-white font-bold text-sm px-5 py-2.5 rounded-2xl
              transition-all duration-200 shadow-lg shadow-emerald-900/30"
          >
            <PlusCircle size={15} />
            إضافة منتج جديد
          </button>
        </div>
      </div>

      {/* Stats grid */}
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

      {/* Quick actions */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-5">إجراءات سريعة</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: 'إضافة منتج جديد', Icon: PlusCircle, tab: 'add-product', cls: 'border-blue-200   hover:bg-blue-50   hover:border-blue-400   text-blue-700'   },
            { label: 'عرض منتجاتي',      Icon: Package,    tab: 'my-products', cls: 'border-gray-200   hover:bg-gray-50   hover:border-gray-400   text-gray-700'   },
            { label: 'إعدادات المتجر',   Icon: Settings,   tab: 'settings',    cls: 'border-violet-200 hover:bg-violet-50 hover:border-violet-400 text-violet-700' },
          ].map(({ label, Icon, tab, cls }) => (
            <button
              key={tab}
              onClick={() => onNavigate(tab)}
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

// ─── Image Upload Drop Zone ─────────────────────────────────────────────────────

function ImageDropZone({ file, onFile, onClear, disabled }) {
  const inputRef  = useRef(null);
  const [drag, setDrag] = useState(false);

  const accept = (f) => {
    if (!f) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(f.type)) return;
    if (f.size > 5 * 1024 * 1024) return; // 5 MB guard
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
      onDragOver={(e) => { e.preventDefault(); setDrag(true);  }}
      onDragLeave={() => setDrag(false)}
      onDrop={onDrop}
      onClick={() => !file && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed
        transition-all duration-200 overflow-hidden select-none
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${drag    ? 'border-blue-400 bg-blue-50 scale-[1.01]' : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'}
        ${file    ? 'h-52' : 'h-44'}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => accept(e.target.files[0])}
      />

      {file ? (
        <>
          <img src={preview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center gap-2 opacity-0 hover:opacity-100 transition-opacity duration-200">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear(); }}
              className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <X size={12} /> حذف الصورة
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-gray-800 text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              <Upload size={12} /> استبدال
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
            <p className="text-sm font-semibold text-gray-600">
              {drag ? 'أفلت الصورة هنا' : 'اسحب صورة أو انقر للرفع'}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG · PNG · WebP · GIF — بحد أقصى 5 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Add-Product form ──────────────────────────────────────────────────────────

const EMPTY_PRODUCT = {
  name_ar: '', description_ar: '', price: '', category_id: '', city_id: '',
  is_perishable: false, delivery_type: 'nationwide', stock: '',
};

// Upload phase labels shown in the submit button
const PHASE_LABELS = {
  idle:       null,
  uploading:  'جاري رفع الصورة…',
  saving:     'جاري حفظ المنتج…',
};

function AddProductForm({ profile, cities, categories, showToast }) {
  const [form,      setForm]      = useState(EMPTY_PRODUCT);
  const [imageFile, setImageFile] = useState(null);
  const [phase,     setPhase]     = useState('idle'); // 'idle' | 'uploading' | 'saving'
  const [fieldErrs, setFieldErrs] = useState({});

  const submitting = phase !== 'idle';
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.name_ar.trim())   errs.name_ar     = 'اسم المنتج مطلوب';
    if (!form.price)            errs.price        = 'السعر مطلوب';
    else if (isNaN(parseFloat(form.price)) || parseFloat(form.price) < 0)
                                errs.price        = 'يرجى إدخال سعر صحيح';
    if (!form.stock)            errs.stock        = 'الكمية مطلوبة';
    if (!form.category_id)      errs.category_id  = 'يرجى اختيار الفئة';
    if (!form.city_id)          errs.city_id      = 'يرجى اختيار المدينة';
    return errs;
  };

  // ── Submit: upload → insert ─────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrs(errs); return; }
    setFieldErrs({});

    let image_url = null;

    try {
      // Step 1: Upload image (if provided)
      if (imageFile) {
        setPhase('uploading');
        const ext      = imageFile.name.split('.').pop();
        const filePath = `${profile.user_id}/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, imageFile, { upsert: false, contentType: imageFile.type });

        if (uploadError) {
          showToast(`خطأ في رفع الصورة: ${uploadError.message}`, 'error');
          return; // finally block will reset phase
        }

        // Step 2: Get the public CDN URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        image_url = urlData.publicUrl;
      }

      // Step 3: Insert product row
      setPhase('saving');
      const { error: insertError } = await supabase.from('products').insert({
        producer_id:    profile.id,
        category_id:    parseInt(form.category_id),
        city_id:        parseInt(form.city_id),
        name_ar:        form.name_ar.trim(),
        description_ar: form.description_ar.trim() || null,
        price:          parseFloat(form.price),
        is_perishable:  form.is_perishable,
        delivery_type:  form.delivery_type,
        stock:          parseInt(form.stock),
        image_url,
        is_active:      true,
      });

      if (insertError) {
        console.error('SUPABASE INSERT ERROR:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          fullError: insertError
        });
        showToast(`خطأ في حفظ المنتج: ${insertError.message}`, 'error');
      } else {
        showToast('تم نشر المنتج بنجاح ✓', 'success');
        setForm(EMPTY_PRODUCT);
        setImageFile(null);
      }
    } catch (unexpectedErr) {
      // Catch-all for network failures, JS errors, etc.
      showToast(`خطأ غير متوقع: ${unexpectedErr.message}`, 'error');
    } finally {
      // ALWAYS reset phase — prevents button from hanging in loading state
      setPhase('idle');
    }
  };

  const inputErr = (key) =>
    `${inputCls} ${fieldErrs[key] ? 'ring-2 ring-red-300 border-red-300 focus:ring-red-400' : ''}`;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-800">إضافة منتج جديد</h1>
        <p className="text-sm text-gray-500 mt-1">
          سيُضاف المنتج إلى متجر <span className="font-bold text-blue-700">{profile.business_name_ar}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col gap-7">

        {/* ── Product Image ── */}
        <section>
          <SectionTitle icon={ImagePlus} label="صورة المنتج" />
          <div className="mt-4">
            <ImageDropZone
              file={imageFile}
              onFile={setImageFile}
              onClear={() => setImageFile(null)}
              disabled={submitting}
            />
            <p className="text-xs text-gray-400 mt-2 text-center">الصورة اختيارية — يمكنك إضافتها لاحقاً</p>
          </div>
        </section>

        <Divider />

        {/* ── Product Info ── */}
        <section>
          <SectionTitle icon={ShoppingBag} label="معلومات المنتج" />
          <div className="flex flex-col gap-4 mt-4">

            <Field label="اسم المنتج" required>
              <input
                type="text"
                placeholder="مثال: مجبوس دجاج بالزعفران"
                value={form.name_ar}
                onChange={(e) => set('name_ar', e.target.value)}
                className={inputErr('name_ar')}
                disabled={submitting}
              />
              {fieldErrs.name_ar && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrs.name_ar}</p>}
            </Field>

            <Field label="وصف المنتج">
              <textarea
                placeholder="صف منتجك باختصار — المكونات، الوزن، مدة الصلاحية، إلخ…"
                value={form.description_ar}
                onChange={(e) => set('description_ar', e.target.value)}
                rows={3}
                className={`${inputCls} resize-none leading-relaxed`}
                disabled={submitting}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="السعر (ريال سعودي)" required>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.price}
                  onChange={(e) => set('price', e.target.value)}
                  className={inputErr('price')}
                  disabled={submitting}
                />
                {fieldErrs.price && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrs.price}</p>}
              </Field>
              <Field label="الكمية المتاحة" required>
                <input
                  type="number" min="0" placeholder="0"
                  value={form.stock}
                  onChange={(e) => set('stock', e.target.value)}
                  className={inputErr('stock')}
                  disabled={submitting}
                />
                {fieldErrs.stock && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrs.stock}</p>}
              </Field>
            </div>
          </div>
        </section>

        <Divider />

        {/* ── Classification ── */}
        <section>
          <SectionTitle icon={Layers} label="التصنيف والموقع" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="الفئة" required>
              <select
                value={form.category_id}
                onChange={(e) => set('category_id', e.target.value)}
                className={inputErr('category_id')}
                disabled={submitting}
              >
                <option value="">— اختر الفئة —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
              {fieldErrs.category_id && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrs.category_id}</p>}
            </Field>
            <Field label="المدينة" required>
              <select
                value={form.city_id}
                onChange={(e) => set('city_id', e.target.value)}
                className={inputErr('city_id')}
                disabled={submitting}
              >
                <option value="">— اختر المدينة —</option>
                {cities.map((c) => <option key={c.id} value={c.id}>{c.name_ar}</option>)}
              </select>
              {fieldErrs.city_id && <p className="text-xs text-red-500 font-medium mt-1">{fieldErrs.city_id}</p>}
            </Field>
          </div>
        </section>

        <Divider />

        {/* ── Shipping ── */}
        <section>
          <SectionTitle icon={Truck} label="الشحن والتوصيل" />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Field label="نوع التوصيل" required>
              <select
                value={form.delivery_type}
                onChange={(e) => set('delivery_type', e.target.value)}
                className={inputCls}
                disabled={submitting}
              >
                <option value="nationwide">🚚 لجميع المناطق</option>
                <option value="local">📍 محلي فقط</option>
              </select>
            </Field>
            <Field label="طبيعة المنتج">
              <label className={`flex items-center gap-3 cursor-pointer rounded-xl border px-4 py-2.5 h-[42px] transition-all duration-200 select-none
                ${form.is_perishable ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300'}
                ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <input
                  type="checkbox"
                  checked={form.is_perishable}
                  onChange={(e) => set('is_perishable', e.target.checked)}
                  className="sr-only"
                  disabled={submitting}
                />
                <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150
                  ${form.is_perishable ? 'bg-amber-500 border-amber-500' : 'border-gray-300 bg-white'}`}>
                  {form.is_perishable && (
                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="text-sm font-medium text-gray-700">طازج / سريع التلف</span>
              </label>
            </Field>
          </div>
        </section>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-900 hover:bg-blue-800 active:scale-[0.97] text-white font-bold py-3.5 rounded-2xl
            transition-all duration-200 flex items-center justify-center gap-2.5 text-sm
            disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-900/15 mt-1"
        >
          {submitting
            ? <><Loader2 size={16} className="animate-spin" /> {PHASE_LABELS[phase]}</>
            : <><PlusCircle size={16} /> نشر المنتج</>
          }
        </button>
      </form>
    </div>
  );
}

// ─── Sidebar nav ───────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',    label: 'الرئيسية',       Icon: LayoutDashboard },
  { id: 'add-product', label: 'إضافة منتج',     Icon: PlusCircle      },
  { id: 'my-products', label: 'منتجاتي',         Icon: Package         },
  { id: 'settings',    label: 'إعدادات المتجر',  Icon: Settings        },
];

// ─── Dashboard ─────────────────────────────────────────────────────────────────

export default function SellerDashboard() {
  const navigate                = useNavigate();
  const { logout, displayName } = useAuth(); // UI display + logout only

  // isChecking blocks ALL rendering until the DB query resolves
  // isAuthorized only becomes true when the DB confirms a producer_profiles row exists
  const [isChecking,   setIsChecking]   = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [dbError,      setDbError]      = useState(null);  // set when DB query hard-fails
  const [profile,      setProfile]      = useState(null);
  const [cities,       setCities]       = useState([]);
  const [categories,   setCategories]   = useState([]);
  const [activeTab,    setActiveTab]    = useState('overview');
  const [toast,        setToast]        = useState(null);


  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Step 1: Read the local session — instant, no network round-trip.
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        if (!cancelled) navigate('/login');
        return;
      }

      // Step 2: DB is the ONLY authorization check — no metadata fallback, no mock data.
      // A row in producer_profiles = this user is a producer. Full stop.
      // RLS policy "producers can read own profile" must be present (USING auth.uid() = user_id).
      const { data: profileData, error: profileError } = await supabase
        .from('producer_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (profileError) {
        // Surface the real DB error — do NOT fabricate data.
        if (!cancelled) setDbError(profileError.message);
        return;
      }

      if (!profileData) {
        // No row = this account is not a producer.
        if (!cancelled) navigate('/');
        return;
      }

      // Step 3: Authorized — fetch lookup tables for the UI.
      const [{ data: citiesData }, { data: catsData }] = await Promise.all([
        supabase.from('cities').select('id, name_ar').order('id'),
        supabase.from('categories').select('id, name_ar').order('id'),
      ]);

      // Step 4: All data ready — unblock the render.
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

  // Loading gate — blocks ALL rendering until the DB query resolves.
  if (isChecking) {
    if (dbError) {
      return (
        <div className="flex h-screen items-center justify-center flex-col gap-4 text-center px-6">
          <AlertCircle size={40} className="text-red-400" />
          <p className="text-lg font-bold text-gray-700">تعذّر تحميل بيانات المتجر</p>
          <p className="text-sm text-gray-400 max-w-sm">{dbError}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-5 py-2.5 bg-blue-900 text-white text-sm font-bold rounded-xl hover:bg-blue-800 transition-colors"
          >
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

  if (!isAuthorized || !profile) return null; // safety net for in-flight redirects

  const profileCity = cities.find((c) => c.id === profile.city_id);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" dir="rtl">
      <Toast toast={toast} />

      {/* Navbar */}
      <header className="bg-blue-950 text-white h-16 px-6 flex items-center justify-between shrink-0 shadow-lg z-30">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="أصارونا" className="w-12 h-8 object-contain" />
          <span className="font-extrabold text-lg hidden sm:block">أصارونا</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden sm:flex items-center gap-1.5 text-sm text-blue-300">
            <User size={14} />{displayName}
          </span>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-blue-300 hover:text-white text-xs font-semibold
              border border-blue-800 hover:border-blue-500 rounded-xl px-3 py-1.5 transition-all"
          >
            <LogOut size={13} />خروج
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
            <h2 className="font-extrabold text-[15px] leading-snug">{profile.business_name_ar}</h2>
            {profileCity && (
              <p className="text-blue-300 text-xs mt-1 flex items-center gap-1">
                <MapPin size={11} />{profileCity.name_ar}
              </p>
            )}
            <div className="mt-4 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30
              rounded-full px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              متجر نشط
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const active = activeTab === id;
              return (
                <button key={id} onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold w-full text-right transition-all duration-150
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
              <ChevronRight size={14} />العودة للموقع
            </Link>
          </div>
        </aside>

        {/* Mobile bottom tab strip */}
        <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20 flex">
          {NAV_ITEMS.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button key={id} onClick={() => setActiveTab(id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold transition-colors
                  ${active ? 'text-blue-700' : 'text-gray-400'}`}
              >
                <Icon size={18} />{label}
              </button>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-5 lg:p-10 pb-20 md:pb-10">
          {activeTab === 'overview'    && <OverviewTab profile={profile} onNavigate={setActiveTab} />}
          {activeTab === 'add-product' && <AddProductForm profile={profile} cities={cities} categories={categories} showToast={showToast} />}
          {activeTab === 'my-products' && <Placeholder icon={Archive}  title="قريباً" desc="ستتمكن من عرض وإدارة جميع منتجاتك من هنا." />}
          {activeTab === 'settings'    && <Placeholder icon={Settings} title="قريباً" desc="ستتمكن من تعديل بيانات متجرك وإعداداته." />}
        </main>
      </div>
    </div>
  );
}
