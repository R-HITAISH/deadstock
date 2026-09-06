import { useEffect, useState, useMemo } from 'react';
import { supabase, type Item, CATEGORIES, CONDITIONS, SIZES } from '@/lib/supabase';
import { ItemCard } from '@/components/ItemCard';
import { SlidersHorizontal, X } from 'lucide-react';

export function ShopPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [condition, setCondition] = useState<string | null>(null);
  const [sort, setSort] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    let query = supabase.from('items').select('*').eq('status', 'available');
    if (category) query = query.eq('category', category);
    if (size) query = query.eq('size', size);
    if (condition) query = query.eq('condition', condition);
    if (sort === 'price-low') query = query.order('price_inr', { ascending: true });
    else if (sort === 'price-high') query = query.order('price_inr', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    query.then(({ data }) => {
      if (data) setItems(data);
      setLoading(false);
    });
  }, [category, size, condition, sort]);

  const activeFilterCount = useMemo(
    () => [category, size, condition].filter(Boolean).length,
    [category, size, condition]
  );

  const clearFilters = () => {
    setCategory(null);
    setSize(null);
    setCondition(null);
  };

  const FilterSection = ({
    title,
    options,
    value,
    onChange,
  }: {
    title: string;
    options: readonly string[];
    value: string | null;
    onChange: (v: string | null) => void;
  }) => (
    <div className="mb-6">
      <h4 className="font-body text-xs uppercase tracking-wider text-muted mb-3">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(value === opt ? null : opt)}
            className={`filter-btn ${value === opt ? 'filter-btn-active' : 'filter-btn-inactive'}`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <p className="font-body text-xs uppercase tracking-widest text-muted mb-2">
          All available stock
        </p>
        <h1 className="font-display text-5xl md:text-6xl uppercase">Shop the drop</h1>
      </div>

      {/* Sort bar */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-ink">
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="flex items-center gap-2 font-body text-sm uppercase tracking-wider hover:text-accent transition-colors"
        >
          <SlidersHorizontal size={16} />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-accent text-bone text-xs px-1.5 py-0.5 border border-ink">
              {activeFilterCount}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          <span className="font-body text-xs uppercase tracking-wider text-muted">Sort</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="font-body text-sm border-2 border-ink bg-bone px-3 py-1.5 focus:outline-none focus:border-accent"
          >
            <option value="newest">Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="mb-8 p-6 bg-bone-50 border-2 border-ink shadow-hard animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display text-xl uppercase">Filter</h3>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="font-body text-xs uppercase tracking-wider text-muted hover:text-accent"
                >
                  Clear all
                </button>
              )}
              <button onClick={() => setFiltersOpen(false)} className="text-ink hover:text-accent">
                <X size={20} />
              </button>
            </div>
          </div>
          <FilterSection title="Category" options={CATEGORIES} value={category} onChange={setCategory} />
          <FilterSection title="Size" options={SIZES} value={size} onChange={setSize} />
          <FilterSection title="Condition" options={CONDITIONS} value={condition} onChange={setCondition} />
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-bone-200 border-2 border-ink animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-3xl uppercase mb-2">Nothing matches</p>
          <p className="font-body text-sm text-muted mb-6">
            Try clearing your filters or check back when the next drop lands.
          </p>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="btn btn-dark">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="font-body text-xs uppercase tracking-wider text-muted mb-4">
            {items.length} {items.length === 1 ? 'item' : 'items'} available
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
