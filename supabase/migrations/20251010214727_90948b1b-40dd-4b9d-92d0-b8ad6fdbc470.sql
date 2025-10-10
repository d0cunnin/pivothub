-- Add DELETE policies for GDPR compliance (right to erasure)

-- Activity submissions - users can delete their own submissions
CREATE POLICY "Users can delete their own submissions"
  ON public.activity_submissions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Lesson progress - users can delete their progress records
CREATE POLICY "Users can delete their own progress"
  ON public.lesson_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Quiz results - users can delete their quiz attempts
CREATE POLICY "Users can delete their own quiz results"
  ON public.quiz_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User progress - users can delete their progress data
CREATE POLICY "Users can delete their own user progress"
  ON public.user_progress
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Tool usage analytics - users can delete their analytics data
CREATE POLICY "Users can delete their own analytics"
  ON public.tool_usage_analytics
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Result feedback - users can delete their feedback
CREATE POLICY "Users can delete their own feedback"
  ON public.result_feedback
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Assessment results - users can delete their assessments
CREATE POLICY "Users can delete their own assessment results"
  ON public.assessment_results
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Course enrollments - users can unenroll from courses
CREATE POLICY "Users can delete their own enrollments"
  ON public.course_enrollments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Side income assessments - users can delete their assessments
CREATE POLICY "Users can delete their own side income assessments"
  ON public.side_income_assessments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Conversation context - users can delete their conversation data
CREATE POLICY "Users can delete their own context"
  ON public.conversation_context
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User preferences - users can delete their preferences
CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);