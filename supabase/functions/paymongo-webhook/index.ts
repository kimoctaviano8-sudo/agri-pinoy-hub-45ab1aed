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
    // First, get current order status
    const { data: currentOrder, error: fetchError } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (fetchError) {
      console.error(`Error fetching order ${orderId}:`, fetchError);
      return { success: false, error: fetchError.message };
    }

    const currentStatus = currentOrder?.status as string;

    // Prevent invalid status transitions - don't go backwards from final states
    const finalStatuses = ['paid', 'completed', 'cancelled'];
    if (finalStatuses.includes(currentStatus) && currentStatus !== newStatus) {
      // Allow payment_failed to override pending states, but not final states
      if (currentStatus === 'paid' && newStatus === 'payment_failed') {
        console.log(`Skipping status update for order ${orderId}: ${currentStatus} cannot become ${newStatus}`);
        return { success: true };
      }
    }

    // Skip if already in target status
    if (currentStatus === newStatus) {
      console.log(`Order ${orderId} already has status ${newStatus}, skipping update`);
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
      console.error(`Error updating order ${orderId}:`, updateError);
      return { success: false, error: updateError.message };
    }

    console.log(`Order ${orderId} status updated: ${currentStatus} -> ${newStatus} (via ${eventType})`);
    return { success: true };
  } catch (error) {
    console.error(`Exception updating order ${orderId}:`, error);
    return { success: false, error: String(error) };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    console.log("PayMongo webhook received:", JSON.stringify(payload, null, 2));

    const { data } = payload;
    
    if (!data) {
      console.log("No data in webhook payload");
      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = data.attributes?.type;
    const resourceData = data.attributes?.data;
    
    console.log("Event type:", eventType);
    console.log("Resource data:", JSON.stringify(resourceData, null, 2));

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle source.chargeable - Create payment from the chargeable source
    if (eventType === "source.chargeable") {
      const sourceId = resourceData?.id;
      const amount = resourceData?.attributes?.amount;
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      console.log("Source chargeable - sourceId:", sourceId, "amount:", amount, "orderId:", orderId);
      
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

        console.log("Creating payment from source:", JSON.stringify(paymentPayload, null, 2));

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
          console.log("Payment creation response:", JSON.stringify(paymentData, null, 2));

          if (paymentResponse.ok && paymentData.data?.attributes?.status === "paid") {
            // Payment successful, update order
            if (orderId) {
              await updateOrderStatus(supabase, orderId, "paid", "source.chargeable");
            }
          } else if (!paymentResponse.ok) {
            console.error("Payment creation failed:", paymentData);
            // Update order to payment_failed
            if (orderId) {
              await updateOrderStatus(supabase, orderId, "payment_failed", "source.chargeable");
            }
          }
        } catch (paymentError) {
          console.error("Error creating payment:", paymentError);
          if (orderId) {
            await updateOrderStatus(supabase, orderId, "payment_failed", "source.chargeable_error");
          }
        }
      }
    }
    
    // Handle payment.paid - Direct payment success
    if (eventType === "payment.paid") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment paid - updating order:", orderId);
        await updateOrderStatus(supabase, orderId, "paid", "payment.paid");
      } else {
        console.log("payment.paid event received but no order_id in metadata");
      }
    }
    
    // Handle payment.failed
    if (eventType === "payment.failed") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment failed for order:", orderId);
        await updateOrderStatus(supabase, orderId, "payment_failed", "payment.failed");
      } else {
        console.log("payment.failed event received but no order_id in metadata");
      }
    }

    // Handle payment_intent.succeeded - For bank transfer and card payments
    if (eventType === "payment_intent.succeeded") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment intent succeeded - updating order:", orderId);
        await updateOrderStatus(supabase, orderId, "paid", "payment_intent.succeeded");
      } else {
        console.log("payment_intent.succeeded event received but no order_id in metadata");
      }
    }

    // Handle payment_intent.payment_failed
    if (eventType === "payment_intent.payment_failed") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment intent failed for order:", orderId);
        await updateOrderStatus(supabase, orderId, "payment_failed", "payment_intent.payment_failed");
      } else {
        console.log("payment_intent.payment_failed event received but no order_id in metadata");
      }
    }

    // Handle checkout_session.payment.paid (for Checkout Sessions)
    if (eventType === "checkout_session.payment.paid") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Checkout session payment paid - updating order:", orderId);
        await updateOrderStatus(supabase, orderId, "paid", "checkout_session.payment.paid");
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Webhook error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});