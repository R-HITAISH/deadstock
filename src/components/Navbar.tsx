import { Link, useRouter } from '@/router/Router';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ShoppingBag, User, Menu, X, LogOut } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const { itemCount } = useCart();
  const { user, signOut } = useAuth();
  const { navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { label: 'Shop', to: '/shop' },
    { label: 'Sell to us', to: '/sell' },
    { label: 'About', to: '/about' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-ink border-b-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="font-display text-2xl uppercase tracking-tight text-bone leading-none">
              Deadstock
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="font-body text-sm uppercase tracking-wider text-bone/70 hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to={user ? '/account' : '/auth'}
              className="hidden sm:flex items-center gap-1.5 font-body text-sm uppercase tracking-wider text-bone/70 hover:text-accent transition-colors"
            >
              <User size={16} />
              {user ? 'Account' : 'Sign in'}
            </Link>
            {user && (
              <button
                onClick={() => signOut()}
                className="hidden sm:flex items-center gap-1.5 font-body text-sm uppercase tracking-wider text-bone/70 hover:text-accent transition-colors"
              >
                <LogOut size={16} />
              </button>
            )}
            <Link
              to="/cart"
              className="relative flex items-center gap-1.5 font-body text-sm uppercase tracking-wider text-bone hover:text-accent transition-colors"
            >
              <ShoppingBag size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-bone text-xs font-bold w-5 h-5 flex items-center justify-center border border-ink">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              className="md:hidden text-bone"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <nav className="md:hidden bg-ink-800 border-t-2 border-ink animate-fade-in">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className="block font-body text-sm uppercase tracking-wider text-bone/80 hover:text-accent"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={user ? '/account' : '/auth'}
              onClick={() => setMobileOpen(false)}
              className="block font-body text-sm uppercase tracking-wider text-bone/80 hover:text-accent"
            >
              {user ? 'Account' : 'Sign in'}
            </Link>
            {user && (
              <button
                onClick={() => {
                  signOut();
                  setMobileOpen(false);
                  navigate('/');
                }}
                className="block font-body text-sm uppercase tracking-wider text-bone/80 hover:text-accent"
              >
                Sign out
              </button>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
