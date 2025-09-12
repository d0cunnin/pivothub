-- Create user preferences table for storing AI tool preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_name)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for user preferences
CREATE POLICY "Users can view their own preferences" 
ON public.user_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences" 
ON public.user_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences" 
ON public.user_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create usage analytics table
CREATE TABLE IF NOT EXISTS public.tool_usage_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  tool_name TEXT NOT NULL,
  input_data JSONB NOT NULL DEFAULT '{}',
  input_quality_score INTEGER CHECK (input_quality_score >= 1 AND input_quality_score <= 5),
  response_data JSONB,
  response_quality_score INTEGER CHECK (response_quality_score >= 1 AND response_quality_score <= 5),
  session_id TEXT,
  model_used TEXT,
  response_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analytics (allow read for authenticated users, insert for all)
ALTER TABLE public.tool_usage_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Analytics readable by owner" 
ON public.tool_usage_analytics 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Analytics insertable by all" 
ON public.tool_usage_analytics 
FOR INSERT 
WITH CHECK (true);

-- Create feedback table for result quality feedback
CREATE TABLE IF NOT EXISTS public.result_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  tool_name TEXT NOT NULL,
  result_id TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  improvement_suggestions TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for feedback
ALTER TABLE public.result_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Feedback readable by owner" 
ON public.result_feedback 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Feedback insertable by all" 
ON public.result_feedback 
FOR INSERT 
WITH CHECK (true);

-- Create conversation context table for chatbots
CREATE TABLE IF NOT EXISTS public.conversation_context (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  tool_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  context_data JSONB NOT NULL DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for conversation context
ALTER TABLE public.conversation_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Context readable by owner" 
ON public.conversation_context 
FOR SELECT 
USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Context manageable by owner" 
ON public.conversation_context 
FOR ALL 
USING (auth.uid() = user_id OR user_id IS NULL);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_tool ON public.user_preferences(user_id, tool_name);
CREATE INDEX IF NOT EXISTS idx_analytics_tool_created ON public.tool_usage_analytics(tool_name, created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_user_created ON public.tool_usage_analytics(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feedback_tool_rating ON public.result_feedback(tool_name, rating);
CREATE INDEX IF NOT EXISTS idx_context_session ON public.conversation_context(session_id);
CREATE INDEX IF NOT EXISTS idx_context_expires ON public.conversation_context(expires_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON public.user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_context_updated_at ON public.conversation_context;
CREATE TRIGGER update_conversation_context_updated_at
  BEFORE UPDATE ON public.conversation_context
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to clean up expired contexts
CREATE OR REPLACE FUNCTION public.cleanup_expired_contexts()
RETURNS void AS $$
BEGIN
  DELETE FROM public.conversation_context 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;