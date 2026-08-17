import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Contact from './pages/Contact';
import Policies from './pages/Policies';
import { CartProvider } from './context/CartContext';
import { QuickViewProvider } from './context/QuickViewContext';
import { AuthProvider } from './context/AuthContext';
import { CategoryProvider } from './context/CategoryContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AccountLayout from './pages/AccountLayout';
import Dashboard from './pages/Dashboard';
import Addresses from './pages/Addresses';
import AccountDetails from './pages/AccountDetails';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';

export default function App() {
  return (
    <AuthProvider>
      <CategoryProvider>
        <CartProvider>
          <QuickViewProvider>
            <BrowserRouter>
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/project/:id" element={<ProjectDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/signup" element={<Navigate to="/register" replace />} />

                  <Route path="/account" element={<AccountLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="orders" element={<Orders />} />
                    <Route path="addresses" element={<Addresses />} />
                    <Route path="details" element={<AccountDetails />} />
                  </Route>

                  <Route path="/orders/:id" element={<OrderDetail />} />
                  <Route path="*" element={<Home />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </QuickViewProvider>
        </CartProvider>
      </CategoryProvider>
    </AuthProvider>
  );
}