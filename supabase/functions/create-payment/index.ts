import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY")!;
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Map bank codes to PayMongo DOB bank codes (only BDO, Landbank, Metrobank are supported)
const validBankCodes = ["bdo", "landbank", "metrobank"];

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

    const { amount, paymentMethod, orderId, description, redirectUrl, bankCode } = await req.json();

    console.log("Creating payment:", { amount, paymentMethod, orderId, description, bankCode });

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

    } else if (paymentMethod === "bank_transfer") {
      // Create Payment Intent for Direct Online Banking (DOB) using Brankas
      const normalizedBankCode = bankCode?.toLowerCase();
      
      if (!normalizedBankCode || !validBankCodes.includes(normalizedBankCode)) {
        return new Response(JSON.stringify({ 
          error: `Invalid bank code. Supported banks: BDO, Landbank, Metrobank` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      console.log("Creating bank transfer payment intent for bank:", normalizedBankCode);

      // First, create a payment intent with brankas as allowed method
      const paymentIntentPayload = {
        data: {
          attributes: {
            amount: amountInCentavos,
            currency: "PHP",
            payment_method_allowed: ["brankas"],
            description: description || `Order ${orderId}`,
            statement_descriptor: "GEMINIAGRI",
            metadata: {
              order_id: orderId,
              user_id: user.id,
              bank_code: normalizedBankCode,
            },
          },
        },
      };

      console.log("Creating PayMongo payment intent for DOB:", JSON.stringify(paymentIntentPayload, null, 2));

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

      const paymentIntentId = intentData.data.id;
      const clientKey = intentData.data.attributes.client_key;

      // Create a payment method for brankas (DOB)
      const paymentMethodPayload = {
        data: {
          attributes: {
            type: "brankas",
            details: {
              bank_code: normalizedBankCode,
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

      console.log("Creating PayMongo payment method:", JSON.stringify(paymentMethodPayload, null, 2));

      const methodResponse = await fetch(`${paymongoBaseUrl}/payment_methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(paymentMethodPayload),
      });

      const methodData = await methodResponse.json();
      console.log("PayMongo method response:", JSON.stringify(methodData, null, 2));

      if (!methodResponse.ok) {
        console.error("PayMongo payment method error:", methodData);
        return new Response(JSON.stringify({ 
          error: methodData.errors?.[0]?.detail || "Failed to create payment method" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const paymentMethodId = methodData.data.id;

      // Attach payment method to payment intent
      const attachPayload = {
        data: {
          attributes: {
            payment_method: paymentMethodId,
            client_key: clientKey,
            return_url: `${redirectUrl}?status=success&order_id=${orderId}`,
          },
        },
      };

      console.log("Attaching payment method to intent:", JSON.stringify(attachPayload, null, 2));

      const attachResponse = await fetch(`${paymongoBaseUrl}/payment_intents/${paymentIntentId}/attach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(attachPayload),
      });

      const attachData = await attachResponse.json();
      console.log("PayMongo attach response:", JSON.stringify(attachData, null, 2));

      if (!attachResponse.ok) {
        console.error("PayMongo attach error:", attachData);
        return new Response(JSON.stringify({ 
          error: attachData.errors?.[0]?.detail || "Failed to attach payment method" 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get the redirect URL for bank authentication
      const status = attachData.data.attributes.status;
      const nextAction = attachData.data.attributes.next_action;

      if (status === "awaiting_next_action" && nextAction?.type === "redirect") {
        checkoutUrl = nextAction.redirect.url;
        paymentId = paymentIntentId;
      } else if (status === "succeeded") {
        // Payment already succeeded (rare case)
        return new Response(JSON.stringify({
          success: true,
          paymentId: paymentIntentId,
          status: "paid",
          type: "bank_transfer",
        }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        return new Response(JSON.stringify({ 
          error: `Unexpected payment status: ${status}` 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

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
      type: paymentMethod === "bank_transfer" ? "bank_transfer" : "source",
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
