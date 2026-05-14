import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true); // true until first session check resolves

  useEffect(() => {
    // Resolve the persisted session once on mount, then flip the loading flag
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoadingAuth(false);
    });

    // Keep user in sync with any subsequent auth events (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.family_name
    || user?.email?.split('@')[0]
    || null;

  return (
    <AuthContext.Provider value={{ user, loadingAuth, logout, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
