-- Make kim.octaviano@geminiagri.com an admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('76d7fab5-92a5-47f3-840f-4f9e079832e1', 'admin')
ON CONFLICT (user_id, role) 
DO UPDATE SET role = 'admin';