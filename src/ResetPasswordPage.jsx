import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Globe, Check, Loader2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { supabase } from './supabase';
import logo from './assets/logo.png';

const T = {
  ar: {
    dir: 'rtl', langBtn: 'English',
    title:         'تعيين كلمة مرور جديدة',
    subtitle:      'أدخل كلمة المرور الجديدة لحسابك',
    labelPw:       'كلمة المرور الجديدة',
    labelConfirm:  'تأكيد كلمة المرور',
    phPw:          '••••••••',
    submit:        'حفظ كلمة المرور',
    saving:        'جاري الحفظ...',
    successTitle:  'تم التغيير ✓',
    successMsg:    'تم تعيين كلمة المرور الجديدة بنجاح.',
    successSub:    'يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.',
    toLogin:       'الذهاب لتسجيل الدخول',
    errPw:         'كلمة المرور لا تستوفي المتطلبات',
    errMatch:      'كلمتا المرور غير متطابقتان',
    errGeneric:    'حدث خطأ، يرجى المحاولة مرة أخرى',
    errNoSession:  'رابط إعادة التعيين غير صالح أو منتهي الصلاحية.',
    waitingTitle:  'جاري التحقق...',
    goForgot:      'طلب رابط جديد',
    check_length:  '8 أحرف على الأقل',
    check_upper:   'حرف كبير (A-Z)',
    check_number:  'رقم (0-9)',
    check_special: 'رمز خاص (!@#...)',
    check_english: 'أحرف إنجليزية فقط',
  },
  en: {
    dir: 'ltr', langBtn: 'العربية',
    title:         'Set a new password',
    subtitle:      'Enter a new password for your account',
    labelPw:       'New password',
    labelConfirm:  'Confirm password',
    phPw:          '••••••••',
    submit:        'Save password',
    saving:        'Saving...',
    successTitle:  'Password changed ✓',
    successMsg:    'Your new password has been set successfully.',
    successSub:    'You can now sign in with your new password.',
    toLogin:       'Go to sign in',
    errPw:         'Password does not meet requirements',
    errMatch:      'Passwords do not match',
    errGeneric:    'An error occurred, please try again',
    errNoSession:  'Reset link is invalid or has expired.',
    waitingTitle:  'Verifying…',
    goForgot:      'Request a new link',
    check_length:  'At least 8 characters',
    check_upper:   'Uppercase letter (A-Z)',
    check_number:  'Number (0-9)',
    check_special: 'Special character (!@#...)',
    check_english: 'English characters only',
  },
};

const pwChecks = (pw) => ({
  length:  pw.length >= 8,
  upper:   /[A-Z]/.test(pw),
  number:  /[0-9]/.test(pw),
  special: /[^A-Za-z0-9]/.test(pw),
  english: pw.length > 0 && !/[؀-ۿ]/.test(pw),
});
const pwValid = (pw) => Object.values(pwChecks(pw)).every(Boolean);

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [lang,        setLang]        = useState('ar');
  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [success,     setSuccess]     = useState(false);
  const [error,       setError]       = useState('');
  // null = waiting for Supabase, true = recovery session active, false = invalid/expired
  const [sessionReady, setSessionReady] = useState(null);

  const t     = T[lang];
  const isRtl = lang === 'ar';
  const iStart = isRtl ? 'right-3.5' : 'left-3.5';
  const iEnd   = isRtl ? 'left-3.5'  : 'right-3.5';
  const pStart = isRtl ? 'pr-10'     : 'pl-10';

  // Supabase fires PASSWORD_RECOVERY when the user arrives from the reset link
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true);
      }
    });

    // Also check if there's already a valid session (page reload case)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    // Timeout: if no recovery event fires within 4s, the link is invalid/expired
    const timeout = setTimeout(() => {
      setSessionReady((prev) => (prev === null ? false : prev));
    }, 4000);

    return () => { subscription.unsubscribe(); clearTimeout(timeout); };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!pwValid(password))      { setError(t.errPw);    return; }
    if (password !== confirm)    { setError(t.errMatch);  return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      await supabase.auth.signOut();
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch {
      setError(t.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  const checks = pwChecks(password);
  const checkList = [
    { key: 'length',  label: t.check_length  },
    { key: 'upper',   label: t.check_upper   },
    { key: 'number',  label: t.check_number  },
    { key: 'special', label: t.check_special },
    { key: 'english', label: t.check_english },
  ];

  return (
    <div dir={t.dir} className="min-h-screen bg-gray-50 font-sans flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-8">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="Usaruna" className="w-9 h-9 object-contain" />
            <span className="text-xl font-extrabold text-blue-900 font-brand">
              {lang === 'ar' ? 'اسرنا' : 'Usaruna'}
            </span>
          </Link>
          <button
            onClick={() => setLang((l) => l === 'ar' ? 'en' : 'ar')}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm"
          >
            <Globe size={13} /> {t.langBtn}
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">

          {/* ── Waiting for session ── */}
          {sessionReady === null && (
            <div className="flex flex-col items-center py-10 gap-4">
              <Loader2 size={32} className="animate-spin text-blue-400" />
              <p className="text-gray-500 text-sm font-medium">{t.waitingTitle}</p>
            </div>
          )}

          {/* ── Invalid / expired link ── */}
          {sessionReady === false && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center">
                <AlertCircle size={26} className="text-red-500" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">{isRtl ? 'رابط غير صالح' : 'Invalid link'}</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{t.errNoSession}</p>
              <Link
                to="/forgot-password"
                className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all flex items-center gap-2"
              >
                {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                {t.goForgot}
              </Link>
            </div>
          )}

          {/* ── Success ── */}
          {sessionReady === true && success && (
            <div className="flex flex-col items-center py-6 gap-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check size={30} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">{t.successTitle}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{t.successMsg}</p>
              <p className="text-gray-400 text-xs">{t.successSub}</p>
              <Link
                to="/login"
                className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all flex items-center gap-2"
              >
                {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                {t.toLogin}
              </Link>
            </div>
          )}

          {/* ── Form ── */}
          {sessionReady === true && !success && (
            <>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">{t.title}</h2>
              <p className="text-gray-500 text-sm mb-7 leading-relaxed">{t.subtitle}</p>

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* New password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelPw}</label>
                  <div className="relative">
                    <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t.phPw}
                      dir="ltr"
                      className={`w-full bg-gray-100 rounded-2xl py-3 ${pStart} ${isRtl ? 'pl-11' : 'pr-11'} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all`}
                    />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password strength checklist */}
                  {password && (
                    <div className={`mt-2 p-2.5 rounded-xl border ${pwValid(password) ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'} flex flex-col gap-1`}>
                      {checkList.map(({ key, label }) => (
                        <div key={key} className="flex items-center gap-1.5 text-[11px] font-medium">
                          <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${checks[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                            {checks[key] && <Check size={8} className="text-white" strokeWidth={3} />}
                          </span>
                          <span className={checks[key] ? 'text-emerald-700' : 'text-gray-500'}>{label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.labelConfirm}</label>
                  <div className="relative">
                    <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder={t.phPw}
                      dir="ltr"
                      className={`w-full bg-gray-100 rounded-2xl py-3 ${pStart} ${isRtl ? 'pl-11' : 'pr-11'} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 ${confirm && confirm !== password ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'} focus:bg-white transition-all`}
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}>
                      {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {confirm && confirm !== password && (
                    <p className="text-xs text-red-500 font-medium mt-1.5">{t.errMatch}</p>
                  )}
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold bg-blue-900 hover:bg-blue-800 disabled:bg-blue-800 disabled:opacity-70 text-white transition-all flex items-center justify-center gap-2 shadow-sm mt-2"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" />{t.saving}</>
                    : <>{isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}{t.submit}</>
                  }
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
