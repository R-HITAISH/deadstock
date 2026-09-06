import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Link, useRouter } from '@/router/Router';
import { supabase, type Order, type OrderItem } from '@/lib/supabase';
import { formatINR, timeAgo } from '@/lib/utils';
import { Loader2, Package, ShoppingBag } from 'lucide-react';

export function AccountPage() {
  const { user, loading: authLoading } = useAuth();
  const { navigate } = useRouter();
  const [orders, setOrders] = useState<(Order & { order_items: (OrderItem & { item: { id: string; name: string; photos: string[] } | null })[] })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase
      .from('orders')
      .select('*, order_items(*, item:item_id(id, name, photos))')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setOrders(data as typeof orders);
        setLoading(false);
      });
  }, [user]);

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="mb-8">
        <p className="font-body text-xs uppercase tracking-widest text-muted mb-2">
          Account
        </p>
        <h1 className="font-display text-5xl uppercase mb-1">{user.email}</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="border-2 border-ink p-4 bg-bone-50">
          <p className="font-body text-xs uppercase text-muted mb-1">Orders</p>
          <p className="font-display text-3xl">{orders.length}</p>
        </div>
        <div className="border-2 border-ink p-4 bg-bone-50">
          <p className="font-body text-xs uppercase text-muted mb-1">Paid</p>
          <p className="font-display text-3xl">
            {orders.filter((o) => o.status === 'paid').length}
          </p>
        </div>
        <div className="border-2 border-ink p-4 bg-bone-50">
          <p className="font-body text-xs uppercase text-muted mb-1">Spent</p>
          <p className="font-display text-3xl">
            {formatINR(orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.total_inr, 0))}
          </p>
        </div>
      </div>

      {/* Order history */}
      <h2 className="font-display text-3xl uppercase mb-4">Order history</h2>

      {loading ? (
        <Loader2 size={24} className="animate-spin text-muted" />
      ) : orders.length === 0 ? (
        <div className="border-2 border-ink p-8 text-center">
          <Package size={40} className="mx-auto mb-3 text-muted" />
          <p className="font-body text-sm text-muted mb-4">No orders yet.</p>
          <Link to="/shop" className="btn btn-dark">
            <ShoppingBag size={16} />
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border-2 border-ink p-4 bg-bone-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted">
                    Order {order.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="font-body text-xs text-muted">{timeAgo(order.created_at)}</p>
                </div>
                <span
                  className={`tag ${
                    order.status === 'paid'
                      ? 'tag-accent'
                      : order.status === 'pending'
                      ? 'tag-dark'
                      : 'tag'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="space-y-2">
                {order.order_items.map((oi) => (
                  <Link
                    key={oi.id}
                    to={`/item/${oi.item_id}`}
                    className="flex items-center gap-3 hover:text-accent transition-colors"
                  >
                    {oi.item?.photos?.[0] && (
                      <div className="w-14 h-14 border-2 border-ink overflow-hidden shrink-0">
                        <img
                          src={oi.item.photos[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-sm font-bold truncate">{oi.item?.name ?? 'Item removed'}</p>
                      <p className="font-body text-xs text-muted">{formatINR(oi.price_inr)}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-ink/20">
                <span className="font-body text-xs uppercase tracking-wider text-muted">Total</span>
                <span className="font-display text-xl">{formatINR(order.total_inr)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
