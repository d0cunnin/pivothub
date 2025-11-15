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
    PostgrestVersion: "13.0.5"
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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          ip_address: string | null
          target_user_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_user_id?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_rate_limits: {
        Row: {
          action_count: number
          action_type: string
          admin_user_id: string
          created_at: string
          id: string
          window_start: string
        }
        Insert: {
          action_count?: number
          action_type: string
          admin_user_id: string
          created_at?: string
          id?: string
          window_start?: string
        }
        Update: {
          action_count?: number
          action_type?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          window_start?: string
        }
        Relationships: []
      }
      ai_service_status: {
        Row: {
          checked_at: string
          created_at: string | null
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
          workspace_paused: boolean | null
        }
        Insert: {
          checked_at?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status: string
          workspace_paused?: boolean | null
        }
        Update: {
          checked_at?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
          workspace_paused?: boolean | null
        }
        Relationships: []
      }
      api_ip_usage: {
        Row: {
          count: number
          endpoint: string
          ip: unknown
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          ip: unknown
          window_start: string
        }
        Update: {
          count?: number
          endpoint?: string
          ip?: unknown
          window_start?: string
        }
        Relationships: []
      }
      api_request_log: {
        Row: {
          created_at: string | null
          credits_charged: number | null
          endpoint: string
          error_message: string | null
          id: string
          ip_address: unknown
          request_duration_ms: number | null
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          credits_charged?: number | null
          endpoint: string
          error_message?: string | null
          id?: string
          ip_address: unknown
          request_duration_ms?: number | null
          success: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          credits_charged?: number | null
          endpoint?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          request_duration_ms?: number | null
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_user_usage: {
        Row: {
          count: number
          endpoint: string
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          endpoint: string
          user_id: string
          window_start: string
        }
        Update: {
          count?: number
          endpoint?: string
          user_id?: string
          window_start?: string
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
      auth_failed_attempts: {
        Row: {
          attempted_at: string | null
          email: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          attempted_at?: string | null
          email: string
          id?: string
          ip_address: unknown
          user_agent?: string | null
        }
        Update: {
          attempted_at?: string | null
          email?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      auth_lockouts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          locked_until: string
          reason: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          locked_until: string
          reason?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          locked_until?: string
          reason?: string | null
        }
        Relationships: []
      }
      checkout_sessions: {
        Row: {
          created_at: string
          id: string
          session_type: string
          stripe_session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_type: string
          stripe_session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_type?: string
          stripe_session_id?: string
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
      credit_deduction_log: {
        Row: {
          credits_deducted: number
          deducted_at: string | null
          endpoint: string
          id: string
          request_hash: string | null
          user_id: string | null
        }
        Insert: {
          credits_deducted: number
          deducted_at?: string | null
          endpoint: string
          id?: string
          request_hash?: string | null
          user_id?: string | null
        }
        Update: {
          credits_deducted?: number
          deducted_at?: string | null
          endpoint?: string
          id?: string
          request_hash?: string | null
          user_id?: string | null
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
      moderation_log: {
        Row: {
          categories: Json | null
          created_at: string | null
          flagged: boolean
          function_name: string
          id: string
          input_text: string
          user_id: string | null
        }
        Insert: {
          categories?: Json | null
          created_at?: string | null
          flagged: boolean
          function_name: string
          id?: string
          input_text: string
          user_id?: string | null
        }
        Update: {
          categories?: Json | null
          created_at?: string | null
          flagged?: boolean
          function_name?: string
          id?: string
          input_text?: string
          user_id?: string | null
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          credit_limit: number
          currency: string
          display_name: string
          effective_from: string
          features: Json
          is_active: boolean
          plan_code: string
          price_cents: number
          rollover_cap_multiplier: number
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          credit_limit?: number
          currency?: string
          display_name: string
          effective_from?: string
          features?: Json
          is_active?: boolean
          plan_code: string
          price_cents: number
          rollover_cap_multiplier?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          credit_limit?: number
          currency?: string
          display_name?: string
          effective_from?: string
          features?: Json
          is_active?: boolean
          plan_code?: string
          price_cents?: number
          rollover_cap_multiplier?: number
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      processed_stripe_events: {
        Row: {
          event_id: string
          event_type: string
          processed_successfully: boolean
          received_at: string
        }
        Insert: {
          event_id: string
          event_type: string
          processed_successfully?: boolean
          received_at?: string
        }
        Update: {
          event_id?: string
          event_type?: string
          processed_successfully?: boolean
          received_at?: string
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
          onboarding_completed: boolean | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_completed?: boolean | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
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
      rate_limit_alerts: {
        Row: {
          active_tools: Json | null
          alert_level: string
          id: string
          notes: string | null
          percentage_used: number
          rate_limit: number
          requests_per_minute: number
          resolved_at: string | null
          triggered_at: string
        }
        Insert: {
          active_tools?: Json | null
          alert_level: string
          id?: string
          notes?: string | null
          percentage_used: number
          rate_limit: number
          requests_per_minute: number
          resolved_at?: string | null
          triggered_at?: string
        }
        Update: {
          active_tools?: Json | null
          alert_level?: string
          id?: string
          notes?: string | null
          percentage_used?: number
          rate_limit?: number
          requests_per_minute?: number
          resolved_at?: string | null
          triggered_at?: string
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
          credits_used: number | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_data?: Json
          created_at?: string
          credits_used?: number | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_data?: Json
          created_at?: string
          credits_used?: number | null
          id?: string
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
          {
            foreignKeyName: "side_income_reports_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: true
            referencedRelation: "v_side_income_assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      signup_audit: {
        Row: {
          accounts_from_ip: number | null
          created_at: string
          email: string
          flagged_as_suspicious: boolean
          fraud_reason: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accounts_from_ip?: number | null
          created_at?: string
          email: string
          flagged_as_suspicious?: boolean
          fraud_reason?: string | null
          id?: string
          ip_address: unknown
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accounts_from_ip?: number | null
          created_at?: string
          email?: string
          flagged_as_suspicious?: boolean
          fraud_reason?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      storage_access_audit: {
        Row: {
          access_granted: boolean
          attempted_at: string | null
          bucket_id: string
          id: string
          object_name: string
          user_id: string
        }
        Insert: {
          access_granted: boolean
          attempted_at?: string | null
          bucket_id: string
          id?: string
          object_name: string
          user_id: string
        }
        Update: {
          access_granted?: boolean
          attempted_at?: string | null
          bucket_id?: string
          id?: string
          object_name?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers_public: {
        Row: {
          abuse_flags: number | null
          account_status: string | null
          ai_request_limit: number | null
          billing_cycle_start: string | null
          created_at: string
          extra_credits: number | null
          free_tier_start_date: string | null
          grace_period_end: string | null
          id: string
          last_flag_date: string | null
          last_request_reset: string | null
          moderation_flags: number | null
          monthly_ai_requests: number | null
          next_billing_date: string | null
          payment_retry_count: number | null
          rollover_credits: number | null
          subscribed: boolean
          subscription_end: string | null
          subscription_package: string | null
          subscription_start_date: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          abuse_flags?: number | null
          account_status?: string | null
          ai_request_limit?: number | null
          billing_cycle_start?: string | null
          created_at?: string
          extra_credits?: number | null
          free_tier_start_date?: string | null
          grace_period_end?: string | null
          id?: string
          last_flag_date?: string | null
          last_request_reset?: string | null
          moderation_flags?: number | null
          monthly_ai_requests?: number | null
          next_billing_date?: string | null
          payment_retry_count?: number | null
          rollover_credits?: number | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_package?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          abuse_flags?: number | null
          account_status?: string | null
          ai_request_limit?: number | null
          billing_cycle_start?: string | null
          created_at?: string
          extra_credits?: number | null
          free_tier_start_date?: string | null
          grace_period_end?: string | null
          id?: string
          last_flag_date?: string | null
          last_request_reset?: string | null
          moderation_flags?: number | null
          monthly_ai_requests?: number | null
          next_billing_date?: string | null
          payment_retry_count?: number | null
          rollover_credits?: number | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_package?: string | null
          subscription_start_date?: string | null
          subscription_tier?: string | null
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
        Relationships: []
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
          created_at: string | null
          credits_used: number
          estimated_cost_usd: number | null
          estimated_tokens: number | null
          id: string
          month_year: string | null
          tool_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          credits_used: number
          estimated_cost_usd?: number | null
          estimated_tokens?: number | null
          id?: string
          month_year?: string | null
          tool_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          credits_used?: number
          estimated_cost_usd?: number | null
          estimated_tokens?: number | null
          id?: string
          month_year?: string | null
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
      users: {
        Row: {
          ai_credits_remaining: number | null
          ai_credits_total: number | null
          ai_credits_used: number | null
          ai_usage_month: number | null
          ai_usage_year: number | null
          billing_cycle_start: string | null
          created_at: string | null
          display_name: string | null
          email: string
          grace_period_end: string | null
          id: string
          last_login: string | null
          next_billing_date: string | null
          onboarding_completed: boolean | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscribed: boolean | null
          subscription_end: string | null
          subscription_package: string | null
          subscription_start: string | null
          subscription_status: string | null
          subscription_tier: string | null
          updated_at: string | null
        }
        Insert: {
          ai_credits_remaining?: number | null
          ai_credits_total?: number | null
          ai_credits_used?: number | null
          ai_usage_month?: number | null
          ai_usage_year?: number | null
          billing_cycle_start?: string | null
          created_at?: string | null
          display_name?: string | null
          email: string
          grace_period_end?: string | null
          id: string
          last_login?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_package?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_credits_remaining?: number | null
          ai_credits_total?: number | null
          ai_credits_used?: number | null
          ai_usage_month?: number | null
          ai_usage_year?: number | null
          billing_cycle_start?: string | null
          created_at?: string | null
          display_name?: string | null
          email?: string
          grace_period_end?: string | null
          id?: string
          last_login?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscribed?: boolean | null
          subscription_end?: string | null
          subscription_package?: string | null
          subscription_start?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webhook_audit_log: {
        Row: {
          error_message: string | null
          event_id: string
          event_type: string
          id: string
          processing_status: string
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          error_message?: string | null
          event_id: string
          event_type: string
          id?: string
          processing_status: string
          received_at?: string
          signature_valid: boolean
        }
        Update: {
          error_message?: string | null
          event_id?: string
          event_type?: string
          id?: string
          processing_status?: string
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
    }
    Views: {
      monthly_usage_summary: {
        Row: {
          month_year: string | null
          total_cost_usd: number | null
          total_credits: number | null
          total_uses: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_ai_current_rate: {
        Row: {
          active_tools: string[] | null
          active_users: number | null
          credits_last_minute: number | null
          requests_last_minute: number | null
        }
        Relationships: []
      }
      v_ai_usage_by_minute: {
        Row: {
          minute: string | null
          request_count: number | null
          tools_used: string[] | null
          total_credits: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      v_assessment_summary: {
        Row: {
          assessment_type: string | null
          created_at: string | null
          id: string | null
          score: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_type?: string | null
          created_at?: string | null
          id?: string | null
          score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_type?: string | null
          created_at?: string | null
          id?: string | null
          score?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_failed_login_monitoring: {
        Row: {
          attempt_count: number | null
          email: string | null
          ip_addresses: string[] | null
          last_attempt: string | null
        }
        Relationships: []
      }
      v_public_pricing: {
        Row: {
          credit_limit: number | null
          currency: string | null
          display_name: string | null
          features: Json | null
          plan_code: string | null
          price_cents: number | null
          rollover_cap_multiplier: number | null
        }
        Insert: {
          credit_limit?: number | null
          currency?: string | null
          display_name?: string | null
          features?: Json | null
          plan_code?: string | null
          price_cents?: number | null
          rollover_cap_multiplier?: number | null
        }
        Update: {
          credit_limit?: number | null
          currency?: string | null
          display_name?: string | null
          features?: Json | null
          plan_code?: string | null
          price_cents?: number | null
          rollover_cap_multiplier?: number | null
        }
        Relationships: []
      }
      v_side_income_assessments: {
        Row: {
          assessment_data: Json | null
          created_at: string | null
          credits_used: number | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assessment_data?: Json | null
          created_at?: string | null
          credits_used?: number | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assessment_data?: Json | null
          created_at?: string | null
          credits_used?: number | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_storage_access_monitoring: {
        Row: {
          access_attempts: number | null
          bucket_id: string | null
          denied_count: number | null
          granted_count: number | null
          last_attempt: string | null
          user_id: string | null
        }
        Relationships: []
      }
      v_subscribers_masked: {
        Row: {
          created_at: string | null
          email_masked: string | null
          has_stripe_account: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_masked?: never
          has_stripe_account?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_masked?: never
          has_stripe_account?: never
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      v_suspicious_credit_usage: {
        Row: {
          request_count: number | null
          tool_name: string | null
          total_cost: number | null
          total_credits: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_suspicious_signups: {
        Row: {
          account_count: number | null
          emails: string[] | null
          first_signup: string | null
          has_flags: boolean | null
          ip_address: unknown
          last_signup: string | null
          signup_count: number | null
        }
        Relationships: []
      }
      v_webhook_failures: {
        Row: {
          event_type: string | null
          failure_count: number | null
          last_failure: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_account_lockout: { Args: { p_email: string }; Returns: Json }
      check_admin_rate_limit: {
        Args: {
          p_action_type: string
          p_admin_user_id: string
          p_max_actions?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_and_increment_ai_usage:
        | {
            Args: {
              p_credits_to_use?: number
              p_tool_name?: string
              p_user_id: string
            }
            Returns: Json
          }
        | { Args: { p_user_id: string }; Returns: Json }
      cleanup_expired_contexts: { Args: never; Returns: undefined }
      cleanup_old_health_checks: { Args: never; Returns: undefined }
      clear_account_lockout: { Args: { p_email: string }; Returns: undefined }
      floor_to_window: {
        Args: { seconds: number; ts: string }
        Returns: string
      }
      get_admin_cost_analysis: {
        Args: never
        Returns: {
          email: string
          month_year: string
          monthly_revenue: number
          profit_margin: number
          subscribed: boolean
          subscription_package: string
          total_cost_usd: number
          total_credits: number
        }[]
      }
      get_my_billing_profile: {
        Args: never
        Returns: {
          created_at: string
          email_masked: string
          updated_at: string
          user_id: string
        }[]
      }
      get_my_payment_status: {
        Args: { assessment_id: string }
        Returns: string
      }
      has_role:
        | { Args: { _role: string }; Returns: boolean }
        | {
            Args: {
              _role: Database["public"]["Enums"]["app_role"]
              _user_id: string
            }
            Returns: boolean
          }
      mask_email: { Args: { p_email: string }; Returns: string }
      record_failed_login: {
        Args: { p_email: string; p_ip: unknown; p_user_agent?: string }
        Returns: undefined
      }
      reset_monthly_ai_requests: { Args: never; Returns: undefined }
      throttle_ip: {
        Args: {
          p_endpoint: string
          p_ip: string
          p_max_reqs: number
          p_window_seconds: number
        }
        Returns: undefined
      }
      throttle_user: {
        Args: {
          p_endpoint: string
          p_max_reqs: number
          p_user_id: string
          p_window_seconds: number
        }
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
