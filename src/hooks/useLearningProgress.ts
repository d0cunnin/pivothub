import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface LearningProgressData {
  enrollments: string[];
  completedLessons: Record<string, string[]>;
  activitySubmissions: Record<string, Record<string, string>>;
  quizResults: Record<string, Record<string, { score: number; total: number }>>;
}

export const useLearningProgress = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<LearningProgressData>({
    enrollments: [],
    completedLessons: {},
    activitySubmissions: {},
    quizResults: {}
  });

  // Load user progress from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadProgress();
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;

    try {
      // Load enrollments
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('user_id', user.id);

      // Load completed lessons
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select('course_id, lesson_id')
        .eq('user_id', user.id);

      // Load activity submissions
      const { data: submissions } = await supabase
        .from('activity_submissions')
        .select('course_id, lesson_id, activity_id, submission_text')
        .eq('user_id', user.id);

      // Load quiz results
      const { data: quizzes } = await supabase
        .from('quiz_results')
        .select('course_id, lesson_id, quiz_id, score, total_questions')
        .eq('user_id', user.id);

      // Transform data into the expected format
      const completedLessons: Record<string, string[]> = {};
      lessonProgress?.forEach(lesson => {
        if (!completedLessons[lesson.course_id]) {
          completedLessons[lesson.course_id] = [];
        }
        completedLessons[lesson.course_id].push(lesson.lesson_id);
      });

      const activitySubmissions: Record<string, Record<string, string>> = {};
      submissions?.forEach(sub => {
        const key = `${sub.course_id}-${sub.lesson_id}`;
        if (!activitySubmissions[key]) {
          activitySubmissions[key] = {};
        }
        activitySubmissions[key][sub.activity_id] = sub.submission_text || '';
      });

      const quizResults: Record<string, Record<string, { score: number; total: number }>> = {};
      quizzes?.forEach(quiz => {
        const key = `${quiz.course_id}-${quiz.lesson_id}`;
        if (!quizResults[key]) {
          quizResults[key] = {};
        }
        quizResults[key][quiz.quiz_id] = {
          score: quiz.score,
          total: quiz.total_questions
        };
      });

      setProgress({
        enrollments: enrollments?.map(e => e.course_id) || [],
        completedLessons,
        activitySubmissions,
        quizResults
      });
    } catch (error) {
      console.error('Error loading progress:', error);
      toast.error('Failed to load learning progress');
    } finally {
      setLoading(false);
    }
  };

  const enrollInCourse = async (courseId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('course_enrollments')
        .insert({
          user_id: user.id,
          course_id: courseId
        });

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          toast.info('You are already enrolled in this course!');
          return true;
        }
        throw error;
      }

      setProgress(prev => ({
        ...prev,
        enrollments: [...prev.enrollments, courseId]
      }));

      toast.success('Successfully enrolled in course!');
      return true;
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Failed to enroll in course');
      return false;
    }
  };

  const completeLesson = async (courseId: string, lessonId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('lesson_progress')
        .insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId
        });

      if (error && error.code !== '23505') { // Ignore unique constraint violations
        throw error;
      }

      setProgress(prev => ({
        ...prev,
        completedLessons: {
          ...prev.completedLessons,
          [courseId]: [...(prev.completedLessons[courseId] || []), lessonId]
        }
      }));

      // Update course enrollment progress using current state
      const currentLessons = progress.completedLessons[courseId]?.length || 0;
      const newProgress = ((currentLessons + 1) / 10) * 100; // Assuming ~10 lessons per course

      await supabase
        .from('course_enrollments')
        .update({ progress: newProgress })
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      return true;
    } catch (error) {
      console.error('Error completing lesson:', error);
      toast.error('Failed to save lesson progress');
      return false;
    }
  };

  const saveActivitySubmission = async (
    courseId: string,
    lessonId: string,
    activityId: string,
    submission: string
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('activity_submissions')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          activity_id: activityId,
          submission_text: submission
        });

      if (error) throw error;

      const key = `${courseId}-${lessonId}`;
      setProgress(prev => ({
        ...prev,
        activitySubmissions: {
          ...prev.activitySubmissions,
          [key]: {
            ...prev.activitySubmissions[key],
            [activityId]: submission
          }
        }
      }));

      return true;
    } catch (error) {
      console.error('Error saving activity submission:', error);
      toast.error('Failed to save activity submission');
      return false;
    }
  };

  const saveQuizResult = async (
    courseId: string,
    lessonId: string,
    quizId: string,
    score: number,
    totalQuestions: number,
    answers: Record<string, number>
  ) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('quiz_results')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          quiz_id: quizId,
          score,
          total_questions: totalQuestions,
          answers
        });

      if (error) throw error;

      const key = `${courseId}-${lessonId}`;
      setProgress(prev => ({
        ...prev,
        quizResults: {
          ...prev.quizResults,
          [key]: {
            ...prev.quizResults[key],
            [quizId]: { score, total: totalQuestions }
          }
        }
      }));

      return true;
    } catch (error) {
      console.error('Error saving quiz result:', error);
      toast.error('Failed to save quiz result');
      return false;
    }
  };

  return {
    progress,
    loading,
    enrollInCourse,
    completeLesson,
    saveActivitySubmission,
    saveQuizResult,
    refreshProgress: loadProgress
  };
};