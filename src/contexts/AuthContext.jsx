import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const logout = () => supabase.auth.signOut();

  // Pull display name from metadata (set during signUp)
  const displayName = user?.user_metadata?.full_name
    || user?.user_metadata?.family_name
    || user?.email?.split('@')[0]
    || null;

  return (
    <AuthContext.Provider value={{ user, logout, displayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
