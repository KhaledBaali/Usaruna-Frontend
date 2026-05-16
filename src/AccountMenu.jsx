import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User, ChevronDown, LogOut, LayoutDashboard, ShoppingBag, UserCircle, Heart,
} from 'lucide-react';
import { useAuth } from './contexts/AuthContext';
import { useLang } from './contexts/LanguageContext';
import { supabase } from './supabase';

export default function AccountMenu() {
  const { user, logout, displayName } = useAuth();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const [open,       setOpen]       = useState(false);
  const [isProducer, setIsProducer] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!user) { setIsProducer(false); return; }
    supabase
      .from('producer_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setIsProducer(!!data));
  }, [user]);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  if (!user) {
    return (
      <Link
        to="/login"
        className="p-2.5 rounded-2xl hover:bg-gray-100 transition-colors hidden sm:flex"
        aria-label={t('nav_account')}
      >
        <User size={21} className="text-blue-900" />
      </Link>
    );
  }

  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-2xl hover:bg-gray-100 transition-colors"
      >
        <div className="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center shrink-0">
          <User size={13} className="text-white" />
        </div>
        <span className="text-sm font-bold text-blue-900 max-w-[90px] truncate">{displayName}</span>
        <ChevronDown
          size={13}
          className={`text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={close} />
          <div
            className="absolute top-full mt-2 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 min-w-[190px] z-50 overflow-hidden"
            style={{ [lang === 'ar' ? 'right' : 'left']: 0 }}
          >
            {/* User info header */}
            <div className="px-4 py-2.5 border-b border-gray-100 mb-1">
              <p className="text-xs font-bold text-gray-800 truncate">{displayName}</p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>

            <button
              onClick={() => { close(); navigate('/account'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-start"
            >
              <UserCircle size={15} className="text-gray-400 shrink-0" />
              {lang === 'ar' ? 'حسابي' : 'My Account'}
            </button>

            <button
              onClick={() => { close(); navigate('/account?tab=orders'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-start"
            >
              <ShoppingBag size={15} className="text-gray-400 shrink-0" />
              {lang === 'ar' ? 'طلباتي' : 'My Orders'}
            </button>

            <button
              onClick={() => { close(); navigate('/account?tab=wishlist'); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-start"
            >
              <Heart size={15} className="text-red-400 shrink-0" />
              {lang === 'ar' ? 'المفضلة' : 'Wishlist'}
            </button>

            {isProducer && (
              <button
                onClick={() => { close(); navigate('/dashboard'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-blue-700 hover:bg-blue-50 transition-colors text-start"
              >
                <LayoutDashboard size={15} className="text-blue-500 shrink-0" />
                {lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
              </button>
            )}

            <div className="border-t border-gray-100 mt-1 pt-1">
              <button
                onClick={async () => { close(); await logout(); navigate('/'); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-start"
              >
                <LogOut size={15} className="text-red-400 shrink-0" />
                {lang === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
