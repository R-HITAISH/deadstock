import { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter, Link } from '@/router/Router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatINR } from '@/lib/utils';
import { ArrowLeft, Check, AlertTriangle, Loader2 } from 'lucide-react';

type CheckoutStep = 'address' | 'processing' | 'success' | 'failed';

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export function CheckoutPage() {
  const { cartItems, loading: cartLoading, clearCart } = useCart();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [step, setStep] = useState<CheckoutStep>('address');
  const [form, setForm] = useState({
    name: user?.email ?? '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = cartItems.reduce((sum, ci) => sum + ci.item.price_inr, 0);

  const validItems = cartItems.filter((ci) => new Date(ci.lock.expires_at) > new Date());

  useEffect(() => {
    if (!cartLoading && cartItems.length === 0) {
      navigate('/cart');
    }
  }, [cartLoading, cartItems.length, navigate]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep('processing');

    try {
      // 1. Create order in DB
      const orderInsert: Record<string, unknown> = {
        status: 'pending',
        total_inr: total,
        session_id: localStorage.getItem('deadstock_session_id'),
        shipping_name: form.name,
        shipping_address: form.address,
        shipping_city: form.city,
        shipping_state: form.state,
        shipping_pincode: form.pincode,
        shipping_phone: form.phone,
      };
      if (user) orderInsert.user_id = user.id;

      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderErr || !order) {
        throw new Error('Could not create order. Please try again.');
      }

      // 2. Create order_items
      const orderItemsData = validItems.map((ci) => ({
        order_id: order.id,
        item_id: ci.item.id,
        price_inr: ci.item.price_inr,
      }));

      const { error: oiErr } = await supabase.from('order_items').insert(orderItemsData);
      if (oiErr) throw new Error('Could not save order items.');

      // 3. Create Razorpay order via edge function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const createRes = await fetch(`${supabaseUrl}/functions/v1/razorpay-create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({
          order_id: order.id,
          amount: total * 100,
        }),
      });

      if (!createRes.ok) {
        const errBody = await createRes.json().catch(() => ({}));
        throw new Error(errBody.error || 'Could not initiate payment.');
      }

      const razorpayData = await createRes.json();
      const razorpayOrderId = razorpayData.razorpay_order_id;

      // 4. Save razorpay_order_id
      await supabase
        .from('orders')
        .update({ razorpay_order_id: razorpayOrderId })
        .eq('id', order.id);

      setOrderId(order.id);

      // 5. Open Razorpay checkout
      if (!window.Razorpay) {
        throw new Error('Payment gateway not loaded. Check your connection and try again.');
      }

      const rzp = new window.Razorpay({
        key: razorpayData.key_id,
        amount: total * 100,
        currency: 'INR',
        name: 'DEADSTOCK',
        description: 'One-of-one streetwear purchase',
        order_id: razorpayOrderId,
        prefill: {
          name: form.name,
          contact: form.phone,
        },
        handler: async (response: any) => {
          // 6. Verify payment server-side
          try {
            const verifyRes = await fetch(`${supabaseUrl}/functions/v1/razorpay-verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${anonKey}`,
              },
              body: JSON.stringify({
                order_id: order.id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            if (!verifyRes.ok) {
              const errBody = await verifyRes.json().catch(() => ({}));
              throw new Error(errBody.error || 'Payment verification failed.');
            }

            await clearCart();
            setStep('success');
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed.');
            setStep('failed');
          }
        },
        modal: {
          ondismiss: () => {
            setStep('address');
            setError('Payment was cancelled. Your items are still in your bag.');
          },
        },
      });

      rzp.on('payment.failed', () => {
        setStep('failed');
        setError('Payment failed. Please try a different method.');
      });

      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
      setStep('failed');
    }
  };

  if (cartLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Loader2 size={32} className="animate-spin text-muted" />
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 border-2 border-ink bg-accent text-bone mb-6">
          <Check size={40} />
        </div>
        <h1 className="font-display text-5xl uppercase mb-3">Order confirmed</h1>
        <p className="font-body text-sm text-muted mb-2">
          Payment verified. Your items are marked sold — permanently.
        </p>
        {orderId && (
          <p className="font-body text-xs text-muted mb-8">
            Order ref: {orderId.slice(0, 8).toUpperCase()}
          </p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          <Link to="/shop" className="btn btn-dark">
            Keep shopping
          </Link>
          {user && (
            <Link to="/account" className="btn btn-ghost">
              View order history
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <Link
        to="/cart"
        className="inline-flex items-center gap-2 font-body text-sm uppercase tracking-wider text-muted hover:text-accent mb-6 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to bag
      </Link>

      <h1 className="font-display text-5xl uppercase mb-8">Checkout</h1>

      {/* Order summary */}
      <div className="border-2 border-ink p-4 mb-6 bg-bone-50">
        <h3 className="font-body text-xs uppercase tracking-wider text-muted mb-3">
          Order summary
        </h3>
        <div className="space-y-2">
          {validItems.map((ci) => (
            <div key={ci.lock.id} className="flex items-center justify-between text-sm">
              <span className="font-body truncate pr-2">{ci.item.name}</span>
              <span className="font-body font-bold whitespace-nowrap">
                {formatINR(ci.item.price_inr)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-ink/20">
            <span className="font-body text-sm uppercase font-bold">Total</span>
            <span className="font-display text-2xl">{formatINR(total)}</span>
          </div>
        </div>
      </div>

      {/* Address form */}
      <form onSubmit={handleCheckout} className="space-y-4">
        <h3 className="font-body text-xs uppercase tracking-wider text-muted">
          Shipping address
        </h3>
        <div>
          <label className="font-body text-xs uppercase text-muted block mb-1">Full name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="font-body text-xs uppercase text-muted block mb-1">Address</label>
          <textarea
            required
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input-field min-h-[80px]"
            placeholder="House no, street, area"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-xs uppercase text-muted block mb-1">City</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="input-field"
              placeholder="Mumbai"
            />
          </div>
          <div>
            <label className="font-body text-xs uppercase text-muted block mb-1">State</label>
            <input
              type="text"
              required
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="input-field"
              placeholder="Maharashtra"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-xs uppercase text-muted block mb-1">Pincode</label>
            <input
              type="text"
              required
              pattern="[0-9]{6}"
              value={form.pincode}
              onChange={(e) => setForm({ ...form, pincode: e.target.value })}
              className="input-field"
              placeholder="400001"
            />
          </div>
          <div>
            <label className="font-body text-xs uppercase text-muted block mb-1">Phone</label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-field"
              placeholder="9876543210"
            />
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 border-2 border-error bg-error/10 text-error font-body text-sm">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={step === 'processing' || validItems.length === 0}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {step === 'processing' ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>Pay {formatINR(total)} with Razorpay</>
          )}
        </button>

        {validItems.length === 0 && (
          <p className="font-body text-xs text-error text-center">
            All items in your bag have expired. Go back and add items again.
          </p>
        )}
      </form>
    </div>
  );
}
