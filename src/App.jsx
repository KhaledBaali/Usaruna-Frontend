import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './HomePage';
import LoginPage from './LoginPage';
import UserRegisterPage from './UserRegisterPage';
import FamilyRegisterPage from './FamilyRegisterPage';
import ProductDetailsPage from './ProductDetailsPage';

const Cart = () => (
  <div className="p-10 text-2xl font-bold text-center mt-20" dir="rtl">
    🛒 سلة المشتريات
  </div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                     element={<HomePage />}           />
        <Route path="/product/:id" element={<ProductDetailsPage />}         />
        <Route path="/cart"                 element={<Cart />}                       />
        <Route path="/login"                element={<LoginPage />}                  />
        <Route path="/register"       element={<UserRegisterPage />} />
        <Route path="/register-family" element={<FamilyRegisterPage />} />
      </Routes>
    </Router>
  );
}
