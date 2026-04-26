import { useState } from 'react';
import { supabase } from './supabase';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// صفحات مؤقتة
const Home = () => <div className="p-10 text-2xl font-bold text-center mt-20">🏠 الصفحة الرئيسية - أسرنا</div>;
const Cart = () => <div className="p-10 text-2xl font-bold text-center mt-20">🛒 سلة المشتريات</div>;

// شاشة تسجيل الدخول الحقيقية (مربوطة بقاعدة البيانات)
const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('⏳ جاري التحقق من السحابة...');
    
    // إرسال البيانات إلى Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setMessage('❌ فشل الاتصال أو الحساب غير موجود: ' + error.message);
    } else {
      setMessage('✅ متصل بقاعدة البيانات! أهلاً بك: ' + data.user.email);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-gray-100">
      <h2 className="text-3xl font-extrabold mb-8 text-center text-gray-800">تسجيل الدخول 🔐</h2>
      <form onSubmit={handleLogin} className="flex flex-col gap-5">
        <input 
          type="email" 
          placeholder="البريد الإلكتروني" 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
        <input 
          type="password" 
          placeholder="كلمة المرور" 
          className="border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
        <button type="submit" className="bg-blue-600 text-white font-bold p-3 rounded-lg hover:bg-blue-700 transition">
          دخول
        </button>
      </form>
      {message && <p className="mt-6 text-center font-bold text-lg" dir="ltr">{message}</p>}
    </div>
  );
};

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans text-right" dir="rtl">
        <nav className="bg-white shadow-md p-4 flex justify-center gap-8 text-lg font-semibold fixed w-full top-0">
          <Link to="/" className="hover:text-blue-600 transition">الرئيسية</Link>
          <Link to="/cart" className="hover:text-blue-600 transition">السلة</Link>
          <Link to="/login" className="hover:text-blue-600 transition">تسجيل الدخول</Link>
        </nav>
        <main className="container mx-auto pt-20">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;