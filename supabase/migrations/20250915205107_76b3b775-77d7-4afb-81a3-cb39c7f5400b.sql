-- Create subscribers table for managing trial and subscription data
CREATE TABLE public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  subscribed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT,
  subscription_end TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  is_trial_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription data" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription data" 
ON public.subscribers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription data" 
ON public.subscribers 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically start trial for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_trial()
RETURNS TRIGGER AS $$
BEGIN
  -- Create subscriber record with 3-day trial
  INSERT INTO public.subscribers (
    user_id,
    email,
    trial_start,
    trial_end,
    is_trial_active
  ) VALUES (
    NEW.id,
    NEW.email,
    now(),
    now() + interval '3 days',
    true
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to start trial when user confirms email
CREATE TRIGGER on_auth_user_trial_start
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user_trial();