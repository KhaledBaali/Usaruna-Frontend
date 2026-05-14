import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { supabase } from './supabase';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import UserRegisterPage from './UserRegisterPage';
import FamilyRegisterPage from './FamilyRegisterPage';
import ProductDetailsPage from './ProductDetailsPage';
import CartPage from './CartPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import SellerDashboard from './SellerDashboard';

// Blocks access to producer-only routes at the router level.
// Awaits getSession() directly so the role check never fires before the session is loaded.
function ProducerRoute({ children }) {
  const [status, setStatus] = useState('checking'); // 'checking' | 'ok' | 'no-user' | 'wrong-role'

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        console.log('[ProducerRoute] Redirecting to /login — no session');
        setStatus('no-user');
        return;
      }
      const role = session.user.user_metadata?.role;
      if (role !== 'producer') {
        console.log(`[ProducerRoute] Redirecting to / — role is "${role ?? 'undefined'}"`);
        setStatus('wrong-role');
        return;
      }
      setStatus('ok');
    });
  }, []);

  if (status === 'checking') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }
  if (status === 'no-user')    return <Navigate to="/login" replace />;
  if (status === 'wrong-role') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/"                element={<HomePage />}           />
              <Route path="/product/:id"     element={<ProductDetailsPage />} />
              <Route path="/cart"            element={<CartPage />}           />
              <Route path="/login"           element={<LoginPage />}          />
              <Route path="/register"        element={<UserRegisterPage />}   />
              <Route path="/register-family" element={<FamilyRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard"       element={<ProducerRoute><SellerDashboard /></ProducerRoute>} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
