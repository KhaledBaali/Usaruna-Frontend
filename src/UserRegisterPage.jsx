import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Lock, Eye, EyeOff, Shield,
  Loader2, AlertCircle, Check, ChevronLeft, ChevronRight,
  Globe, ArrowLeft, ArrowRight,
} from 'lucide-react';
import { supabase } from './supabase';
import logo from './assets/logo.png';
import { useLang } from './contexts/LanguageContext';

// ─── BRAND PANEL ──────────────────────────────────────────────────────────────

function BrandPanel({ t, dir }) {
  return (
    <div dir={dir} className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-gradient-to-bl from-blue-950 via-blue-900 to-blue-800 relative overflow-hidden flex-col p-12 xl:p-16">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500 rounded-full opacity-10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-400 rounded-full opacity-[0.15] blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-52 h-52 bg-emerald-400 rounded-full opacity-[0.07] blur-2xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-3 w-fit relative z-10">
        <img src={logo} alt={t('brand_name')} className="w-11 h-11 object-contain" />
        <span className="text-2xl font-extrabold text-white tracking-tight font-brand">{t('brand_name')}</span>
      </Link>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <span className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t('ureg_panelBadge')}
        </span>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] mb-5">
          {t('ureg_panelTitle1')}
          <br />
          <span className="text-emerald-400">{t('ureg_panelTitle2')}</span>
        </h1>

        <p className="text-blue-200 text-base leading-relaxed mb-10 max-w-sm">{t('ureg_panelDesc')}</p>

        <div className="space-y-4">
          {[
            { emoji: '🛡️', key: 'ureg_feat1' },
            { emoji: '🚚', key: 'ureg_feat2' },
            { emoji: '⭐', key: 'ureg_feat3' },
            { emoji: '💬', key: 'ureg_feat4' },
          ].map((f) => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-xl">{f.emoji}</span>
              <span className="text-blue-100 text-sm">{t(f.key)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 flex gap-8 pt-7 border-t border-white/10">
        {[
          { val: t('hero_stat1_val'), label: t('hero_stat1_label') },
          { val: t('hero_stat2_val'), label: t('hero_stat2_label') },
          { val: t('hero_stat3_val'), label: t('hero_stat3_label') },
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

function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
        {hint && <span className="text-gray-400 font-normal text-xs mx-1">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium mt-1.5">{error}</p>}
    </div>
  );
}

// ─── USER REGISTER PAGE ───────────────────────────────────────────────────────

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const { lang, dir, toggle, t } = useLang();
  const isRtl  = dir === 'rtl';
  const iStart = isRtl ? 'right-3.5' : 'left-3.5';
  const iEnd   = isRtl ? 'left-3.5'  : 'right-3.5';
  const pStart = isRtl ? 'pr-10'     : 'pl-10';
  const pEnd   = isRtl ? 'pl-4'      : 'pr-4';
  const pEye   = isRtl ? 'pl-11'     : 'pr-11';

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading,   setIsLoading]   = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success,     setSuccess]     = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const pwChecks = (pw) => ({
    length:  pw.length >= 8,
    upper:   /[A-Z]/.test(pw),
    number:  /[0-9]/.test(pw),
    special: /[^A-Za-z0-9]/.test(pw),
    english: pw.length > 0 && !/[؀-ۿ]/.test(pw),
  });
  const pwValid = (pw) => Object.values(pwChecks(pw)).every(Boolean);

  const validate = () => {
    const errs = {};
    if (!form.fullName.trim())       errs.fullName = t('ureg_errName');
    if (!form.email.trim())          errs.email = t('ureg_errEmail');
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('ureg_errEmailFmt');
    if (form.phone && !/^05\d{8}$/.test(form.phone.trim())) errs.phone = t('ureg_errPhone');
    if (!pwValid(form.password))     errs.password = t('ureg_errPw');
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('ureg_errPwMatch');
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
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.fullName.trim(), phone: form.phone.trim() || null, role: 'customer' } },
      });

      // Detect duplicate email: either an error (email-confirm OFF) or identities:[] (email-confirm ON)
      const emailTaken =
        authError?.message?.includes('already registered') ||
        (!authError && data?.user && data.user.identities?.length === 0);

      if (emailTaken) {
        // data.user.id is the real existing user's ID (when identities:[]).
        // Query producer_profiles to determine account type — don't trust user_metadata
        // because it contains what we just submitted, not the existing user's data.
        let isProducer = false;
        if (data?.user?.id) {
          const { data: profile } = await supabase
            .from('producer_profiles')
            .select('id')
            .eq('user_id', data.user.id)
            .maybeSingle();
          isProducer = !!profile;
        }
        setError(isProducer ? t('ureg_errTakenProducer') : t('ureg_errTakenCustomer'));
        return;
      }

      if (authError) throw authError;

      // Always sign out immediately — user must verify their email before logging in.
      if (data.session) await supabase.auth.signOut();

      setSuccess(true);
    } catch (err) {
      setError(t('ureg_errGeneric'));
    } finally {
      setIsLoading(false);
    }
  };


  const inputCls = (key) =>
    `w-full bg-gray-100 rounded-2xl py-3 ${pStart} ${pEnd} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${fieldErrors[key] ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`;

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${isRtl ? 'text-right' : 'text-left'} flex`}>

      <BrandPanel t={t} dir={dir} />

      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <img src={logo} alt={t('brand_name')} className="w-9 h-9 object-contain" />
            <span className="text-xl font-extrabold text-blue-900 tracking-tight font-brand">{t('brand_name')}</span>
          </Link>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm"
            >
              <Globe size={13} />
              {t('nav_langToggle')}
            </button>
            <Link
              to="/login"
              className="text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isRtl ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              {t('ureg_toLogin')}
            </Link>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-5 pb-10 sm:px-10">
          <div className="w-full max-w-[420px]">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">

              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">
                  {success ? t('ureg_successTitle') : t('ureg_title')}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {success ? t('ureg_successSub') : t('ureg_subtitle')}
                </p>
              </div>

              {!success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mb-6">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={17} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">{t('ureg_trustTitle')}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">{t('ureg_trustDesc')}</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-2xl p-3.5 mb-5">
                  <AlertCircle size={15} className="text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{error}</p>
                </div>
              )}

              {success ? (
                <div className="flex flex-col items-center py-8 gap-4">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                    <Check size={30} className="text-emerald-600" />
                  </div>
                  <p className="text-emerald-700 font-bold text-center">{t('ureg_successMsg')}</p>
                  <p className="text-gray-500 text-sm text-center leading-relaxed">
                    {t('ureg_emailSent')} <span className="font-bold text-blue-700">{form.email}</span>
                  </p>
                  <Link to="/login" className="mt-2 bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all duration-200 flex items-center gap-2">
                    {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                    {t('ureg_toLogin')}
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleRegister} noValidate className="space-y-4">

                  <Field label={`${t('ureg_labelName')} *`} error={fieldErrors.fullName}>
                    <div className="relative">
                      <User size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input type="text" value={form.fullName} onChange={set('fullName')} placeholder={t('ureg_phName')} className={inputCls('fullName')} />
                    </div>
                  </Field>

                  <Field label={`${t('ureg_labelEmail')} *`} error={fieldErrors.email}>
                    <div className="relative">
                      <Mail size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input type="email" value={form.email} onChange={set('email')} placeholder="example@email.com" dir="ltr" className={inputCls('email')} />
                    </div>
                  </Field>

                  <Field label={t('ureg_labelPhone')} hint={t('ureg_phoneOpt')} error={fieldErrors.phone}>
                    <div className="relative">
                      <Phone size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input type="tel" value={form.phone} onChange={set('phone')} placeholder="05xxxxxxxx" dir="ltr" className={inputCls('phone')} />
                    </div>
                  </Field>

                  <Field label={`${t('ureg_labelPw')} *`} error={fieldErrors.password}>
                    <div className="relative">
                      <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input type={showPw ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder={t('ureg_phPw')} dir="ltr"
                        className={`w-full bg-gray-100 rounded-2xl py-3 ${pStart} ${pEye} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${fieldErrors.password ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {form.password && (() => {
                      const c = pwChecks(form.password);
                      const allOk = Object.values(c).every(Boolean);
                      const checks = [
                        { key: 'length',  label: lang === 'ar' ? '8 أحرف على الأقل' : 'At least 8 characters' },
                        { key: 'upper',   label: lang === 'ar' ? 'حرف كبير (A-Z)'    : 'Uppercase letter (A-Z)' },
                        { key: 'number',  label: lang === 'ar' ? 'رقم (0-9)'          : 'Number (0-9)' },
                        { key: 'special', label: lang === 'ar' ? 'رمز خاص (!@#...)'   : 'Special character (!@#...)' },
                        { key: 'english', label: lang === 'ar' ? 'أحرف إنجليزية فقط'  : 'English characters only' },
                      ];
                      return (
                        <div className={`mt-2 p-2.5 rounded-xl border ${allOk ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-gray-50'} flex flex-col gap-1`}>
                          {checks.map(({ key, label }) => (
                            <div key={key} className="flex items-center gap-1.5 text-[11px] font-medium">
                              <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 ${c[key] ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                {c[key] && <Check size={8} className="text-white" strokeWidth={3} />}
                              </span>
                              <span className={c[key] ? 'text-emerald-700' : 'text-gray-500'}>{label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </Field>

                  <Field label={`${t('ureg_labelConfirm')} *`} error={fieldErrors.confirmPassword}>
                    <div className="relative">
                      <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')} placeholder={t('ureg_phConfirm')} dir="ltr"
                        className={`w-full bg-gray-100 rounded-2xl py-3 ${pStart} ${pEye} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200 ${fieldErrors.confirmPassword ? 'focus:ring-red-400 ring-2 ring-red-300' : 'focus:ring-blue-400'}`}
                      />
                      <button type="button" onClick={() => setShowConfirm((v) => !v)} className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}>
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>

                  <button type="submit" disabled={isLoading}
                    className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm mt-2 ${isLoading ? 'bg-blue-800 text-white cursor-wait' : 'bg-blue-900 hover:bg-blue-800 active:scale-[0.98] text-white'}`}
                  >
                    {isLoading
                      ? <><Loader2 size={16} className="animate-spin" /> {t('ureg_loading')}</>
                      : <>{isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />} {t('ureg_submit')}</>
                    }
                  </button>
                </form>
              )}
            </div>

            {!success && (
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
                <span className="text-gray-500">
                  {t('ureg_hasAccount')}{' '}
                  <Link to="/login" className="text-blue-700 font-bold hover:text-blue-900 transition-colors">{t('ureg_toLogin')}</Link>
                </span>
                <span className="hidden sm:block w-px h-4 bg-gray-300" />
                <span className="text-gray-500">
                  {t('ureg_hasFamily')}{' '}
                  <Link to="/register-family" className="text-emerald-600 font-bold hover:text-emerald-800 transition-colors">{t('ureg_regFamily')}</Link>
                </span>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-2">
              {t('ureg_terms')}{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">{t('footer_usageTerms')}</a>
              {' '}{t('word_and')}{' '}
              <a href="#" className="text-blue-500 hover:text-blue-700 transition-colors">{t('footer_privacy')}</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
