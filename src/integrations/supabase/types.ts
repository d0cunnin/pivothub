export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      activity_submissions: {
        Row: {
          activity_id: string
          course_id: string
          id: string
          lesson_id: string
          submission_file_url: string | null
          submission_text: string | null
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_id: string
          course_id: string
          id?: string
          lesson_id: string
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_id?: string
          course_id?: string
          id?: string
          lesson_id?: string
          submission_file_url?: string | null
          submission_text?: string | null
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          action_plan: Json | null
          assessment_type: string
          created_at: string
          detailed_analysis: Json | null
          id: string
          results: Json
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action_plan?: Json | null
          assessment_type: string
          created_at?: string
          detailed_analysis?: Json | null
          id?: string
          results: Json
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action_plan?: Json | null
          assessment_type?: string
          created_at?: string
          detailed_analysis?: Json | null
          id?: string
          results?: Json
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_context: {
        Row: {
          context_data: Json
          created_at: string
          expires_at: string
          id: string
          session_id: string
          tool_name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          context_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          session_id: string
          tool_name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          context_data?: Json
          created_at?: string
          expires_at?: string
          id?: string
          session_id?: string
          tool_name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string
          id: string
          progress: number | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string
          id?: string
          progress?: number | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed_at: string
          course_id: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          course_id: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          course_id?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_results: {
        Row: {
          answers: Json
          completed_at: string
          course_id: string
          id: string
          lesson_id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          course_id: string
          id?: string
          lesson_id: string
          quiz_id: string
          score: number
          total_questions: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          course_id?: string
          id?: string
          lesson_id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      result_feedback: {
        Row: {
          created_at: string
          feedback_text: string | null
          id: string
          improvement_suggestions: string[] | null
          rating: number
          result_id: string
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          rating: number
          result_id: string
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_text?: string | null
          id?: string
          improvement_suggestions?: string[] | null
          rating?: number
          result_id?: string
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      side_income_assessments: {
        Row: {
          assessment_data: Json
          created_at: string
          id: string
          payment_status: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_data?: Json
          created_at?: string
          id?: string
          payment_status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_data?: Json
          created_at?: string
          id?: string
          payment_status?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      side_income_reports: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          report_content: Json
          user_id: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          report_content: Json
          user_id: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          report_content?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "side_income_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "side_income_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers_public: {
        Row: {
          abuse_flags: number | null
          account_status: string | null
          ai_request_limit: number | null
          created_at: string
          extra_credits: number | null
          id: string
          is_trial_active: boolean
          last_request_reset: string | null
          monthly_ai_requests: number | null
          subscribed: boolean
          subscription_end: string | null
          subscription_package: string | null
          subscription_tier: string | null
          trial_end: string | null
          trial_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abuse_flags?: number | null
          account_status?: string | null
          ai_request_limit?: number | null
          created_at?: string
          extra_credits?: number | null
          id?: string
          is_trial_active?: boolean
          last_request_reset?: string | null
          monthly_ai_requests?: number | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_package?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abuse_flags?: number | null
          account_status?: string | null
          ai_request_limit?: number | null
          created_at?: string
          extra_credits?: number | null
          id?: string
          is_trial_active?: boolean
          last_request_reset?: string | null
          monthly_ai_requests?: number | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_package?: string | null
          subscription_tier?: string | null
          trial_end?: string | null
          trial_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers_secure: {
        Row: {
          created_at: string
          email: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_secure_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "subscribers_public"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscription_audit_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          id: string
          new_state: Json | null
          notes: string | null
          previous_state: Json | null
          user_id: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          id?: string
          new_state?: Json | null
          notes?: string | null
          previous_state?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          new_state?: Json | null
          notes?: string | null
          previous_state?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      tool_usage_analytics: {
        Row: {
          created_at: string
          id: string
          input_data: Json
          input_quality_score: number | null
          model_used: string | null
          response_data: Json | null
          response_quality_score: number | null
          response_time_ms: number | null
          session_id: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_data?: Json
          input_quality_score?: number | null
          model_used?: string | null
          response_data?: Json | null
          response_quality_score?: number | null
          response_time_ms?: number | null
          session_id?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_data?: Json
          input_quality_score?: number | null
          model_used?: string | null
          response_data?: Json | null
          response_quality_score?: number | null
          response_time_ms?: number | null
          session_id?: string | null
          tool_name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferences: Json
          tool_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferences?: Json
          tool_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferences?: Json
          tool_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          achieved_at: string
          assessment_type: string
          id: string
          milestone: string | null
          progress_data: Json
          user_id: string
        }
        Insert: {
          achieved_at?: string
          assessment_type: string
          id?: string
          milestone?: string | null
          progress_data: Json
          user_id: string
        }
        Update: {
          achieved_at?: string
          assessment_type?: string
          id?: string
          milestone?: string | null
          progress_data?: Json
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_ai_usage: {
        Args: { p_user_id: string }
        Returns: Json
      }
      cleanup_expired_contexts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_monthly_ai_requests: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
