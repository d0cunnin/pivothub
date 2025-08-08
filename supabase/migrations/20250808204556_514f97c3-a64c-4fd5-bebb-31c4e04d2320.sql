-- Create storage buckets for course materials and submissions
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('course-materials', 'course-materials', true),
  ('student-submissions', 'student-submissions', false),
  ('course-media', 'course-media', true);

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create course enrollments table
CREATE TABLE public.course_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  progress DECIMAL(5,2) DEFAULT 0,
  UNIQUE(user_id, course_id)
);

-- Create lesson progress table
CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id)
);

-- Create activity submissions table
CREATE TABLE public.activity_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  submission_text TEXT,
  submission_file_url TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id, activity_id)
);

-- Create quiz results table
CREATE TABLE public.quiz_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  lesson_id TEXT NOT NULL,
  quiz_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, lesson_id, quiz_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for course enrollments
CREATE POLICY "Users can view their own enrollments" 
ON public.course_enrollments FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves in courses" 
ON public.course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enrollments" 
ON public.course_enrollments FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for lesson progress
CREATE POLICY "Users can view their own progress" 
ON public.lesson_progress FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress" 
ON public.lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for activity submissions
CREATE POLICY "Users can view their own submissions" 
ON public.activity_submissions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own submissions" 
ON public.activity_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public.activity_submissions FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for quiz results
CREATE POLICY "Users can view their own quiz results" 
ON public.quiz_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz results" 
ON public.quiz_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage policies for course materials (public read)
CREATE POLICY "Course materials are publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'course-materials');

-- Create storage policies for student submissions (private)
CREATE POLICY "Users can view their own submissions" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own submissions" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own submissions" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'student-submissions' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for course media (public read)
CREATE POLICY "Course media is publicly accessible" 
ON storage.objects FOR SELECT USING (bucket_id = 'course-media');

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_activity_submissions_updated_at
  BEFORE UPDATE ON public.activity_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'display_name');
  RETURN new;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();