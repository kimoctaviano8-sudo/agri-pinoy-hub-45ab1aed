import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, paymentMethod, orderId, description, redirectUrl } = await req.json();

    console.log("Creating payment:", { amount, paymentMethod, orderId, description });

    if (!amount || !paymentMethod || !orderId) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert amount to centavos (PayMongo uses smallest currency unit)
    const amountInCentavos = Math.round(amount * 100);

    // PayMongo API base URL
    const paymongoBaseUrl = "https://api.paymongo.com/v1";
    const authString = btoa(`${paymongoSecretKey}:`);

    let checkoutUrl = "";
    let paymentId = "";

    if (paymentMethod === "gcash" || paymentMethod === "grab_pay" || paymentMethod === "maya") {
      // Create a Source for e-wallet payments
      const sourcePayload = {
        data: {
          attributes: {
            amount: amountInCentavos,
            currency: "PHP",
            type: paymentMethod,
            redirect: {
              success: `${redirectUrl}?status=success&order_id=${orderId}`,
              failed: `${redirectUrl}?status=failed&order_id=${orderId}`,
            },
            billing: {
              name: user.user_metadata?.full_name || user.email,
              email: user.email,
            },
            metadata: {
              order_id: orderId,
              user_id: user.id,
            },
          },
        },
      };

      console.log("Creating PayMongo source:", JSON.stringify(sourcePayload, null, 2));

      const sourceResponse = await fetch(`${paymongoBaseUrl}/sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(sourcePayload),
      });

      const sourceData = await sourceResponse.json();
      console.log("PayMongo source response:", JSON.stringify(sourceData, null, 2));

      if (!sourceResponse.ok) {
        console.error("PayMongo error:", sourceData);
        return new Response(JSON.stringify({ 
          error: sourceData.errors?.[0]?.detail || "Failed to create payment source" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      checkoutUrl = sourceData.data.attributes.redirect.checkout_url;
      paymentId = sourceData.data.id;

    } else if (paymentMethod === "card") {
      // Create a Payment Intent for card payments
      const paymentIntentPayload = {
        data: {
          attributes: {
            amount: amountInCentavos,
            currency: "PHP",
            payment_method_allowed: ["card"],
            description: description || `Order ${orderId}`,
            statement_descriptor: "GEMINIAGRI",
            metadata: {
              order_id: orderId,
              user_id: user.id,
            },
          },
        },
      };

      console.log("Creating PayMongo payment intent:", JSON.stringify(paymentIntentPayload, null, 2));

      const intentResponse = await fetch(`${paymongoBaseUrl}/payment_intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(paymentIntentPayload),
      });

      const intentData = await intentResponse.json();
      console.log("PayMongo intent response:", JSON.stringify(intentData, null, 2));

      if (!intentResponse.ok) {
        console.error("PayMongo error:", intentData);
        return new Response(JSON.stringify({ 
          error: intentData.errors?.[0]?.detail || "Failed to create payment intent" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      paymentId = intentData.data.id;
      // For card payments, we return the client key for frontend processing
      return new Response(JSON.stringify({
        success: true,
        paymentId,
        clientKey: intentData.data.attributes.client_key,
        type: "payment_intent",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      checkoutUrl,
      paymentId,
      type: "source",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Payment creation error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
