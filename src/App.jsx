import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import UserRegisterPage from './UserRegisterPage';
import FamilyRegisterPage from './FamilyRegisterPage';
import ProductDetailsPage from './ProductDetailsPage';
import CartPage from './CartPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import SellerDashboard from './SellerDashboard';

// SellerDashboard owns its own auth guard (DB query on mount).
// No wrapper needed — any unauthenticated or unauthorized visit is handled inside the component.
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/product/:id" element={<ProductDetailsPage />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<UserRegisterPage />} />
              <Route path="/register-family" element={<FamilyRegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/dashboard" element={<SellerDashboard />} />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}