import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Link, useRouter } from '@/router/Router';
import { formatINR, formatTimeRemaining } from '@/lib/utils';
import { Trash2, ShoppingBag, ArrowRight, AlertTriangle } from 'lucide-react';

export function CartPage() {
  const { cartItems, loading, removeFromCart } = useCart();
  const { navigate } = useRouter();
  const [, setTick] = useState(0);

  // Tick every second for countdown
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const total = cartItems.reduce((sum, ci) => sum + ci.item.price_inr, 0);
  const allExpired = cartItems.every((ci) => new Date(ci.lock.expires_at) < new Date());

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-8 bg-bone-200 border-2 border-ink animate-pulse w-1/3 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-bone-200 border-2 border-ink animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <h1 className="font-display text-5xl md:text-6xl uppercase mb-8">Your bag</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-ink p-8">
          <ShoppingBag size={48} className="mx-auto mb-4 text-muted" />
          <p className="font-display text-3xl uppercase mb-2">Bag is empty</p>
          <p className="font-body text-sm text-muted mb-6">
            Items you add will show up here. Each one is held for 10 minutes.
          </p>
          <Link to="/shop" className="btn btn-dark">
            Shop the drop
          </Link>
        </div>
      ) : (
        <div>
          {allExpired && cartItems.length > 0 && (
            <div className="flex items-start gap-2 p-4 border-2 border-warning bg-warning/10 text-warning font-body text-sm mb-6">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              Some items in your bag have expired. They may be released back to the shop.
              Proceed to checkout quickly or remove expired items.
            </div>
          )}

          <div className="space-y-4 mb-8">
            {cartItems.map((ci) => {
              const expired = new Date(ci.lock.expires_at) < new Date();
              return (
                <div
                  key={ci.lock.id}
                  className={`flex gap-4 border-2 border-ink p-4 bg-bone-50 ${
                    expired ? 'opacity-60' : ''
                  }`}
                >
                  <Link to={`/item/${ci.item.id}`} className="shrink-0">
                    <div className="w-24 h-32 bg-bone-200 border-2 border-ink overflow-hidden">
                      <img
                        src={ci.item.photos[0] ?? ''}
                        alt={ci.item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/item/${ci.item.id}`}>
                      <h3 className="font-body text-sm font-bold leading-tight mb-1 hover:text-accent transition-colors">
                        {ci.item.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-body text-xs text-muted uppercase">{ci.item.size}</span>
                      <span className="font-body text-xs text-muted">·</span>
                      <span className="font-body text-xs text-muted uppercase">{ci.item.condition}</span>
                    </div>
                    <p className="font-body text-lg font-bold mb-2">{formatINR(ci.item.price_inr)}</p>
                    {!expired ? (
                      <p className="font-body text-xs text-accent flex items-center gap-1">
                        Held for {formatTimeRemaining(ci.lock.expires_at)}
                      </p>
                    ) : (
                      <p className="font-body text-xs text-error">Lock expired</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(ci.lock.id)}
                    className="self-start text-muted hover:text-error transition-colors p-1"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="border-2 border-ink bg-ink text-bone p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-body text-sm uppercase tracking-wider text-bone/60">
                Total ({cartItems.length} {cartItems.length === 1 ? 'item' : 'items'})
              </span>
              <span className="font-display text-4xl">{formatINR(total)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              disabled={allExpired}
              className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Proceed to checkout
              <ArrowRight size={16} />
            </button>
            <p className="mt-3 font-body text-xs text-bone/40 text-center">
              Payment secured by Razorpay. Items are marked sold after payment verification.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
