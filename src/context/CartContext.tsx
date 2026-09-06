import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, type CartLock, type Item, LOCK_DURATION_MS } from '@/lib/supabase';
import { getSessionId } from '@/lib/utils';

type CartItem = {
  lock: CartLock;
  item: Item;
};

type CartContextValue = {
  cartItems: CartItem[];
  loading: boolean;
  itemCount: number;
  addToCart: (itemId: string) => Promise<{ success: boolean; error: string | null }>;
  removeFromCart: (lockId: string) => Promise<void>;
  refreshCart: () => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(async () => {
    const sessionId = getSessionId();
    const { data: locks } = await supabase
      .from('cart_locks')
      .select('*, item:item_id(*)')
      .eq('session_id', sessionId)
      .eq('status', 'active')
      .order('locked_at', { ascending: false });

    if (locks) {
      const items: CartItem[] = locks
        .filter((l) => l.item && l.item.status !== 'sold')
        .map((l) => ({ lock: l, item: l.item as Item }));
      setCartItems(items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshCart();

    const interval = setInterval(() => {
      refreshCart();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshCart]);

  const addToCart = useCallback(
    async (itemId: string): Promise<{ success: boolean; error: string | null }> => {
      const sessionId = getSessionId();
      const expiresAt = new Date(Date.now() + LOCK_DURATION_MS).toISOString();

      const { error } = await supabase.from('cart_locks').insert({
        item_id: itemId,
        session_id: sessionId,
        status: 'active',
        locked_at: new Date().toISOString(),
        expires_at: expiresAt,
      });

      if (error) {
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Someone else just reserved this item',
          };
        }
        return { success: false, error: error.message };
      }

      await refreshCart();
      return { success: true, error: null };
    },
    [refreshCart]
  );

  const removeFromCart = useCallback(
    async (lockId: string) => {
      await supabase.from('cart_locks').update({ status: 'released' }).eq('id', lockId);
      await refreshCart();
    },
    [refreshCart]
  );

  const clearCart = useCallback(async () => {
    const sessionId = getSessionId();
    await supabase
      .from('cart_locks')
      .update({ status: 'released' })
      .eq('session_id', sessionId)
      .eq('status', 'active');
    await refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        loading,
        itemCount: cartItems.length,
        addToCart,
        removeFromCart,
        refreshCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
