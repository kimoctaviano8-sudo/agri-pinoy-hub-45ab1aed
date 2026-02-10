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

    const { record, type: eventType, notification_type } = await req.json();

    if (!record) {
      throw new Error('No record provided');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    let recipientId: string;
    let senderId: string;
    let heading: string;
    let body: string;
    let notifData: Record<string, string> = {};

    if (notification_type === 'ticket_response') {
      // Handle support ticket response push notification
      const ticketId = record.ticket_id;
      const responderId = record.user_id;
      const responseMessage = record.message;

      // Get the ticket to find the owner
      const { data: ticket } = await supabase
        .from('support_tickets')
        .select('user_id, subject')
        .eq('id', ticketId)
        .maybeSingle();

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Get responder info
      const { data: responderProfile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', responderId)
        .maybeSingle();

      // Get responder role
      const { data: responderRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', responderId)
        .maybeSingle();

      const responderName = responderProfile?.full_name || 'Support';
      const isStaff = responderRole?.role === 'field_technician' || responderRole?.role === 'admin';

      // If staff replied, notify ticket owner. If user replied, notify assigned technicians.
      if (isStaff && responderId !== ticket.user_id) {
        recipientId = ticket.user_id;
        senderId = responderId;
        heading = `Support: ${ticket.subject}`;
        body = `${responderName}: ${responseMessage?.substring(0, 100) || 'Sent a response'}`;
        notifData = { type: 'ticket_response', ticket_id: ticketId };
      } else if (!isStaff) {
        // User replied - notify all field technicians/admins
        const { data: staffRoles } = await supabase
          .from('user_roles')
          .select('user_id')
          .in('role', ['field_technician', 'admin']);

        const staffIds = staffRoles?.map(r => r.user_id).filter(id => id !== responderId) || [];

        if (staffIds.length > 0) {
          // Send to all staff members
          const notificationPayload = {
            app_id: ONESIGNAL_APP_ID,
            include_aliases: { external_id: staffIds },
            target_channel: "push",
            headings: { en: `Support: ${ticket.subject}` },
            contents: { en: `${responderName}: ${responseMessage?.substring(0, 100) || 'Sent a response'}` },
            data: { type: 'ticket_response', ticket_id: ticketId },
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
          console.log('Push notification sent to staff:', JSON.stringify(responseData));

          return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true, message: 'No staff to notify' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Staff replying to own ticket - skip
        return new Response(JSON.stringify({ success: true, message: 'Self-reply skipped' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Handle inbox message push notification (default)
      recipientId = record.recipient_id;
      senderId = record.sender_id;
      const messageContent = record.content;
      const messageSubject = record.subject;

      if (!recipientId || !senderId) {
        throw new Error('Missing recipient or sender ID');
      }

      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', senderId)
        .maybeSingle();

      const senderName = senderProfile?.full_name || 'Someone';
      heading = messageSubject || 'New Message';
      body = `${senderName}: ${messageContent?.substring(0, 100) || 'Sent you a message'}`;
      notifData = { type: 'inbox_message', sender_id: senderId };
    }

    // Send push notification via OneSignal
    const notificationPayload = {
      app_id: ONESIGNAL_APP_ID,
      include_aliases: { external_id: [recipientId] },
      target_channel: "push",
      headings: { en: heading },
      contents: { en: body },
      data: notifData,
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
