import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID');
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');

    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      throw new Error('OneSignal credentials not configured');
    }

    const { record, type: eventType } = await req.json();

    if (!record) {
      throw new Error('No record provided');
    }

    const recipientId = record.recipient_id;
    const senderId = record.sender_id;
    const messageContent = record.content;
    const messageSubject = record.subject;

    if (!recipientId || !senderId) {
      throw new Error('Missing recipient or sender ID');
    }

    // Get sender name from profiles
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', senderId)
      .maybeSingle();

    const senderName = senderProfile?.full_name || 'Someone';

    // Send push notification via OneSignal using external_id (user UUID)
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: {
        external_id: [recipientId],
      },
      target_channel: "push",
      headings: { en: messageSubject || 'New Message' },
      contents: { en: `${senderName}: ${messageContent?.substring(0, 100) || 'Sent you a message'}` },
      data: {
        type: 'inbox_message',
        sender_id: senderId,
      },
    };

    const oneSignalResponse = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Key ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(notificationPayload),
    });

    const responseData = await oneSignalResponse.json();

    if (!oneSignalResponse.ok) {
      console.error('OneSignal API error:', JSON.stringify(responseData));
      throw new Error(`OneSignal API error: ${responseData.errors?.[0] || 'Unknown error'}`);
    }

    console.log('Push notification sent successfully:', JSON.stringify(responseData));

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error sending push notification:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
