-- Create side_income_assessments table
CREATE TABLE public.side_income_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  stripe_session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create side_income_reports table
CREATE TABLE public.side_income_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.side_income_assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  report_content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(assessment_id)
);

-- Enable RLS
ALTER TABLE public.side_income_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.side_income_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for side_income_assessments
CREATE POLICY "Users can view their own assessments"
  ON public.side_income_assessments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own assessments"
  ON public.side_income_assessments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own assessments"
  ON public.side_income_assessments
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for side_income_reports
CREATE POLICY "Users can view their own reports"
  ON public.side_income_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert reports"
  ON public.side_income_reports
  FOR INSERT
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_side_income_assessments_updated_at
  BEFORE UPDATE ON public.side_income_assessments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for better performance
CREATE INDEX idx_side_income_assessments_user_id ON public.side_income_assessments(user_id);
CREATE INDEX idx_side_income_assessments_payment_status ON public.side_income_assessments(payment_status);
CREATE INDEX idx_side_income_reports_user_id ON public.side_income_reports(user_id);
CREATE INDEX idx_side_income_reports_assessment_id ON public.side_income_reports(assessment_id);