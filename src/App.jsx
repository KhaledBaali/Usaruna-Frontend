import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import UserRegisterPage from './UserRegisterPage';
import FamilyRegisterPage from './FamilyRegisterPage';
import ProductDetailsPage from './ProductDetailsPage';
import CartPage from './CartPage';
import ForgotPasswordPage from './ForgotPasswordPage';
import SellerDashboard from './SellerDashboard';
import CheckoutPage from './CheckoutPage';
import CustomerDashboard from './CustomerDashboard';

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <Routes>
                <Route path="/"                element={<HomePage />}           />
                <Route path="/product/:id"     element={<ProductDetailsPage />} />
                <Route path="/cart"            element={<CartPage />}           />
                <Route path="/login"           element={<LoginPage />}          />
                <Route path="/register"        element={<UserRegisterPage />}   />
                <Route path="/register-family" element={<FamilyRegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/dashboard"       element={<SellerDashboard />}    />
                <Route path="/checkout"        element={<CheckoutPage />}       />
                <Route path="/account"         element={<CustomerDashboard />}  />
              </Routes>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
