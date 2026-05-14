import { useState } from 'react';
import logo from './assets/logo.png';
import { Link } from 'react-router-dom';
import {
  User, Users, Mail, Phone, Lock, Eye, EyeOff,
  MapPin, Tag, FileText, Shield, Loader2, AlertCircle,
  Check, ChevronLeft, ChevronRight, ArrowLeft, ArrowRight,
  ChevronDown, Globe, Wand2,
} from 'lucide-react';
import { supabase } from './supabase';
import { useLang } from './contexts/LanguageContext';
import { enhanceDescription } from './lib/aiApi';

// ─── STATIC DATA ──────────────────────────────────────────────────────────────

const CITIES = [
  'الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'ينبع',
];

const CATEGORIES = [
  { value: 'food',   ar: '🍛 أطباق رئيسية ومطبخ', en: '🍛 Main Dishes & Cuisine'    },
  { value: 'sweets', ar: '🍰 حلويات ومخبوزات',      en: '🍰 Sweets & Pastries'        },
  { value: 'frozen', ar: '❄️ مفرزنات',              en: '❄️ Frozen Foods'             },
  { value: 'spices', ar: '🌿 بهارات وأعشاب',        en: '🌿 Spices & Herbs'           },
  { value: 'honey',  ar: '🍯 عسل ومنتجات طبيعية',  en: '🍯 Honey & Natural Products'  },
  { value: 'crafts', ar: '🧶 مشغولات يدوية',         en: '🧶 Handmade Crafts'          },
  { value: 'dates',  ar: '🌴 تمور ومنتجات تمر',     en: '🌴 Dates & Date Products'    },
  { value: 'other',  ar: '📦 منتجات أخرى',           en: '📦 Other Products'           },
];

// ─── BRAND PANEL ──────────────────────────────────────────────────────────────

function BrandPanel({ t, dir, lang }) {
  const BENEFITS = [
    { emoji: '🆓', key: 'freg_benefit1' },
    { emoji: '📦', key: 'freg_benefit2' },
    { emoji: '💰', key: 'freg_benefit3' },
    { emoji: '📊', key: 'freg_benefit4' },
    { emoji: '🤝', key: 'freg_benefit5' },
  ];

  return (
    <div dir={dir} className="hidden lg:flex lg:w-[44%] xl:w-[42%] bg-gradient-to-bl from-blue-950 via-blue-900 to-emerald-900 relative overflow-hidden flex-col p-12 xl:p-16">
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-emerald-500 rounded-full opacity-15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-400 rounded-full opacity-[0.12] blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-52 h-52 bg-emerald-300 rounded-full opacity-[0.08] blur-2xl pointer-events-none" />

      <Link to="/" className="flex items-center gap-3 w-fit relative z-10">
        <img src={logo} alt={t('brand_name')} className="w-11 h-11 object-contain" />
        <span className="text-2xl font-extrabold text-white tracking-tight font-brand">{t('brand_name')}</span>
      </Link>

      <div className="relative z-10 flex-1 flex flex-col justify-center py-10">
        <span className="inline-flex items-center gap-2 bg-emerald-400/20 border border-emerald-300/30 text-emerald-300 rounded-full px-4 py-1.5 text-sm font-semibold mb-7 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {t('freg_panelBadge')}
        </span>

        <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-[1.2] mb-5">
          {t('freg_panelTitle1')}
          <br />
          <span className="text-emerald-400">{t('freg_panelTitle2')}</span>
        </h1>

        <p className="text-emerald-100/80 text-base leading-relaxed mb-10 max-w-sm">
          {t('freg_panelDesc')}
        </p>

        <div className="space-y-4">
          {BENEFITS.map((b) => (
            <div key={b.key} className="flex items-center gap-3">
              <span className="text-lg">{b.emoji}</span>
              <span className="text-emerald-100/90 text-sm">{t(b.key)}</span>
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
            <div className="text-emerald-300/70 text-xs mt-1.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FIELD COMPONENT ──────────────────────────────────────────────────────────

function Field({ label, required, hint, error, children, isRtl }) {
  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
        {required && <span className={`text-red-400 ${isRtl ? 'mr-1' : 'ml-1'}`}>*</span>}
        {hint && <span className={`text-gray-400 font-normal text-xs ${isRtl ? 'mr-1' : 'ml-1'}`}>({hint})</span>}
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
  const { lang, dir, toggle, t } = useLang();

  const isRtl  = dir === 'rtl';
  const iStart = isRtl ? 'right-3.5' : 'left-3.5';
  const iEnd   = isRtl ? 'left-3.5'  : 'right-3.5';
  const pStart = isRtl ? 'pr-10'     : 'pl-10';
  const pEnd   = isRtl ? 'pl-4'      : 'pr-4';
  const pEye   = isRtl ? 'pl-11'     : 'pr-11';

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
  const [enhancing,   setEnhancing]   = useState(false);
  const [error,       setError]       = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success,     setSuccess]     = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleEnhance = async () => {
    if (!form.description.trim() || enhancing) return;
    setEnhancing(true);
    try {
      const enhanced = await enhanceDescription(form.description);
      setForm((f) => ({ ...f, description: enhanced }));
    } catch { /* keep original text */ } finally {
      setEnhancing(false);
    }
  };

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
    if (!form.ownerName.trim())   errs.ownerName       = t('freg_errOwner');
    if (!form.familyName.trim())  errs.familyName      = t('freg_errFamily');
    if (!form.email.trim())       errs.email           = t('freg_errEmail');
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = t('freg_errEmailFmt');
    if (!form.phone.trim())       errs.phone           = t('freg_errPhone');
    else if (!/^5\d{8}$/.test(form.phone)) errs.phone = t('freg_errPhoneFmt');
    if (!form.city)               errs.city            = t('freg_errCity');
    if (!form.category)           errs.category        = t('freg_errCat');
    if (!pwValid(form.password))  errs.password        = t('freg_errPw');
    if (form.password !== form.confirmPassword) errs.confirmPassword = t('freg_errPwMatch');
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
        setError(t('freg_errTaken'));
      } else {
        setError(t('freg_errGeneric'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = (key) =>
    `w-full bg-gray-100 rounded-2xl py-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:bg-white transition-all duration-200
    ${fieldErrors[key] ? 'ring-2 ring-red-300 focus:ring-red-400' : 'focus:ring-blue-400'}`;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div dir={dir} className={`min-h-screen bg-gray-50 font-sans ${isRtl ? 'text-right' : 'text-left'} flex`}>

      <BrandPanel t={t} dir={dir} lang={lang} />

      <div className="flex-1 flex flex-col min-h-screen">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden">
            <img src={logo} alt={t('brand_name')} className="w-9 h-9 object-contain" />
            <span className="text-xl font-extrabold text-blue-900 tracking-tight font-brand">{t('brand_name')}</span>
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={toggle}
              className="text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Globe size={13} />
              {t('nav_langToggle')}
            </button>

            {/* Sign-in link */}
            <Link
              to="/login"
              className="text-xs font-semibold text-gray-500 hover:text-blue-700 bg-white border border-gray-200 rounded-xl px-3 py-2 transition-colors shadow-sm flex items-center gap-1.5"
            >
              {isRtl ? <ChevronLeft size={13} /> : <ChevronRight size={13} />}
              {t('freg_toLogin')}
            </Link>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 flex justify-center px-5 py-6 sm:px-10">
          <div className="w-full max-w-[460px]">

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">

              {/* Header */}
              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1.5">
                  {success ? t('freg_successTitle') : t('freg_title')}
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {success ? t('freg_successSub') : t('freg_subtitle')}
                </p>
              </div>

              {/* Trust badge */}
              {!success && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 mb-6">
                  <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                    <Shield size={17} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-800">{t('freg_trustTitle')}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">{t('freg_trustDesc')}</p>
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
                    <p className="text-emerald-700 font-bold text-lg mb-1">{t('freg_successMsg')}</p>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                      {t('freg_successDesc1')}{' '}
                      <span className="font-bold text-blue-700">{form.email}</span>
                      {t('freg_successDesc2')}
                    </p>
                  </div>
                  <Link
                    to="/"
                    className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 py-3 rounded-2xl text-sm transition-all duration-200 flex items-center gap-2"
                  >
                    {isRtl ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
                    {t('freg_backHome')}
                  </Link>
                </div>

              ) : (
                <form onSubmit={handleRegister} noValidate className="space-y-4">

                  <SectionDivider label={t('freg_secOwner')} />

                  {/* Owner name */}
                  <Field label={t('freg_labelOwner')} required error={fieldErrors.ownerName} isRtl={isRtl}>
                    <div className="relative">
                      <User size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input
                        type="text"
                        value={form.ownerName}
                        onChange={set('ownerName')}
                        placeholder={t('freg_phOwner')}
                        className={`${inputCls('ownerName')} ${pStart} ${pEnd}`}
                      />
                    </div>
                  </Field>

                  {/* Email */}
                  <Field label={t('freg_labelEmail')} required error={fieldErrors.email} isRtl={isRtl}>
                    <div className="relative">
                      <Mail size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input
                        type="email"
                        value={form.email}
                        onChange={set('email')}
                        placeholder="example@email.com"
                        dir="ltr"
                        className={`${inputCls('email')} ${pStart} ${pEnd}`}
                      />
                    </div>
                  </Field>

                  {/* Phone */}
                  <Field label={t('freg_labelPhone')} required error={fieldErrors.phone} isRtl={isRtl}>
                    <div className="relative">
                      <Phone size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={set('phone')}
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                        className={`${inputCls('phone')} ${pStart} ${pEnd}`}
                      />
                    </div>
                  </Field>

                  <SectionDivider label={t('freg_secFamily')} />

                  {/* Family name */}
                  <Field label={t('freg_labelFamily')} required hint={t('freg_familyHint')} error={fieldErrors.familyName} isRtl={isRtl}>
                    <div className="relative">
                      <Users size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input
                        type="text"
                        value={form.familyName}
                        onChange={set('familyName')}
                        placeholder={t('freg_phFamily')}
                        className={`${inputCls('familyName')} ${pStart} ${pEnd}`}
                      />
                    </div>
                  </Field>

                  {/* City */}
                  <Field label={t('freg_labelCity')} required error={fieldErrors.city} isRtl={isRtl}>
                    <div className="relative">
                      <MapPin size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <ChevronDown size={14} className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <select
                        value={form.city}
                        onChange={set('city')}
                        className={`${inputCls('city')} ${pStart} ${isRtl ? 'pl-8' : 'pr-8'} appearance-none cursor-pointer`}
                      >
                        <option value="">{t('freg_cityPh')}</option>
                        {CITIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  {/* Category */}
                  <Field label={t('freg_labelCat')} required error={fieldErrors.category} isRtl={isRtl}>
                    <div className="relative">
                      <Tag size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <ChevronDown size={14} className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <select
                        value={form.category}
                        onChange={set('category')}
                        className={`${inputCls('category')} ${pStart} ${isRtl ? 'pl-8' : 'pr-8'} appearance-none cursor-pointer`}
                      >
                        <option value="">{t('freg_catPh')}</option>
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {lang === 'ar' ? c.ar : c.en}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Field>

                  {/* Description */}
                  <Field label={t('freg_labelDesc')} hint={t('freg_descHint')} isRtl={isRtl}>
                    <div className="relative">
                      <FileText size={16} className={`absolute ${iStart} top-3.5 text-gray-400 pointer-events-none`} />
                      <textarea
                        value={form.description}
                        onChange={set('description')}
                        rows={3}
                        placeholder={t('freg_phDesc')}
                        className={`w-full bg-gray-100 rounded-2xl py-3 ${pStart} ${pEnd} text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition-all duration-200 resize-none`}
                      />
                    </div>
                    {form.description.trim() && (
                      <button
                        type="button"
                        onClick={handleEnhance}
                        disabled={enhancing}
                        className="mt-2 flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-800 transition-colors disabled:opacity-50 disabled:cursor-default"
                      >
                        {enhancing
                          ? <><Loader2 size={13} className="animate-spin" />{t('ai_enhancing')}</>
                          : <><Wand2 size={13} />{t('ai_enhance')}</>
                        }
                      </button>
                    )}
                  </Field>

                  <SectionDivider label={t('freg_secLogin')} />

                  {/* Password */}
                  <Field label={t('freg_labelPw')} required error={fieldErrors.password} isRtl={isRtl}>
                    <div className="relative">
                      <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={set('password')}
                        placeholder={t('freg_phPw')}
                        dir="ltr"
                        className={`${inputCls('password')} ${pStart} ${pEye}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}
                      >
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

                  {/* Confirm password */}
                  <Field label={t('freg_labelConfirm')} required error={fieldErrors.confirmPassword} isRtl={isRtl}>
                    <div className="relative">
                      <Lock size={16} className={`absolute ${iStart} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        value={form.confirmPassword}
                        onChange={set('confirmPassword')}
                        placeholder={t('freg_phConfirm')}
                        dir="ltr"
                        className={`${inputCls('confirmPassword')} ${pStart} ${pEye}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className={`absolute ${iEnd} top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors p-0.5`}
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
                      ? <><Loader2 size={16} className="animate-spin" /> {t('freg_loading')}</>
                      : <>{isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />} {t('freg_submit')}</>
                    }
                  </button>
                </form>
              )}
            </div>

            {/* Navigation below card */}
            {!success && (
              <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm">
                <span className="text-gray-500">
                  {t('freg_hasAccount')}{' '}
                  <Link to="/login" className="text-blue-700 font-bold hover:text-blue-900 transition-colors">
                    {t('freg_toLogin')}
                  </Link>
                </span>
                <span className="hidden sm:block w-px h-4 bg-gray-300" />
                <span className="text-gray-500">
                  {t('freg_isUser')}{' '}
                  <Link to="/register" className="text-blue-600 font-bold hover:text-blue-800 transition-colors">
                    {t('freg_regUser')}
                  </Link>
                </span>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed px-2">
              {t('freg_terms')}{' '}
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
