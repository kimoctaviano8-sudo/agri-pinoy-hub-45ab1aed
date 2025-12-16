import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paymongo-signature",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

    // Handle different event types
    if (eventType === "payment.paid" || eventType === "source.chargeable") {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Extract order ID from metadata
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Updating order status for order:", orderId);
        
        // Update order status to 'paid'
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
          console.log("Order status updated to paid successfully");
        }
      } else {
        console.log("No order_id found in metadata");
      }
    } else if (eventType === "payment.failed") {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const metadata = resourceData?.attributes?.metadata;
      const orderId = metadata?.order_id;
      
      if (orderId) {
        console.log("Payment failed for order:", orderId);
        
        // Update order status to 'payment_failed'
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
