import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight, Globe, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from './supabase';
import logo from './assets/logo.png';

const T = {
  ar: {
    dir: 'rtl', langBtn: 'English',
    title:       'استعادة كلمة المرور',
    subtitle:    'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين',
    label:       'البريد الإلكتروني',
    placeholder: 'example@email.com',
    submit:      'إرسال رابط الاستعادة',
    sending:     'جاري الإرسال...',
    successTitle:'تم الإرسال ✓',
    successMsg:  'تحقق من بريدك الإلكتروني — أرسلنا رابط إعادة تعيين كلمة المرور.',
    successSub:  'لم تستلم البريد؟ تحقق من مجلد الرسائل غير المرغوب فيها.',
    backLogin:   'العودة لتسجيل الدخول',
    errEmpty:    'يرجى إدخال البريد الإلكتروني',
    errFmt:      'صيغة البريد الإلكتروني غير صحيحة',
    errGeneric:  'حدث خطأ، يرجى المحاولة مرة أخرى',
  },
  en: {
    dir: 'ltr', langBtn: 'العربية',
    title:       'Reset your password',
    subtitle:    'Enter your email and we\'ll send you a reset link',
    label:       'Email address',
    placeholder: 'example@email.com',
    submit:      'Send reset link',
    sending:     'Sending...',
    successTitle:'Email sent ✓',
    successMsg:  'Check your inbox — we sent a password reset link.',
    successSub:  'Didn\'t receive it? Check your spam folder.',
    backLogin:   'Back to sign in',
    errEmpty:    'Please enter your email address',
    errFmt:      'Invalid email format',
    errGeneric:  'An error occurred, please try again',
  },
};

export default function ForgotPasswordPage() {
  const [lang,    setLang]    = useState('ar');
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error,   setError]   = useState('');

  const t     = T[lang];
  const isRtl = lang === 'ar';
  const iStart = isRtl ? 'right-3.5' : 'left-3.5';
  const pStart = isRtl ? 'pr-10'     : 'pl-10';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim())              { setError(t.errEmpty);   return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError(t.errFmt);   return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSuccess(true);
    } catch {
      setError(t.errGeneric);
    } finally {
      setLoading(false);
    }
  };

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

          {success ? (
            <div className="flex flex-col items-center py-4 gap-4 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <Check size={30} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">{t.successTitle}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{t.successMsg}</p>
              <p className="text-gray-400 text-xs">{t.successSub}</p>
              <Link to="/login" className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all flex items-center gap-2">
                {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                {t.backLogin}
              </Link>
            </div>
          ) : (
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
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">{t.label}</label>
                  <div className="relative">
                    <Mail size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.placeholder}
                      dir="ltr"
                      className={`w-full bg-gray-100 rounded-2xl py-3 ${pStart} pr-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all`}
                    />
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-2xl text-sm font-bold bg-blue-900 hover:bg-blue-800 disabled:bg-blue-800 text-white transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" />{t.sending}</>
                    : <>{isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}{t.submit}</>
                  }
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                  ← {t.backLogin}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
