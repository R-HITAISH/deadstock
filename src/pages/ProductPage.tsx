import { useEffect, useState } from 'react';
import { supabase, type Item } from '@/lib/supabase';
import { Link, useRouter } from '@/router/Router';
import { useCart } from '@/context/CartContext';
import { formatINR, formatTimeRemaining } from '@/lib/utils';
import { StampBadge } from '@/components/StampBadge';
import { ArrowLeft, ShoppingBag, Check, AlertTriangle, Clock } from 'lucide-react';

export function ProductPage({ itemId }: { itemId: string }) {
  const { navigate } = useRouter();
  const { addToCart } = useCart();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    setLoading(true);
    supabase
      .from('items')
      .select('*')
      .eq('id', itemId)
      .maybeSingle()
      .then(({ data }) => {
        setItem(data);
        setLoading(false);
      });
  }, [itemId]);

  // Poll for status changes
  useEffect(() => {
    if (!item) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('items')
        .select('status')
        .eq('id', itemId)
        .maybeSingle();
      if (data && data.status !== item.status) {
        setItem({ ...item, status: data.status });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [item, itemId]);

  const handleAddToCart = async () => {
    if (!item) return;
    setAdding(true);
    setError(null);
    setSuccess(false);
    const result = await addToCart(item.id);
    setAdding(false);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/cart'), 1200);
    } else {
      setError(result.error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="aspect-[3/4] bg-bone-200 border-2 border-ink animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-bone-200 border-2 border-ink animate-pulse w-3/4" />
            <div className="h-6 bg-bone-200 border-2 border-ink animate-pulse w-1/2" />
            <div className="h-32 bg-bone-200 border-2 border-ink animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-display text-5xl uppercase mb-4">Item not found</h1>
        <p className="font-body text-sm text-muted mb-6">
          This piece doesn't exist or was removed.
        </p>
        <Link to="/shop" className="btn btn-dark">
          Back to shop
        </Link>
      </div>
    );
  }

  const sold = item.status === 'sold';
  const locked = item.status === 'locked';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-wider text-muted hover:text-accent mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to shop
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Photos */}
        <div>
          <div className="aspect-[3/4] bg-bone-200 border-2 border-ink shadow-hard overflow-hidden relative">
            <img
              src={item.photos[activePhoto] ?? item.photos[0] ?? ''}
              alt={item.name}
              className={`w-full h-full object-cover ${sold ? 'grayscale opacity-60' : ''}`}
            />
            <div className="absolute top-4 left-4">
              <span className="tag tag-accent">1 of 1</span>
            </div>
            {sold && (
              <div className="absolute inset-0 flex items-center justify-center">
                <StampBadge text="Sold" size="lg" variant="dark" />
              </div>
            )}
          </div>
          {item.photos.length > 1 && (
            <div className="flex gap-2 mt-3">
              {item.photos.map((photo, i) => (
                <button
                  key={i}
                  onClick={() => setActivePhoto(i)}
                  className={`w-20 h-20 border-2 overflow-hidden ${
                    i === activePhoto ? 'border-accent' : 'border-ink'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          {item.brand && (
            <p className="font-body text-xs uppercase tracking-widest text-muted mb-2">
              {item.brand}
            </p>
          )}
          <h1 className="font-display text-4xl md:text-5xl uppercase leading-none mb-4">
            {item.name}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="font-body text-3xl font-bold">{formatINR(item.price_inr)}</span>
            {locked && !sold && (
              <span className="flex items-center gap-1 font-body text-xs uppercase tracking-wider text-accent">
                <Clock size={14} />
                Reserved by another buyer
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="border-2 border-ink p-3">
              <p className="font-body text-xs uppercase text-muted mb-1">Size</p>
              <p className="font-body text-sm font-bold uppercase">{item.size}</p>
            </div>
            <div className="border-2 border-ink p-3">
              <p className="font-body text-xs uppercase text-muted mb-1">Category</p>
              <p className="font-body text-sm font-bold uppercase">{item.category}</p>
            </div>
            <div className="border-2 border-ink p-3">
              <p className="font-body text-xs uppercase text-muted mb-1">Condition</p>
              <p className="font-body text-sm font-bold uppercase">{item.condition}</p>
            </div>
          </div>

          {item.description && (
            <div className="mb-6">
              <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-2">
                Description
              </h3>
              <p className="font-body text-sm leading-relaxed">{item.description}</p>
            </div>
          )}

          {item.measurements && (
            <div className="mb-6">
              <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-2">
                Measurements
              </h3>
              <p className="font-body text-sm leading-relaxed">{item.measurements}</p>
            </div>
          )}

          {/* Add to cart */}
          <div className="mt-8">
            {sold ? (
              <button disabled className="btn btn-dark w-full opacity-60 cursor-not-allowed">
                Sold
              </button>
            ) : success ? (
              <div className="flex items-center justify-center gap-2 p-4 border-2 border-accent bg-accent/10 text-accent font-body text-sm uppercase tracking-wider">
                <Check size={18} />
                Added to bag — redirecting...
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                disabled={adding || locked}
                className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? (
                  'Reserving...'
                ) : locked ? (
                  'Currently reserved'
                ) : (
                  <>
                    <ShoppingBag size={16} />
                    Add to bag
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="mt-3 flex items-start gap-2 p-3 border-2 border-error bg-error/10 text-error font-body text-sm">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {!sold && !locked && (
              <p className="mt-3 font-body text-xs text-muted text-center">
                Adding to bag reserves this item for 10 minutes.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
