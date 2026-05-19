import { BrowserRouter as Router, Routes, Route, } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { WishlistProvider } from './contexts/WishlistContext';
import HomePage from './HomePage';

const LoginPage          = lazy(() => import('./LoginPage'));
const UserRegisterPage   = lazy(() => import('./UserRegisterPage'));
const FamilyRegisterPage = lazy(() => import('./FamilyRegisterPage'));
const ProductDetailsPage = lazy(() => import('./ProductDetailsPage'));
const CartPage           = lazy(() => import('./CartPage'));
const ForgotPasswordPage = lazy(() => import('./ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./ResetPasswordPage'));
const SellerDashboard    = lazy(() => import('./SellerDashboard'));
const CheckoutPage       = lazy(() => import('./CheckoutPage'));
const CustomerDashboard  = lazy(() => import('./CustomerDashboard'));

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <CartProvider>
          <WishlistProvider>
            <Router>
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/"                element={<HomePage />}           />
                  <Route path="/product/:id"     element={<ProductDetailsPage />} />
                  <Route path="/cart"            element={<CartPage />}           />
                  <Route path="/login"           element={<LoginPage />}          />
                  <Route path="/register"        element={<UserRegisterPage />}   />
                  <Route path="/register-family" element={<FamilyRegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password"  element={<ResetPasswordPage />}  />
                  <Route path="/dashboard"       element={<SellerDashboard />}    />
                  <Route path="/checkout"        element={<CheckoutPage />}       />
                  <Route path="/account"         element={<CustomerDashboard />}  />
                </Routes>
              </Suspense>
            </Router>
          </WishlistProvider>
        </CartProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
