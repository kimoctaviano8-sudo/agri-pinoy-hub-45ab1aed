-- Fix notifications.type check constraint to allow support ticket notifications
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('reaction', 'comment', 'support_ticket'));
