import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY")!;
const paymongoWebhookSecret = Deno.env.get("PAYMONGO_WEBHOOK_SECRET");

// Maximum age of webhook event in seconds (5 minutes)
const WEBHOOK_TIMESTAMP_TOLERANCE = 300;

/**
 * Convert ArrayBuffer to hex string
 */
function arrayBufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Compute HMAC-SHA256 using Web Crypto API
 */
async function computeHmacSha256(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return arrayBufferToHex(signature);
}

/**
 * Timing-safe string comparison
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return mismatch === 0;
}

/**
 * Verify PayMongo webhook signature
 * PayMongo signature format: t=timestamp,te=testmode_signature,li=livemode_signature
 */
async function verifyPaymongoSignature(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string
): Promise<{ valid: boolean; error?: string }> {
  if (!signatureHeader) {
    return { valid: false, error: "Missing signature header" };
  }

  try {
    // Parse the signature header
    const signatureParts: Record<string, string> = {};
    signatureHeader.split(",").forEach((part) => {
      const [key, value] = part.split("=");
      if (key && value) {
        signatureParts[key.trim()] = value.trim();
      }
    });

    const timestamp = signatureParts["t"];
    // Use livemode signature (li) or testmode signature (te)
    const signature = signatureParts["li"] || signatureParts["te"];

    if (!timestamp) {
      return { valid: false, error: "Missing timestamp in signature" };
    }

    if (!signature) {
      return { valid: false, error: "Missing signature value" };
    }

    // Validate timestamp to prevent replay attacks
    const timestampInt = parseInt(timestamp, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTimestamp - timestampInt);

    if (timeDiff > WEBHOOK_TIMESTAMP_TOLERANCE) {
      return { 
        valid: false, 
        error: `Timestamp too old or invalid. Difference: ${timeDiff}s, tolerance: ${WEBHOOK_TIMESTAMP_TOLERANCE}s` 
      };
    }

    // Construct the signed payload (timestamp.payload)
    const signedPayload = `${timestamp}.${payload}`;

    // Compute expected signature using HMAC-SHA256
    const expectedSignature = await computeHmacSha256(webhookSecret, signedPayload);

    // Compare signatures using timing-safe comparison
    if (!timingSafeEqual(signature, expectedSignature)) {
      return { valid: false, error: "Signature verification failed" };
    }

    return { valid: true };
  } catch (error) {
    console.error("[Webhook] Signature verification error:", error);
    return { valid: false, error: `Signature verification exception: ${String(error)}` };
  }
}

// Helper to safely update order status with conflict prevention
async function updateOrderStatus(
  supabase: any,
  orderId: string,
  newStatus: string,
  eventType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Webhook] Updating order ${orderId} to status: ${newStatus} (event: ${eventType})`);
    
    // First, get current order status
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError) {
      console.error(`[Webhook] Error fetching order ${orderId}:`, fetchError.message);
      return { success: false, error: fetchError.message };
    }

    const currentStatus = currentOrder?.status as string;
    console.log(`[Webhook] Current status for order ${orderId}: ${currentStatus}`);

    // Prevent invalid status transitions - don't go backwards from final states
    const finalStatuses = ['to_ship', 'to_receive', 'completed', 'cancelled'];
    if (finalStatuses.includes(currentStatus) && currentStatus !== newStatus) {
      console.log(`[Webhook] Skipping update - order ${orderId} already in final state: ${currentStatus}`);
      return { success: true };
    }

    // Skip if already in target status
    if (currentStatus === newStatus) {
      console.log(`[Webhook] Skipping update - order ${orderId} already has status: ${newStatus}`);
      return { success: true };
    }

    // Update order status
    const { error: updateError } = await supabase
      .from("orders")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (updateError) {
      console.error(`[Webhook] Error updating order ${orderId}:`, updateError.message);
      return { success: false, error: updateError.message };
    }

    console.log(`[Webhook] Successfully updated order ${orderId} to status: ${newStatus}`);
    return { success: true };
  } catch (error) {
    console.error(`[Webhook] Exception updating order ${orderId}:`, String(error));
    return { success: false, error: String(error) };
  }
}

// Helper to add credits for credit purchase payments
async function addCreditsForPurchase(
  supabase: any,
  orderId: string,
  userId: string,
  credits: number,
  eventType: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[Webhook] Adding ${credits} credits for user ${userId} (order: ${orderId}, event: ${eventType})`);
    
    // Use the add_credits RPC function to add credits atomically
    const { error: rpcError } = await supabase.rpc('add_credits', {
      user_id_param: userId,
      credits_to_add: credits
    });

    if (rpcError) {
      console.error(`[Webhook] Error adding credits for user ${userId}:`, rpcError.message);
      return { success: false, error: rpcError.message };
    }

    console.log(`[Webhook] Successfully added ${credits} credits for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Webhook] Exception adding credits for user ${userId}:`, String(error));
    return { success: false, error: String(error) };
  }
}

// Helper to check if this is a credit purchase and process it
async function processCreditPurchaseIfApplicable(
  supabase: any,
  orderId: string,
  userId: string | undefined,
  credits: number | undefined,
  eventType: string
): Promise<boolean> {
  // Credit purchase orders start with "CREDITS-"
  if (!orderId?.startsWith("CREDITS-")) {
    return false;
  }

  console.log(`[Webhook] Detected credit purchase order: ${orderId}`);

  if (!userId) {
    console.error(`[Webhook] No user_id in metadata for credit purchase ${orderId}`);
    return false;
  }

  if (!credits || credits <= 0) {
    console.error(`[Webhook] Invalid credits value in metadata for credit purchase ${orderId}: ${credits}`);
    return false;
  }

  const result = await addCreditsForPurchase(supabase, orderId, userId, credits, eventType);
  return result.success;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Log request for audit trail
  const requestId = crypto.randomUUID();
  console.log(`[Webhook:${requestId}] Received request from ${req.headers.get("x-forwarded-for") || "unknown"}`);

  try {
    // Read raw body for signature verification
    const rawBody = await req.text();
    
    // Get the signature header
    const signatureHeader = req.headers.get("paymongo-signature");

    // Verify webhook signature if secret is configured
    if (paymongoWebhookSecret) {
      console.log(`[Webhook:${requestId}] Verifying webhook signature...`);
      
      const verificationResult = await verifyPaymongoSignature(rawBody, signatureHeader, paymongoWebhookSecret);
      
      if (!verificationResult.valid) {
        console.error(`[Webhook:${requestId}] Signature verification failed: ${verificationResult.error}`);
        return new Response(
          JSON.stringify({ error: "Signature verification failed", details: verificationResult.error }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      console.log(`[Webhook:${requestId}] Signature verification successful`);
    } else {
      // Log warning if webhook secret is not configured
      console.warn(`[Webhook:${requestId}] WARNING: PAYMONGO_WEBHOOK_SECRET not configured - skipping signature verification`);
    }

    // Parse the verified payload
    const payload = JSON.parse(rawBody);
    console.log(`[Webhook:${requestId}] Processing event:`, JSON.stringify(payload, null, 2));
    
    const { data } = payload;
    
    if (!data) {
      console.log(`[Webhook:${requestId}] No data in payload, acknowledging`);
      return new Response(JSON.stringify({ received: true, request_id: requestId }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = data.attributes?.type;
    const resourceData = data.attributes?.data;
    
    console.log(`[Webhook:${requestId}] Event type: ${eventType}`);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle source.chargeable - Create payment from the chargeable source
    if (eventType === "source.chargeable") {
      const sourceId = resourceData?.id;
      const amount = resourceData?.attributes?.amount;
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      console.log(`[Webhook:${requestId}] source.chargeable - order_id: ${orderId}`);
      
      if (sourceId && amount) {
        // Create a payment using the chargeable source
        const paymongoBaseUrl = "https://api.paymongo.com/v1";
        const authString = btoa(`${paymongoSecretKey}:`);
        
        const paymentPayload = {
          data: {
            attributes: {
              amount: amount,
              currency: "PHP",
              source: {
                id: sourceId,
                type: "source",
              },
              description: `Order payment`,
              metadata: metadata,
            },
          },
        };

        try {
          const paymentResponse = await fetch(`${paymongoBaseUrl}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${authString}`,
            },
            body: JSON.stringify(paymentPayload),
          });

          const paymentData = await paymentResponse.json();

          if (paymentResponse.ok && paymentData.data?.attributes?.status === "paid") {
            // Check if this is a credit purchase
            const isCreditPurchase = await processCreditPurchaseIfApplicable(
              supabase,
              orderId,
              metadata?.user_id,
              metadata?.credits,
              "source.chargeable"
            );

            // If not a credit purchase, update order status
            if (!isCreditPurchase && orderId) {
              await updateOrderStatus(supabase, orderId, "to_ship", "source.chargeable");
            }
          } else if (!paymentResponse.ok) {
            // Update order to payment_failed (only for non-credit purchases)
            if (orderId && !orderId.startsWith("CREDITS-")) {
              await updateOrderStatus(supabase, orderId, "payment_failed", "source.chargeable");
            }
          }
        } catch (paymentError) {
          console.error(`[Webhook:${requestId}] Payment creation error:`, String(paymentError));
          if (orderId && !orderId.startsWith("CREDITS-")) {
            await updateOrderStatus(supabase, orderId, "payment_failed", "source.chargeable_error");
          }
        }
      }
    }
    
    // Handle payment.paid - Direct payment success
    if (eventType === "payment.paid") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook:${requestId}] payment.paid - order_id: ${orderId}`);
      
      // Check if this is a credit purchase
      const isCreditPurchase = await processCreditPurchaseIfApplicable(
        supabase,
        orderId,
        metadata?.user_id,
        metadata?.credits,
        "payment.paid"
      );

      // If not a credit purchase, update order status
      if (!isCreditPurchase && orderId) {
        await updateOrderStatus(supabase, orderId, "to_ship", "payment.paid");
      }
    }
    
    // Handle payment.failed
    if (eventType === "payment.failed") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook:${requestId}] payment.failed - order_id: ${orderId}`);
      
      // Only update order status for non-credit purchases
      if (orderId && !orderId.startsWith("CREDITS-")) {
        await updateOrderStatus(supabase, orderId, "payment_failed", "payment.failed");
      }
    }

    // Handle payment_intent.succeeded - For bank transfer and card payments
    if (eventType === "payment_intent.succeeded") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook:${requestId}] payment_intent.succeeded - order_id: ${orderId}`);
      
      // Check if this is a credit purchase
      const isCreditPurchase = await processCreditPurchaseIfApplicable(
        supabase,
        orderId,
        metadata?.user_id,
        metadata?.credits,
        "payment_intent.succeeded"
      );

      // If not a credit purchase, update order status
      if (!isCreditPurchase && orderId) {
        await updateOrderStatus(supabase, orderId, "to_ship", "payment_intent.succeeded");
      }
    }

    // Handle payment_intent.payment_failed
    if (eventType === "payment_intent.payment_failed") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook:${requestId}] payment_intent.payment_failed - order_id: ${orderId}`);
      
      // Only update order status for non-credit purchases
      if (orderId && !orderId.startsWith("CREDITS-")) {
        await updateOrderStatus(supabase, orderId, "payment_failed", "payment_intent.payment_failed");
      }
    }

    // Handle checkout_session.payment.paid (for Checkout Sessions - QRPh)
    if (eventType === "checkout_session.payment.paid") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook:${requestId}] checkout_session.payment.paid - order_id: ${orderId}`);
      
      // Check if this is a credit purchase
      const isCreditPurchase = await processCreditPurchaseIfApplicable(
        supabase,
        orderId,
        metadata?.user_id,
        metadata?.credits,
        "checkout_session.payment.paid"
      );

      // If not a credit purchase, update order status
      if (!isCreditPurchase && orderId) {
        await updateOrderStatus(supabase, orderId, "to_ship", "checkout_session.payment.paid");
      }
    }

    console.log(`[Webhook:${requestId}] Request processed successfully`);
    return new Response(JSON.stringify({ received: true, request_id: requestId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Webhook:${requestId}] Error:`, errorMessage);
    return new Response(JSON.stringify({ error: errorMessage, request_id: requestId }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
