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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find all active locks that have expired
    const { data: expiredLocks, error: findErr } = await supabase
      .from('cart_locks')
      .select('id, item_id')
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString());

    if (findErr) {
      return new Response(
        JSON.stringify({ error: findErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!expiredLocks || expiredLocks.length === 0) {
      return new Response(
        JSON.stringify({ released: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lockIds = expiredLocks.map((l) => l.id);
    const itemIds = [...new Set(expiredLocks.map((l) => l.item_id))];

    // Set locks to expired (trigger will set items back to available)
    const { error: updateErr } = await supabase
      .from('cart_locks')
      .update({ status: 'expired' })
      .in('id', lockIds);

    if (updateErr) {
      return new Response(
        JSON.stringify({ error: updateErr.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ released: lockIds.length, item_ids: itemIds }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
