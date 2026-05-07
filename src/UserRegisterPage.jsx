import { useState } from 'react';
import logo from './assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Shield,
  Loader2, AlertCircle, Check, ChevronLeft, Globe, ArrowLeft,
} from 'lucide-react';
import { supabase } from './supabase';

// ─── BRAND PANEL ──────────────────────────────────────────────────────────────

function BrandPanel() {
  return (
    <div dir="rtl" className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-gradient-to-bl from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden flex-col p-12 xl:p-16">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-400 rounded-full opacity-[0.15] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-52 h-52 bg-emerald-400 rounded-full opacity-[0.07] blur-2xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-3 w-fit relative z-10">
        <img src={logo} alt="اسرنا" className="w-11 h-11 object-contain" />
        <span className="text-2xl font-extrabold text-white tracking-tight font-brand">اسرنا</span>
      </Link>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          منصة الأسر المنتجة السعودية
        </span>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] mb-5">
          انضم لمجتمع
          <br />
          <span className="text-emerald-400">اسرنا اليوم</span>
        </h1>

        <p className="text-blue-200 text-base leading-relaxed mb-10 max-w-sm">
          أنشئ حسابك وابدأ التسوق من آلاف المنتجات الأصيلة مصنوعة بحب من أسر سعودية.
        </p>

        {/* Feature list */}
        <div className="space-y-4">
          {[
            { emoji: '🛡️', text: 'حماية كاملة لبياناتك وأموالك' },
            { emoji: '🚚', text: 'توصيل سريع لجميع مدن المملكة' },
            { emoji: '⭐', text: 'منتجات مضمونة الجودة' },
            { emoji: '💬', text: 'دعم عملاء على مدار الساعة' },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-blue-100 text-sm">{f.text}</span>
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
            <div className="text-blue-300/80 text-xs mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FIELD COMPONENT ──────────────────────────────────────────────────────────

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
    </div>
  );
}

// ─── USER REGISTER PAGE ───────────────────────────────────────────────────────

export default function UserRegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
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
    if (!form.fullName.trim())       errs.fullName = 'يرجى إدخال الاسم الكامل';
    if (!form.email.trim())          errs.email = 'يرجى إدخال البريد الإلكتروني';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'صيغة البريد غير صحيحة';
    if (form.phone && !/^05\d{8}$/.test(form.phone)) errs.phone = 'رقم الجوال يجب أن يبدأ بـ 05 ويتكون من 10 أرقام';
    if (form.password.length < 8)    errs.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
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
            full_name: form.fullName.trim(),
            phone: form.phone.trim() || null,
            role: 'customer',
          },
        },
      });
      if (authError) throw authError;
      setSuccess(true);
    } catch (err) {
      if (err.message?.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول');
      } else {
        setError('حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة مرة أخرى');
      }
    } finally {
      setIsLoading(false);
    }
  };

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

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-[420px]">

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">
                  {success ? 'تم إنشاء الحساب ✓' : 'إنشاء حساب جديد 🛍️'}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {success
                    ? 'تحقق من بريدك الإلكتروني لتفعيل الحساب'
                    : 'سجّل كمتسوق وابدأ اكتشاف منتجات اسرنا'
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
                    <p className="text-xs font-bold text-emerald-800">تسجيل آمن ومشفر</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">لن نشارك بياناتك مع أي طرف ثالث</p>
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
                  <p className="text-emerald-700 font-bold text-center">تم إنشاء حسابك بنجاح!</p>
                  <p className="text-gray-500 text-sm text-center leading-relaxed">
                    أرسلنا رسالة تأكيد إلى <span className="font-bold text-blue-700">{form.email}</span>
                  </p>
                  <Link
                    to="/login"
                    className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all duration-200 flex items-center gap-2"
                  >
                    <ArrowLeft size={15} />
                    تسجيل الدخول
                  </Link>
                </div>

              ) : (
                <form onSubmit={handleRegister} noValidate className="space-y-4">

                  {/* Full name */}
                  <Field label="الاسم الكامل *" error={fieldErrors.fullName}>
                    <div className="relative">
                      <User size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={set('fullName')}
                        placeholder="محمد أحمد العبدالله"
                        className={`w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
                          ${fieldErrors.fullName ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
                      />
                    </div>
                  </Field>

                  {/* Email */}
                  <Field label="البريد الإلكتروني *" error={fieldErrors.email}>
                    <div className="relative">
                      <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="example@email.com"
                        dir="ltr"
                        className={`w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
                          ${fieldErrors.email ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
                      />
                    </div>
                  </Field>

                  {/* Phone (optional) */}
                  <Field label="رقم الجوال (اختياري)" error={fieldErrors.phone}>
                    <div className="relative">
                      <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                        className={`w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
                          ${fieldErrors.phone ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
                      />
                    </div>
                  </Field>

                  {/* Password */}
                  <Field label="كلمة المرور *" error={fieldErrors.password}>
                    <div className="relative">
                      <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        placeholder="8 أحرف على الأقل"
                        dir="ltr"
                        className={`w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-11 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
                          ${fieldErrors.password ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5"
                      >
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {/* Strength hint */}
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
                  <Field label="تأكيد كلمة المرور *" error={fieldErrors.confirmPassword}>
                    <div className="relative">
                      <Lock size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={set('confirmPassword')}
                        placeholder="أعد كتابة كلمة المرور"
                        dir="ltr"
                        className={`w-full bg-gray-100 rounded-2xl py-3 pr-10 pl-11 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
                          ${fieldErrors.confirmPassword ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
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
                        ? 'bg-blue-800 text-white cursor-wait'
                        : 'bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white'
                      }`}
                  >
                    {isLoading
                      ? <><Loader2 size={16} className="animate-spin" /> جاري إنشاء الحساب...</>
                      : <><ArrowLeft size={16} /> إنشاء الحساب</>
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
                  لديك أسرة منتجة؟{' '}
                  <Link to="/register-family" className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors">
                    سجّل أسرتك
                  </Link>
                </span>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-2">
              بإنشاء حساب، أنت توافق على{' '}
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
