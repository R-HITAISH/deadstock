import { Link } from '@/router/Router';
import { Instagram, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-ink text-bone border-t-2 border-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display text-3xl uppercase mb-3">Deadstock</h3>
            <p className="font-body text-sm text-bone/60 leading-relaxed">
              One of one. Never restocked. Thrifted streetwear, resold with intent.
            </p>
          </div>

          <div>
            <h4 className="font-body text-xs uppercase tracking-wider text-bone/50 mb-4">Navigate</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/shop" className="font-body text-sm text-bone/80 hover:text-accent transition-colors">
                  Shop the drop
                </Link>
              </li>
              <li>
                <Link to="/sell" className="font-body text-sm text-bone/80 hover:text-accent transition-colors">
                  Sell to us
                </Link>
              </li>
              <li>
                <Link to="/about" className="font-body text-sm text-bone/80 hover:text-accent transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/account" className="font-body text-sm text-bone/80 hover:text-accent transition-colors">
                  Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-body text-xs uppercase tracking-wider text-bone/50 mb-4">Contact</h4>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="flex items-center gap-2 font-body text-sm text-bone/80 hover:text-accent transition-colors"
              >
                <Instagram size={18} />
                @deadstock
              </a>
              <a
                href="mailto:hey@deadstock.in"
                className="flex items-center gap-2 font-body text-sm text-bone/80 hover:text-accent transition-colors"
              >
                <Mail size={18} />
                hey@deadstock.in
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-bone/10">
          <p className="font-body text-xs text-bone/40 uppercase tracking-wider">
            © {new Date().getFullYear()} Deadstock. All items one-of-one. No restocks, no exceptions.
          </p>
        </div>
      </div>
    </footer>
  );
}
