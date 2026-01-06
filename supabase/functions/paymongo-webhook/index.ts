import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY")!;

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

  try {
    const payload = await req.json();
    console.log("[Webhook] Received PayMongo webhook:", JSON.stringify(payload, null, 2));
    
    const { data } = payload;
    
    if (!data) {
      console.log("[Webhook] No data in payload, acknowledging");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = data.attributes?.type;
    const resourceData = data.attributes?.data;
    
    console.log(`[Webhook] Event type: ${eventType}`);
    console.log(`[Webhook] Resource data:`, JSON.stringify(resourceData, null, 2));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle source.chargeable - Create payment from the chargeable source
    if (eventType === "source.chargeable") {
      const sourceId = resourceData?.id;
      const amount = resourceData?.attributes?.amount;
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
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
      console.log(`[Webhook] payment.paid - order_id: ${orderId}`);
      
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
      console.log(`[Webhook] payment.failed - order_id: ${orderId}`);
      
      // Only update order status for non-credit purchases
      if (orderId && !orderId.startsWith("CREDITS-")) {
        await updateOrderStatus(supabase, orderId, "payment_failed", "payment.failed");
      }
    }

    // Handle payment_intent.succeeded - For bank transfer and card payments
    if (eventType === "payment_intent.succeeded") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook] payment_intent.succeeded - order_id: ${orderId}`);
      
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
      console.log(`[Webhook] payment_intent.payment_failed - order_id: ${orderId}`);
      
      // Only update order status for non-credit purchases
      if (orderId && !orderId.startsWith("CREDITS-")) {
        await updateOrderStatus(supabase, orderId, "payment_failed", "payment_intent.payment_failed");
      }
    }

    // Handle checkout_session.payment.paid (for Checkout Sessions - QRPh)
    if (eventType === "checkout_session.payment.paid") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      console.log(`[Webhook] checkout_session.payment.paid - order_id: ${orderId}`);
      
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

    return new Response(JSON.stringify({ received: true }), {
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
