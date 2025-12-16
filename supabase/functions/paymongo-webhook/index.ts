import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const paymongoSecretKey = Deno.env.get("PAYMONGO_SECRET_KEY")!;

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
              const { error: updateError } = await supabase
                .from("orders")
                .update({ 
                  status: "paid",
                  updated_at: new Date().toISOString()
                })
                .eq("id", orderId);
              
              if (updateError) {
                console.error("Error updating order:", updateError);
              } else {
                console.log("Order status updated to paid via source.chargeable");
              }
            }
          } else if (!paymentResponse.ok) {
            console.error("Payment creation failed:", paymentData);
            // Update order to payment_failed
            if (orderId) {
              await supabase
                .from("orders")
                .update({ 
                  status: "payment_failed",
                  updated_at: new Date().toISOString()
                })
                .eq("id", orderId);
            }
          }
        } catch (paymentError) {
          console.error("Error creating payment:", paymentError);
        }
      }
    }
    
    // Handle payment.paid - Direct payment success
    if (eventType === "payment.paid") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment paid - updating order:", orderId);
        
        const { error: updateError } = await supabase
          .from("orders")
          .update({ 
            status: "paid",
            updated_at: new Date().toISOString()
          })
          .eq("id", orderId);
        
        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log("Order status updated to paid via payment.paid");
        }
      }
    }
    
    // Handle payment.failed
    if (eventType === "payment.failed") {
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment failed for order:", orderId);
        
        const { error: updateError } = await supabase
          .from("orders")
          .update({ 
            status: "payment_failed",
            updated_at: new Date().toISOString()
          })
          .eq("id", orderId);
        
        if (updateError) {
          console.error("Error updating order:", updateError);
        } else {
          console.log("Order status updated to payment_failed");
        }
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