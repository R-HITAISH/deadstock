import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { RouterProvider, useRouter } from '@/router/Router';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { HomePage } from '@/pages/HomePage';
import { ShopPage } from '@/pages/ShopPage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { CheckoutPage } from '@/pages/CheckoutPage';
import { SellPage } from '@/pages/SellPage';
import { AboutPage } from '@/pages/AboutPage';
import { AuthPage } from '@/pages/AuthPage';
import { AccountPage } from '@/pages/AccountPage';

function Routes() {
  const { path } = useRouter();

  let page;
  if (path === '/') page = <HomePage />;
  else if (path === '/shop') page = <ShopPage />;
  else if (path.startsWith('/item/')) page = <ProductPage itemId={path.split('/item/')[1]} />;
  else if (path === '/cart') page = <CartPage />;
  else if (path === '/checkout') page = <CheckoutPage />;
  else if (path === '/sell') page = <SellPage />;
  else if (path === '/about') page = <AboutPage />;
  else if (path === '/auth') page = <AuthPage />;
  else if (path === '/account') page = <AccountPage />;
  else page = <HomePage />;

  return (
    <div className="min-h-screen flex flex-col bg-bone">
      <Navbar />
      <main className="flex-1">{page}</main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <Routes />
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
