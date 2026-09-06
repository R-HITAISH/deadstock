import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({ error: 'Missing required payment verification fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    if (!keySecret) {
      return new Response(
        JSON.stringify({ error: 'Razorpay keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify signature using HMAC SHA256
    const expectedSignature = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keySecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    ).then((key) =>
      crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${razorpay_order_id}|${razorpay_payment_id}`))
    ).then((sig) =>
      Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
    );

    if (expectedSignature !== razorpay_signature) {
      // Mark order as failed
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      await supabase.from('orders').update({ status: 'failed' }).eq('id', order_id);

      return new Response(
        JSON.stringify({ error: 'Signature verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Signature verified — mark order as paid
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Update order
    const { error: orderErr } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        razorpay_payment_id: razorpay_payment_id,
        razorpay_signature: razorpay_signature,
        paid_at: new Date().toISOString(),
      })
      .eq('id', order_id);

    if (orderErr) {
      return new Response(
        JSON.stringify({ error: 'Failed to update order status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Get order_items and update item status + cart locks
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('item_id')
      .eq('order_id', order_id);

    if (orderItems && orderItems.length > 0) {
      const itemIds = orderItems.map((oi) => oi.item_id);

      // Mark items as sold
      await supabase.from('items').update({ status: 'sold' }).in('id', itemIds);

      // Convert active cart locks for these items
      await supabase
        .from('cart_locks')
        .update({ status: 'converted' })
        .in('item_id', itemIds)
        .eq('status', 'active');
    }

    return new Response(
      JSON.stringify({ verified: true, order_id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
