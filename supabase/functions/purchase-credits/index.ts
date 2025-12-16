import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY FIX: Endpoint disabled until payment gateway integration is implemented
  // This prevents users from obtaining free credits without payment verification
  // 
  // To enable this endpoint:
  // 1. Integrate with Stripe or another payment gateway
  // 2. Create payment intent before granting credits
  // 3. Verify payment completion via webhook
  // 4. Only call add_credits RPC after successful payment confirmation
  console.log('Purchase credits endpoint called but disabled - payment integration required');
  
  return new Response(
    JSON.stringify({ 
      error: 'Credit purchase is temporarily unavailable',
      message: 'Payment processing is being configured. Please try again later.'
    }),
    { 
      status: 503, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
});
