import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const body: { creditPackage?: 'small' | 'medium' | 'large' | 'xlarge' } = await req.json();
    const creditPackage = body.creditPackage;

    type CreditPackageKey = 'small' | 'medium' | 'large' | 'xlarge';

    // Define credit packages with explicit typing to satisfy TypeScript
    const packages: Record<CreditPackageKey, { credits: number; price: number; name: string }> = {
      small: { credits: 10, price: 5.0, name: '10 Credits' },
      medium: { credits: 25, price: 10.0, name: '25 Credits' },
      large: { credits: 50, price: 18.0, name: '50 Credits' },
      xlarge: { credits: 100, price: 30.0, name: '100 Credits' },
    };

    if (!creditPackage || !(creditPackage in packages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid credit package' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const selectedPackage = packages[creditPackage];

    // For now, simulate a successful purchase
    // In a real implementation, you would integrate with Stripe or another payment processor
    console.log(`Processing credit purchase for user ${user.id}: ${selectedPackage.name}`);

    // Add credits to user's account
    const { error: addCreditsError } = await supabaseClient
      .rpc('add_credits', { 
        user_id_param: user.id, 
        credits_to_add: selectedPackage.credits 
      });

    if (addCreditsError) {
      console.error('Error adding credits:', addCreditsError);
      return new Response(
        JSON.stringify({ error: 'Failed to add credits' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Successfully added ${selectedPackage.credits} credits to your account`,
        creditsAdded: selectedPackage.credits,
        packageName: selectedPackage.name
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Purchase credits error:', error);
    return new Response(
      JSON.stringify({ error: 'Purchase failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});