CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
BEGIN
  -- Insert into profiles table with new fields from metadata
  INSERT INTO public.profiles (
    id, 
    email, 
    first_name,
    last_name,
    full_name, 
    phone,
    birthday,
    street_number,
    barangay,
    city,
    role,
    gender,
    avatar_url
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email),
    COALESCE(new.raw_user_meta_data ->> 'phone', ''),
    CASE 
      WHEN new.raw_user_meta_data ->> 'birthday' IS NOT NULL 
      THEN (new.raw_user_meta_data ->> 'birthday')::DATE 
      ELSE NULL 
    END,
    COALESCE(new.raw_user_meta_data ->> 'street_number', ''),
    COALESCE(new.raw_user_meta_data ->> 'barangay', ''),
    COALESCE(new.raw_user_meta_data ->> 'city', ''),
    COALESCE(new.raw_user_meta_data ->> 'role', 'farmer'),
    COALESCE(new.raw_user_meta_data ->> 'gender', ''),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    phone = EXCLUDED.phone,
    birthday = EXCLUDED.birthday,
    street_number = EXCLUDED.street_number,
    barangay = EXCLUDED.barangay,
    city = EXCLUDED.city,
    role = EXCLUDED.role,
    gender = EXCLUDED.gender,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  
  -- Insert into user_roles table with error handling
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$function$;