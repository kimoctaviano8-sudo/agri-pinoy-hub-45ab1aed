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
const validPaymentMethods = ["gcash", "grab_pay", "maya", "bank_transfer", "card", "qrph"];

// Input validation helper
function validatePaymentInput(body: Record<string, unknown>): { valid: boolean; error?: string } {
  const { amount, paymentMethod, orderId, bankCode } = body;
  
  if (!amount || typeof amount !== 'number' || amount <= 0 || amount > 1000000) {
    return { valid: false, error: "Invalid amount. Must be a positive number up to 1,000,000" };
  }
  
  if (!paymentMethod || typeof paymentMethod !== 'string' || !validPaymentMethods.includes(paymentMethod)) {
    return { valid: false, error: "Invalid payment method" };
  }
  
  if (!orderId || typeof orderId !== 'string' || orderId.length < 10 || orderId.length > 100) {
    return { valid: false, error: "Invalid order ID" };
  }
  
  if (paymentMethod === 'bank_transfer') {
    const normalizedBankCode = String(bankCode || '').toLowerCase();
    if (!validBankCodes.includes(normalizedBankCode)) {
      return { valid: false, error: `Invalid bank code. Supported banks: BDO, Landbank, Metrobank` };
    }
  }
  
  return { valid: true };
}

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

    const body = await req.json();
    
    // Validate input
    const validation = validatePaymentInput(body);
    if (!validation.valid) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { amount, paymentMethod, orderId, description, redirectUrl, bankCode } = body;

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

      const sourceResponse = await fetch(`${paymongoBaseUrl}/sources`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(sourcePayload),
      });

      const sourceData = await sourceResponse.json();

      if (!sourceResponse.ok) {
        const errorDetail = sourceData.errors?.[0]?.detail || "Failed to create payment source";
        // Check if it's an account permission issue for e-wallets
        const isAccountIssue = errorDetail.toLowerCase().includes("not allowed") || 
                               errorDetail.toLowerCase().includes("organization");
        return new Response(JSON.stringify({ 
          error: isAccountIssue 
            ? `${paymentMethod.toUpperCase()} payments are currently unavailable. Please try another payment method or contact support.`
            : errorDetail
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      checkoutUrl = sourceData.data.attributes.redirect.checkout_url;
      paymentId = sourceData.data.id;

    } else if (paymentMethod === "qrph") {
      // Use Checkout Sessions API for QR Ph payments (provides hosted checkout page with QR display)
      console.log("Creating QR Ph checkout session for order:", orderId);
      
      const checkoutSessionPayload = {
        data: {
          attributes: {
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: description || `Order ${orderId}`,
            line_items: [
              {
                currency: "PHP",
                amount: amountInCentavos,
                name: `Order ${orderId}`,
                quantity: 1,
              },
            ],
            payment_method_types: ["qrph"],
            success_url: `${redirectUrl}?status=success&order_id=${orderId}`,
            cancel_url: `${redirectUrl}?status=cancelled&order_id=${orderId}`,
            metadata: {
              order_id: orderId,
              user_id: user.id,
            },
          },
        },
      };

      const checkoutResponse = await fetch(`${paymongoBaseUrl}/checkout_sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(checkoutSessionPayload),
      });

      const checkoutData = await checkoutResponse.json();
      console.log("QR Ph checkout session response:", JSON.stringify(checkoutData));

      if (!checkoutResponse.ok) {
        const errorDetail = checkoutData.errors?.[0]?.detail || "Failed to create QR Ph checkout";
        const isAccountIssue = errorDetail.toLowerCase().includes("not allowed") || 
                               errorDetail.toLowerCase().includes("organization");
        return new Response(JSON.stringify({ 
          error: isAccountIssue 
            ? "QR Ph payments are currently unavailable. Please try another payment method or contact support."
            : errorDetail
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      checkoutUrl = checkoutData.data.attributes.checkout_url;
      paymentId = checkoutData.data.id;
      console.log("QR Ph checkout URL:", checkoutUrl);

    } else if (paymentMethod === "bank_transfer") {
      // Create Payment Intent for Direct Online Banking (DOB) using Brankas
      const normalizedBankCode = String(bankCode).toLowerCase();

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

      const intentResponse = await fetch(`${paymongoBaseUrl}/payment_intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(paymentIntentPayload),
      });

      const intentData = await intentResponse.json();

      if (!intentResponse.ok) {
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

      const methodResponse = await fetch(`${paymongoBaseUrl}/payment_methods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(paymentMethodPayload),
      });

      const methodData = await methodResponse.json();

      if (!methodResponse.ok) {
        const errorDetail = methodData.errors?.[0]?.detail || "Failed to create payment method";
        // Check if it's an account permission issue
        const isAccountIssue = errorDetail.toLowerCase().includes("not allowed for your account");
        return new Response(JSON.stringify({ 
          error: isAccountIssue 
            ? "Bank transfer payments are currently unavailable. Please try another payment method."
            : errorDetail
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

      const attachResponse = await fetch(`${paymongoBaseUrl}/payment_intents/${paymentIntentId}/attach`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(attachPayload),
      });

      const attachData = await attachResponse.json();

      if (!attachResponse.ok) {
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

      const intentResponse = await fetch(`${paymongoBaseUrl}/payment_intents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${authString}`,
        },
        body: JSON.stringify(paymentIntentPayload),
      });

      const intentData = await intentResponse.json();

      if (!intentResponse.ok) {
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
      type: paymentMethod === "bank_transfer" ? "bank_transfer" : paymentMethod === "qrph" ? "qrph" : "source",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
