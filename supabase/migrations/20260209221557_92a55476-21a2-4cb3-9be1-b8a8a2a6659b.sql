
-- Update users table
UPDATE public.users 
SET email = 'hightower_skyler@yahoo.com', display_name = 'Skyler Hightower', updated_at = now()
WHERE id = 'e9069307-d2e0-47da-ac9c-833185384111';

-- Update subscribers_secure table
UPDATE public.subscribers_secure 
SET email = 'hightower_skyler@yahoo.com', updated_at = now()
WHERE user_id = 'e9069307-d2e0-47da-ac9c-833185384111';

-- Update profiles table
UPDATE public.profiles 
SET display_name = 'Skyler Hightower', updated_at = now()
WHERE id = 'e9069307-d2e0-47da-ac9c-833185384111';
