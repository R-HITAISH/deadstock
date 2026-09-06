import type { Item } from '@/lib/supabase';
import { formatINR } from '@/lib/utils';
import { Link } from '@/router/Router';

export function ItemCard({ item }: { item: Item }) {
  const sold = item.status === 'sold';
  const locked = item.status === 'locked';

  return (
    <Link to={`/item/${item.id}`} className="block group">
      <div className="card overflow-hidden relative">
        <div className="aspect-[3/4] bg-bone-200 overflow-hidden relative">
          <img
            src={item.photos[0] ?? ''}
            alt={item.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              sold ? 'grayscale opacity-60' : ''
            }`}
            loading="lazy"
          />
          <div className="absolute top-3 left-3">
            <span className="tag tag-accent">1 of 1</span>
          </div>
          {sold && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="stamp px-6 py-2 bg-ink text-bone text-xl rotate-[-12deg]">
                Sold
              </span>
            </div>
          )}
          {locked && !sold && (
            <div className="absolute top-3 right-3">
              <span className="tag tag-dark">Reserved</span>
            </div>
          )}
        </div>
        <div className="p-4 border-t-2 border-ink">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-body text-sm font-bold leading-tight line-clamp-2">{item.name}</h3>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="font-body text-xs text-muted uppercase">{item.size}</span>
            <span className="font-body text-xs text-muted">·</span>
            <span className="font-body text-xs text-muted uppercase">{item.condition}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-body text-lg font-bold">{formatINR(item.price_inr)}</span>
            {item.brand && (
              <span className="font-body text-xs text-muted uppercase">{item.brand}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
