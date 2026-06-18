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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          start_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          start_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          start_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      accident_reports: {
        Row: {
          created_at: string
          description: string
          first_aid_given: string | null
          hospital_name: string | null
          hospital_referred: boolean | null
          id: string
          incident_date: string
          incident_time: string | null
          injury_type: string | null
          location: string | null
          parent_notified: boolean | null
          parent_notified_at: string | null
          reported_by: string | null
          severity: string | null
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          first_aid_given?: string | null
          hospital_name?: string | null
          hospital_referred?: boolean | null
          id?: string
          incident_date?: string
          incident_time?: string | null
          injury_type?: string | null
          location?: string | null
          parent_notified?: boolean | null
          parent_notified_at?: string | null
          reported_by?: string | null
          severity?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          first_aid_given?: string | null
          hospital_name?: string | null
          hospital_referred?: boolean | null
          id?: string
          incident_date?: string
          incident_time?: string | null
          injury_type?: string | null
          location?: string | null
          parent_notified?: boolean | null
          parent_notified_at?: string | null
          reported_by?: string | null
          severity?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_screenings: {
        Row: {
          applicant_name: string | null
          application_id: string | null
          created_at: string
          created_by: string | null
          criteria: Json | null
          grade_level: string | null
          id: string
          input_data: Json | null
          interview_questions: Json | null
          rationale: string | null
          recommendation: string | null
          red_flags: Json | null
          score: number | null
          strengths: Json | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          applicant_name?: string | null
          application_id?: string | null
          created_at?: string
          created_by?: string | null
          criteria?: Json | null
          grade_level?: string | null
          id?: string
          input_data?: Json | null
          interview_questions?: Json | null
          rationale?: string | null
          recommendation?: string | null
          red_flags?: Json | null
          score?: number | null
          strengths?: Json | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          applicant_name?: string | null
          application_id?: string | null
          created_at?: string
          created_by?: string | null
          criteria?: Json | null
          grade_level?: string | null
          id?: string
          input_data?: Json | null
          interview_questions?: Json | null
          rationale?: string | null
          recommendation?: string | null
          red_flags?: Json | null
          score?: number | null
          strengths?: Json | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_cache: {
        Row: {
          cache_key: string
          completion_tokens: number
          created_at: string
          expires_at: string
          feature: string
          hit_count: number
          id: string
          model: string
          prompt_tokens: number
          provider: string
          response_json: Json | null
          response_text: string | null
          tenant_id: string
        }
        Insert: {
          cache_key: string
          completion_tokens?: number
          created_at?: string
          expires_at?: string
          feature: string
          hit_count?: number
          id?: string
          model: string
          prompt_tokens?: number
          provider: string
          response_json?: Json | null
          response_text?: string | null
          tenant_id: string
        }
        Update: {
          cache_key?: string
          completion_tokens?: number
          created_at?: string
          expires_at?: string
          feature?: string
          hit_count?: number
          id?: string
          model?: string
          prompt_tokens?: number
          provider?: string
          response_json?: Json | null
          response_text?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_cache_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_comment_usage: {
        Row: {
          count: number
          created_at: string
          id: string
          tenant_id: string
          updated_at: string
          user_id: string
          year_month: string
        }
        Insert: {
          count?: number
          created_at?: string
          id?: string
          tenant_id: string
          updated_at?: string
          user_id: string
          year_month: string
        }
        Update: {
          count?: number
          created_at?: string
          id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          year_month?: string
        }
        Relationships: []
      }
      ai_plan_quotas: {
        Row: {
          created_at: string
          monthly_cost_cap_usd: number | null
          monthly_request_limit: number | null
          plan: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          monthly_cost_cap_usd?: number | null
          monthly_request_limit?: number | null
          plan: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          monthly_cost_cap_usd?: number | null
          monthly_request_limit?: number | null
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_prompt_template_versions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          model: string | null
          notes: string | null
          system_prompt: string | null
          temperature: number | null
          template_id: string
          user_prompt: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          system_prompt?: string | null
          temperature?: number | null
          template_id: string
          user_prompt: string
          version: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          model?: string | null
          notes?: string | null
          system_prompt?: string | null
          temperature?: number | null
          template_id?: string
          user_prompt?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_template_versions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_prompt_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_prompt_templates: {
        Row: {
          active_version: number
          created_at: string
          default_model: string | null
          description: string | null
          feature: string
          id: string
          is_system: boolean
          name: string
          slug: string
          tenant_id: string | null
          updated_at: string
          variables: Json
        }
        Insert: {
          active_version?: number
          created_at?: string
          default_model?: string | null
          description?: string | null
          feature: string
          id?: string
          is_system?: boolean
          name: string
          slug: string
          tenant_id?: string | null
          updated_at?: string
          variables?: Json
        }
        Update: {
          active_version?: number
          created_at?: string
          default_model?: string | null
          description?: string | null
          feature?: string
          id?: string
          is_system?: boolean
          name?: string
          slug?: string
          tenant_id?: string | null
          updated_at?: string
          variables?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_prompt_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cache_hit: boolean
          completion_tokens: number
          cost_usd: number
          created_at: string
          error_message: string | null
          feature: string
          id: string
          latency_ms: number | null
          model: string
          prompt_tokens: number
          provider: string
          request_meta: Json | null
          response_meta: Json | null
          status: string
          tenant_id: string
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          cache_hit?: boolean
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          latency_ms?: number | null
          model: string
          prompt_tokens?: number
          provider: string
          request_meta?: Json | null
          response_meta?: Json | null
          status?: string
          tenant_id: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          cache_hit?: boolean
          completion_tokens?: number
          cost_usd?: number
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          latency_ms?: number | null
          model?: string
          prompt_tokens?: number
          provider?: string
          request_meta?: Json | null
          response_meta?: Json | null
          status?: string
          tenant_id?: string
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          audience: string | null
          author_id: string | null
          content: string | null
          created_at: string | null
          id: string
          priority: string | null
          tenant_id: string
          title: string
        }
        Insert: {
          audience?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          tenant_id: string
          title: string
        }
        Update: {
          audience?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_grade: string | null
          created_at: string | null
          date_of_birth: string | null
          first_name: string
          gender: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          last_name: string
          notes: string | null
          previous_school: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          applied_grade?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          last_name: string
          notes?: string | null
          previous_school?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          applied_grade?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          first_name?: string
          gender?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          last_name?: string
          notes?: string | null
          previous_school?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_outcomes: {
        Row: {
          assessment_id: string
          learning_outcome_id: string
        }
        Insert: {
          assessment_id: string
          learning_outcome_id: string
        }
        Update: {
          assessment_id?: string
          learning_outcome_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_outcomes_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_outcomes_learning_outcome_id_fkey"
            columns: ["learning_outcome_id"]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string | null
          created_at: string
          due_date: string | null
          id: string
          max_marks: number
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string
          term_id: string | null
          title: string
          type: Database["public"]["Enums"]["assessment_type_enum"]
          weight: number
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          max_marks?: number
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          term_id?: string | null
          title: string
          type?: Database["public"]["Enums"]["assessment_type_enum"]
          weight?: number
        }
        Update: {
          class_id?: string | null
          created_at?: string
          due_date?: string | null
          id?: string
          max_marks?: number
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
          term_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["assessment_type_enum"]
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessments_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag: string
          assigned_to_staff_id: string | null
          category: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["asset_status_enum"]
          supplier_id: string | null
          tenant_id: string
          updated_at: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag: string
          assigned_to_staff_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status_enum"]
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string
          assigned_to_staff_id?: string | null
          category?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["asset_status_enum"]
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_assigned_to_staff_id_fkey"
            columns: ["assigned_to_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          arrival_time: string | null
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          marked_at: string
          notes: string | null
          notify_status: string
          period_id: string | null
          recorded_by: string | null
          source: string
          status: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          arrival_time?: string | null
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_at?: string
          notes?: string | null
          notify_status?: string
          period_id?: string | null
          recorded_by?: string | null
          source?: string
          status?: string
          student_id: string
          tenant_id: string
        }
        Update: {
          arrival_time?: string | null
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          marked_at?: string
          notes?: string | null
          notify_status?: string
          period_id?: string | null
          recorded_by?: string | null
          source?: string
          status?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          date: string
          id: string
          locked: boolean
          marked_at: string
          marked_by: string | null
          notes: string | null
          period_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          locked?: boolean
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          period_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          date?: string
          id?: string
          locked?: boolean
          marked_at?: string
          marked_by?: string | null
          notes?: string | null
          period_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          tenant_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_campaigns: {
        Row: {
          audience_filter: Json
          channels: Database["public"]["Enums"]["message_channel_enum"][]
          cost_currency: string | null
          created_at: string
          created_by: string | null
          delivered_count: number
          description: string | null
          failed_count: number
          id: string
          is_emergency: boolean
          name: string
          recipient_count: number
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number
          status: Database["public"]["Enums"]["campaign_status_enum"]
          template_id: string | null
          template_variables: Json | null
          tenant_id: string
          total_cost: number | null
          updated_at: string
        }
        Insert: {
          audience_filter?: Json
          channels?: Database["public"]["Enums"]["message_channel_enum"][]
          cost_currency?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          description?: string | null
          failed_count?: number
          id?: string
          is_emergency?: boolean
          name: string
          recipient_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["campaign_status_enum"]
          template_id?: string | null
          template_variables?: Json | null
          tenant_id: string
          total_cost?: number | null
          updated_at?: string
        }
        Update: {
          audience_filter?: Json
          channels?: Database["public"]["Enums"]["message_channel_enum"][]
          cost_currency?: string | null
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          description?: string | null
          failed_count?: number
          id?: string
          is_emergency?: boolean
          name?: string
          recipient_count?: number
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: Database["public"]["Enums"]["campaign_status_enum"]
          template_id?: string | null
          template_variables?: Json | null
          tenant_id?: string
          total_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "broadcast_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean | null
          audience: string
          category: string | null
          class_id: string | null
          color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string
          id: string
          location: string | null
          starts_at: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          all_day?: boolean | null
          audience?: string
          category?: string | null
          class_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at: string
          id?: string
          location?: string | null
          starts_at: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          all_day?: boolean | null
          audience?: string
          category?: string | null
          class_id?: string | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string
          id?: string
          location?: string | null
          starts_at?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cbc_assessment_scores: {
        Row: {
          comment: string | null
          id: string
          learning_outcome_id: string
          performance_level: number
          recorded_at: string
          student_id: string
          teacher_id: string | null
          tenant_id: string
          term_id: string | null
        }
        Insert: {
          comment?: string | null
          id?: string
          learning_outcome_id: string
          performance_level: number
          recorded_at?: string
          student_id: string
          teacher_id?: string | null
          tenant_id: string
          term_id?: string | null
        }
        Update: {
          comment?: string | null
          id?: string
          learning_outcome_id?: string
          performance_level?: number
          recorded_at?: string
          student_id?: string
          teacher_id?: string | null
          tenant_id?: string
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cbc_assessment_scores_learning_outcome_id_fkey"
            columns: ["learning_outcome_id"]
            isOneToOne: false
            referencedRelation: "learning_outcomes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbc_assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cbc_assessment_scores_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      cbc_values: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          periods_per_week: number
          preferred_room_id: string | null
          prefers_double_period: boolean
          subject_id: string
          teacher_id: string | null
          tenant_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          periods_per_week?: number
          preferred_room_id?: string | null
          prefers_double_period?: boolean
          subject_id: string
          teacher_id?: string | null
          tenant_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          periods_per_week?: number
          preferred_room_id?: string | null
          prefers_double_period?: boolean
          subject_id?: string
          teacher_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_subjects_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_preferred_room_id_fkey"
            columns: ["preferred_room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          class_teacher_id: string | null
          created_at: string | null
          current_enrollment: number
          grade_level: string | null
          grade_level_id: string | null
          id: string
          name: string
          room_id: string | null
          stream: string | null
          teacher_id: string | null
          tenant_id: string
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string | null
          current_enrollment?: number
          grade_level?: string | null
          grade_level_id?: string | null
          id?: string
          name: string
          room_id?: string | null
          stream?: string | null
          teacher_id?: string | null
          tenant_id: string
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          class_teacher_id?: string | null
          created_at?: string | null
          current_enrollment?: number
          grade_level?: string | null
          grade_level_id?: string | null
          id?: string
          name?: string
          room_id?: string | null
          stream?: string | null
          teacher_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_class_teacher_id_fkey"
            columns: ["class_teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_exports_log: {
        Row: {
          export_type: string
          generated_at: string
          generated_by: string | null
          id: string
          parameters: Json | null
          row_count: number | null
          tenant_id: string
        }
        Insert: {
          export_type: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          row_count?: number | null
          tenant_id: string
        }
        Update: {
          export_type?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          parameters?: Json | null
          row_count?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_exports_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          id: string
          ip_hash: string | null
          policy_version: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted: boolean
          id?: string
          ip_hash?: string | null
          policy_version?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          id?: string
          ip_hash?: string | null
          policy_version?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      core_competencies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      disciplinary_actions: {
        Row: {
          action_type: string
          created_at: string
          end_date: string | null
          id: string
          incident_id: string
          issued_by: string | null
          notes: string | null
          start_date: string | null
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          end_date?: string | null
          id?: string
          incident_id: string
          issued_by?: string | null
          notes?: string | null
          start_date?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          end_date?: string | null
          id?: string
          incident_id?: string
          issued_by?: string | null
          notes?: string | null
          start_date?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "discipline_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_incidents: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          incident_date: string
          incident_time: string | null
          location: string | null
          notify_status: string
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: number
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
          witnesses: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description: string
          id?: string
          incident_date?: string
          incident_time?: string | null
          location?: string | null
          notify_status?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
          witnesses?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          incident_date?: string
          incident_time?: string | null
          location?: string | null
          notify_status?: string
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: number
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
          witnesses?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_url: string
          id: string
          mime_type: string | null
          notes: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type_enum"]
          size_bytes: number | null
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_url: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type_enum"]
          size_bytes?: number | null
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_url?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["document_owner_type_enum"]
          size_bytes?: number | null
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      dpia_assessments: {
        Row: {
          assessor_name: string | null
          created_at: string
          data_categories: string[] | null
          id: string
          lawful_basis: string | null
          mitigations: Json | null
          next_review_at: string | null
          processing_activity: string
          residual_risk: string | null
          reviewed_at: string | null
          risks: Json | null
          status: string
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assessor_name?: string | null
          created_at?: string
          data_categories?: string[] | null
          id?: string
          lawful_basis?: string | null
          mitigations?: Json | null
          next_review_at?: string | null
          processing_activity: string
          residual_risk?: string | null
          reviewed_at?: string | null
          risks?: Json | null
          status?: string
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assessor_name?: string | null
          created_at?: string
          data_categories?: string[] | null
          id?: string
          lawful_basis?: string | null
          mitigations?: Json | null
          next_review_at?: string | null
          processing_activity?: string
          residual_risk?: string | null
          reviewed_at?: string | null
          risks?: Json | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dpia_assessments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean | null
          license_class: string | null
          license_expiry: string | null
          license_number: string | null
          notes: string | null
          phone: string | null
          staff_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean | null
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          staff_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          license_class?: string | null
          license_expiry?: string | null
          license_number?: string | null
          notes?: string | null
          phone?: string | null
          staff_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drivers_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      erasure_requests: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          erased_records_summary: Json | null
          id: string
          legal_basis_retention: string | null
          reason: string | null
          rejection_reason: string | null
          related_staff_id: string | null
          related_student_id: string | null
          requested_at: string
          status: Database["public"]["Enums"]["erasure_status_enum"]
          subject_email: string | null
          subject_name: string
          subject_type: Database["public"]["Enums"]["sar_subject_type_enum"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          erased_records_summary?: Json | null
          id?: string
          legal_basis_retention?: string | null
          reason?: string | null
          rejection_reason?: string | null
          related_staff_id?: string | null
          related_student_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["erasure_status_enum"]
          subject_email?: string | null
          subject_name: string
          subject_type: Database["public"]["Enums"]["sar_subject_type_enum"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          erased_records_summary?: Json | null
          id?: string
          legal_basis_retention?: string | null
          reason?: string | null
          rejection_reason?: string | null
          related_staff_id?: string | null
          related_student_id?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["erasure_status_enum"]
          subject_email?: string | null
          subject_name?: string
          subject_type?: Database["public"]["Enums"]["sar_subject_type_enum"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "erasure_requests_related_staff_id_fkey"
            columns: ["related_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erasure_requests_related_student_id_fkey"
            columns: ["related_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erasure_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_results: {
        Row: {
          created_at: string | null
          exam_id: string
          grade: string | null
          id: string
          remarks: string | null
          score: number | null
          student_id: string
          subject: string
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          remarks?: string | null
          score?: number | null
          student_id: string
          subject: string
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          remarks?: string | null
          score?: number | null
          student_id?: string
          subject?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_subjects: {
        Row: {
          created_at: string
          exam_id: string
          grading_scale_id: string | null
          id: string
          max_marks: number
          subject_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          exam_id: string
          grading_scale_id?: string | null
          id?: string
          max_marks?: number
          subject_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          exam_id?: string
          grading_scale_id?: string | null
          id?: string
          max_marks?: number
          subject_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_subjects_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_grading_scale_id_fkey"
            columns: ["grading_scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year: string | null
          created_at: string | null
          end_date: string | null
          id: string
          name: string
          start_date: string | null
          status: string | null
          tenant_id: string
          term: string | null
          term_id: string | null
          type: string | null
          weight: number | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
          status?: string | null
          tenant_id: string
          term?: string | null
          term_id?: string | null
          type?: string | null
          weight?: number | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
          status?: string | null
          tenant_id?: string
          term?: string | null
          term_id?: string | null
          type?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_approvals: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          expense_id: string
          id: string
          notes: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          expense_id: string
          id?: string
          notes?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          expense_id?: string
          id?: string
          notes?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_approvals_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_approvals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          code: string | null
          created_at: string
          gl_account_code: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          gl_account_code?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string | null
          created_at?: string
          gl_account_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_vendors: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          mpesa_number: string | null
          name: string
          notes: string | null
          tax_pin: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          mpesa_number?: string | null
          name: string
          notes?: string | null
          tax_pin?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          mpesa_number?: string | null
          name?: string
          notes?: string | null
          tax_pin?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_vendors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          attachment_url: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          expense_number: string | null
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: Database["public"]["Enums"]["expense_payment_method_enum"]
          payment_reference: string | null
          status: Database["public"]["Enums"]["expense_status_enum"]
          tax_amount: number
          tenant_id: string
          total_amount: number | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          expense_date?: string
          expense_number?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["expense_payment_method_enum"]
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["expense_status_enum"]
          tax_amount?: number
          tenant_id: string
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          attachment_url?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          expense_number?: string | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: Database["public"]["Enums"]["expense_payment_method_enum"]
          payment_reference?: string | null
          status?: Database["public"]["Enums"]["expense_status_enum"]
          tax_amount?: number
          tenant_id?: string
          total_amount?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "expense_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      face_attendance_sessions: {
        Row: {
          ai_notes: string | null
          capture_date: string
          class_id: string | null
          created_at: string
          created_by: string | null
          id: string
          marked_attendance: boolean | null
          matched_students: Json | null
          photo_path: string
          status: string
          tenant_id: string
          unmatched_faces: number | null
          updated_at: string
        }
        Insert: {
          ai_notes?: string | null
          capture_date?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          marked_attendance?: boolean | null
          matched_students?: Json | null
          photo_path: string
          status?: string
          tenant_id: string
          unmatched_faces?: number | null
          updated_at?: string
        }
        Update: {
          ai_notes?: string | null
          capture_date?: string
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          marked_attendance?: boolean | null
          matched_students?: Json | null
          photo_path?: string
          status?: string
          tenant_id?: string
          unmatched_faces?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      face_enrollments: {
        Row: {
          created_at: string
          enrolled_by: string | null
          id: string
          image_path: string
          is_primary: boolean | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          enrolled_by?: string | null
          id?: string
          image_path: string
          is_primary?: boolean | null
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          enrolled_by?: string | null
          id?: string
          image_path?: string
          is_primary?: boolean | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      fee_categories: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          key: Database["public"]["Enums"]["fee_category_enum"]
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          key: Database["public"]["Enums"]["fee_category_enum"]
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          key?: Database["public"]["Enums"]["fee_category_enum"]
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      fee_discounts: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string | null
          id: string
          invoice_id: string | null
          reason: string | null
          student_id: string | null
          tenant_id: string
          type: Database["public"]["Enums"]["discount_type_enum"]
          value: number
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          invoice_id?: string | null
          reason?: string | null
          student_id?: string | null
          tenant_id: string
          type?: Database["public"]["Enums"]["discount_type_enum"]
          value?: number
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string | null
          id?: string
          invoice_id?: string | null
          reason?: string | null
          student_id?: string | null
          tenant_id?: string
          type?: Database["public"]["Enums"]["discount_type_enum"]
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_discounts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_discounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_items: {
        Row: {
          amount: number
          applies_to_terms: Json | null
          category: Database["public"]["Enums"]["fee_category_enum"]
          created_at: string
          frequency: Database["public"]["Enums"]["fee_frequency_enum"]
          id: string
          is_mandatory: boolean
          late_fee_after_days: number | null
          late_fee_amount: number | null
          learner_category:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          name: string
          sort_order: number
          structure_id: string
          tenant_id: string
        }
        Insert: {
          amount?: number
          applies_to_terms?: Json | null
          category?: Database["public"]["Enums"]["fee_category_enum"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["fee_frequency_enum"]
          id?: string
          is_mandatory?: boolean
          late_fee_after_days?: number | null
          late_fee_amount?: number | null
          learner_category?:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          name: string
          sort_order?: number
          structure_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          applies_to_terms?: Json | null
          category?: Database["public"]["Enums"]["fee_category_enum"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["fee_frequency_enum"]
          id?: string
          is_mandatory?: boolean
          late_fee_after_days?: number | null
          late_fee_amount?: number | null
          learner_category?:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          name?: string
          sort_order?: number
          structure_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_items_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure_assignments: {
        Row: {
          class_id: string | null
          created_at: string
          grade_level_id: string | null
          id: string
          structure_id: string
          student_id: string | null
          tenant_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          grade_level_id?: string | null
          id?: string
          structure_id: string
          student_id?: string | null
          tenant_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          grade_level_id?: string | null
          id?: string
          structure_id?: string
          student_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structure_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_assignments_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_assignments_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_assignments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string | null
          applies_to: Database["public"]["Enums"]["structure_applies_to_enum"]
          class_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          grade_level_id: string | null
          id: string
          is_active: boolean
          learner_category:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          name: string
          notes: string | null
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          applies_to?: Database["public"]["Enums"]["structure_applies_to_enum"]
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          learner_category?:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          name: string
          notes?: string | null
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          applies_to?: Database["public"]["Enums"]["structure_applies_to_enum"]
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          learner_category?:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          name?: string
          notes?: string | null
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      goods_received_notes: {
        Row: {
          created_at: string
          delivery_note: string | null
          grn_number: string | null
          id: string
          notes: string | null
          po_id: string | null
          received_by: string | null
          received_date: string
          supplier_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_note?: string | null
          grn_number?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          received_by?: string | null
          received_date?: string
          supplier_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_note?: string | null
          grn_number?: string | null
          id?: string
          notes?: string | null
          po_id?: string | null
          received_by?: string | null
          received_date?: string
          supplier_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_received_notes_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_bands: {
        Row: {
          created_at: string
          grade: string
          grading_scale_id: string
          id: string
          max_pct: number
          min_pct: number
          points: number
          remark: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          grade: string
          grading_scale_id: string
          id?: string
          max_pct: number
          min_pct: number
          points?: number
          remark?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          grade?: string
          grading_scale_id?: string
          id?: string
          max_pct?: number
          min_pct?: number
          points?: number
          remark?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_bands_grading_scale_id_fkey"
            columns: ["grading_scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          sort_order: number
          stage: Database["public"]["Enums"]["grade_stage_enum"] | null
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["grade_stage_enum"] | null
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["grade_stage_enum"] | null
          tenant_id?: string
        }
        Relationships: []
      }
      grading_scales: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      grn_lines: {
        Row: {
          created_at: string
          description: string
          grn_id: string
          id: string
          po_line_id: string | null
          quantity_received: number
          stock_item_id: string | null
          tenant_id: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          grn_id: string
          id?: string
          po_line_id?: string | null
          quantity_received: number
          stock_item_id?: string | null
          tenant_id: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          description?: string
          grn_id?: string
          id?: string
          po_line_id?: string | null
          quantity_received?: number
          stock_item_id?: string | null
          tenant_id?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_lines_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "goods_received_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_po_line_id_fkey"
            columns: ["po_line_id"]
            isOneToOne: false
            referencedRelation: "po_lines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          email: string | null
          employer: string | null
          full_name: string
          id: string
          national_id_number: string | null
          occupation: string | null
          phone_primary: string | null
          phone_secondary: string | null
          photo_url: string | null
          portal_user_id: string | null
          residential_address: string | null
          tenant_id: string
          updated_at: string
          whatsapp_number: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          employer?: string | null
          full_name: string
          id?: string
          national_id_number?: string | null
          occupation?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          residential_address?: string | null
          tenant_id: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          employer?: string | null
          full_name?: string
          id?: string
          national_id_number?: string | null
          occupation?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          residential_address?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      health_visits: {
        Row: {
          attended_by: string | null
          blood_pressure: string | null
          complaint: string
          created_at: string
          diagnosis: string | null
          id: string
          notes: string | null
          pulse: number | null
          referred_to: string | null
          sent_home: boolean | null
          student_id: string
          temperature: number | null
          tenant_id: string
          treatment: string | null
          updated_at: string
          visit_date: string
          visit_time: string | null
        }
        Insert: {
          attended_by?: string | null
          blood_pressure?: string | null
          complaint: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          notes?: string | null
          pulse?: number | null
          referred_to?: string | null
          sent_home?: boolean | null
          student_id: string
          temperature?: number | null
          tenant_id: string
          treatment?: string | null
          updated_at?: string
          visit_date?: string
          visit_time?: string | null
        }
        Update: {
          attended_by?: string | null
          blood_pressure?: string | null
          complaint?: string
          created_at?: string
          diagnosis?: string | null
          id?: string
          notes?: string | null
          pulse?: number | null
          referred_to?: string | null
          sent_home?: boolean | null
          student_id?: string
          temperature?: number | null
          tenant_id?: string
          treatment?: string | null
          updated_at?: string
          visit_date?: string
          visit_time?: string | null
        }
        Relationships: []
      }
      hostel_allocations: {
        Row: {
          allocated_by: string | null
          bed_id: string
          created_at: string
          end_date: string | null
          hostel_id: string
          id: string
          notes: string | null
          room_id: string
          start_date: string
          status: Database["public"]["Enums"]["allocation_status_enum"]
          student_id: string
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          allocated_by?: string | null
          bed_id: string
          created_at?: string
          end_date?: string | null
          hostel_id: string
          id?: string
          notes?: string | null
          room_id: string
          start_date?: string
          status?: Database["public"]["Enums"]["allocation_status_enum"]
          student_id: string
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          allocated_by?: string | null
          bed_id?: string
          created_at?: string
          end_date?: string | null
          hostel_id?: string
          id?: string
          notes?: string | null
          room_id?: string
          start_date?: string
          status?: Database["public"]["Enums"]["allocation_status_enum"]
          student_id?: string
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_allocations_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "hostel_beds"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_bedding_inventory: {
        Row: {
          bed_id: string | null
          condition: string | null
          created_at: string
          hostel_id: string
          id: string
          item_name: string
          last_checked_at: string | null
          notes: string | null
          quantity: number
          room_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bed_id?: string | null
          condition?: string | null
          created_at?: string
          hostel_id: string
          id?: string
          item_name: string
          last_checked_at?: string | null
          notes?: string | null
          quantity?: number
          room_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bed_id?: string | null
          condition?: string | null
          created_at?: string
          hostel_id?: string
          id?: string
          item_name?: string
          last_checked_at?: string | null
          notes?: string | null
          quantity?: number
          room_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_bedding_inventory_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "hostel_beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_bedding_inventory_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_bedding_inventory_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_beds: {
        Row: {
          bed_label: string
          created_at: string
          hostel_id: string
          id: string
          notes: string | null
          room_id: string
          status: Database["public"]["Enums"]["bed_status_enum"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          bed_label: string
          created_at?: string
          hostel_id: string
          id?: string
          notes?: string | null
          room_id: string
          status?: Database["public"]["Enums"]["bed_status_enum"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          bed_label?: string
          created_at?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          room_id?: string
          status?: Database["public"]["Enums"]["bed_status_enum"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_beds_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_out_passes: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checked_out_at: string | null
          checked_out_by: string | null
          created_at: string
          destination: string | null
          expected_return_at: string
          guardian_id: string | null
          guardian_response_at: string | null
          guardian_response_note: string | null
          hostel_id: string | null
          id: string
          leave_at: string
          notes: string | null
          reason: string
          requested_at: string
          requested_by: string | null
          returned_at: string | null
          returned_by: string | null
          status: Database["public"]["Enums"]["out_pass_status_enum"]
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          created_at?: string
          destination?: string | null
          expected_return_at: string
          guardian_id?: string | null
          guardian_response_at?: string | null
          guardian_response_note?: string | null
          hostel_id?: string | null
          id?: string
          leave_at: string
          notes?: string | null
          reason: string
          requested_at?: string
          requested_by?: string | null
          returned_at?: string | null
          returned_by?: string | null
          status?: Database["public"]["Enums"]["out_pass_status_enum"]
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checked_out_at?: string | null
          checked_out_by?: string | null
          created_at?: string
          destination?: string | null
          expected_return_at?: string
          guardian_id?: string | null
          guardian_response_at?: string | null
          guardian_response_note?: string | null
          hostel_id?: string | null
          id?: string
          leave_at?: string
          notes?: string | null
          reason?: string
          requested_at?: string
          requested_by?: string | null
          returned_at?: string | null
          returned_by?: string | null
          status?: Database["public"]["Enums"]["out_pass_status_enum"]
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      hostel_roll_call_entries: {
        Row: {
          id: string
          marked_at: string
          notes: string | null
          roll_call_id: string
          status: Database["public"]["Enums"]["roll_call_status_enum"]
          student_id: string
          tenant_id: string
        }
        Insert: {
          id?: string
          marked_at?: string
          notes?: string | null
          roll_call_id: string
          status?: Database["public"]["Enums"]["roll_call_status_enum"]
          student_id: string
          tenant_id: string
        }
        Update: {
          id?: string
          marked_at?: string
          notes?: string | null
          roll_call_id?: string
          status?: Database["public"]["Enums"]["roll_call_status_enum"]
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_roll_call_entries_roll_call_id_fkey"
            columns: ["roll_call_id"]
            isOneToOne: false
            referencedRelation: "hostel_roll_calls"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_roll_calls: {
        Row: {
          conducted_by: string | null
          created_at: string
          ended_at: string | null
          hostel_id: string
          id: string
          notes: string | null
          session_date: string
          session_type: Database["public"]["Enums"]["roll_call_type_enum"]
          started_at: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          conducted_by?: string | null
          created_at?: string
          ended_at?: string | null
          hostel_id: string
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: Database["public"]["Enums"]["roll_call_type_enum"]
          started_at?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          conducted_by?: string | null
          created_at?: string
          ended_at?: string | null
          hostel_id?: string
          id?: string
          notes?: string | null
          session_date?: string
          session_type?: Database["public"]["Enums"]["roll_call_type_enum"]
          started_at?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_roll_calls_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_rooms: {
        Row: {
          capacity: number
          created_at: string
          floor: string | null
          hostel_id: string
          id: string
          notes: string | null
          room_number: string
          room_type: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          floor?: string | null
          hostel_id: string
          id?: string
          notes?: string | null
          room_number: string
          room_type?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          capacity?: number
          created_at?: string
          floor?: string | null
          hostel_id?: string
          id?: string
          notes?: string | null
          room_number?: string
          room_type?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_rooms_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_visitors: {
        Row: {
          checked_in_at: string
          checked_out_at: string | null
          created_at: string
          hostel_id: string | null
          id: string
          notes: string | null
          purpose: string | null
          recorded_by: string | null
          relationship: string | null
          student_id: string | null
          tenant_id: string
          visitor_id_number: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          hostel_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          recorded_by?: string | null
          relationship?: string | null
          student_id?: string | null
          tenant_id: string
          visitor_id_number?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          checked_in_at?: string
          checked_out_at?: string | null
          created_at?: string
          hostel_id?: string | null
          id?: string
          notes?: string | null
          purpose?: string | null
          recorded_by?: string | null
          relationship?: string | null
          student_id?: string | null
          tenant_id?: string
          visitor_id_number?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_visitors_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          capacity: number
          code: string | null
          created_at: string
          gender: Database["public"]["Enums"]["hostel_gender_enum"]
          id: string
          is_active: boolean
          location: string | null
          matron_name: string | null
          matron_phone: string | null
          name: string
          notes: string | null
          tenant_id: string
          updated_at: string
          warden_staff_id: string | null
        }
        Insert: {
          capacity?: number
          code?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["hostel_gender_enum"]
          id?: string
          is_active?: boolean
          location?: string | null
          matron_name?: string | null
          matron_phone?: string | null
          name: string
          notes?: string | null
          tenant_id: string
          updated_at?: string
          warden_staff_id?: string | null
        }
        Update: {
          capacity?: number
          code?: string | null
          created_at?: string
          gender?: Database["public"]["Enums"]["hostel_gender_enum"]
          id?: string
          is_active?: boolean
          location?: string | null
          matron_name?: string | null
          matron_phone?: string | null
          name?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string
          warden_staff_id?: string | null
        }
        Relationships: []
      }
      immunization_records: {
        Row: {
          administered_by: string | null
          batch_number: string | null
          created_at: string
          date_given: string
          dose_number: number | null
          id: string
          next_due_date: string | null
          notes: string | null
          student_id: string
          tenant_id: string
          vaccine_name: string
        }
        Insert: {
          administered_by?: string | null
          batch_number?: string | null
          created_at?: string
          date_given: string
          dose_number?: number | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          student_id: string
          tenant_id: string
          vaccine_name: string
        }
        Update: {
          administered_by?: string | null
          batch_number?: string | null
          created_at?: string
          date_given?: string
          dose_number?: number | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          student_id?: string
          tenant_id?: string
          vaccine_name?: string
        }
        Relationships: []
      }
      import_mappings: {
        Row: {
          created_at: string
          header_signature: string
          id: string
          last_used_at: string
          mapping: Json
          source_type: string
          tenant_id: string
          use_count: number
        }
        Insert: {
          created_at?: string
          header_signature: string
          id?: string
          last_used_at?: string
          mapping?: Json
          source_type?: string
          tenant_id: string
          use_count?: number
        }
        Update: {
          created_at?: string
          header_signature?: string
          id?: string
          last_used_at?: string
          mapping?: Json
          source_type?: string
          tenant_id?: string
          use_count?: number
        }
        Relationships: []
      }
      inventory_assets: {
        Row: {
          category: string | null
          condition: string
          created_at: string | null
          id: string
          last_audit_date: string | null
          location: string | null
          name: string
          quantity: number | null
          tenant_id: string
          value: number | null
        }
        Insert: {
          category?: string | null
          condition?: string
          created_at?: string | null
          id?: string
          last_audit_date?: string | null
          location?: string | null
          name: string
          quantity?: number | null
          tenant_id: string
          value?: number | null
        }
        Update: {
          category?: string | null
          condition?: string
          created_at?: string | null
          id?: string
          last_audit_date?: string | null
          location?: string | null
          name?: string
          quantity?: number | null
          tenant_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_assets_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academic_year: string | null
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          paid_amount: number | null
          status: string | null
          student_id: string
          tenant_id: string
          term: string | null
        }
        Insert: {
          academic_year?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          paid_amount?: number | null
          status?: string | null
          student_id: string
          tenant_id: string
          term?: string | null
        }
        Update: {
          academic_year?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          paid_amount?: number | null
          status?: string | null
          student_id?: string
          tenant_id?: string
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_areas: {
        Row: {
          code: string
          created_at: string
          grade_level_id: string | null
          id: string
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          grade_level_id?: string | null
          id?: string
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          grade_level_id?: string | null
          id?: string
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_areas_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_outcomes: {
        Row: {
          code: string | null
          created_at: string
          description: string
          id: string
          sort_order: number
          sub_strand_id: string
          tenant_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description: string
          id?: string
          sort_order?: number
          sub_strand_id: string
          tenant_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          sub_strand_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_sub_strand_id_fkey"
            columns: ["sub_strand_id"]
            isOneToOne: false
            referencedRelation: "sub_strands"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          assessment: string | null
          class_id: string | null
          conclusion: string | null
          created_at: string
          date: string
          development: string | null
          hod_id: string | null
          hod_status: Database["public"]["Enums"]["lesson_status_enum"]
          homework: string | null
          id: string
          introduction: string | null
          learning_outcome_ids: string[] | null
          materials: string | null
          objectives: string | null
          period_id: string | null
          reflection: string | null
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assessment?: string | null
          class_id?: string | null
          conclusion?: string | null
          created_at?: string
          date: string
          development?: string | null
          hod_id?: string | null
          hod_status?: Database["public"]["Enums"]["lesson_status_enum"]
          homework?: string | null
          id?: string
          introduction?: string | null
          learning_outcome_ids?: string[] | null
          materials?: string | null
          objectives?: string | null
          period_id?: string | null
          reflection?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assessment?: string | null
          class_id?: string | null
          conclusion?: string | null
          created_at?: string
          date?: string
          development?: string | null
          hod_id?: string | null
          hod_status?: Database["public"]["Enums"]["lesson_status_enum"]
          homework?: string | null
          id?: string
          introduction?: string | null
          learning_outcome_ids?: string[] | null
          materials?: string | null
          objectives?: string | null
          period_id?: string | null
          reflection?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plans_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_plans_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          created_at: string | null
          due_date: string | null
          id: string
          isbn: string | null
          issued_to: string | null
          shelf_location: string | null
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          isbn?: string | null
          issued_to?: string | null
          shelf_location?: string | null
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          due_date?: string | null
          id?: string
          isbn?: string | null
          issued_to?: string | null
          shelf_location?: string | null
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_books_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      library_items: {
        Row: {
          author: string | null
          available_copies: number
          barcode: string | null
          category: string | null
          cover_url: string | null
          created_at: string
          edition: string | null
          id: string
          isbn: string | null
          language: string | null
          location: string | null
          notes: string | null
          publish_year: number | null
          publisher: string | null
          status: Database["public"]["Enums"]["library_item_status_enum"]
          tenant_id: string
          title: string
          total_copies: number
          updated_at: string
        }
        Insert: {
          author?: string | null
          available_copies?: number
          barcode?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          edition?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          location?: string | null
          notes?: string | null
          publish_year?: number | null
          publisher?: string | null
          status?: Database["public"]["Enums"]["library_item_status_enum"]
          tenant_id: string
          title: string
          total_copies?: number
          updated_at?: string
        }
        Update: {
          author?: string | null
          available_copies?: number
          barcode?: string | null
          category?: string | null
          cover_url?: string | null
          created_at?: string
          edition?: string | null
          id?: string
          isbn?: string | null
          language?: string | null
          location?: string | null
          notes?: string | null
          publish_year?: number | null
          publisher?: string | null
          status?: Database["public"]["Enums"]["library_item_status_enum"]
          tenant_id?: string
          title?: string
          total_copies?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      library_loans: {
        Row: {
          borrower_type: string
          checked_out_at: string
          created_at: string
          due_date: string
          fine_amount: number
          fine_paid: boolean
          id: string
          issued_by: string | null
          item_id: string
          notes: string | null
          returned_at: string | null
          returned_by: string | null
          staff_id: string | null
          status: Database["public"]["Enums"]["library_loan_status_enum"]
          student_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          borrower_type: string
          checked_out_at?: string
          created_at?: string
          due_date: string
          fine_amount?: number
          fine_paid?: boolean
          id?: string
          issued_by?: string | null
          item_id: string
          notes?: string | null
          returned_at?: string | null
          returned_by?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["library_loan_status_enum"]
          student_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          borrower_type?: string
          checked_out_at?: string
          created_at?: string
          due_date?: string
          fine_amount?: number
          fine_paid?: boolean
          id?: string
          issued_by?: string | null
          item_id?: string
          notes?: string | null
          returned_at?: string | null
          returned_by?: string | null
          staff_id?: string | null
          status?: Database["public"]["Enums"]["library_loan_status_enum"]
          student_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_loans_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_administration: {
        Row: {
          administered_at: string
          administered_by: string | null
          created_at: string
          dose: string | null
          id: string
          medication_name: string
          notes: string | null
          reason: string | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          dose?: string | null
          id?: string
          medication_name: string
          notes?: string | null
          reason?: string | null
          student_id: string
          tenant_id: string
        }
        Update: {
          administered_at?: string
          administered_by?: string | null
          created_at?: string
          dose?: string | null
          id?: string
          medication_name?: string
          notes?: string | null
          reason?: string | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      merit_points: {
        Row: {
          awarded_by: string | null
          awarded_date: string
          category: string
          created_at: string
          id: string
          points: number
          reason: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          awarded_by?: string | null
          awarded_date?: string
          category?: string
          created_at?: string
          id?: string
          points?: number
          reason: string
          student_id: string
          tenant_id: string
        }
        Update: {
          awarded_by?: string | null
          awarded_date?: string
          category?: string
          created_at?: string
          id?: string
          points?: number
          reason?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      message_opt_outs: {
        Row: {
          address: string
          channel: Database["public"]["Enums"]["message_channel_enum"]
          id: string
          opted_out_at: string
          reason: string | null
          tenant_id: string
        }
        Insert: {
          address: string
          channel: Database["public"]["Enums"]["message_channel_enum"]
          id?: string
          opted_out_at?: string
          reason?: string | null
          tenant_id: string
        }
        Update: {
          address?: string
          channel?: Database["public"]["Enums"]["message_channel_enum"]
          id?: string
          opted_out_at?: string
          reason?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_opt_outs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body: string
          category: Database["public"]["Enums"]["template_category_enum"]
          channel: Database["public"]["Enums"]["message_channel_enum"]
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name: string
          slug: string
          subject: string | null
          tenant_id: string
          updated_at: string
          variables: Json
          whatsapp_language: string | null
          whatsapp_template_name: string | null
        }
        Insert: {
          body: string
          category?: Database["public"]["Enums"]["template_category_enum"]
          channel: Database["public"]["Enums"]["message_channel_enum"]
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name: string
          slug: string
          subject?: string | null
          tenant_id: string
          updated_at?: string
          variables?: Json
          whatsapp_language?: string | null
          whatsapp_template_name?: string | null
        }
        Update: {
          body?: string
          category?: Database["public"]["Enums"]["template_category_enum"]
          channel?: Database["public"]["Enums"]["message_channel_enum"]
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name?: string
          slug?: string
          subject?: string | null
          tenant_id?: string
          updated_at?: string
          variables?: Json
          whatsapp_language?: string | null
          whatsapp_template_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          campaign_id: string | null
          channel: Database["public"]["Enums"]["message_channel_enum"]
          cost: number | null
          cost_currency: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_message_id: string | null
          read_at: string | null
          recipient_address: string | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: Database["public"]["Enums"]["message_recipient_type_enum"]
          retry_count: number
          scheduled_for: string | null
          sender_user_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status_enum"]
          student_id: string | null
          subject: string | null
          template_id: string | null
          template_variables: Json | null
          tenant_id: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          channel: Database["public"]["Enums"]["message_channel_enum"]
          cost?: number | null
          cost_currency?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_address?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type: Database["public"]["Enums"]["message_recipient_type_enum"]
          retry_count?: number
          scheduled_for?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status_enum"]
          student_id?: string | null
          subject?: string | null
          template_id?: string | null
          template_variables?: Json | null
          tenant_id: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          channel?: Database["public"]["Enums"]["message_channel_enum"]
          cost?: number | null
          cost_currency?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          recipient_address?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_type?: Database["public"]["Enums"]["message_recipient_type_enum"]
          retry_count?: number
          scheduled_for?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["message_status_enum"]
          student_id?: string | null
          subject?: string | null
          template_id?: string | null
          template_variables?: Json | null
          tenant_id?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_fk"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "message_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "messaging_inbox_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      messaging_inbox_threads: {
        Row: {
          assigned_to: string | null
          channel: Database["public"]["Enums"]["message_channel_enum"]
          contact_address: string
          contact_name: string | null
          created_at: string
          id: string
          last_message_at: string
          last_message_preview: string | null
          status: string
          student_id: string | null
          tenant_id: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel: Database["public"]["Enums"]["message_channel_enum"]
          contact_address: string
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: Database["public"]["Enums"]["message_channel_enum"]
          contact_address?: string
          contact_name?: string | null
          created_at?: string
          id?: string
          last_message_at?: string
          last_message_preview?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaging_inbox_threads_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaging_inbox_threads_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_config: {
        Row: {
          callback_url: string | null
          consumer_key: string | null
          consumer_secret: string | null
          created_at: string
          environment: string
          id: string
          initiator_name: string | null
          is_active: boolean
          passkey: string | null
          security_credential: string | null
          shortcode: string | null
          shortcode_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          callback_url?: string | null
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          passkey?: string | null
          security_credential?: string | null
          shortcode?: string | null
          shortcode_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          callback_url?: string | null
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          passkey?: string | null
          security_credential?: string | null
          shortcode?: string | null
          shortcode_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mpesa_stk_requests: {
        Row: {
          account_reference: string | null
          amount: number
          checkout_request_id: string | null
          created_at: string
          id: string
          invoice_id: string | null
          merchant_request_id: string | null
          mpesa_receipt: string | null
          phone: string
          result_code: string | null
          result_desc: string | null
          status: string
          student_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          account_reference?: string | null
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          phone: string
          result_code?: string | null
          result_desc?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          account_reference?: string | null
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          invoice_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt?: string | null
          phone?: string
          result_code?: string | null
          result_desc?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      mpesa_transactions: {
        Row: {
          account_reference: string | null
          account_reference_raw: string | null
          amount: number
          bill_ref_number: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          matched_invoice_id: string | null
          matched_payment_id: string | null
          matched_student_id: string | null
          middle_name: string | null
          mpesa_receipt: string
          org_account_balance: number | null
          phone: string | null
          raw_payload: Json | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          tenant_id: string
          transaction_time: string
          transaction_type: string | null
        }
        Insert: {
          account_reference?: string | null
          account_reference_raw?: string | null
          amount?: number
          bill_ref_number?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_invoice_id?: string | null
          matched_payment_id?: string | null
          matched_student_id?: string | null
          middle_name?: string | null
          mpesa_receipt: string
          org_account_balance?: number | null
          phone?: string | null
          raw_payload?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id: string
          transaction_time?: string
          transaction_type?: string | null
        }
        Update: {
          account_reference?: string | null
          account_reference_raw?: string | null
          amount?: number
          bill_ref_number?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_invoice_id?: string | null
          matched_payment_id?: string | null
          matched_student_id?: string | null
          middle_name?: string | null
          mpesa_receipt?: string
          org_account_balance?: number | null
          phone?: string | null
          raw_payload?: Json | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          tenant_id?: string
          transaction_time?: string
          transaction_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_transactions_matched_payment_id_fkey"
            columns: ["matched_payment_id"]
            isOneToOne: false
            referencedRelation: "student_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      nemis_credentials: {
        Row: {
          created_at: string
          last_synced_at: string | null
          password_ciphertext: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
          username: string
        }
        Insert: {
          created_at?: string
          last_synced_at?: string | null
          password_ciphertext: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          username: string
        }
        Update: {
          created_at?: string
          last_synced_at?: string | null
          password_ciphertext?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "nemis_credentials_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          id: string
          language: string | null
          preferences: Json
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language?: string | null
          preferences?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string | null
          preferences?: Json
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          category: Database["public"]["Enums"]["notification_category_enum"]
          created_at: string
          icon: string | null
          id: string
          metadata: Json | null
          read_at: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category_enum"]
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          tenant_id: string
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: Database["public"]["Enums"]["notification_category_enum"]
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          read_at?: string | null
          tenant_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_grading_jobs: {
        Row: {
          ai_notes: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          exam_id: string | null
          id: string
          image_path: string
          max_marks: number | null
          per_question: Json | null
          posted_to_gradebook: boolean | null
          status: string
          student_id: string | null
          subject_id: string | null
          tenant_id: string
          total_marks: number | null
          updated_at: string
        }
        Insert: {
          ai_notes?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          exam_id?: string | null
          id?: string
          image_path: string
          max_marks?: number | null
          per_question?: Json | null
          posted_to_gradebook?: boolean | null
          status?: string
          student_id?: string | null
          subject_id?: string | null
          tenant_id: string
          total_marks?: number | null
          updated_at?: string
        }
        Update: {
          ai_notes?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          exam_id?: string | null
          id?: string
          image_path?: string
          max_marks?: number | null
          per_question?: Json | null
          posted_to_gradebook?: boolean | null
          status?: string
          student_id?: string | null
          subject_id?: string | null
          tenant_id?: string
          total_marks?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          amount: number
          created_at: string
          id: string
          invoice_id: string
          payment_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          payment_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          payment_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "student_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_reminders_config: {
        Row: {
          channels: Database["public"]["Enums"]["reminder_channel_enum"][]
          days_after_due: number[]
          days_before_due: number[]
          is_active: boolean
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channels?: Database["public"]["Enums"]["reminder_channel_enum"][]
          days_after_due?: number[]
          days_before_due?: number[]
          is_active?: boolean
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channels?: Database["public"]["Enums"]["reminder_channel_enum"][]
          days_after_due?: number[]
          days_before_due?: number[]
          is_active?: boolean
          tenant_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_periods: {
        Row: {
          created_at: string
          id: string
          month: number
          notes: string | null
          pay_date: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          tenant_id: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          id?: string
          month: number
          notes?: string | null
          pay_date?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          id?: string
          month?: number
          notes?: string | null
          pay_date?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          basic_salary: number
          created_at: string
          detail: Json
          gross_pay: number
          house_allowance: number
          housing_levy: number
          id: string
          net_pay: number
          nssf: number
          other_allowances: number
          other_deductions: number
          paid_at: string | null
          paye: number
          payment_method: string | null
          payment_reference: string | null
          pdf_url: string | null
          period_id: string
          shif: number
          staff_id: string
          status: string
          taxable_pay: number
          tenant_id: string
          total_deductions: number
          transport_allowance: number
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          detail?: Json
          gross_pay?: number
          house_allowance?: number
          housing_levy?: number
          id?: string
          net_pay?: number
          nssf?: number
          other_allowances?: number
          other_deductions?: number
          paid_at?: string | null
          paye?: number
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_id: string
          shif?: number
          staff_id: string
          status?: string
          taxable_pay?: number
          tenant_id: string
          total_deductions?: number
          transport_allowance?: number
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          created_at?: string
          detail?: Json
          gross_pay?: number
          house_allowance?: number
          housing_levy?: number
          id?: string
          net_pay?: number
          nssf?: number
          other_allowances?: number
          other_deductions?: number
          paid_at?: string | null
          paye?: number
          payment_method?: string | null
          payment_reference?: string | null
          pdf_url?: string | null
          period_id?: string
          shif?: number
          staff_id?: string
          status?: string
          taxable_pay?: number
          tenant_id?: string
          total_deductions?: number
          transport_allowance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      periods: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_break: boolean
          name: string
          sort_order: number
          start_time: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_break?: boolean
          name: string
          sort_order?: number
          start_time: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_break?: boolean
          name?: string
          sort_order?: number
          start_time?: string
          tenant_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          category: string | null
          description: string | null
          id: string
          key: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          key: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          key?: string
        }
        Relationships: []
      }
      po_lines: {
        Row: {
          created_at: string
          description: string
          id: string
          line_total: number
          po_id: string
          quantity: number
          received_qty: number
          stock_item_id: string | null
          tenant_id: string
          unit: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          line_total?: number
          po_id: string
          quantity: number
          received_qty?: number
          stock_item_id?: string | null
          tenant_id: string
          unit?: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          line_total?: number
          po_id?: string
          quantity?: number
          received_qty?: number
          stock_item_id?: string | null
          tenant_id?: string
          unit?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_lines_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_lines_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "po_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          phone: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          phone: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      privacy_policies: {
        Row: {
          body_markdown: string
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          kind: Database["public"]["Enums"]["policy_kind_enum"]
          published_at: string | null
          tenant_id: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          body_markdown: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          kind: Database["public"]["Enums"]["policy_kind_enum"]
          published_at?: string | null
          tenant_id: string
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          body_markdown?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          kind?: Database["public"]["Enums"]["policy_kind_enum"]
          published_at?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "privacy_policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          default_tenant_id: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          default_tenant_id?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          default_tenant_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["default_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_pricing: {
        Row: {
          channel: Database["public"]["Enums"]["message_channel_enum"]
          country_code: string
          currency: string
          id: string
          is_active: boolean
          notes: string | null
          provider: string
          tenant_id: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["message_channel_enum"]
          country_code?: string
          currency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          provider: string
          tenant_id?: string | null
          unit_price: number
          updated_at?: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["message_channel_enum"]
          country_code?: string
          currency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          provider?: string
          tenant_id?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_pricing_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string | null
          requisition_id: string | null
          status: Database["public"]["Enums"]["po_status_enum"]
          subtotal: number
          supplier_id: string | null
          tax_total: number
          tenant_id: string
          total: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string | null
          requisition_id?: string | null
          status?: Database["public"]["Enums"]["po_status_enum"]
          subtotal?: number
          supplier_id?: string | null
          tax_total?: number
          tenant_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string | null
          requisition_id?: string | null
          status?: Database["public"]["Enums"]["po_status_enum"]
          subtotal?: number
          supplier_id?: string | null
          tax_total?: number
          tenant_id?: string
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          tenant_id: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          tenant_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          tenant_id?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reminder_log: {
        Row: {
          channel: Database["public"]["Enums"]["reminder_channel_enum"]
          error: string | null
          id: string
          invoice_id: string | null
          message: string | null
          recipient: string | null
          sent_at: string
          status: string
          student_id: string | null
          tenant_id: string
        }
        Insert: {
          channel: Database["public"]["Enums"]["reminder_channel_enum"]
          error?: string | null
          id?: string
          invoice_id?: string | null
          message?: string | null
          recipient?: string | null
          sent_at?: string
          status?: string
          student_id?: string | null
          tenant_id: string
        }
        Update: {
          channel?: Database["public"]["Enums"]["reminder_channel_enum"]
          error?: string | null
          id?: string
          invoice_id?: string | null
          message?: string | null
          recipient?: string | null
          sent_at?: string
          status?: string
          student_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reminder_log_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_log_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_runs: {
        Row: {
          class_id: string | null
          completed: number
          created_at: string
          error: string | null
          id: string
          requested_by: string | null
          status: Database["public"]["Enums"]["report_run_status_enum"]
          template_id: string | null
          tenant_id: string
          term_id: string | null
          total: number
          updated_at: string
          zip_url: string | null
        }
        Insert: {
          class_id?: string | null
          completed?: number
          created_at?: string
          error?: string | null
          id?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["report_run_status_enum"]
          template_id?: string | null
          tenant_id: string
          term_id?: string | null
          total?: number
          updated_at?: string
          zip_url?: string | null
        }
        Update: {
          class_id?: string | null
          completed?: number
          created_at?: string
          error?: string | null
          id?: string
          requested_by?: string | null
          status?: Database["public"]["Enums"]["report_run_status_enum"]
          template_id?: string | null
          tenant_id?: string
          term_id?: string | null
          total?: number
          updated_at?: string
          zip_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_card_runs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_card_runs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_card_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_card_runs_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      report_card_templates: {
        Row: {
          created_at: string
          curriculum_kind: string
          id: string
          is_default: boolean
          layout: Json
          name: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          curriculum_kind?: string
          id?: string
          is_default?: boolean
          layout?: Json
          name: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          curriculum_kind?: string
          id?: string
          is_default?: boolean
          layout?: Json
          name?: string
          tenant_id?: string
        }
        Relationships: []
      }
      report_cards: {
        Row: {
          created_at: string
          error: string | null
          id: string
          pdf_url: string | null
          run_id: string
          status: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          pdf_url?: string | null
          run_id: string
          status?: string
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          pdf_url?: string | null
          run_id?: string
          status?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "report_card_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      requisition_lines: {
        Row: {
          created_at: string
          description: string
          estimated_total: number
          estimated_unit_cost: number
          id: string
          quantity: number
          requisition_id: string
          stock_item_id: string | null
          tenant_id: string
          unit: string
        }
        Insert: {
          created_at?: string
          description: string
          estimated_total?: number
          estimated_unit_cost?: number
          id?: string
          quantity: number
          requisition_id: string
          stock_item_id?: string | null
          tenant_id: string
          unit?: string
        }
        Update: {
          created_at?: string
          description?: string
          estimated_total?: number
          estimated_unit_cost?: number
          id?: string
          quantity?: number
          requisition_id?: string
          stock_item_id?: string | null
          tenant_id?: string
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisition_lines_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_lines_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisition_lines_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          department: string | null
          id: string
          is_auto_generated: boolean
          justification: string | null
          needed_by: string | null
          rejection_reason: string | null
          requested_by: string | null
          requisition_number: string | null
          status: Database["public"]["Enums"]["requisition_status_enum"]
          tenant_id: string
          total_estimated: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_auto_generated?: boolean
          justification?: string | null
          needed_by?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          requisition_number?: string | null
          status?: Database["public"]["Enums"]["requisition_status_enum"]
          tenant_id: string
          total_estimated?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          department?: string | null
          id?: string
          is_auto_generated?: boolean
          justification?: string | null
          needed_by?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          requisition_number?: string | null
          status?: Database["public"]["Enums"]["requisition_status_enum"]
          tenant_id?: string
          total_estimated?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_bookings: {
        Row: {
          booked_by: string | null
          created_at: string
          ends_at: string
          event_id: string | null
          id: string
          purpose: string | null
          resource_name: string
          resource_type: string
          starts_at: string
          tenant_id: string
        }
        Insert: {
          booked_by?: string | null
          created_at?: string
          ends_at: string
          event_id?: string | null
          id?: string
          purpose?: string | null
          resource_name: string
          resource_type: string
          starts_at: string
          tenant_id: string
        }
        Update: {
          booked_by?: string | null
          created_at?: string
          ends_at?: string
          event_id?: string | null
          id?: string
          purpose?: string | null
          resource_name?: string
          resource_type?: string
          starts_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookings_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission_id: string
          role_id: string
        }
        Insert: {
          permission_id: string
          role_id: string
        }
        Update: {
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          tenant_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          tenant_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["room_type_enum"]
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          name: string
          tenant_id: string
          type?: Database["public"]["Enums"]["room_type_enum"]
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          name?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["room_type_enum"]
        }
        Relationships: []
      }
      route_assignments: {
        Row: {
          conductor_id: string | null
          created_at: string
          driver_id: string | null
          effective_from: string
          effective_to: string | null
          id: string
          route_id: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          conductor_id?: string | null
          created_at?: string
          driver_id?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          route_id: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          conductor_id?: string | null
          created_at?: string
          driver_id?: string | null
          effective_from?: string
          effective_to?: string | null
          id?: string
          route_id?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_assignments_conductor_id_fkey"
            columns: ["conductor_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes_of_work: {
        Row: {
          approved_by: string | null
          created_at: string
          file_url: string | null
          grade_level_id: string | null
          id: string
          rich_text: string | null
          status: Database["public"]["Enums"]["scheme_status_enum"]
          subject_id: string | null
          tenant_id: string
          term_id: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          file_url?: string | null
          grade_level_id?: string | null
          id?: string
          rich_text?: string | null
          status?: Database["public"]["Enums"]["scheme_status_enum"]
          subject_id?: string | null
          tenant_id: string
          term_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          file_url?: string | null
          grade_level_id?: string | null
          id?: string
          rich_text?: string | null
          status?: Database["public"]["Enums"]["scheme_status_enum"]
          subject_id?: string | null
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schemes_of_work_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schemes_of_work_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schemes_of_work_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      scholarships: {
        Row: {
          amount: number
          created_at: string
          eligibility_criteria: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["discount_type_enum"]
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          eligibility_criteria?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          type?: Database["public"]["Enums"]["discount_type_enum"]
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          eligibility_criteria?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["discount_type_enum"]
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          address: string | null
          bank_account_number: string | null
          bank_branch: string | null
          bank_name: string | null
          classes_taught: Json | null
          created_at: string | null
          date_employed: string | null
          date_of_birth: string | null
          date_of_confirmation: string | null
          department: string | null
          email: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          ethiopia_employee_id: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_enum"] | null
          gross_salary: number | null
          highest_qualification: string | null
          hire_date: string | null
          id: string
          institution: string | null
          job_title: string | null
          kra_pin: string | null
          last_name: string
          middle_name: string | null
          national_id_number: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relation: string | null
          nhif_or_shif_number: string | null
          nssf_number: string | null
          phone: string | null
          photo_url: string | null
          professional_certifications: Json | null
          reports_to: string | null
          role: string | null
          rwanda_rssb_number: string | null
          salary_scale: string | null
          staff_number: string | null
          status: string | null
          subjects_taught: Json | null
          tanzania_payroll_number: string | null
          tenant_id: string
          tsc_job_group: string | null
          tsc_number: string | null
          tsc_registered_subjects: string[] | null
          tsc_registration_date: string | null
          uganda_payroll_number: string | null
          updated_at: string | null
          user_id: string | null
          year_qualified: number | null
        }
        Insert: {
          address?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          classes_taught?: Json | null
          created_at?: string | null
          date_employed?: string | null
          date_of_birth?: string | null
          date_of_confirmation?: string | null
          department?: string | null
          email?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          ethiopia_employee_id?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          gross_salary?: number | null
          highest_qualification?: string | null
          hire_date?: string | null
          id?: string
          institution?: string | null
          job_title?: string | null
          kra_pin?: string | null
          last_name: string
          middle_name?: string | null
          national_id_number?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          nhif_or_shif_number?: string | null
          nssf_number?: string | null
          phone?: string | null
          photo_url?: string | null
          professional_certifications?: Json | null
          reports_to?: string | null
          role?: string | null
          rwanda_rssb_number?: string | null
          salary_scale?: string | null
          staff_number?: string | null
          status?: string | null
          subjects_taught?: Json | null
          tanzania_payroll_number?: string | null
          tenant_id: string
          tsc_job_group?: string | null
          tsc_number?: string | null
          tsc_registered_subjects?: string[] | null
          tsc_registration_date?: string | null
          uganda_payroll_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          year_qualified?: number | null
        }
        Update: {
          address?: string | null
          bank_account_number?: string | null
          bank_branch?: string | null
          bank_name?: string | null
          classes_taught?: Json | null
          created_at?: string | null
          date_employed?: string | null
          date_of_birth?: string | null
          date_of_confirmation?: string | null
          department?: string | null
          email?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          ethiopia_employee_id?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          gross_salary?: number | null
          highest_qualification?: string | null
          hire_date?: string | null
          id?: string
          institution?: string | null
          job_title?: string | null
          kra_pin?: string | null
          last_name?: string
          middle_name?: string | null
          national_id_number?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relation?: string | null
          nhif_or_shif_number?: string | null
          nssf_number?: string | null
          phone?: string | null
          photo_url?: string | null
          professional_certifications?: Json | null
          reports_to?: string | null
          role?: string | null
          rwanda_rssb_number?: string | null
          salary_scale?: string | null
          staff_number?: string | null
          status?: string | null
          subjects_taught?: Json | null
          tanzania_payroll_number?: string | null
          tenant_id?: string
          tsc_job_group?: string | null
          tsc_number?: string | null
          tsc_registered_subjects?: string[] | null
          tsc_registration_date?: string | null
          uganda_payroll_number?: string | null
          updated_at?: string | null
          user_id?: string | null
          year_qualified?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_compensation: {
        Row: {
          basic_salary: number
          created_at: string
          effective_from: string
          house_allowance: number
          id: string
          insurance_relief: number
          other_allowances: Json
          pays_housing_levy: boolean
          pays_nssf: boolean
          pays_paye: boolean
          pays_shif: boolean
          personal_relief: number
          recurring_deductions: Json
          staff_id: string
          tenant_id: string
          transport_allowance: number
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          effective_from?: string
          house_allowance?: number
          id?: string
          insurance_relief?: number
          other_allowances?: Json
          pays_housing_levy?: boolean
          pays_nssf?: boolean
          pays_paye?: boolean
          pays_shif?: boolean
          personal_relief?: number
          recurring_deductions?: Json
          staff_id: string
          tenant_id: string
          transport_allowance?: number
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          created_at?: string
          effective_from?: string
          house_allowance?: number
          id?: string
          insurance_relief?: number
          other_allowances?: Json
          pays_housing_levy?: boolean
          pays_nssf?: boolean
          pays_paye?: boolean
          pays_shif?: boolean
          personal_relief?: number
          recurring_deductions?: Json
          staff_id?: string
          tenant_id?: string
          transport_allowance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_compensation_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: true
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_compensation_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      statutory_filings: {
        Row: {
          amount: number | null
          created_at: string
          file_url: string | null
          filed_at: string | null
          filed_by: string | null
          filing_type: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          reference: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          file_url?: string | null
          filed_at?: string | null
          filed_by?: string | null
          filing_type: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          reference?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          file_url?: string | null
          filed_at?: string | null
          filed_by?: string | null
          filing_type?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          reference?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "statutory_filings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          preferred_supplier_id: string | null
          quantity_on_hand: number
          reorder_level: number
          sku: string | null
          store_id: string | null
          tenant_id: string
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          preferred_supplier_id?: string | null
          quantity_on_hand?: number
          reorder_level?: number
          sku?: string | null
          store_id?: string | null
          tenant_id: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          preferred_supplier_id?: string | null
          quantity_on_hand?: number
          reorder_level?: number
          sku?: string | null
          store_id?: string | null
          tenant_id?: string
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_items_preferred_supplier_id_fkey"
            columns: ["preferred_supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["stock_movement_type_enum"]
          performed_at: string
          performed_by: string | null
          quantity: number
          reason: string | null
          reference: string | null
          stock_item_id: string
          tenant_id: string
          unit_cost: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["stock_movement_type_enum"]
          performed_at?: string
          performed_by?: string | null
          quantity: number
          reason?: string | null
          reference?: string | null
          stock_item_id: string
          tenant_id: string
          unit_cost?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["stock_movement_type_enum"]
          performed_at?: string
          performed_by?: string | null
          quantity?: number
          reason?: string | null
          reference?: string | null
          stock_item_id?: string
          tenant_id?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_stock_item_id_fkey"
            columns: ["stock_item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          manager_staff_id: string | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          manager_staff_id?: string | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          manager_staff_id?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_manager_staff_id_fkey"
            columns: ["manager_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      strands: {
        Row: {
          created_at: string
          id: string
          learning_area_id: string
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          learning_area_id: string
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          learning_area_id?: string
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "strands_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      student_activity: {
        Row: {
          actor_user_id: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
          occurred_at: string
          student_id: string
          tenant_id: string
          title: string
        }
        Insert: {
          actor_user_id?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          student_id: string
          tenant_id: string
          title: string
        }
        Update: {
          actor_user_id?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          occurred_at?: string
          student_id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: []
      }
      student_assessment_scores: {
        Row: {
          assessment_id: string
          comment: string | null
          created_at: string
          id: string
          score: number | null
          student_id: string
          tenant_id: string
        }
        Insert: {
          assessment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          score?: number | null
          student_id: string
          tenant_id: string
        }
        Update: {
          assessment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          score?: number | null
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_assessment_scores_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_assessment_scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_exam_results: {
        Row: {
          created_at: string
          entered_at: string | null
          entered_by: string | null
          exam_id: string
          grade: string | null
          id: string
          locked: boolean
          max_marks: number | null
          points: number | null
          position_in_class: number | null
          position_in_stream: number | null
          raw_marks: number | null
          student_id: string
          subject_id: string
          teacher_comment: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entered_at?: string | null
          entered_by?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          locked?: boolean
          max_marks?: number | null
          points?: number | null
          position_in_class?: number | null
          position_in_stream?: number | null
          raw_marks?: number | null
          student_id: string
          subject_id: string
          teacher_comment?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entered_at?: string | null
          entered_by?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          locked?: boolean
          max_marks?: number | null
          points?: number | null
          position_in_class?: number | null
          position_in_stream?: number | null
          raw_marks?: number | null
          student_id?: string
          subject_id?: string
          teacher_comment?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_results_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_adjustments: {
        Row: {
          approved_by: string | null
          created_at: string
          custom_amount: number | null
          id: string
          is_active: boolean
          reason: string | null
          scholarship_id: string | null
          student_id: string
          tenant_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          custom_amount?: number | null
          id?: string
          is_active?: boolean
          reason?: string | null
          scholarship_id?: string | null
          student_id: string
          tenant_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          custom_amount?: number | null
          id?: string
          is_active?: boolean
          reason?: string | null
          scholarship_id?: string | null
          student_id?: string
          tenant_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_adjustments_scholarship_id_fkey"
            columns: ["scholarship_id"]
            isOneToOne: false
            referencedRelation: "scholarships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_guardians: {
        Row: {
          created_at: string
          guardian_id: string
          has_financial_responsibility: boolean
          has_pickup_authorization: boolean
          id: string
          is_primary_contact: boolean
          receives_communications: boolean
          relationship: Database["public"]["Enums"]["guardian_relationship_enum"]
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          guardian_id: string
          has_financial_responsibility?: boolean
          has_pickup_authorization?: boolean
          id?: string
          is_primary_contact?: boolean
          receives_communications?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship_enum"]
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          guardian_id?: string
          has_financial_responsibility?: boolean
          has_pickup_authorization?: boolean
          id?: string
          is_primary_contact?: boolean
          receives_communications?: boolean
          relationship?: Database["public"]["Enums"]["guardian_relationship_enum"]
          student_id?: string
          tenant_id?: string
        }
        Relationships: []
      }
      student_invoice_lines: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["fee_category_enum"]
          created_at: string
          description: string
          fee_item_id: string | null
          id: string
          invoice_id: string
          quantity: number
          tenant_id: string
          unit_amount: number
        }
        Insert: {
          amount?: number
          category?: Database["public"]["Enums"]["fee_category_enum"]
          created_at?: string
          description: string
          fee_item_id?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          tenant_id: string
          unit_amount?: number
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["fee_category_enum"]
          created_at?: string
          description?: string
          fee_item_id?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          tenant_id?: string
          unit_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "student_invoice_lines_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "student_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      student_invoices: {
        Row: {
          academic_year_id: string | null
          balance: number
          created_at: string
          created_by: string | null
          currency: string
          discount_total: number
          due_date: string | null
          id: string
          invoice_number: string | null
          issued_at: string | null
          notes: string | null
          paid_total: number
          status: Database["public"]["Enums"]["invoice_status_enum"]
          structure_id: string | null
          student_id: string
          subtotal: number
          tenant_id: string
          term_id: string | null
          total: number
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_total?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          notes?: string | null
          paid_total?: number
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          structure_id?: string | null
          student_id: string
          subtotal?: number
          tenant_id: string
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_total?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string | null
          notes?: string | null
          paid_total?: number
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          structure_id?: string | null
          student_id?: string
          subtotal?: number
          tenant_id?: string
          term_id?: string | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_invoices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoices_structure_id_fkey"
            columns: ["structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_refunded: boolean
          method: Database["public"]["Enums"]["payment_method_enum"]
          mpesa_txn_id: string | null
          notes: string | null
          paid_at: string
          received_by: string | null
          reference: string | null
          refunded_amount: number
          student_id: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_refunded?: boolean
          method?: Database["public"]["Enums"]["payment_method_enum"]
          mpesa_txn_id?: string | null
          notes?: string | null
          paid_at?: string
          received_by?: string | null
          reference?: string | null
          refunded_amount?: number
          student_id: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_refunded?: boolean
          method?: Database["public"]["Enums"]["payment_method_enum"]
          mpesa_txn_id?: string | null
          notes?: string | null
          paid_at?: string
          received_by?: string | null
          reference?: string | null
          refunded_amount?: number
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_mpesa_txn_id_fkey"
            columns: ["mpesa_txn_id"]
            isOneToOne: false
            referencedRelation: "mpesa_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_receipts: {
        Row: {
          id: string
          issued_at: string
          payment_id: string
          pdf_url: string | null
          receipt_number: string
          tenant_id: string
        }
        Insert: {
          id?: string
          issued_at?: string
          payment_id: string
          pdf_url?: string | null
          receipt_number: string
          tenant_id: string
        }
        Update: {
          id?: string
          issued_at?: string
          payment_id?: string
          pdf_url?: string | null
          receipt_number?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "student_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transport_subscriptions: {
        Row: {
          created_at: string
          dropoff_stop_id: string | null
          end_date: string | null
          fare: number | null
          id: string
          is_active: boolean | null
          pickup_stop_id: string | null
          route_id: string
          start_date: string | null
          student_id: string
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dropoff_stop_id?: string | null
          end_date?: string | null
          fare?: number | null
          id?: string
          is_active?: boolean | null
          pickup_stop_id?: string | null
          route_id: string
          start_date?: string | null
          student_id: string
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dropoff_stop_id?: string | null
          end_date?: string | null
          fare?: number | null
          id?: string
          is_active?: boolean | null
          pickup_stop_id?: string | null
          route_id?: string
          start_date?: string | null
          student_id?: string
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_subscriptions_dropoff_stop_id_fkey"
            columns: ["dropoff_stop_id"]
            isOneToOne: false
            referencedRelation: "transport_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_subscriptions_pickup_stop_id_fkey"
            columns: ["pickup_stop_id"]
            isOneToOne: false
            referencedRelation: "transport_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_subscriptions_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_subscriptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_subscriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_subscriptions_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          accommodations: string | null
          address: string | null
          admission_date: string | null
          admission_grade: string | null
          admission_number: string | null
          allergies: string | null
          birth_certificate_number: string | null
          birth_certificate_serial: string | null
          blood_group: Database["public"]["Enums"]["blood_group_enum"] | null
          chronic_conditions: string | null
          city: string | null
          country: string | null
          county_or_region: string | null
          created_at: string | null
          current_class_id: string | null
          date_of_birth: string | null
          doctor_name: string | null
          doctor_phone: string | null
          documents: Json | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          enrollment_status:
            | Database["public"]["Enums"]["enrollment_status_enum"]
            | null
          ethiopia_moe_id: string | null
          ethiopian_birth_date: string | null
          exit_date: string | null
          exit_reason: string | null
          expected_graduation_year: number | null
          first_name: string
          gender: string | null
          grade: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          has_special_needs: boolean | null
          health_info: Json | null
          house: string | null
          huduma_number: string | null
          id: string
          iep_on_file: boolean | null
          immunization_status: Json | null
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_repeater: boolean | null
          kcpe_index_number: string | null
          kcse_index_number: string | null
          knec_assessment_number: string | null
          last_medical_checkup: string | null
          last_name: string
          learner_category:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          lin: string | null
          medications: string | null
          middle_name: string | null
          moe_student_id: string | null
          national_id_number: string | null
          nationality: string | null
          necta_index_number: string | null
          nemis_upi: string | null
          nhif_or_shif_number: string | null
          phone: string | null
          photo_url: string | null
          portal_user_id: string | null
          postal_code: string | null
          preferred_name: string | null
          prems_number: string | null
          previous_school: string | null
          reb_student_id: string | null
          residential_address: string | null
          rwanda_national_id: string | null
          rwanda_reb_id: string | null
          sne_category: string | null
          special_needs_details: string | null
          status: string | null
          stream: string | null
          tanzania_prems_id: string | null
          tenant_id: string
          transfer_in_date: string | null
          transfer_out_date: string | null
          uganda_lin: string | null
          une_index_number: string | null
          uneb_index_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accommodations?: string | null
          address?: string | null
          admission_date?: string | null
          admission_grade?: string | null
          admission_number?: string | null
          allergies?: string | null
          birth_certificate_number?: string | null
          birth_certificate_serial?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group_enum"] | null
          chronic_conditions?: string | null
          city?: string | null
          country?: string | null
          county_or_region?: string | null
          created_at?: string | null
          current_class_id?: string | null
          date_of_birth?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_status?:
            | Database["public"]["Enums"]["enrollment_status_enum"]
            | null
          ethiopia_moe_id?: string | null
          ethiopian_birth_date?: string | null
          exit_date?: string | null
          exit_reason?: string | null
          expected_graduation_year?: number | null
          first_name: string
          gender?: string | null
          grade?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          has_special_needs?: boolean | null
          health_info?: Json | null
          house?: string | null
          huduma_number?: string | null
          id?: string
          iep_on_file?: boolean | null
          immunization_status?: Json | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_repeater?: boolean | null
          kcpe_index_number?: string | null
          kcse_index_number?: string | null
          knec_assessment_number?: string | null
          last_medical_checkup?: string | null
          last_name: string
          learner_category?:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          lin?: string | null
          medications?: string | null
          middle_name?: string | null
          moe_student_id?: string | null
          national_id_number?: string | null
          nationality?: string | null
          necta_index_number?: string | null
          nemis_upi?: string | null
          nhif_or_shif_number?: string | null
          phone?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          prems_number?: string | null
          previous_school?: string | null
          reb_student_id?: string | null
          residential_address?: string | null
          rwanda_national_id?: string | null
          rwanda_reb_id?: string | null
          sne_category?: string | null
          special_needs_details?: string | null
          status?: string | null
          stream?: string | null
          tanzania_prems_id?: string | null
          tenant_id: string
          transfer_in_date?: string | null
          transfer_out_date?: string | null
          uganda_lin?: string | null
          une_index_number?: string | null
          uneb_index_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accommodations?: string | null
          address?: string | null
          admission_date?: string | null
          admission_grade?: string | null
          admission_number?: string | null
          allergies?: string | null
          birth_certificate_number?: string | null
          birth_certificate_serial?: string | null
          blood_group?: Database["public"]["Enums"]["blood_group_enum"] | null
          chronic_conditions?: string | null
          city?: string | null
          country?: string | null
          county_or_region?: string | null
          created_at?: string | null
          current_class_id?: string | null
          date_of_birth?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          documents?: Json | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_status?:
            | Database["public"]["Enums"]["enrollment_status_enum"]
            | null
          ethiopia_moe_id?: string | null
          ethiopian_birth_date?: string | null
          exit_date?: string | null
          exit_reason?: string | null
          expected_graduation_year?: number | null
          first_name?: string
          gender?: string | null
          grade?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          has_special_needs?: boolean | null
          health_info?: Json | null
          house?: string | null
          huduma_number?: string | null
          id?: string
          iep_on_file?: boolean | null
          immunization_status?: Json | null
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_repeater?: boolean | null
          kcpe_index_number?: string | null
          kcse_index_number?: string | null
          knec_assessment_number?: string | null
          last_medical_checkup?: string | null
          last_name?: string
          learner_category?:
            | Database["public"]["Enums"]["learner_category_enum"]
            | null
          lin?: string | null
          medications?: string | null
          middle_name?: string | null
          moe_student_id?: string | null
          national_id_number?: string | null
          nationality?: string | null
          necta_index_number?: string | null
          nemis_upi?: string | null
          nhif_or_shif_number?: string | null
          phone?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          prems_number?: string | null
          previous_school?: string | null
          reb_student_id?: string | null
          residential_address?: string | null
          rwanda_national_id?: string | null
          rwanda_reb_id?: string | null
          sne_category?: string | null
          special_needs_details?: string | null
          status?: string | null
          stream?: string | null
          tanzania_prems_id?: string | null
          tenant_id?: string
          transfer_in_date?: string | null
          transfer_out_date?: string | null
          uganda_lin?: string | null
          une_index_number?: string | null
          uneb_index_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_strands: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          strand_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          strand_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          strand_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sub_strands_strand_id_fkey"
            columns: ["strand_id"]
            isOneToOne: false
            referencedRelation: "strands"
            referencedColumns: ["id"]
          },
        ]
      }
      subject_access_requests: {
        Row: {
          created_at: string
          due_date: string
          fulfilled_at: string | null
          fulfilled_by: string | null
          id: string
          notes: string | null
          package_url: string | null
          rejection_reason: string | null
          related_staff_id: string | null
          related_student_id: string | null
          request_details: string | null
          requested_at: string
          status: Database["public"]["Enums"]["sar_status_enum"]
          subject_email: string | null
          subject_id_number: string | null
          subject_name: string
          subject_phone: string | null
          subject_type: Database["public"]["Enums"]["sar_subject_type_enum"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          package_url?: string | null
          rejection_reason?: string | null
          related_staff_id?: string | null
          related_student_id?: string | null
          request_details?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["sar_status_enum"]
          subject_email?: string | null
          subject_id_number?: string | null
          subject_name: string
          subject_phone?: string | null
          subject_type: Database["public"]["Enums"]["sar_subject_type_enum"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          id?: string
          notes?: string | null
          package_url?: string | null
          rejection_reason?: string | null
          related_staff_id?: string | null
          related_student_id?: string | null
          request_details?: string | null
          requested_at?: string
          status?: Database["public"]["Enums"]["sar_status_enum"]
          subject_email?: string | null
          subject_id_number?: string | null
          subject_name?: string
          subject_phone?: string | null
          subject_type?: Database["public"]["Enums"]["sar_subject_type_enum"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subject_access_requests_related_staff_id_fkey"
            columns: ["related_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_access_requests_related_student_id_fkey"
            columns: ["related_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subject_access_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          assessment_type: Database["public"]["Enums"]["subject_assessment_enum"]
          category: Database["public"]["Enums"]["subject_category_enum"]
          code: string
          created_at: string
          curriculum_tag: string | null
          id: string
          is_assessed: boolean
          name: string
          required_room_type:
            | Database["public"]["Enums"]["room_type_enum"]
            | null
          tenant_id: string
        }
        Insert: {
          assessment_type?: Database["public"]["Enums"]["subject_assessment_enum"]
          category?: Database["public"]["Enums"]["subject_category_enum"]
          code: string
          created_at?: string
          curriculum_tag?: string | null
          id?: string
          is_assessed?: boolean
          name: string
          required_room_type?:
            | Database["public"]["Enums"]["room_type_enum"]
            | null
          tenant_id: string
        }
        Update: {
          assessment_type?: Database["public"]["Enums"]["subject_assessment_enum"]
          category?: Database["public"]["Enums"]["subject_category_enum"]
          code?: string
          created_at?: string
          curriculum_tag?: string | null
          id?: string
          is_assessed?: boolean
          name?: string
          required_room_type?:
            | Database["public"]["Enums"]["room_type_enum"]
            | null
          tenant_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          code: Database["public"]["Enums"]["subscription_plan"]
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          max_staff: number | null
          max_students: number | null
          name: string
          price_annual_usd: number
          price_monthly_usd: number
          sort_order: number
        }
        Insert: {
          code: Database["public"]["Enums"]["subscription_plan"]
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_staff?: number | null
          max_students?: number | null
          name: string
          price_annual_usd?: number
          price_monthly_usd?: number
          sort_order?: number
        }
        Update: {
          code?: Database["public"]["Enums"]["subscription_plan"]
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          max_staff?: number | null
          max_students?: number | null
          name?: string
          price_annual_usd?: number
          price_monthly_usd?: number
          sort_order?: number
        }
        Relationships: []
      }
      super_admin_audit_log: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          id: string
          meta: Json
          tenant_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          id?: string
          meta?: Json
          tenant_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          id?: string
          meta?: Json
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          tax_pin: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_pin?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_pin?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_unavailability: {
        Row: {
          created_at: string
          day_of_week: number
          id: string
          period_id: string | null
          reason: string | null
          teacher_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          id?: string
          period_id?: string | null
          reason?: string | null
          teacher_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          id?: string
          period_id?: string | null
          reason?: string | null
          teacher_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_unavailability_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_unavailability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_billing_invoices: {
        Row: {
          amount_usd: number
          created_at: string
          currency: string
          hosted_invoice_url: string | null
          id: string
          invoice_number: string
          paid_at: string | null
          period_end: string
          period_start: string
          plan_code: Database["public"]["Enums"]["subscription_plan"]
          status: string
          tenant_id: string
        }
        Insert: {
          amount_usd: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_number: string
          paid_at?: string | null
          period_end: string
          period_start: string
          plan_code: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          tenant_id: string
        }
        Update: {
          amount_usd?: number
          created_at?: string
          currency?: string
          hosted_invoice_url?: string | null
          id?: string
          invoice_number?: string
          paid_at?: string | null
          period_end?: string
          period_start?: string
          plan_code?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_billing_invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_dpo: {
        Row: {
          appointed_at: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          registration_number: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          appointed_at?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          appointed_at?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          registration_number?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_dpo_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_messaging_config: {
        Row: {
          at_api_key: string | null
          at_sender_id: string | null
          at_username: string | null
          country_code: string
          created_at: string
          email_daily_limit: number
          email_from_address: string | null
          email_from_name: string | null
          email_provider: string
          email_sent_today: number
          id: string
          is_active: boolean
          last_reset_date: string
          resend_api_key: string | null
          sms_daily_limit: number
          sms_provider: string
          sms_sent_today: number
          tenant_id: string
          twilio_account_sid: string | null
          twilio_auth_token: string | null
          twilio_from_number: string | null
          updated_at: string
        }
        Insert: {
          at_api_key?: string | null
          at_sender_id?: string | null
          at_username?: string | null
          country_code?: string
          created_at?: string
          email_daily_limit?: number
          email_from_address?: string | null
          email_from_name?: string | null
          email_provider?: string
          email_sent_today?: number
          id?: string
          is_active?: boolean
          last_reset_date?: string
          resend_api_key?: string | null
          sms_daily_limit?: number
          sms_provider?: string
          sms_sent_today?: number
          tenant_id: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_from_number?: string | null
          updated_at?: string
        }
        Update: {
          at_api_key?: string | null
          at_sender_id?: string | null
          at_username?: string | null
          country_code?: string
          created_at?: string
          email_daily_limit?: number
          email_from_address?: string | null
          email_from_name?: string | null
          email_provider?: string
          email_sent_today?: number
          id?: string
          is_active?: boolean
          last_reset_date?: string
          resend_api_key?: string | null
          sms_daily_limit?: number
          sms_provider?: string
          sms_sent_today?: number
          tenant_id?: string
          twilio_account_sid?: string | null
          twilio_auth_token?: string | null
          twilio_from_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_messaging_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          tenant_id: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          tenant_id: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "tenant_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_users: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_users_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          academic_calendar: Json | null
          academic_year_end: string | null
          academic_year_start: string | null
          address: string | null
          code: string | null
          country: string | null
          country_code: string
          created_at: string | null
          currency_code: string
          curriculum: Database["public"]["Enums"]["curriculum_type"] | null
          data_hosting_region: string | null
          data_retention_years: number | null
          email: string | null
          grading_system: Json | null
          id: string
          is_active: boolean | null
          is_demo: boolean
          language_of_instruction: string | null
          locale: string
          logo_url: string | null
          motto: string | null
          name: string
          nemis_code: string | null
          payment_config: Json | null
          phone: string | null
          primary_color: string | null
          registration_number: string | null
          regulatory_body: string | null
          school_levels: Json | null
          school_type: Database["public"]["Enums"]["school_type"] | null
          slug: string | null
          subjects: Json | null
          subscription_plan: Database["public"]["Enums"]["subscription_plan"]
          subscription_status: Database["public"]["Enums"]["subscription_status"]
          timezone: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          academic_calendar?: Json | null
          academic_year_end?: string | null
          academic_year_start?: string | null
          address?: string | null
          code?: string | null
          country?: string | null
          country_code?: string
          created_at?: string | null
          currency_code?: string
          curriculum?: Database["public"]["Enums"]["curriculum_type"] | null
          data_hosting_region?: string | null
          data_retention_years?: number | null
          email?: string | null
          grading_system?: Json | null
          id?: string
          is_active?: boolean | null
          is_demo?: boolean
          language_of_instruction?: string | null
          locale?: string
          logo_url?: string | null
          motto?: string | null
          name: string
          nemis_code?: string | null
          payment_config?: Json | null
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          regulatory_body?: string | null
          school_levels?: Json | null
          school_type?: Database["public"]["Enums"]["school_type"] | null
          slug?: string | null
          subjects?: Json | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          academic_calendar?: Json | null
          academic_year_end?: string | null
          academic_year_start?: string | null
          address?: string | null
          code?: string | null
          country?: string | null
          country_code?: string
          created_at?: string | null
          currency_code?: string
          curriculum?: Database["public"]["Enums"]["curriculum_type"] | null
          data_hosting_region?: string | null
          data_retention_years?: number | null
          email?: string | null
          grading_system?: Json | null
          id?: string
          is_active?: boolean | null
          is_demo?: boolean
          language_of_instruction?: string | null
          locale?: string
          logo_url?: string | null
          motto?: string | null
          name?: string
          nemis_code?: string | null
          payment_config?: Json | null
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          regulatory_body?: string | null
          school_levels?: Json | null
          school_type?: Database["public"]["Enums"]["school_type"] | null
          slug?: string | null
          subjects?: Json | null
          subscription_plan?: Database["public"]["Enums"]["subscription_plan"]
          subscription_status?: Database["public"]["Enums"]["subscription_status"]
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      terms: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          name: string
          start_date: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          name: string
          start_date: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          name?: string
          start_date?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "terms_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_optimization_runs: {
        Row: {
          class_id: string | null
          created_at: string
          duration_ms: number | null
          hard_violations: number
          id: string
          placed: number
          ran_by: string | null
          scope: string
          score: number | null
          settings: Json
          soft_violations: number
          tenant_id: string
          term_id: string
          unplaced: number
          violations: Json
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          duration_ms?: number | null
          hard_violations?: number
          id?: string
          placed?: number
          ran_by?: string | null
          scope?: string
          score?: number | null
          settings?: Json
          soft_violations?: number
          tenant_id: string
          term_id: string
          unplaced?: number
          violations?: Json
        }
        Update: {
          class_id?: string | null
          created_at?: string
          duration_ms?: number | null
          hard_violations?: number
          id?: string
          placed?: number
          ran_by?: string | null
          scope?: string
          score?: number | null
          settings?: Json
          soft_violations?: number
          tenant_id?: string
          term_id?: string
          unplaced?: number
          violations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "timetable_optimization_runs_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_optimization_runs_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          class_id: string
          created_at: string
          id: string
          period_id: string
          room_id: string | null
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string
          term_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          period_id: string
          room_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          term_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          period_id?: string
          room_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timetable_slots_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_incidents: {
        Row: {
          action_taken: string | null
          created_at: string
          created_by: string | null
          description: string
          driver_id: string | null
          id: string
          incident_type: Database["public"]["Enums"]["transport_incident_type_enum"]
          location: string | null
          occurred_at: string
          resolved: boolean | null
          resolved_at: string | null
          severity: number
          tenant_id: string
          trip_id: string | null
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          driver_id?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["transport_incident_type_enum"]
          location?: string | null
          occurred_at?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: number
          tenant_id: string
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          driver_id?: string | null
          id?: string
          incident_type?: Database["public"]["Enums"]["transport_incident_type_enum"]
          location?: string | null
          occurred_at?: string
          resolved?: boolean | null
          resolved_at?: string | null
          severity?: number
          tenant_id?: string
          trip_id?: string | null
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_incidents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_incidents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_incidents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "transport_trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_incidents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_routes: {
        Row: {
          am_start_time: string | null
          avg_trip_minutes: number | null
          capacity: number | null
          code: string | null
          created_at: string | null
          description: string | null
          driver_name: string | null
          fare_per_term: number | null
          id: string
          is_active: boolean | null
          name: string
          pm_start_time: string | null
          status: string
          student_count: number | null
          tenant_id: string
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          am_start_time?: string | null
          avg_trip_minutes?: number | null
          capacity?: number | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          driver_name?: string | null
          fare_per_term?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          pm_start_time?: string | null
          status?: string
          student_count?: number | null
          tenant_id: string
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          am_start_time?: string | null
          avg_trip_minutes?: number | null
          capacity?: number | null
          code?: string | null
          created_at?: string | null
          description?: string | null
          driver_name?: string | null
          fare_per_term?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          pm_start_time?: string | null
          status?: string
          student_count?: number | null
          tenant_id?: string
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_routes_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_stops: {
        Row: {
          am_pickup_time: string | null
          created_at: string
          id: string
          landmark: string | null
          latitude: number | null
          longitude: number | null
          name: string
          pm_dropoff_time: string | null
          route_id: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          am_pickup_time?: string | null
          created_at?: string
          id?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          pm_dropoff_time?: string | null
          route_id: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          am_pickup_time?: string | null
          created_at?: string
          id?: string
          landmark?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          pm_dropoff_time?: string | null
          route_id?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transport_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_stops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      transport_trips: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          direction: Database["public"]["Enums"]["trip_direction_enum"]
          driver_id: string | null
          fuel_liters: number | null
          id: string
          notes: string | null
          odometer_end: number | null
          odometer_start: number | null
          route_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["trip_status_enum"]
          tenant_id: string
          trip_date: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["trip_direction_enum"]
          driver_id?: string | null
          fuel_liters?: number | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          route_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status_enum"]
          tenant_id: string
          trip_date?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          direction?: Database["public"]["Enums"]["trip_direction_enum"]
          driver_id?: string | null
          fuel_liters?: number | null
          id?: string
          notes?: string | null
          odometer_end?: number | null
          odometer_start?: number | null
          route_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["trip_status_enum"]
          tenant_id?: string
          trip_date?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transport_trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_trips_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "transport_routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_trips_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transport_trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_attendance: {
        Row: {
          id: string
          notes: string | null
          recorded_at: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["boarding_status_enum"]
          stop_id: string | null
          student_id: string
          tenant_id: string
          trip_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["boarding_status_enum"]
          stop_id?: string | null
          student_id: string
          tenant_id: string
          trip_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["boarding_status_enum"]
          stop_id?: string | null
          student_id?: string
          tenant_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_attendance_stop_id_fkey"
            columns: ["stop_id"]
            isOneToOne: false
            referencedRelation: "transport_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_attendance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_attendance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "transport_trips"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role_id: string
          tenant_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role_id: string
          tenant_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role_id?: string
          tenant_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          created_at: string
          fuel_type: string | null
          id: string
          inspection_expiry: string | null
          insurance_expiry: string | null
          make: string | null
          model: string | null
          nickname: string | null
          notes: string | null
          registration_number: string
          status: Database["public"]["Enums"]["vehicle_status_enum"]
          tenant_id: string
          updated_at: string
          year: number | null
        }
        Insert: {
          capacity?: number
          created_at?: string
          fuel_type?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          make?: string | null
          model?: string | null
          nickname?: string | null
          notes?: string | null
          registration_number: string
          status?: Database["public"]["Enums"]["vehicle_status_enum"]
          tenant_id: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          capacity?: number
          created_at?: string
          fuel_type?: string | null
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          make?: string | null
          model?: string | null
          nickname?: string | null
          notes?: string | null
          registration_number?: string
          status?: Database["public"]["Enums"]["vehicle_status_enum"]
          tenant_id?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_broadcasts: {
        Row: {
          audience_filter: Json
          audience_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          failed_count: number
          id: string
          recipient_count: number
          sent_count: number
          started_at: string | null
          status: string
          template_id: string | null
          tenant_id: string
        }
        Insert: {
          audience_filter?: Json
          audience_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          recipient_count?: number
          sent_count?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          tenant_id: string
        }
        Update: {
          audience_filter?: Json
          audience_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          failed_count?: number
          id?: string
          recipient_count?: number
          sent_count?: number
          started_at?: string | null
          status?: string
          template_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_broadcasts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_config: {
        Row: {
          access_token: string | null
          business_account_id: string | null
          created_at: string
          daily_message_limit: number
          display_phone_number: string | null
          id: string
          is_active: boolean
          last_reset_date: string
          messages_sent_today: number
          phone_number_id: string | null
          tenant_id: string
          updated_at: string
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          business_account_id?: string | null
          created_at?: string
          daily_message_limit?: number
          display_phone_number?: string | null
          id?: string
          is_active?: boolean
          last_reset_date?: string
          messages_sent_today?: number
          phone_number_id?: string | null
          tenant_id: string
          updated_at?: string
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          business_account_id?: string | null
          created_at?: string
          daily_message_limit?: number
          display_phone_number?: string | null
          id?: string
          is_active?: boolean
          last_reset_date?: string
          messages_sent_today?: number
          phone_number_id?: string | null
          tenant_id?: string
          updated_at?: string
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          broadcast_id: string | null
          created_at: string
          direction: string
          error: string | null
          from_phone: string | null
          id: string
          raw_payload: Json | null
          status: string
          student_id: string | null
          template_id: string | null
          tenant_id: string
          to_phone: string | null
          wa_message_id: string | null
        }
        Insert: {
          body?: string | null
          broadcast_id?: string | null
          created_at?: string
          direction: string
          error?: string | null
          from_phone?: string | null
          id?: string
          raw_payload?: Json | null
          status?: string
          student_id?: string | null
          template_id?: string | null
          tenant_id: string
          to_phone?: string | null
          wa_message_id?: string | null
        }
        Update: {
          body?: string | null
          broadcast_id?: string | null
          created_at?: string
          direction?: string
          error?: string | null
          from_phone?: string | null
          id?: string
          raw_payload?: Json | null
          status?: string
          student_id?: string | null
          template_id?: string | null
          tenant_id?: string
          to_phone?: string | null
          wa_message_id?: string | null
        }
        Relationships: []
      }
      whatsapp_templates: {
        Row: {
          body_template: string
          category: string
          created_at: string
          id: string
          language: string
          last_used_at: string | null
          name: string
          placeholder_count: number
          placeholder_labels: Json
          status: string
          tenant_id: string
          updated_at: string
          usage_count: number
        }
        Insert: {
          body_template: string
          category?: string
          created_at?: string
          id?: string
          language?: string
          last_used_at?: string | null
          name: string
          placeholder_count?: number
          placeholder_labels?: Json
          status?: string
          tenant_id: string
          updated_at?: string
          usage_count?: number
        }
        Update: {
          body_template?: string
          category?: string
          created_at?: string
          id?: string
          language?: string
          last_used_at?: string | null
          name?: string
          placeholder_count?: number
          placeholder_labels?: Json
          status?: string
          tenant_id?: string
          updated_at?: string
          usage_count?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_check_quota: { Args: { _tenant: string }; Returns: Json }
      ai_current_month_usage: {
        Args: { _tenant: string }
        Returns: {
          request_count: number
          total_cost_usd: number
          total_tokens: number
        }[]
      }
      attendance_chronic_absentees: {
        Args: {
          _from: string
          _min_absences?: number
          _tenant: string
          _to: string
        }
        Returns: {
          absence_pct: number
          absent_days: number
          admission_number: string
          class_name: string
          full_name: string
          late_days: number
          student_id: string
          total_marked: number
        }[]
      }
      attendance_student_summary: {
        Args: { _from: string; _student: string; _tenant: string; _to: string }
        Returns: {
          absent_days: number
          attendance_pct: number
          excused_days: number
          late_days: number
          present_days: number
          total_days: number
        }[]
      }
      calc_kenya_payroll: {
        Args: {
          _basic: number
          _house: number
          _insurance_relief: number
          _other_deductions: number
          _other_nontax: number
          _other_taxable: number
          _pays_housing: boolean
          _pays_nssf: boolean
          _pays_paye: boolean
          _pays_shif: boolean
          _personal_relief: number
          _transport: number
        }
        Returns: Json
      }
      claim_due_messages: {
        Args: { _limit?: number }
        Returns: {
          body: string
          campaign_id: string | null
          channel: Database["public"]["Enums"]["message_channel_enum"]
          cost: number | null
          cost_currency: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          provider: string | null
          provider_message_id: string | null
          read_at: string | null
          recipient_address: string | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_type: Database["public"]["Enums"]["message_recipient_type_enum"]
          retry_count: number
          scheduled_for: string | null
          sender_user_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["message_status_enum"]
          student_id: string | null
          subject: string | null
          template_id: string | null
          template_variables: Json | null
          tenant_id: string
          thread_id: string | null
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "messages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      compute_grade: {
        Args: { _pct: number; _scale: string }
        Returns: {
          grade: string
          points: number
          remark: string
        }[]
      }
      current_academic_year: { Args: { _tenant: string }; Returns: string }
      current_term: { Args: { _tenant: string }; Returns: string }
      generate_admission_number: { Args: { _tenant: string }; Returns: string }
      generate_doc_number: {
        Args: { _key: string; _prefix: string; _tenant: string }
        Returns: string
      }
      generate_expense_number: { Args: { _tenant: string }; Returns: string }
      generate_invoice_number: { Args: { _tenant: string }; Returns: string }
      generate_receipt_number: { Args: { _tenant: string }; Returns: string }
      global_search: {
        Args: { _limit?: number; _q: string; _tenant: string }
        Returns: Json
      }
      has_perm: {
        Args: { _perm: string; _tenant: string; _user?: string }
        Returns: boolean
      }
      has_role_in_tenant: {
        Args: { _role: string; _tenant: string; _user?: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user?: string }; Returns: boolean }
      is_tenant_member: {
        Args: { _tenant: string; _user?: string }
        Returns: boolean
      }
      manual_reconcile_mpesa: {
        Args: {
          _invoice?: string
          _student: string
          _txn: string
          _user?: string
        }
        Returns: string
      }
      normalize_account_ref: { Args: { _raw: string }; Returns: string }
      portal_link_guardian_user: {
        Args: { _phone: string; _user_id: string }
        Returns: number
      }
      portal_link_student_user: {
        Args: { _phone: string; _user_id: string }
        Returns: number
      }
      portal_my_guardian_tenants: {
        Args: { _user?: string }
        Returns: {
          tenant_id: string
        }[]
      }
      portal_my_student_ids: {
        Args: { _user?: string }
        Returns: {
          student_id: string
        }[]
      }
      portal_my_tenants: {
        Args: { _user?: string }
        Returns: {
          tenant_id: string
        }[]
      }
      process_payroll_period: {
        Args: { _period: string; _user?: string }
        Returns: number
      }
      recompute_exam_positions: { Args: { _exam: string }; Returns: undefined }
      recompute_invoice_totals: {
        Args: { _invoice: string }
        Returns: undefined
      }
      seed_cbc_competencies_and_values: {
        Args: { _tenant: string }
        Returns: undefined
      }
      seed_default_message_templates: {
        Args: { _tenant: string }
        Returns: undefined
      }
      seed_expense_categories: { Args: { _tenant: string }; Returns: undefined }
      seed_fee_categories: { Args: { _tenant: string }; Returns: undefined }
      seed_grade_levels: {
        Args: { _curriculum: string; _tenant: string }
        Returns: undefined
      }
    }
    Enums: {
      allocation_status_enum: "active" | "ended" | "transferred"
      assessment_type_enum:
        | "assignment"
        | "quiz"
        | "project"
        | "practical"
        | "oral"
        | "other"
      asset_status_enum: "active" | "in_repair" | "disposed" | "lost"
      bed_status_enum:
        | "available"
        | "occupied"
        | "reserved"
        | "maintenance"
        | "out_of_service"
      blood_group_enum:
        | "A+"
        | "A-"
        | "B+"
        | "B-"
        | "O+"
        | "O-"
        | "AB+"
        | "AB-"
        | "unknown"
      boarding_status_enum:
        | "boarded"
        | "missed"
        | "dropped"
        | "absent"
        | "no_show"
      campaign_status_enum:
        | "draft"
        | "scheduled"
        | "sending"
        | "sent"
        | "failed"
        | "cancelled"
      curriculum_type: "cbc" | "8-4-4" | "igcse" | "ib" | "cambridge" | "mixed"
      discount_type_enum: "percent" | "fixed"
      document_owner_type_enum: "student" | "staff" | "guardian"
      employment_type_enum:
        | "permanent"
        | "contract"
        | "part_time"
        | "intern"
        | "casual"
        | "bom"
      enrollment_status_enum:
        | "active"
        | "alumni"
        | "transferred"
        | "dropped_out"
        | "suspended"
        | "deceased"
        | "on_leave"
      erasure_status_enum: "pending" | "approved" | "rejected" | "completed"
      exam_status_enum:
        | "planned"
        | "in_progress"
        | "marking"
        | "published"
        | "archived"
      exam_type_enum:
        | "cat"
        | "midterm"
        | "end_term"
        | "mock"
        | "knec_mock"
        | "internal"
        | "other"
      expense_payment_method_enum:
        | "cash"
        | "mpesa"
        | "bank_transfer"
        | "cheque"
        | "card"
        | "other"
      expense_status_enum:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "paid"
        | "void"
      fee_category_enum:
        | "tuition"
        | "transport"
        | "boarding"
        | "lunch"
        | "exam"
        | "activity"
        | "uniform"
        | "book"
        | "development"
        | "other"
      fee_frequency_enum: "per_term" | "per_year" | "one_off" | "monthly"
      gender_enum: "male" | "female" | "other" | "prefer_not_to_say"
      grade_stage_enum:
        | "pre_primary"
        | "lower_primary"
        | "upper_primary"
        | "junior_secondary"
        | "senior_secondary"
        | "primary"
        | "secondary"
        | "o_level"
        | "a_level"
        | "other"
      guardian_relationship_enum:
        | "father"
        | "mother"
        | "guardian"
        | "grandparent"
        | "uncle"
        | "aunt"
        | "sibling"
        | "other"
      hostel_gender_enum: "boys" | "girls" | "mixed"
      invoice_status_enum:
        | "draft"
        | "issued"
        | "partial"
        | "paid"
        | "overdue"
        | "void"
      learner_category_enum:
        | "day_scholar"
        | "boarder"
        | "weekly_boarder"
        | "special_needs"
      lesson_status_enum: "draft" | "pending_review" | "approved" | "rejected"
      library_item_status_enum:
        | "available"
        | "checked_out"
        | "reserved"
        | "lost"
        | "damaged"
        | "retired"
      library_loan_status_enum: "active" | "returned" | "overdue" | "lost"
      message_channel_enum:
        | "in_app"
        | "sms"
        | "email"
        | "whatsapp"
        | "voice"
        | "push"
      message_recipient_type_enum:
        | "student"
        | "guardian"
        | "staff"
        | "user"
        | "group"
        | "phone"
        | "email"
      message_status_enum:
        | "queued"
        | "sending"
        | "sent"
        | "delivered"
        | "read"
        | "failed"
        | "opted_out"
      notification_category_enum:
        | "academic"
        | "financial"
        | "communication"
        | "attendance"
        | "system"
      out_pass_status_enum:
        | "requested"
        | "guardian_approved"
        | "guardian_denied"
        | "approved"
        | "denied"
        | "checked_out"
        | "returned"
        | "overdue"
        | "cancelled"
      payment_method_enum:
        | "cash"
        | "mpesa"
        | "airtel_money"
        | "bank_transfer"
        | "cheque"
        | "card"
        | "pos"
        | "other"
      po_status_enum:
        | "draft"
        | "approved"
        | "sent"
        | "partially_received"
        | "received"
        | "closed"
        | "cancelled"
      policy_kind_enum:
        | "privacy_policy"
        | "terms_of_service"
        | "cookie_policy"
        | "dpia"
      reminder_channel_enum: "sms" | "whatsapp" | "email"
      report_run_status_enum: "queued" | "running" | "ready" | "failed"
      requisition_status_enum:
        | "draft"
        | "submitted"
        | "approved"
        | "rejected"
        | "ordered"
        | "closed"
      roll_call_status_enum:
        | "present"
        | "absent"
        | "sick"
        | "out_pass"
        | "unaccounted"
      roll_call_type_enum:
        | "morning"
        | "evening"
        | "lights_out"
        | "weekend"
        | "custom"
      room_type_enum:
        | "classroom"
        | "lab"
        | "hall"
        | "sports"
        | "library"
        | "other"
      sar_status_enum:
        | "pending"
        | "in_progress"
        | "fulfilled"
        | "rejected"
        | "cancelled"
      sar_subject_type_enum: "parent" | "student" | "staff" | "other"
      scheme_status_enum: "draft" | "pending_review" | "approved" | "rejected"
      school_type:
        | "primary"
        | "junior_secondary"
        | "senior_secondary"
        | "combined"
        | "tertiary"
        | "tvet"
        | "international"
      stock_movement_type_enum:
        | "in"
        | "out"
        | "adjustment"
        | "transfer"
        | "write_off"
      structure_applies_to_enum: "all" | "grade" | "class" | "individual"
      subject_assessment_enum: "continuous" | "exam" | "both"
      subject_category_enum:
        | "core"
        | "elective"
        | "co_curricular"
        | "life_skills"
      subscription_plan: "free" | "starter" | "standard" | "pro" | "enterprise"
      subscription_status: "trial" | "active" | "past_due" | "cancelled"
      template_category_enum:
        | "fee_reminder"
        | "attendance_alert"
        | "exam_result"
        | "announcement"
        | "payment_receipt"
        | "meeting"
        | "emergency"
        | "custom"
      transport_incident_type_enum:
        | "breakdown"
        | "accident"
        | "complaint"
        | "traffic"
        | "medical"
        | "other"
      trip_direction_enum: "am_pickup" | "pm_dropoff" | "excursion" | "other"
      trip_status_enum:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "incident"
      vehicle_status_enum: "active" | "maintenance" | "retired" | "reserved"
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
      allocation_status_enum: ["active", "ended", "transferred"],
      assessment_type_enum: [
        "assignment",
        "quiz",
        "project",
        "practical",
        "oral",
        "other",
      ],
      asset_status_enum: ["active", "in_repair", "disposed", "lost"],
      bed_status_enum: [
        "available",
        "occupied",
        "reserved",
        "maintenance",
        "out_of_service",
      ],
      blood_group_enum: [
        "A+",
        "A-",
        "B+",
        "B-",
        "O+",
        "O-",
        "AB+",
        "AB-",
        "unknown",
      ],
      boarding_status_enum: [
        "boarded",
        "missed",
        "dropped",
        "absent",
        "no_show",
      ],
      campaign_status_enum: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "failed",
        "cancelled",
      ],
      curriculum_type: ["cbc", "8-4-4", "igcse", "ib", "cambridge", "mixed"],
      discount_type_enum: ["percent", "fixed"],
      document_owner_type_enum: ["student", "staff", "guardian"],
      employment_type_enum: [
        "permanent",
        "contract",
        "part_time",
        "intern",
        "casual",
        "bom",
      ],
      enrollment_status_enum: [
        "active",
        "alumni",
        "transferred",
        "dropped_out",
        "suspended",
        "deceased",
        "on_leave",
      ],
      erasure_status_enum: ["pending", "approved", "rejected", "completed"],
      exam_status_enum: [
        "planned",
        "in_progress",
        "marking",
        "published",
        "archived",
      ],
      exam_type_enum: [
        "cat",
        "midterm",
        "end_term",
        "mock",
        "knec_mock",
        "internal",
        "other",
      ],
      expense_payment_method_enum: [
        "cash",
        "mpesa",
        "bank_transfer",
        "cheque",
        "card",
        "other",
      ],
      expense_status_enum: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "paid",
        "void",
      ],
      fee_category_enum: [
        "tuition",
        "transport",
        "boarding",
        "lunch",
        "exam",
        "activity",
        "uniform",
        "book",
        "development",
        "other",
      ],
      fee_frequency_enum: ["per_term", "per_year", "one_off", "monthly"],
      gender_enum: ["male", "female", "other", "prefer_not_to_say"],
      grade_stage_enum: [
        "pre_primary",
        "lower_primary",
        "upper_primary",
        "junior_secondary",
        "senior_secondary",
        "primary",
        "secondary",
        "o_level",
        "a_level",
        "other",
      ],
      guardian_relationship_enum: [
        "father",
        "mother",
        "guardian",
        "grandparent",
        "uncle",
        "aunt",
        "sibling",
        "other",
      ],
      hostel_gender_enum: ["boys", "girls", "mixed"],
      invoice_status_enum: [
        "draft",
        "issued",
        "partial",
        "paid",
        "overdue",
        "void",
      ],
      learner_category_enum: [
        "day_scholar",
        "boarder",
        "weekly_boarder",
        "special_needs",
      ],
      lesson_status_enum: ["draft", "pending_review", "approved", "rejected"],
      library_item_status_enum: [
        "available",
        "checked_out",
        "reserved",
        "lost",
        "damaged",
        "retired",
      ],
      library_loan_status_enum: ["active", "returned", "overdue", "lost"],
      message_channel_enum: [
        "in_app",
        "sms",
        "email",
        "whatsapp",
        "voice",
        "push",
      ],
      message_recipient_type_enum: [
        "student",
        "guardian",
        "staff",
        "user",
        "group",
        "phone",
        "email",
      ],
      message_status_enum: [
        "queued",
        "sending",
        "sent",
        "delivered",
        "read",
        "failed",
        "opted_out",
      ],
      notification_category_enum: [
        "academic",
        "financial",
        "communication",
        "attendance",
        "system",
      ],
      out_pass_status_enum: [
        "requested",
        "guardian_approved",
        "guardian_denied",
        "approved",
        "denied",
        "checked_out",
        "returned",
        "overdue",
        "cancelled",
      ],
      payment_method_enum: [
        "cash",
        "mpesa",
        "airtel_money",
        "bank_transfer",
        "cheque",
        "card",
        "pos",
        "other",
      ],
      po_status_enum: [
        "draft",
        "approved",
        "sent",
        "partially_received",
        "received",
        "closed",
        "cancelled",
      ],
      policy_kind_enum: [
        "privacy_policy",
        "terms_of_service",
        "cookie_policy",
        "dpia",
      ],
      reminder_channel_enum: ["sms", "whatsapp", "email"],
      report_run_status_enum: ["queued", "running", "ready", "failed"],
      requisition_status_enum: [
        "draft",
        "submitted",
        "approved",
        "rejected",
        "ordered",
        "closed",
      ],
      roll_call_status_enum: [
        "present",
        "absent",
        "sick",
        "out_pass",
        "unaccounted",
      ],
      roll_call_type_enum: [
        "morning",
        "evening",
        "lights_out",
        "weekend",
        "custom",
      ],
      room_type_enum: [
        "classroom",
        "lab",
        "hall",
        "sports",
        "library",
        "other",
      ],
      sar_status_enum: [
        "pending",
        "in_progress",
        "fulfilled",
        "rejected",
        "cancelled",
      ],
      sar_subject_type_enum: ["parent", "student", "staff", "other"],
      scheme_status_enum: ["draft", "pending_review", "approved", "rejected"],
      school_type: [
        "primary",
        "junior_secondary",
        "senior_secondary",
        "combined",
        "tertiary",
        "tvet",
        "international",
      ],
      stock_movement_type_enum: [
        "in",
        "out",
        "adjustment",
        "transfer",
        "write_off",
      ],
      structure_applies_to_enum: ["all", "grade", "class", "individual"],
      subject_assessment_enum: ["continuous", "exam", "both"],
      subject_category_enum: [
        "core",
        "elective",
        "co_curricular",
        "life_skills",
      ],
      subscription_plan: ["free", "starter", "standard", "pro", "enterprise"],
      subscription_status: ["trial", "active", "past_due", "cancelled"],
      template_category_enum: [
        "fee_reminder",
        "attendance_alert",
        "exam_result",
        "announcement",
        "payment_receipt",
        "meeting",
        "emergency",
        "custom",
      ],
      transport_incident_type_enum: [
        "breakdown",
        "accident",
        "complaint",
        "traffic",
        "medical",
        "other",
      ],
      trip_direction_enum: ["am_pickup", "pm_dropoff", "excursion", "other"],
      trip_status_enum: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "incident",
      ],
      vehicle_status_enum: ["active", "maintenance", "retired", "reserved"],
    },
  },
} as const
