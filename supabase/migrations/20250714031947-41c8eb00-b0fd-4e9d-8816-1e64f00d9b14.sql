-- Manually confirm the email for existing users
UPDATE auth.users 
SET email_confirmed_at = NOW(), 
    confirmed_at = NOW(),
    updated_at = NOW()
WHERE email_confirmed_at IS NULL;