import { useState, useRef } from 'react';
import logo from './assets/logo.png';
import { Link, useNavigate } from 'react-router-dom';
import {
  Mail, Phone, Lock, Eye, EyeOff, Shield,
  Loader2, AlertCircle, Globe, Smartphone,
  ArrowLeft, ArrowRight, Check, ChevronLeft,
} from 'lucide-react';
import { supabase } from './supabase';

// ─── TRANSLATIONS ─────────────────────────────────────────────────────────────

const T = {
  ar: {
    dir: 'rtl',
    brandName: 'اسرنا',
    badge: 'منصة الأسر المنتجة السعودية',
    heroTitle1: 'تسوّق بثقة من',
    heroTitle2: 'أسر سعودية أصيلة',
    heroDesc: 'اكتشف منتجات مصنوعة بحب وإتقان من أسر منتجة في جميع أنحاء المملكة.',
    stat1v: '+500',    stat1l: 'أسرة منتجة',
    stat2v: '+8,000',  stat2l: 'منتج متاح',
    stat3v: '+15,000', stat3l: 'عميل سعيد',
    welcome: 'مرحباً بعودتك 👋',
    subtitle: 'سجّل دخولك للوصول إلى حسابك في اسرنا',
    successTitle: 'تم تسجيل الدخول ✓',
    successSubtitle: 'يتم توجيهك إلى صفحتك الشخصية...',
    successMsg: 'تم تسجيل الدخول بنجاح!',
    backHome: 'العودة للرئيسية',
    trustTitle: 'تسجيل دخول آمن ومشفر',
    trustDesc: 'جميع بياناتك محمية بالكامل · موثوق من +500 أسرة منتجة',
    tabEmail: 'بريد / كلمة مرور',
    tabOtp: 'رمز SMS',
    labelEmail: 'البريد الإلكتروني أو رقم الجوال',
    labelPhone: 'رقم الجوال',
    phEmail: 'example@email.com / 05xxxxxxxx',
    phPhone: '5xxxxxxxx',
    labelPassword: 'كلمة المرور',
    forgot: 'نسيت كلمة المرور؟',
    showPw: 'إظهار كلمة المرور',
    hidePw: 'إخفاء كلمة المرور',
    sendOtp: 'إرسال رمز التحقق',
    sending: 'جاري الإرسال...',
    otpLabel: 'رمز التحقق (6 أرقام)',
    otpSent: 'تم الإرسال',
    resend: 'إعادة الإرسال',
    verifying: 'جاري التحقق...',
    loginBtn: 'تسجيل الدخول',
    orVia: 'أو تسجيل الدخول عبر',
    newCustomer: 'مستخدم جديد؟',
    registerLink: 'أنشئ حسابك',
    newSeller: 'لديك أسرة منتجة؟',
    sellerLink: 'سجّل أسرتك',
    terms: 'بتسجيل الدخول، أنت توافق على',
    termsLink: 'شروط الاستخدام',
    and: 'و',
    privacyLink: 'سياسة الخصوصية',
    errEmail: 'يرجى إدخال البريد الإلكتروني أو رقم الجوال',
    errPassword: 'يرجى إدخال كلمة المرور',
    errOtp: 'يرجى إدخال رمز التحقق المكوّن من 6 أرقام',
    errPhone: 'يرجى إدخال رقم الجوال أولاً',
    errPhoneLen: 'رقم الجوال يجب أن يكون 9 أرقام (مثال: 512345678)',
    errCreds: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    errGeneric: 'حدث خطأ، يرجى المحاولة مرة أخرى',
    langBtn: 'English',
  },
  en: {
    dir: 'ltr',
    brandName: 'Usaruna',
    badge: 'Saudi Family Business Platform',
    heroTitle1: 'Shop with confidence from',
    heroTitle2: 'authentic Saudi families',
    heroDesc: 'Discover products made with love by productive families across the Kingdom.',
    stat1v: '+500',    stat1l: 'Families',
    stat2v: '+8,000',  stat2l: 'Products',
    stat3v: '+15,000', stat3l: 'Happy customers',
    welcome: 'Welcome Back 👋',
    subtitle: 'Sign in to your Usaruna account',
    successTitle: 'Signed In ✓',
    successSubtitle: 'Redirecting to your profile...',
    successMsg: 'Successfully signed in!',
    backHome: 'Back to Home',
    trustTitle: 'Secure & Encrypted Login',
    trustDesc: 'Your data is fully protected · Trusted by 500+ families',
    tabEmail: 'Email / Password',
    tabOtp: 'SMS Code',
    labelEmail: 'Email address or phone number',
    labelPhone: 'Phone number',
    phEmail: 'example@email.com or 05xxxxxxxx',
    phPhone: '5xxxxxxxx',
    labelPassword: 'Password',
    forgot: 'Forgot password?',
    showPw: 'Show password',
    hidePw: 'Hide password',
    sendOtp: 'Send verification code',
    sending: 'Sending...',
    otpLabel: 'Verification code (6 digits)',
    otpSent: 'Sent',
    resend: 'Resend',
    verifying: 'Verifying...',
    loginBtn: 'Sign In',
    orVia: 'Or sign in with',
    newCustomer: 'New here?',
    registerLink: 'Create your account',
    newSeller: 'Have a family business?',
    sellerLink: 'Register your family',
    terms: 'By signing in, you agree to our',
    termsLink: 'Terms of Service',
    and: 'and',
    privacyLink: 'Privacy Policy',
    errEmail: 'Please enter your email or phone number',
    errPassword: 'Please enter your password',
    errOtp: 'Please enter the full 6-digit verification code',
    errPhone: 'Please enter your phone number first',
    errPhoneLen: 'Phone number must be 9 digits (e.g. 512345678)',
    errCreds: 'Invalid email or password',
    errGeneric: 'An error occurred, please try again',
    langBtn: 'العربية',
  },
};

// ─── BRAND PANEL ──────────────────────────────────────────────────────────────

function BrandPanel({ t }) {
  return (
    <div dir={t.dir} className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-gradient-to-bl from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden flex-col p-12 xl:p-16">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-400 rounded-full opacity-[0.15] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-52 h-52 bg-emerald-400 rounded-full opacity-[0.07] blur-2xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-3 w-fit relative z-10">
        <img src={logo} alt={t.brandName} className="w-15 h-10 object-contain" />
        <span className="text-3xl font-extrabold text-white tracking-tight font-brand">{t.brandName}</span>
      </Link>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t.badge}
        </span>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] mb-5">
          {t.heroTitle1}
          <br />
          <span className="text-emerald-400">{t.heroTitle2}</span>
        </h1>

        <p className="text-blue-200 text-base leading-relaxed mb-10 max-w-sm">{t.heroDesc}</p>

        <div className="relative w-64 h-64 xl:w-72 xl:h-72">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/30 to-blue-500/30 rounded-full blur-2xl" />
          <div className="absolute inset-0 rounded-full flex items-center justify-center">
            <img src={logo} alt={t.brandName} className="w-50 h-50 xl:w-50 xl:h-50 object-contain drop-shadow-lg" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex gap-8 pt-7 border-t border-white/10">
        {[
          { v: t.stat1v, l: t.stat1l },
          { v: t.stat2v, l: t.stat2l },
          { v: t.stat3v, l: t.stat3l },
        ].map((s) => (
          <div key={s.l}>
            <div className="text-[1.5rem] font-extrabold text-white leading-none">{s.v}</div>
            <div className="text-blue-300/80 text-xs mt-1.5">{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OTP INPUT ROW ────────────────────────────────────────────────────────────

function OtpInput({ otp, onChange, onKeyDown, refs }) {
  return (
    <div className="flex gap-2 justify-between" dir="ltr">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className="w-11 h-12 text-center text-lg font-extrabold bg-gray-100 rounded-xl border-2 border-transparent focus:border-blue-400 focus:bg-white focus:outline-none transition-all duration-200 text-blue-900"
        />
      ))}
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const [lang,         setLang]         = useState('ar');
  const [loginMode,    setLoginMode]    = useState('email');
  const [identifier,   setIdentifier]   = useState('');
  const [password,     setPassword]     = useState('');
  const [otp,          setOtp]          = useState(Array(6).fill(''));
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading,    setIsLoading]    = useState(false);
  const [otpSent,      setOtpSent]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState(false);

  const t       = T[lang];
  const isRtl   = lang === 'ar';
  // Logical icon sides that flip with language direction
  const iStart  = isRtl ? 'right-3.5' : 'left-3.5';
  const iEnd    = isRtl ? 'left-3.5'  : 'right-3.5';
  const psIcon  = isRtl ? 'pr-10'     : 'pl-10';
  const peIcon  = isRtl ? 'pl-4'      : 'pr-4';
  const peEye   = isRtl ? 'pl-11'     : 'pr-11';
  const otpRefs = useRef([]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) { setError(t.errEmail); return; }
    if (loginMode === 'email' && !password) { setError(t.errPassword); return; }
    if (loginMode === 'otp' && otp.join('').length < 6) { setError(t.errOtp); return; }

    setIsLoading(true);
    try {
      let authData = null;
      if (loginMode === 'email') {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: identifier.trim(),
          password,
        });
        if (authError) throw authError;
        authData = data;
      } else {
        const phone = '+966' + identifier.trim().replace(/^0+/, '');
        const { data, error: authError } = await supabase.auth.verifyOtp({
          phone,
          token: otp.join(''),
          type: 'sms',
        });
        if (authError) throw authError;
        authData = data;
      }
      // Query the DB for role — never trust JWT metadata for routing decisions.
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', authData.user.id)
        .single();

      const role = profileData?.role;
      setSuccess(true);
      navigate(role === 'producer' ? '/dashboard' : '/');
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? t.errCreds : t.errGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError('');
    if (!identifier.trim()) { setError(t.errPhone); return; }
    const digits = identifier.trim().replace(/\D/g, '');
    if (digits.length !== 9) { setError(t.errPhoneLen); return; }
    setIsLoading(true);
    try {
      const phone = '+966' + digits;
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) throw error;
      setOtpSent(true);
    } catch (err) {
      setError(err.message || t.errGeneric);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setError('');
    setOtpSent(false);
    setOtp(Array(6).fill(''));
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div dir={t.dir} className="min-h-screen bg-gray-50 font-sans flex">

      <BrandPanel t={t} />

      {/* Form panel */}
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <img src={logo} alt={t.brandName} className="w-9 h-9 object-contain" />
            <span className="text-xl font-extrabold text-blue-900 tracking-tight font-brand">{t.brandName}</span>
          </Link>
          <div className="hidden lg:block" />

          {/* Language toggle — actually switches all text + layout direction */}
          <button
            onClick={() => { setLang((l) => (l === 'ar' ? 'en' : 'ar')); setError(''); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm"
          >
            <Globe size={13} />
            {t.langBtn}
          </button>
        </div>

        {/* Centered form */}
        <div className="flex-1 flex items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-[420px]">

            {/* ── Login card ── */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">
                  {success ? t.successTitle : t.welcome}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {success ? t.successSubtitle : t.subtitle}
                </p>
              </div>

              {/* Trust badge */}
              {!success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mb-6">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={17} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">{t.trustTitle}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5 leading-snug">{t.trustDesc}</p>
                  </div>
                </div>
              )}

              {/* Mode tabs */}
              {!success && (
                <div className="flex bg-gray-100 rounded-2xl p-1 mb-6 gap-1">
                  {[
                    { id: 'email', Icon: Mail,       label: t.tabEmail },
                    { id: 'otp',   Icon: Smartphone, label: t.tabOtp   },
                  ].map(({ id, Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => switchMode(id)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-200
                        ${loginMode === id
                          ? 'bg-white text-blue-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {/* ── Success ── */}
              {success ? (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check size={30} className="text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 font-bold text-center">{t.successMsg}</p>
                  <Link
                    to="/"
                    className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all duration-200 flex items-center gap-2"
                  >
                    {isRtl ? <ChevronLeft size={15} /> : <ArrowRight size={15} />}
                    {t.backHome}
                  </Link>
                </div>

              ) : (
                /* ── Form ── */
                <form onSubmit={handleLogin} noValidate className="space-y-5">

                  {/* Identifier */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {loginMode === 'email' ? t.labelEmail : t.labelPhone}
                    </label>
                    <div className="relative">
                      {loginMode === 'email'
                        ? <Mail  size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                        : <Phone size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      }
                      {loginMode === 'otp' && (
                        <span className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 ${isRtl ? 'border-r pr-2.5' : 'border-l pl-2.5'} border-gray-300`}>
                          +966
                        </span>
                      )}
                      <input
                        type={loginMode === 'email' ? 'text' : 'tel'}
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={loginMode === 'email' ? t.phEmail : t.phPhone}
                        dir={loginMode === 'otp' ? 'ltr' : 'auto'}
                        className={`w-full bg-gray-100 rounded-2xl py-3 ${psIcon} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200
                          ${loginMode === 'otp' ? (isRtl ? 'pl-16' : 'pr-16') : peIcon}`}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  {loginMode === 'email' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-bold text-gray-700">{t.labelPassword}</label>
                        <Link to="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                          {t.forgot}
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          dir="ltr"
                          className={`w-full bg-gray-100 rounded-2xl py-3 ${psIcon} ${peEye} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}
                          aria-label={showPassword ? t.hidePw : t.showPw}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP send */}
                  {loginMode === 'otp' && !otpSent && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={isLoading}
                      className="w-full bg-blue-50 hover:bg-blue-100 disabled:opacity-60 text-blue-900 font-bold py-3 rounded-2xl text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-blue-200"
                    >
                      {isLoading
                        ? <><Loader2 size={15} className="animate-spin" /> {t.sending}</>
                        : <><Smartphone size={15} /> {t.sendOtp}</>
                      }
                    </button>
                  )}

                  {/* OTP boxes */}
                  {loginMode === 'otp' && otpSent && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-gray-700">{t.otpLabel}</label>
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <Check size={11} /> {t.otpSent}
                        </span>
                      </div>
                      <OtpInput otp={otp} onChange={handleOtpChange} onKeyDown={handleOtpKeyDown} refs={otpRefs} />
                      <button
                        type="button"
                        onClick={() => { setOtpSent(false); setOtp(Array(6).fill('')); }}
                        className="text-xs text-blue-600 hover:text-blue-800 font-semibold mt-3 transition-colors"
                      >
                        {t.resend}
                      </button>
                    </div>
                  )}

                  {/* Submit */}
                  {(loginMode === 'email' || otpSent) && (
                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm
                        ${isLoading
                          ? 'bg-blue-800 text-white cursor-wait'
                          : 'bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white'
                        }`}
                    >
                      {isLoading
                        ? <><Loader2 size={16} className="animate-spin" /> {t.verifying}</>
                        : <>{isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />} {t.loginBtn}</>
                      }
                    </button>
                  )}
                </form>
              )}

              {/* Google only */}
              {!success && (
                <>
                  <div className="flex items-center gap-3 my-6">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400 font-medium shrink-0">{t.orVia}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  <button className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 hover:shadow-md hover:scale-[1.01] text-sm font-semibold text-gray-600 transition-all duration-200 shadow-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
                      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"/>
                      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                    </svg>
                    Google
                  </button>
                </>
              )}
            </div>

            {/* Registration navigation — below card, outside */}
            {!success && (
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
                <span className="text-gray-500">
                  {t.newCustomer}{' '}
                  <Link to="/register" className="text-blue-700 font-bold hover:text-blue-900 transition-colors">
                    {t.registerLink}
                  </Link>
                </span>
                <span className="hidden sm:block w-px h-4 bg-gray-300" />
                <span className="text-gray-500">
                  {t.newSeller}{' '}
                  <Link to="/register-family" className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors">
                    {t.sellerLink}
                  </Link>
                </span>
              </div>
            )}

            {/* Terms */}
            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-2">
              {t.terms}{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">{t.termsLink}</a>
              {' '}{t.and}{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">{t.privacyLink}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
