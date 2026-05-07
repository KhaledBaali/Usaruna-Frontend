import { useState } from 'react';
import logo from './assets/logo.png';
import { Link } from 'react-router-dom';
import {
  User, Users, Mail, Phone, Lock, Eye, EyeOff,
  MapPin, Tag, FileText, Shield, Loader2, AlertCircle,
  Check, ChevronLeft, ArrowLeft, ChevronDown,
} from 'lucide-react';
import { supabase } from './supabase';

// ─── STATIC DATA (matches homepage) ───────────────────────────────────────────

const CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة',
  'الدمام', 'القصيم', 'تبوك', 'أبها', 'حائل', 'ينبع',
  'الباحة', 'الأحساء', 'بريدة', 'خميس مشيط',
];

const CATEGORIES = [
  { value: 'food',     label: '🍛 أطباق رئيسية ومطبخ'   },
  { value: 'sweets',   label: '🍰 حلويات ومخبوزات'        },
  { value: 'frozen',   label: '❄️ مفرزنات'                },
  { value: 'spices',   label: '🌿 بهارات وأعشاب'          },
  { value: 'honey',    label: '🍯 عسل ومنتجات طبيعية'     },
  { value: 'crafts',   label: '🧶 مشغولات يدوية'           },
  { value: 'dates',    label: '🌴 تمور ومنتجات تمر'        },
  { value: 'other',    label: '📦 منتجات أخرى'             },
];

// ─── BRAND PANEL ──────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div dir="rtl" className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-gradient-to-bl from-blue-950 via-blue-900 to-emerald-900 relative overflow-hidden flex-col p-12 xl:p-16">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500 rounded-full opacity-15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-400 rounded-full opacity-[0.12] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-52 h-52 bg-emerald-300 rounded-full opacity-[0.08] blur-2xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-3 w-fit relative z-10">
        <img src={logo} alt="اسرنا" className="w-11 h-11 object-contain" />
        <span className="text-2xl font-extrabold text-white tracking-tight font-brand">اسرنا</span>
      </Link>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <span className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          للأسر المنتجة السعودية
        </span>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] mb-5">
          ابدئي رحلة
          <br />
          <span className="text-emerald-400">نجاح أسرتك</span>
        </h1>

        <p className="text-emerald-100/80 text-base leading-relaxed mb-10 max-w-sm">
          سجّلي أسرتك وابدئي البيع لآلاف العملاء في جميع مدن المملكة العربية السعودية.
        </p>

        {/* Benefits */}
        <div className="space-y-4">
          {[
            { emoji: '🆓', text: 'التسجيل مجاني تماماً' },
            { emoji: '📦', text: 'بيع منتجاتك لجميع مدن المملكة' },
            { emoji: '💰', text: 'استلام أرباحك بشكل آمن وسريع' },
            { emoji: '📊', text: 'لوحة تحكم سهلة لإدارة طلباتك' },
            { emoji: '🤝', text: 'دعم كامل من فريق اسرنا' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-lg">{f.emoji}</span>
              <span className="text-emerald-100/90 text-sm">{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex gap-8 pt-7 border-t border-white/10">
        {[
          { val: '+500',    label: 'أسرة منتجة' },
          { val: '+8,000',  label: 'منتج متاح'  },
          { val: '+15,000', label: 'عميل سعيد'  },
        ].map((s) => (
          <div key={s.label}>
            <div className="text-[1.5rem] font-extrabold text-white leading-none">{s.val}</div>
            <div className="text-emerald-300/70 text-xs mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FIELD COMPONENT ──────────────────────────────────────────────────────────

function Field({ label, required, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-400 mr-1">*</span>}
        {hint && <span className="text-gray-400 font-normal text-xs mr-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
    </div>
  );
}

// ─── SECTION DIVIDER ──────────────────────────────────────────────────────────

function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-xs text-gray-400 font-semibold whitespace-nowrap">{label}</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

// ─── FAMILY REGISTER PAGE ─────────────────────────────────────────────────────

export default function FamilyRegisterPage() {
  const [form, setForm] = useState({
    ownerName:       '',
    familyName:      '',
    email:           '',
    phone:           '',
    city:            '',
    category:        '',
    description:     '',
    password:        '',
    confirmPassword: '',
  });
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success,     setSuccess]     = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const errs = {};
    if (!form.ownerName.trim())   errs.ownerName   = 'يرجى إدخال اسم المسؤول';
    if (!form.familyName.trim())  errs.familyName  = 'يرجى إدخال اسم الأسرة';
    if (!form.email.trim())       errs.email       = 'يرجى إدخال البريد الإلكتروني';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'صيغة البريد غير صحيحة';
    if (!form.phone.trim())       errs.phone       = 'رقم الجوال مطلوب';
    else if (!/^05\d{8}$/.test(form.phone)) errs.phone = 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    if (!form.city)               errs.city        = 'يرجى اختيار المدينة';
    if (!form.category)           errs.category    = 'يرجى اختيار التخصص';
    if (form.password.length < 8) errs.password    = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'كلمتا المرور غير متطابقتين';
    return errs;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setIsLoading(true);
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          data: {
            full_name:   form.ownerName.trim(),
            family_name: form.familyName.trim(),
            phone:       form.phone.trim(),
            city:        form.city,
            category:    form.category,
            description: form.description.trim() || null,
            role:        'seller',
          },
        },
      });
      if (authError) throw authError;
      setSuccess(true);
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول');
      } else {
        setError('حدث خطأ أثناء التسجيل، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (key) =>
    `w-full bg-gray-100 rounded-2xl py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
    ${fieldErrors[key] ? 'ring-2 ring-red-300 focus:ring-red-400' : 'focus:ring-blue-400'}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 font-sans text-right flex">

      <BrandPanel />

      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <img src={logo} alt="اسرنا" className="w-9 h-9 object-contain" />
            <span className="text-xl font-extrabold text-blue-900 tracking-tight font-brand">اسرنا</span>
          </Link>
          <div className="hidden lg:block" />
          <Link
            to="/login"
            className="text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm flex items-center gap-1.5"
          >
            <ChevronLeft size={13} />
            تسجيل الدخول
          </Link>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 flex justify-center px-5 py-6 sm:px-10">
          <div className="w-full max-w-[460px]">

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">
                  {success ? 'تم تسجيل أسرتك ✓' : 'سجّل أسرتك المنتجة 🏡'}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {success
                    ? 'سيتواصل فريقنا معك لاعتماد الحساب خلال 24 ساعة'
                    : 'التسجيل مجاني تماماً · لا يستغرق أكثر من دقيقتين'
                  }
                </p>
              </div>

              {/* Trust badge */}
              {!success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mb-6">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={17} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">تسجيل آمن للأسر المنتجة</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">
                      نراجع كل طلب يدوياً لضمان جودة المنصة
                    </p>
                  </div>
                </div>
              )}

              {/* Global error */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* Success */}
              {success ? (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check size={30} className="text-emerald-600" />
                  </div>
                  <div className="text-center">
                    <p className="text-emerald-700 font-bold text-lg mb-1">تم التسجيل بنجاح!</p>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                      أرسلنا بريد تأكيد إلى <span className="font-bold text-blue-700">{form.email}</span>
                      . سيتواصل فريق اسرنا معك خلال 24 ساعة.
                    </p>
                  </div>
                  <Link
                    to="/"
                    className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all duration-200 flex items-center gap-2"
                  >
                    <ArrowLeft size={15} />
                    العودة للرئيسية
                  </Link>
                </div>

              ) : (
                <form onSubmit={handleRegister} noValidate className="space-y-4">

                  <SectionDivider label="معلومات المسؤول" />

                  {/* Owner name */}
                  <Field label="اسم المسؤول" required error={fieldErrors.ownerName}>
                    <div className="relative">
                      <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={set('ownerName')}
                        placeholder="الاسم الكامل"
                        className={`${inputClass('ownerName')} pr-10 pl-4`}
                      />
                    </div>
                  </Field>

                  {/* Email */}
                  <Field label="البريد الإلكتروني" required error={fieldErrors.email}>
                    <div className="relative">
                      <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="example@email.com"
                        dir="ltr"
                        className={`${inputClass('email')} pr-10 pl-4`}
                      />
                    </div>
                  </Field>

                  {/* Phone */}
                  <Field label="رقم الجوال" required error={fieldErrors.phone}>
                    <div className="relative">
                      <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                        className={`${inputClass('phone')} pr-10 pl-4`}
                      />
                    </div>
                  </Field>

                  <SectionDivider label="معلومات الأسرة المنتجة" />

                  {/* Family name */}
                  <Field label="اسم الأسرة" required hint="سيظهر للعملاء" error={fieldErrors.familyName}>
                    <div className="relative">
                      <Users size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.familyName}
                        onChange={set('familyName')}
                        placeholder="مثال: أسرة القحطاني"
                        className={`${inputClass('familyName')} pr-10 pl-4`}
                      />
                    </div>
                  </Field>

                  {/* City */}
                  <Field label="المدينة" required error={fieldErrors.city}>
                    <div className="relative">
                      <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <ChevronDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select
                        value={form.city}
                        onChange={set('city')}
                        className={`${inputClass('city')} pr-10 pl-8 appearance-none cursor-pointer`}
                      >
                        <option value="">اختر المدينة</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  {/* Category */}
                  <Field label="التخصص الرئيسي" required error={fieldErrors.category}>
                    <div className="relative">
                      <Tag size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <ChevronDown size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <select
                        value={form.category}
                        onChange={set('category')}
                        className={`${inputClass('category')} pr-10 pl-8 appearance-none cursor-pointer`}
                      >
                        <option value="">اختر التخصص</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  {/* Description */}
                  <Field label="وصف مختصر عن أسرتك" hint="اختياري">
                    <div className="relative">
                      <FileText size={16} className="absolute right-3.5 top-3.5 text-gray-400 pointer-events-none" />
                      <textarea
                        value={form.description}
                        onChange={set('description')}
                        rows={3}
                        placeholder="أخبرنا عن منتجاتك وما يميزها..."
                        className="w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200 resize-none"
                      />
                    </div>
                  </Field>

                  <SectionDivider label="بيانات الدخول" />

                  {/* Password */}
                  <Field label="كلمة المرور" required error={fieldErrors.password}>
                    <div className="relative">
                      <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        placeholder="8 أحرف على الأقل"
                        dir="ltr"
                        className={`${inputClass('password')} pr-10 pl-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.password && (
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4].map((n) => (
                          <div
                            key={n}
                            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                              form.password.length >= n * 3
                                ? n <= 2 ? 'bg-red-400' : n === 3 ? 'bg-amber-400' : 'bg-emerald-500'
                                : 'bg-gray-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </Field>

                  {/* Confirm password */}
                  <Field label="تأكيد كلمة المرور" required error={fieldErrors.confirmPassword}>
                    <div className="relative">
                      <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={set('confirmPassword')}
                        placeholder="أعد كتابة كلمة المرور"
                        dir="ltr"
                        className={`${inputClass('confirmPassword')} pr-10 pl-11`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-2
                      ${isLoading
                        ? 'bg-emerald-700 text-white cursor-wait'
                        : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white'
                      }`}
                  >
                    {isLoading
                      ? <><Loader2 size={16} className="animate-spin" /> جاري التسجيل...</>
                      : <><ArrowLeft size={16} /> سجّل أسرتي المنتجة</>
                    }
                  </button>
                </form>
              )}
            </div>

            {/* Navigation below card */}
            {!success && (
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
                <span className="text-gray-500">
                  لديك حساب بالفعل؟{' '}
                  <Link to="/login" className="text-blue-700 font-bold hover:text-blue-900 transition-colors">
                    تسجيل الدخول
                  </Link>
                </span>
                <span className="hidden sm:block w-px h-4 bg-gray-300" />
                <span className="text-gray-500">
                  مستخدم عادي؟{' '}
                  <Link to="/register" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                    أنشئ حساب مشتري
                  </Link>
                </span>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-2">
              بالتسجيل، أنت توافق على{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">شروط الاستخدام</a>
              {' '}و{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">سياسة الخصوصية</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
