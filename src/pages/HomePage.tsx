import { useEffect, useState } from 'react';
import { supabase, type Item } from '@/lib/supabase';
import { Link } from '@/router/Router';
import { ItemCard } from '@/components/ItemCard';
import { StampBadge } from '@/components/StampBadge';
import { ArrowRight } from 'lucide-react';

export function HomePage() {
  const [featured, setFeatured] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('items')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setFeatured(data);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-ink text-bone relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-slide-up">
              <p className="font-body text-xs uppercase tracking-widest text-accent mb-4">
                Thrifted · Secondhand · One of One
              </p>
              <h1 className="font-display text-6xl md:text-8xl uppercase leading-[0.9] mb-6">
                One of one.
                <br />
                Never
                <br />
                restocked.
              </h1>
              <p className="font-body text-sm text-bone/60 max-w-md mb-8 leading-relaxed">
                Every piece on deadstock is a single physical unit. When it sells, it's gone
                for good. No restocks, no reproductions, no lies.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/shop" className="btn btn-primary">
                  Shop the drop
                  <ArrowRight size={16} />
                </Link>
                <Link to="/sell" className="btn btn-light">
                  Sell to us
                </Link>
              </div>
            </div>

            <div className="hidden md:flex justify-center items-center">
              <div className="relative">
                <StampBadge text="No Restocks" subtext="Deadstock · Est. 2026" size="lg" variant="accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="border-t-2 border-bone/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-wrap items-center gap-x-8 gap-y-2 justify-center md:justify-between">
            {['Real photos', 'Real condition', 'Real stock', 'No reproductions'].map((t) => (
              <span key={t} className="font-body text-xs uppercase tracking-wider text-bone/40">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Current drop */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="flex items-end justify-between mb-8 md:mb-12">
          <div>
            <p className="font-body text-xs uppercase tracking-widest text-muted mb-2">
              Current drop
            </p>
            <h2 className="font-display text-4xl md:text-5xl uppercase">Fresh stock</h2>
          </div>
          <Link
            to="/shop"
            className="hidden sm:flex items-center gap-2 font-body text-sm uppercase tracking-wider hover:text-accent transition-colors"
          >
            View all
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-bone-200 border-2 border-ink animate-pulse" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-16">
            <p className="font-body text-sm text-muted uppercase">Drop is empty. Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {featured.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}

        <div className="mt-8 sm:hidden">
          <Link to="/shop" className="btn btn-dark w-full">
            View all
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* How it works strip */}
      <section className="bg-ink text-bone border-y-2 border-ink">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                num: '01',
                title: 'Browse the drop',
                body: 'Every item is photographed and condition-graded honestly. What you see is what you get.',
              },
              {
                num: '02',
                title: 'Lock it for 10 min',
                body: 'Add to bag and we hold the item for you for 10 minutes. Nobody else can buy it while it is locked.',
              },
              {
                num: '03',
                title: 'Pay and own',
                body: 'Checkout with Razorpay. Once paid, the item is marked sold — permanently. No restocks.',
              },
            ].map((step) => (
              <div key={step.num} className="border-2 border-bone/20 p-6">
                <span className="font-display text-5xl text-accent block mb-4">{step.num}</span>
                <h3 className="font-display text-xl uppercase mb-2">{step.title}</h3>
                <p className="font-body text-sm text-bone/60 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
