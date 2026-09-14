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
    PostgrestVersion: "14.5"
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
        Relationships: [
          {
            foreignKeyName: "academic_years_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      accident_reports: {
        Row: {
          created_at: string
          description: string
          first_aid_given: string | null
          guardian_notified: boolean
          guardian_notified_at: string | null
          hospital: string | null
          id: string
          incident_date: string
          injury_description: string | null
          location: string | null
          photos: string[]
          referred_to_hospital: boolean
          reported_by: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
          witnesses: string | null
        }
        Insert: {
          created_at?: string
          description: string
          first_aid_given?: string | null
          guardian_notified?: boolean
          guardian_notified_at?: string | null
          hospital?: string | null
          id?: string
          incident_date: string
          injury_description?: string | null
          location?: string | null
          photos?: string[]
          referred_to_hospital?: boolean
          reported_by?: string | null
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
          witnesses?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          first_aid_given?: string | null
          guardian_notified?: boolean
          guardian_notified_at?: string | null
          hospital?: string | null
          id?: string
          incident_date?: string
          injury_description?: string | null
          location?: string | null
          photos?: string[]
          referred_to_hospital?: boolean
          reported_by?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accident_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accident_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accident_reports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admission_documents: {
        Row: {
          admission_id: string
          created_at: string
          document_type: string
          file_name: string | null
          file_url: string
          id: string
          is_verified: boolean
          tenant_id: string
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admission_id: string
          created_at?: string
          document_type: string
          file_name?: string | null
          file_url: string
          id?: string
          is_verified?: boolean
          tenant_id: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admission_id?: string
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          is_verified?: boolean
          tenant_id?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admission_documents_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admission_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      admissions: {
        Row: {
          applicant_date_of_birth: string | null
          applicant_full_name: string
          applicant_gender: string | null
          application_number: string
          applied_for_academic_year: string | null
          applied_for_class: string | null
          assessment_notes: string | null
          assessment_score: number | null
          created_at: string
          decision_at: string | null
          decision_by: string | null
          decision_notes: string | null
          enrolled_student_id: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          metadata: Json
          previous_class: string | null
          previous_school: string | null
          source: string | null
          stage: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          applicant_date_of_birth?: string | null
          applicant_full_name: string
          applicant_gender?: string | null
          application_number: string
          applied_for_academic_year?: string | null
          applied_for_class?: string | null
          assessment_notes?: string | null
          assessment_score?: number | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          enrolled_student_id?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          metadata?: Json
          previous_class?: string | null
          previous_school?: string | null
          source?: string | null
          stage?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          applicant_date_of_birth?: string | null
          applicant_full_name?: string
          applicant_gender?: string | null
          application_number?: string
          applied_for_academic_year?: string | null
          applied_for_class?: string | null
          assessment_notes?: string | null
          assessment_score?: number | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          enrolled_student_id?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          metadata?: Json
          previous_class?: string | null
          previous_school?: string | null
          source?: string | null
          stage?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "admissions_enrolled_student_id_fkey"
            columns: ["enrolled_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admissions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          cost_usd: number | null
          created_at: string
          function_name: string
          id: string
          input_tokens: number | null
          metadata: Json
          model: string | null
          output_tokens: number | null
          purpose: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          cost_usd?: number | null
          created_at?: string
          function_name: string
          id?: string
          input_tokens?: number | null
          metadata?: Json
          model?: string | null
          output_tokens?: number | null
          purpose?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          cost_usd?: number | null
          created_at?: string
          function_name?: string
          id?: string
          input_tokens?: number | null
          metadata?: Json
          model?: string | null
          output_tokens?: number | null
          purpose?: string | null
          tenant_id?: string | null
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
      attendance_records: {
        Row: {
          arrival_time: string | null
          departure_time: string | null
          id: string
          reason: string | null
          recorded_at: string
          recorded_by: string | null
          session_id: string
          status: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          arrival_time?: string | null
          departure_time?: string | null
          id?: string
          reason?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id: string
          status: string
          student_id: string
          tenant_id: string
        }
        Update: {
          arrival_time?: string | null
          departure_time?: string | null
          id?: string
          reason?: string | null
          recorded_at?: string
          recorded_by?: string | null
          session_id?: string
          status?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          is_finalized: boolean
          notes: string | null
          period_id: string | null
          session_type: string
          subject_id: string | null
          taken_at: string | null
          taken_by: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          is_finalized?: boolean
          notes?: string | null
          period_id?: string | null
          session_type?: string
          subject_id?: string | null
          taken_at?: string | null
          taken_by?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          is_finalized?: boolean
          notes?: string | null
          period_id?: string | null
          session_type?: string
          subject_id?: string | null
          taken_at?: string | null
          taken_by?: string | null
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
            foreignKeyName: "attendance_sessions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_sessions_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "staff"
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
          actor_type: string | null
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: unknown
          tenant_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_type?: string | null
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
          tenant_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_type?: string | null
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: unknown
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
          actual_cost: number | null
          audience_query: Json
          body_template: string
          channel: string
          created_at: string
          created_by: string | null
          delivered_count: number
          estimated_cost: number | null
          failed_count: number
          id: string
          metadata: Json
          name: string
          scheduled_for: string | null
          sent_at: string | null
          sent_count: number
          status: string
          subject: string | null
          tenant_id: string
          total_recipients: number
          updated_at: string
        }
        Insert: {
          actual_cost?: number | null
          audience_query?: Json
          body_template: string
          channel: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          estimated_cost?: number | null
          failed_count?: number
          id?: string
          metadata?: Json
          name: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string | null
          tenant_id: string
          total_recipients?: number
          updated_at?: string
        }
        Update: {
          actual_cost?: number | null
          audience_query?: Json
          body_template?: string
          channel?: string
          created_at?: string
          created_by?: string | null
          delivered_count?: number
          estimated_cost?: number | null
          failed_count?: number
          id?: string
          metadata?: Json
          name?: string
          scheduled_for?: string | null
          sent_at?: string | null
          sent_count?: number
          status?: string
          subject?: string | null
          tenant_id?: string
          total_recipients?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "broadcast_campaigns_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      cbc_values: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cbc_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      class_subjects: {
        Row: {
          class_id: string
          created_at: string
          id: string
          is_active: boolean
          lessons_per_week: number
          subject_id: string
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          lessons_per_week?: number
          subject_id: string
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          lessons_per_week?: number
          subject_id?: string
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
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
          {
            foreignKeyName: "class_subjects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year: string | null
          academic_year_id: string | null
          assistant_teacher_id: string | null
          capacity: number
          class_teacher_id: string | null
          created_at: string
          current_enrollment: number
          grade_level: string | null
          grade_level_id: string | null
          id: string
          is_active: boolean
          name: string
          room_id: string | null
          stream: string | null
          teacher_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          academic_year?: string | null
          academic_year_id?: string | null
          assistant_teacher_id?: string | null
          capacity?: number
          class_teacher_id?: string | null
          created_at?: string
          current_enrollment?: number
          grade_level?: string | null
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          room_id?: string | null
          stream?: string | null
          teacher_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          academic_year?: string | null
          academic_year_id?: string | null
          assistant_teacher_id?: string | null
          capacity?: number
          class_teacher_id?: string | null
          created_at?: string
          current_enrollment?: number
          grade_level?: string | null
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          room_id?: string | null
          stream?: string | null
          teacher_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_assistant_teacher_id_fkey"
            columns: ["assistant_teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_class_teacher_fkey"
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
            foreignKeyName: "classes_teacher_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      core_competencies: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "core_competencies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_notes: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          credit_note_number: string | null
          currency: string
          description: string | null
          id: string
          invoice_id: string | null
          reason: string
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credit_note_number?: string | null
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          reason: string
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          credit_note_number?: string | null
          currency?: string
          description?: string | null
          id?: string
          invoice_id?: string | null
          reason?: string
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_notes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_notes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          code: string | null
          created_at: string
          head_staff_id: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          head_staff_id?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          head_staff_id?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_head_staff_fkey"
            columns: ["head_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "departments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      disciplinary_actions: {
        Row: {
          action_date: string
          action_type: string
          approved_by: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          duration_days: number | null
          id: string
          imposed_by: string | null
          incident_id: string | null
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          action_date?: string
          action_type: string
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          imposed_by?: string | null
          incident_id?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          action_date?: string
          action_type?: string
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          duration_days?: number | null
          id?: string
          imposed_by?: string | null
          incident_id?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disciplinary_actions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_imposed_by_fkey"
            columns: ["imposed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "discipline_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disciplinary_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      discipline_incidents: {
        Row: {
          category: string
          created_at: string
          description: string
          guardian_notified: boolean
          guardian_notified_at: string | null
          id: string
          incident_date: string
          investigated_by: string | null
          location: string | null
          reported_by: string | null
          severity: string
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
          witnesses: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          guardian_notified?: boolean
          guardian_notified_at?: string | null
          id?: string
          incident_date: string
          investigated_by?: string | null
          location?: string | null
          reported_by?: string | null
          severity?: string
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
          guardian_notified?: boolean
          guardian_notified_at?: string | null
          id?: string
          incident_date?: string
          investigated_by?: string | null
          location?: string | null
          reported_by?: string | null
          severity?: string
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
          witnesses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "discipline_incidents_investigated_by_fkey"
            columns: ["investigated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_incidents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discipline_incidents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          doc_type: string
          file_name: string
          file_url: string
          id: string
          is_verified: boolean
          metadata: Json
          mime_type: string | null
          notes: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type_enum"]
          size_bytes: number | null
          tenant_id: string
          uploaded_by: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          doc_type: string
          file_name: string
          file_url: string
          id?: string
          is_verified?: boolean
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          owner_id: string
          owner_type: Database["public"]["Enums"]["document_owner_type_enum"]
          size_bytes?: number | null
          tenant_id: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          doc_type?: string
          file_name?: string
          file_url?: string
          id?: string
          is_verified?: boolean
          metadata?: Json
          mime_type?: string | null
          notes?: string | null
          owner_id?: string
          owner_type?: Database["public"]["Enums"]["document_owner_type_enum"]
          size_bytes?: number | null
          tenant_id?: string
          uploaded_by?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_tenant_id_fkey"
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
          is_active: boolean
          licence_expiry: string | null
          licence_number: string | null
          phone: string | null
          staff_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          licence_expiry?: string | null
          licence_number?: string | null
          phone?: string | null
          staff_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          licence_expiry?: string | null
          licence_number?: string | null
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
      exam_subjects: {
        Row: {
          created_at: string
          duration_minutes: number | null
          exam_date: string | null
          exam_id: string
          id: string
          max_marks: number
          paper_number: number
          subject_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          exam_date?: string | null
          exam_id: string
          id?: string
          max_marks?: number
          paper_number?: number
          subject_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          exam_date?: string | null
          exam_id?: string
          id?: string
          max_marks?: number
          paper_number?: number
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
            foreignKeyName: "exam_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_subjects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          academic_year_id: string
          created_at: string
          created_by: string | null
          end_date: string | null
          exam_type: string
          grade_levels: string[]
          id: string
          name: string
          published_at: string | null
          published_by: string | null
          start_date: string | null
          status: string
          tenant_id: string
          term_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          exam_type?: string
          grade_levels?: string[]
          id?: string
          name: string
          published_at?: string | null
          published_by?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          term_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          exam_type?: string
          grade_levels?: string[]
          id?: string
          name?: string
          published_at?: string | null
          published_by?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          term_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_tenant_id_fkey"
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
      expense_categories: {
        Row: {
          accounting_code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          accounting_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          accounting_code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_tenant_id_fkey"
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
          category_id: string | null
          created_at: string
          currency: string
          description: string
          expense_date: string
          expense_number: string | null
          id: string
          metadata: Json
          notes: string | null
          paid_by: string | null
          paid_date: string | null
          payment_method: string | null
          payment_reference: string | null
          receipt_url: string | null
          requested_by: string | null
          status: string
          tenant_id: string
          updated_at: string
          vat_amount: number
          vendor_name: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description: string
          expense_date: string
          expense_number?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          requested_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vat_amount?: number
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          description?: string
          expense_date?: string
          expense_number?: string | null
          id?: string
          metadata?: Json
          notes?: string | null
          paid_by?: string | null
          paid_date?: string | null
          payment_method?: string | null
          payment_reference?: string | null
          receipt_url?: string | null
          requested_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vat_amount?: number
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_items: {
        Row: {
          accounting_code: string | null
          category: string
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_optional: boolean
          is_refundable: boolean
          name: string
          tenant_id: string
          updated_at: string
          vat_applicable: boolean
          vat_rate: number
        }
        Insert: {
          accounting_code?: string | null
          category: string
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_optional?: boolean
          is_refundable?: boolean
          name: string
          tenant_id: string
          updated_at?: string
          vat_applicable?: boolean
          vat_rate?: number
        }
        Update: {
          accounting_code?: string | null
          category?: string
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_optional?: boolean
          is_refundable?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
          vat_applicable?: boolean
          vat_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "fee_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_reminders: {
        Row: {
          amount_owed_at_send: number
          channel: string
          id: string
          invoice_id: string | null
          message_id: string | null
          reminder_type: string
          sent_at: string
          sent_by: string | null
          sent_to: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          amount_owed_at_send: number
          channel: string
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          reminder_type: string
          sent_at?: string
          sent_by?: string | null
          sent_to: string
          student_id: string
          tenant_id: string
        }
        Update: {
          amount_owed_at_send?: number
          channel?: string
          id?: string
          invoice_id?: string | null
          message_id?: string | null
          reminder_type?: string
          sent_at?: string
          sent_by?: string | null
          sent_to?: string
          student_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_reminders_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_reminders_sent_by_fkey"
            columns: ["sent_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_reminders_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structure_items: {
        Row: {
          amount: number
          created_at: string
          currency: string
          due_date_offset_days: number
          fee_item_id: string
          fee_structure_id: string
          id: string
          is_mandatory: boolean
          notes: string | null
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          due_date_offset_days?: number
          fee_item_id: string
          fee_structure_id: string
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          due_date_offset_days?: number
          fee_item_id?: string
          fee_structure_id?: string
          id?: string
          is_mandatory?: boolean
          notes?: string | null
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_structure_items_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_items_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structure_items_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_structures: {
        Row: {
          academic_year_id: string
          created_at: string
          grade_level_id: string | null
          id: string
          is_active: boolean
          name: string
          scholar_type: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          name: string
          scholar_type?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          grade_level_id?: string | null
          id?: string
          is_active?: boolean
          name?: string
          scholar_type?: string | null
          tenant_id?: string
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
            foreignKeyName: "fee_structures_grade_level_id_fkey"
            columns: ["grade_level_id"]
            isOneToOne: false
            referencedRelation: "grade_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fee_structures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grade_levels: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          max_age: number | null
          min_age: number | null
          name: string
          sort_order: number
          stage: Database["public"]["Enums"]["grade_stage_enum"] | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_age?: number | null
          min_age?: number | null
          name: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["grade_stage_enum"] | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          max_age?: number | null
          min_age?: number | null
          name?: string
          sort_order?: number
          stage?: Database["public"]["Enums"]["grade_stage_enum"] | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grade_levels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scale_bands: {
        Row: {
          created_at: string
          description: string | null
          grading_scale_id: string
          id: string
          label: string
          max_score: number | null
          min_score: number | null
          points: number | null
          sort_order: number
          tenant_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          grading_scale_id: string
          id?: string
          label: string
          max_score?: number | null
          min_score?: number | null
          points?: number | null
          sort_order?: number
          tenant_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          grading_scale_id?: string
          id?: string
          label?: string
          max_score?: number | null
          min_score?: number | null
          points?: number | null
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_scale_bands_grading_scale_id_fkey"
            columns: ["grading_scale_id"]
            isOneToOne: false
            referencedRelation: "grading_scales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grading_scale_bands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      grading_scales: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          scale_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          scale_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          scale_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "grading_scales_tenant_id_fkey"
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
          metadata: Json
          national_id_number: string | null
          notes: string | null
          occupation: string | null
          phone_primary: string | null
          phone_secondary: string | null
          photo_url: string | null
          portal_user_id: string | null
          preferred_channel: string
          preferred_name: string | null
          relationship_default: string | null
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
          metadata?: Json
          national_id_number?: string | null
          notes?: string | null
          occupation?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          preferred_channel?: string
          preferred_name?: string | null
          relationship_default?: string | null
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
          metadata?: Json
          national_id_number?: string | null
          notes?: string | null
          occupation?: string | null
          phone_primary?: string | null
          phone_secondary?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          preferred_channel?: string
          preferred_name?: string | null
          relationship_default?: string | null
          residential_address?: string | null
          tenant_id?: string
          updated_at?: string
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guardians_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      health_records: {
        Row: {
          allergies: string[]
          blood_group: string | null
          chronic_conditions: string[]
          created_at: string
          dietary_restrictions: string | null
          emergency_doctor_name: string | null
          emergency_doctor_phone: string | null
          id: string
          insurance_expiry: string | null
          insurance_number: string | null
          insurance_provider: string | null
          notes: string | null
          preferred_hospital: string | null
          regular_medications: string[]
          special_needs: string | null
          student_id: string
          tenant_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          allergies?: string[]
          blood_group?: string | null
          chronic_conditions?: string[]
          created_at?: string
          dietary_restrictions?: string | null
          emergency_doctor_name?: string | null
          emergency_doctor_phone?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          notes?: string | null
          preferred_hospital?: string | null
          regular_medications?: string[]
          special_needs?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          allergies?: string[]
          blood_group?: string | null
          chronic_conditions?: string[]
          created_at?: string
          dietary_restrictions?: string | null
          emergency_doctor_name?: string | null
          emergency_doctor_phone?: string | null
          id?: string
          insurance_expiry?: string | null
          insurance_number?: string | null
          insurance_provider?: string | null
          notes?: string | null
          preferred_hospital?: string | null
          regular_medications?: string[]
          special_needs?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_records_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      health_visits: {
        Row: {
          attended_by: string | null
          complaint: string
          created_at: string
          diagnosis: string | null
          guardian_notified: boolean
          guardian_notified_at: string | null
          hospital_referred: string | null
          id: string
          medication_dispensed: string | null
          notes: string | null
          referred_to_hospital: boolean
          student_id: string
          tenant_id: string
          treatment: string | null
          updated_at: string
          visit_date: string
        }
        Insert: {
          attended_by?: string | null
          complaint: string
          created_at?: string
          diagnosis?: string | null
          guardian_notified?: boolean
          guardian_notified_at?: string | null
          hospital_referred?: string | null
          id?: string
          medication_dispensed?: string | null
          notes?: string | null
          referred_to_hospital?: boolean
          student_id: string
          tenant_id: string
          treatment?: string | null
          updated_at?: string
          visit_date?: string
        }
        Update: {
          attended_by?: string | null
          complaint?: string
          created_at?: string
          diagnosis?: string | null
          guardian_notified?: boolean
          guardian_notified_at?: string | null
          hospital_referred?: string | null
          id?: string
          medication_dispensed?: string | null
          notes?: string | null
          referred_to_hospital?: boolean
          student_id?: string
          tenant_id?: string
          treatment?: string | null
          updated_at?: string
          visit_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "health_visits_attended_by_fkey"
            columns: ["attended_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_visits_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "health_visits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_allocations: {
        Row: {
          allocated_by: string | null
          allocated_from: string
          allocated_to: string | null
          bed_number: string | null
          created_at: string
          hostel_id: string
          id: string
          notes: string | null
          room_id: string | null
          status: string
          student_id: string
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          allocated_by?: string | null
          allocated_from?: string
          allocated_to?: string | null
          bed_number?: string | null
          created_at?: string
          hostel_id: string
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: string
          student_id: string
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          allocated_by?: string | null
          allocated_from?: string
          allocated_to?: string | null
          bed_number?: string | null
          created_at?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          room_id?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "hostel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_allocations_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_out_passes: {
        Row: {
          actual_departure_at: string | null
          actual_return_at: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          departure_date: string
          departure_time: string | null
          destination: string | null
          guardian_id: string | null
          hostel_id: string | null
          id: string
          notes: string | null
          reason: string
          return_date: string
          return_time: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_departure_at?: string | null
          actual_return_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          departure_date: string
          departure_time?: string | null
          destination?: string | null
          guardian_id?: string | null
          hostel_id?: string | null
          id?: string
          notes?: string | null
          reason: string
          return_date: string
          return_time?: string | null
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_departure_at?: string | null
          actual_return_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          departure_date?: string
          departure_time?: string | null
          destination?: string | null
          guardian_id?: string | null
          hostel_id?: string | null
          id?: string
          notes?: string | null
          reason?: string
          return_date?: string
          return_time?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_out_passes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_out_passes_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_out_passes_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_out_passes_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_out_passes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_roll_call_entries: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          roll_call_id: string
          status: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          roll_call_id: string
          status: string
          student_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          roll_call_id?: string
          status?: string
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
          {
            foreignKeyName: "hostel_roll_call_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_roll_call_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_roll_calls: {
        Row: {
          created_at: string
          hostel_id: string
          id: string
          notes: string | null
          roll_call_at: string
          roll_call_type: string | null
          taken_by: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string
          hostel_id: string
          id?: string
          notes?: string | null
          roll_call_at: string
          roll_call_type?: string | null
          taken_by?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          roll_call_at?: string
          roll_call_type?: string | null
          taken_by?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hostel_roll_calls_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_roll_calls_taken_by_fkey"
            columns: ["taken_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_roll_calls_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          is_active: boolean
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
          is_active?: boolean
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
          is_active?: boolean
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
          {
            foreignKeyName: "hostel_rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hostel_visitors: {
        Row: {
          check_in_at: string
          check_out_at: string | null
          checked_in_by: string | null
          created_at: string
          hostel_id: string
          id: string
          notes: string | null
          purpose: string | null
          relationship_to_student: string | null
          student_id: string | null
          tenant_id: string
          visitor_id_number: string | null
          visitor_id_type: string | null
          visitor_name: string
          visitor_phone: string | null
        }
        Insert: {
          check_in_at?: string
          check_out_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          hostel_id: string
          id?: string
          notes?: string | null
          purpose?: string | null
          relationship_to_student?: string | null
          student_id?: string | null
          tenant_id: string
          visitor_id_number?: string | null
          visitor_id_type?: string | null
          visitor_name: string
          visitor_phone?: string | null
        }
        Update: {
          check_in_at?: string
          check_out_at?: string | null
          checked_in_by?: string | null
          created_at?: string
          hostel_id?: string
          id?: string
          notes?: string | null
          purpose?: string | null
          relationship_to_student?: string | null
          student_id?: string | null
          tenant_id?: string
          visitor_id_number?: string | null
          visitor_id_type?: string | null
          visitor_name?: string
          visitor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostel_visitors_checked_in_by_fkey"
            columns: ["checked_in_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_visitors_hostel_id_fkey"
            columns: ["hostel_id"]
            isOneToOne: false
            referencedRelation: "hostels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_visitors_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostel_visitors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hostels: {
        Row: {
          address: string | null
          capacity: number | null
          created_at: string
          hostel_type: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
          warden_id: string | null
        }
        Insert: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          hostel_type?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
          warden_id?: string | null
        }
        Update: {
          address?: string | null
          capacity?: number | null
          created_at?: string
          hostel_type?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
          warden_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hostels_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hostels_warden_id_fkey"
            columns: ["warden_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      immunization_records: {
        Row: {
          administered_by: string | null
          administered_date: string
          batch_number: string | null
          certificate_url: string | null
          created_at: string
          dose_number: number | null
          id: string
          next_due_date: string | null
          notes: string | null
          student_id: string
          tenant_id: string
          updated_at: string
          vaccine_name: string
        }
        Insert: {
          administered_by?: string | null
          administered_date: string
          batch_number?: string | null
          certificate_url?: string | null
          created_at?: string
          dose_number?: number | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
          vaccine_name: string
        }
        Update: {
          administered_by?: string | null
          administered_date?: string
          batch_number?: string | null
          certificate_url?: string | null
          created_at?: string
          dose_number?: number | null
          id?: string
          next_due_date?: string | null
          notes?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
          vaccine_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "immunization_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "immunization_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category_id: string | null
          code: string
          created_at: string
          current_stock: number
          id: string
          is_active: boolean
          location: string | null
          name: string
          reorder_level: number
          tenant_id: string
          unit: string
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          code: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          reorder_level?: number
          tenant_id: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          code?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          reorder_level?: number
          tenant_id?: string
          unit?: string
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "inventory_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          approved_by: string | null
          created_at: string
          id: string
          item_id: string
          notes: string | null
          performed_by: string | null
          purpose: string | null
          quantity: number
          reference: string | null
          tenant_id: string
          transaction_date: string
          transaction_type: string
          unit_cost: number | null
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          id?: string
          item_id: string
          notes?: string | null
          performed_by?: string | null
          purpose?: string | null
          quantity: number
          reference?: string | null
          tenant_id: string
          transaction_date?: string
          transaction_type: string
          unit_cost?: number | null
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          id?: string
          item_id?: string
          notes?: string | null
          performed_by?: string | null
          purpose?: string | null
          quantity?: number
          reference?: string | null
          tenant_id?: string
          transaction_date?: string
          transaction_type?: string
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          created_at: string
          description: string
          discount_amount: number
          fee_item_id: string | null
          id: string
          invoice_id: string
          line_total: number
          quantity: number
          sort_order: number
          tenant_id: string
          unit_amount: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          created_at?: string
          description: string
          discount_amount?: number
          fee_item_id?: string | null
          id?: string
          invoice_id: string
          line_total: number
          quantity?: number
          sort_order?: number
          tenant_id: string
          unit_amount: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          created_at?: string
          description?: string
          discount_amount?: number
          fee_item_id?: string | null
          id?: string
          invoice_id?: string
          line_total?: number
          quantity?: number
          sort_order?: number
          tenant_id?: string
          unit_amount?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_fee_item_id_fkey"
            columns: ["fee_item_id"]
            isOneToOne: false
            referencedRelation: "fee_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_line_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          academic_year_id: string
          amount_paid: number
          balance: number
          created_at: string
          created_by: string | null
          currency: string
          discount_total: number
          due_date: string | null
          id: string
          invoice_number: string | null
          issue_date: string
          issued_at: string | null
          metadata: Json
          notes: string | null
          status: string
          student_id: string
          subtotal: number
          tenant_id: string
          term_id: string | null
          total: number
          updated_at: string
          vat_total: number
        }
        Insert: {
          academic_year_id: string
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_total?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          issued_at?: string | null
          metadata?: Json
          notes?: string | null
          status?: string
          student_id: string
          subtotal?: number
          tenant_id: string
          term_id?: string | null
          total?: number
          updated_at?: string
          vat_total?: number
        }
        Update: {
          academic_year_id?: string
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          discount_total?: number
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issue_date?: string
          issued_at?: string | null
          metadata?: Json
          notes?: string | null
          status?: string
          student_id?: string
          subtotal?: number
          tenant_id?: string
          term_id?: string | null
          total?: number
          updated_at?: string
          vat_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_areas: {
        Row: {
          category: string | null
          code: string
          created_at: string
          curriculum: string
          description: string | null
          id: string
          is_active: boolean
          max_grade_level: number | null
          min_grade_level: number | null
          name: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          curriculum?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_grade_level?: number | null
          min_grade_level?: number | null
          name: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          curriculum?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_grade_level?: number | null
          min_grade_level?: number | null
          name?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_areas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_outcomes: {
        Row: {
          code: string | null
          core_competencies: string[]
          created_at: string
          description: string
          id: string
          sort_order: number
          sub_strand_id: string
          tenant_id: string
          values: string[]
        }
        Insert: {
          code?: string | null
          core_competencies?: string[]
          created_at?: string
          description: string
          id?: string
          sort_order?: number
          sub_strand_id: string
          tenant_id: string
          values?: string[]
        }
        Update: {
          code?: string | null
          core_competencies?: string[]
          created_at?: string
          description?: string
          id?: string
          sort_order?: number
          sub_strand_id?: string
          tenant_id?: string
          values?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "learning_outcomes_sub_strand_id_fkey"
            columns: ["sub_strand_id"]
            isOneToOne: false
            referencedRelation: "sub_strands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_outcomes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      library_books: {
        Row: {
          accession_number: string
          author: string | null
          category: string | null
          copies_available: number
          copies_total: number
          created_at: string
          edition: string | null
          id: string
          is_active: boolean
          isbn: string | null
          location: string | null
          publisher: string | null
          subject_area: string | null
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          accession_number: string
          author?: string | null
          category?: string | null
          copies_available?: number
          copies_total?: number
          created_at?: string
          edition?: string | null
          id?: string
          is_active?: boolean
          isbn?: string | null
          location?: string | null
          publisher?: string | null
          subject_area?: string | null
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          accession_number?: string
          author?: string | null
          category?: string | null
          copies_available?: number
          copies_total?: number
          created_at?: string
          edition?: string | null
          id?: string
          is_active?: boolean
          isbn?: string | null
          location?: string | null
          publisher?: string | null
          subject_area?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_books_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      library_loans: {
        Row: {
          book_id: string
          borrower_staff_id: string | null
          borrower_student_id: string | null
          borrower_type: string
          created_at: string
          due_at: string
          fine_amount: number
          fine_paid: boolean
          id: string
          loaned_at: string
          loaned_by: string | null
          notes: string | null
          received_by: string | null
          returned_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          book_id: string
          borrower_staff_id?: string | null
          borrower_student_id?: string | null
          borrower_type: string
          created_at?: string
          due_at: string
          fine_amount?: number
          fine_paid?: boolean
          id?: string
          loaned_at?: string
          loaned_by?: string | null
          notes?: string | null
          received_by?: string | null
          returned_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          book_id?: string
          borrower_staff_id?: string | null
          borrower_student_id?: string | null
          borrower_type?: string
          created_at?: string
          due_at?: string
          fine_amount?: number
          fine_paid?: boolean
          id?: string
          loaned_at?: string
          loaned_by?: string | null
          notes?: string | null
          received_by?: string | null
          returned_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "library_loans_book_id_fkey"
            columns: ["book_id"]
            isOneToOne: false
            referencedRelation: "library_books"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_borrower_staff_id_fkey"
            columns: ["borrower_staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_borrower_student_id_fkey"
            columns: ["borrower_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_loaned_by_fkey"
            columns: ["loaned_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "library_loans_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "staff"
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
          consent_document_url: string | null
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          guardian_consent: boolean
          id: string
          is_active: boolean
          medication_name: string
          prescribed_by: string | null
          start_date: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consent_document_url?: string | null
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          guardian_consent?: boolean
          id?: string
          is_active?: boolean
          medication_name: string
          prescribed_by?: string | null
          start_date: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consent_document_url?: string | null
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          guardian_consent?: boolean
          id?: string
          is_active?: boolean
          medication_name?: string
          prescribed_by?: string | null
          start_date?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_administration_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_administration_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      merit_points: {
        Row: {
          awarded_by: string | null
          awarded_date: string
          category: string | null
          created_at: string
          id: string
          points: number
          reason: string
          student_id: string
          tenant_id: string
          term_id: string | null
        }
        Insert: {
          awarded_by?: string | null
          awarded_date?: string
          category?: string | null
          created_at?: string
          id?: string
          points: number
          reason: string
          student_id: string
          tenant_id: string
          term_id?: string | null
        }
        Update: {
          awarded_by?: string | null
          awarded_date?: string
          category?: string | null
          created_at?: string
          id?: string
          points?: number
          reason?: string
          student_id?: string
          tenant_id?: string
          term_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merit_points_awarded_by_fkey"
            columns: ["awarded_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merit_points_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merit_points_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merit_points_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      message_templates: {
        Row: {
          body_template: string
          channel: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          key: string
          language: string
          name: string
          notes: string | null
          subject: string | null
          tenant_id: string | null
          updated_at: string
          variables: string[]
        }
        Insert: {
          body_template: string
          channel: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          key: string
          language?: string
          name: string
          notes?: string | null
          subject?: string | null
          tenant_id?: string | null
          updated_at?: string
          variables?: string[]
        }
        Update: {
          body_template?: string
          channel?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          key?: string
          language?: string
          name?: string
          notes?: string | null
          subject?: string | null
          tenant_id?: string | null
          updated_at?: string
          variables?: string[]
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
          channel: string
          cost: number | null
          cost_currency: string | null
          created_at: string
          delivered_at: string | null
          direction: string
          error: string | null
          failed_at: string | null
          id: string
          metadata: Json
          provider: string | null
          provider_message_id: string | null
          read_at: string | null
          receipt_id: string | null
          recipient_email: string | null
          recipient_id: string | null
          recipient_name: string | null
          recipient_phone: string | null
          recipient_type: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          retry_count: number
          scheduled_for: string | null
          sender_user_id: string | null
          sent_at: string | null
          status: string
          student_id: string | null
          subject: string | null
          template_id: string | null
          template_key: string | null
          template_variables: Json
          tenant_id: string
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          body: string
          campaign_id?: string | null
          channel: string
          cost?: number | null
          cost_currency?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          receipt_id?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          retry_count?: number
          scheduled_for?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          student_id?: string | null
          subject?: string | null
          template_id?: string | null
          template_key?: string | null
          template_variables?: Json
          tenant_id: string
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          campaign_id?: string | null
          channel?: string
          cost?: number | null
          cost_currency?: string | null
          created_at?: string
          delivered_at?: string | null
          direction?: string
          error?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json
          provider?: string | null
          provider_message_id?: string | null
          read_at?: string | null
          receipt_id?: string | null
          recipient_email?: string | null
          recipient_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_type?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          retry_count?: number
          scheduled_for?: string | null
          sender_user_id?: string | null
          sent_at?: string | null
          status?: string
          student_id?: string | null
          subject?: string | null
          template_id?: string | null
          template_key?: string | null
          template_variables?: Json
          tenant_id?: string
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "broadcast_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "student_receipts"
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
          channel: string
          contact_name: string | null
          contact_phone: string
          created_at: string
          guardian_id: string | null
          id: string
          last_message_at: string
          notes: string | null
          status: string
          student_id: string | null
          tenant_id: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel: string
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          guardian_id?: string | null
          id?: string
          last_message_at?: string
          notes?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          guardian_id?: string | null
          id?: string
          last_message_at?: string
          notes?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messaging_inbox_threads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messaging_inbox_threads_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
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
      mpesa_c2b_transactions: {
        Row: {
          amount: number
          bill_ref_number: string | null
          business_shortcode: string
          first_name: string | null
          id: string
          last_name: string | null
          match_reason: string | null
          match_status: string
          matched_at: string | null
          matched_by: string | null
          matched_invoice_id: string | null
          matched_payment_id: string | null
          matched_student_id: string | null
          middle_name: string | null
          msisdn: string
          processed_at: string
          raw_payload: Json
          tenant_id: string | null
          transaction_id: string
          transaction_time: string
          transaction_type: string
        }
        Insert: {
          amount: number
          bill_ref_number?: string | null
          business_shortcode: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          match_reason?: string | null
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_invoice_id?: string | null
          matched_payment_id?: string | null
          matched_student_id?: string | null
          middle_name?: string | null
          msisdn: string
          processed_at?: string
          raw_payload: Json
          tenant_id?: string | null
          transaction_id: string
          transaction_time: string
          transaction_type: string
        }
        Update: {
          amount?: number
          bill_ref_number?: string | null
          business_shortcode?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          match_reason?: string | null
          match_status?: string
          matched_at?: string | null
          matched_by?: string | null
          matched_invoice_id?: string | null
          matched_payment_id?: string | null
          matched_student_id?: string | null
          middle_name?: string | null
          msisdn?: string
          processed_at?: string
          raw_payload?: Json
          tenant_id?: string | null
          transaction_id?: string
          transaction_time?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_c2b_transactions_matched_by_fkey"
            columns: ["matched_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_c2b_transactions_matched_invoice_id_fkey"
            columns: ["matched_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_c2b_transactions_matched_payment_id_fkey"
            columns: ["matched_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_c2b_transactions_matched_student_id_fkey"
            columns: ["matched_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_c2b_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_config: {
        Row: {
          callback_registered: boolean
          callback_registered_at: string | null
          consumer_key_encrypted: string | null
          consumer_secret_encrypted: string | null
          created_at: string
          environment: string
          id: string
          initiator_name: string | null
          is_active: boolean
          notes: string | null
          passkey_encrypted: string | null
          shortcode: string
          shortcode_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          callback_registered?: boolean
          callback_registered_at?: string | null
          consumer_key_encrypted?: string | null
          consumer_secret_encrypted?: string | null
          created_at?: string
          environment: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          notes?: string | null
          passkey_encrypted?: string | null
          shortcode: string
          shortcode_type: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          callback_registered?: boolean
          callback_registered_at?: string | null
          consumer_key_encrypted?: string | null
          consumer_secret_encrypted?: string | null
          created_at?: string
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          notes?: string | null
          passkey_encrypted?: string | null
          shortcode?: string
          shortcode_type?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      mpesa_stk_requests: {
        Row: {
          account_reference: string
          amount: number
          checkout_request_id: string | null
          completed_at: string | null
          id: string
          initiated_at: string
          initiated_by: string | null
          invoice_id: string | null
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          msisdn: string
          payment_id: string | null
          raw_response: Json | null
          result_code: number | null
          result_desc: string | null
          status: string
          student_id: string | null
          tenant_id: string
          transaction_desc: string | null
        }
        Insert: {
          account_reference: string
          amount: number
          checkout_request_id?: string | null
          completed_at?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          invoice_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          msisdn: string
          payment_id?: string | null
          raw_response?: Json | null
          result_code?: number | null
          result_desc?: string | null
          status?: string
          student_id?: string | null
          tenant_id: string
          transaction_desc?: string | null
        }
        Update: {
          account_reference?: string
          amount?: number
          checkout_request_id?: string | null
          completed_at?: string | null
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          invoice_id?: string | null
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          msisdn?: string
          payment_id?: string | null
          raw_response?: Json | null
          result_code?: number | null
          result_desc?: string | null
          status?: string
          student_id?: string | null
          tenant_id?: string
          transaction_desc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mpesa_stk_requests_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_stk_requests_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_stk_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mpesa_stk_requests_tenant_id_fkey"
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
          category: string | null
          created_at: string
          id: string
          is_read: boolean
          read_at: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          severity: string
          tenant_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string
          tenant_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          read_at?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          severity?: string
          tenant_id?: string | null
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
      payment_allocations: {
        Row: {
          allocated_at: string
          allocated_by: string | null
          amount: number
          id: string
          invoice_id: string
          payment_id: string
          tenant_id: string
        }
        Insert: {
          allocated_at?: string
          allocated_by?: string | null
          amount: number
          id?: string
          invoice_id: string
          payment_id: string
          tenant_id: string
        }
        Update: {
          allocated_at?: string
          allocated_by?: string | null
          amount?: number
          id?: string
          invoice_id?: string
          payment_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_allocated_by_fkey"
            columns: ["allocated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_allocations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          bank_account: string | null
          created_at: string
          currency: string
          id: string
          idempotency_key: string | null
          metadata: Json
          method: string
          notes: string | null
          paid_at: string
          payer_name: string | null
          payer_phone: string | null
          payment_number: string | null
          received_by: string | null
          reference: string | null
          status: string
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account?: string | null
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          method: string
          notes?: string | null
          paid_at?: string
          payer_name?: string | null
          payer_phone?: string | null
          payment_number?: string | null
          received_by?: string | null
          reference?: string | null
          status?: string
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account?: string | null
          created_at?: string
          currency?: string
          id?: string
          idempotency_key?: string | null
          metadata?: Json
          method?: string
          notes?: string | null
          paid_at?: string
          payer_name?: string | null
          payer_phone?: string | null
          payment_number?: string | null
          received_by?: string | null
          reference?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_periods: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          end_date: string
          id: string
          name: string
          paid_at: string | null
          pay_date: string
          period_type: string
          start_date: string
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date: string
          id?: string
          name: string
          paid_at?: string | null
          pay_date: string
          period_type?: string
          start_date: string
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          end_date?: string
          id?: string
          name?: string
          paid_at?: string | null
          pay_date?: string
          period_type?: string
          start_date?: string
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_periods_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          allowances_total: number
          base_salary: number
          created_at: string
          deductions_total: number
          gross_pay: number
          housing_levy: number
          id: string
          metadata: Json
          net_pay: number
          nhif_contribution: number
          notes: string | null
          nssf_contribution: number
          other_deductions: number
          paye_tax: number
          payment_method: string | null
          payment_reference: string | null
          payroll_period_id: string
          payslip_url: string | null
          shif_contribution: number
          staff_compensation_id: string | null
          staff_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          allowances_total?: number
          base_salary: number
          created_at?: string
          deductions_total?: number
          gross_pay: number
          housing_levy?: number
          id?: string
          metadata?: Json
          net_pay: number
          nhif_contribution?: number
          notes?: string | null
          nssf_contribution?: number
          other_deductions?: number
          paye_tax?: number
          payment_method?: string | null
          payment_reference?: string | null
          payroll_period_id: string
          payslip_url?: string | null
          shif_contribution?: number
          staff_compensation_id?: string | null
          staff_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          allowances_total?: number
          base_salary?: number
          created_at?: string
          deductions_total?: number
          gross_pay?: number
          housing_levy?: number
          id?: string
          metadata?: Json
          net_pay?: number
          nhif_contribution?: number
          notes?: string | null
          nssf_contribution?: number
          other_deductions?: number
          paye_tax?: number
          payment_method?: string | null
          payment_reference?: string | null
          payroll_period_id?: string
          payslip_url?: string | null
          shif_contribution?: number
          staff_compensation_id?: string | null
          staff_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_runs_payroll_period_id_fkey"
            columns: ["payroll_period_id"]
            isOneToOne: false
            referencedRelation: "payroll_periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_staff_compensation_id_fkey"
            columns: ["staff_compensation_id"]
            isOneToOne: false
            referencedRelation: "staff_compensation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_runs_tenant_id_fkey"
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
          days: string[]
          end_time: string
          id: string
          is_active: boolean
          is_break: boolean
          name: string
          sort_order: number
          start_time: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days?: string[]
          end_time: string
          id?: string
          is_active?: boolean
          is_break?: boolean
          name: string
          sort_order?: number
          start_time: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: string[]
          end_time?: string
          id?: string
          is_active?: boolean
          is_break?: boolean
          name?: string
          sort_order?: number
          start_time?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "periods_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      portal_auth_ratelimit: {
        Row: {
          endpoint: string
          hit_count: number
          id: string
          key: string
          window_start: string
        }
        Insert: {
          endpoint: string
          hit_count?: number
          id?: string
          key: string
          window_start?: string
        }
        Update: {
          endpoint?: string
          hit_count?: number
          id?: string
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      portal_otps: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          guardian_id: string | null
          id: string
          is_consumed: boolean
          max_attempts: number
          phone: string
          purpose: string
          student_id: string | null
          tenant_id: string | null
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          guardian_id?: string | null
          id?: string
          is_consumed?: boolean
          max_attempts?: number
          phone: string
          purpose?: string
          student_id?: string | null
          tenant_id?: string | null
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          guardian_id?: string | null
          id?: string
          is_consumed?: boolean
          max_attempts?: number
          phone?: string
          purpose?: string
          student_id?: string | null
          tenant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_otps_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_otps_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_otps_tenant_id_fkey"
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
          created_at: string
          default_tenant_id: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_tenant_id?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_tenant_id?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_default_tenant_id_fkey"
            columns: ["default_tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          item_id: string | null
          line_total: number
          po_id: string
          quantity: number
          received_quantity: number
          tenant_id: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          item_id?: string | null
          line_total: number
          po_id: string
          quantity: number
          received_quantity?: number
          tenant_id: string
          unit_cost: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          item_id?: string | null
          line_total?: number
          po_id?: string
          quantity?: number
          received_quantity?: number
          tenant_id?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          approved_by: string | null
          created_at: string
          expected_delivery: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          requested_by: string | null
          status: string
          subtotal: number
          supplier_contact: string | null
          supplier_name: string
          tenant_id: string
          total: number
          updated_at: string
          vat_amount: number
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          requested_by?: string | null
          status?: string
          subtotal?: number
          supplier_contact?: string | null
          supplier_name: string
          tenant_id: string
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          expected_delivery?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          requested_by?: string | null
          status?: string
          subtotal?: number
          supplier_contact?: string | null
          supplier_name?: string
          tenant_id?: string
          total?: number
          updated_at?: string
          vat_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "staff"
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
      report_card_templates: {
        Row: {
          created_at: string
          curriculum: string
          grade_levels: string[]
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          template_json: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          curriculum?: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          template_json?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          curriculum?: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          template_json?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          class_id: string | null
          class_size: number | null
          class_teacher_comment: string | null
          created_at: string
          delivered_to_parent_at: string | null
          exam_id: string
          generated_at: string | null
          generated_by: string | null
          head_teacher_comment: string | null
          id: string
          next_term_starts: string | null
          overall_grade: string | null
          overall_mean: number | null
          overall_position: number | null
          pdf_url: string | null
          published_at: string | null
          student_id: string
          template_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          class_size?: number | null
          class_teacher_comment?: string | null
          created_at?: string
          delivered_to_parent_at?: string | null
          exam_id: string
          generated_at?: string | null
          generated_by?: string | null
          head_teacher_comment?: string | null
          id?: string
          next_term_starts?: string | null
          overall_grade?: string | null
          overall_mean?: number | null
          overall_position?: number | null
          pdf_url?: string | null
          published_at?: string | null
          student_id: string
          template_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          class_size?: number | null
          class_teacher_comment?: string | null
          created_at?: string
          delivered_to_parent_at?: string | null
          exam_id?: string
          generated_at?: string | null
          generated_by?: string | null
          head_teacher_comment?: string | null
          id?: string
          next_term_starts?: string | null
          overall_grade?: string | null
          overall_mean?: number | null
          overall_position?: number | null
          pdf_url?: string | null
          published_at?: string | null
          student_id?: string
          template_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "report_card_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_cards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          id?: string
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
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          tenant_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          tenant_id?: string | null
          updated_at?: string
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
          building: string | null
          capacity: number | null
          created_at: string
          floor: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          type: Database["public"]["Enums"]["room_type_enum"]
          updated_at: string
        }
        Insert: {
          building?: string | null
          capacity?: number | null
          created_at?: string
          floor?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          type?: Database["public"]["Enums"]["room_type_enum"]
          updated_at?: string
        }
        Update: {
          building?: string | null
          capacity?: number | null
          created_at?: string
          floor?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          type?: Database["public"]["Enums"]["room_type_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      route_stops: {
        Row: {
          created_at: string
          evening_dropoff_time: string | null
          id: string
          latitude: number | null
          longitude: number | null
          morning_pickup_time: string | null
          name: string
          order_index: number
          route_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          evening_dropoff_time?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          morning_pickup_time?: string | null
          name: string
          order_index: number
          route_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          evening_dropoff_time?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          morning_pickup_time?: string | null
          name?: string
          order_index?: number
          route_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "route_stops_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "route_stops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      routes: {
        Row: {
          created_at: string
          description: string | null
          fee_per_term: number | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee_per_term?: number | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee_per_term?: number | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      school_days: {
        Row: {
          created_at: string
          date: string
          description: string | null
          id: string
          tenant_id: string
          term_id: string | null
          type: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          id?: string
          tenant_id: string
          term_id?: string | null
          type: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          tenant_id?: string
          term_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_days_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_days_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      setup_progress: {
        Row: {
          completion_percentage: number
          has_academic_year: boolean
          has_at_least_one_invoice: boolean
          has_at_least_one_payment: boolean
          has_classes: boolean
          has_current_term: boolean
          has_fee_structure: boolean
          has_grade_levels: boolean
          has_logo: boolean
          has_messaging_config: boolean
          has_mpesa_config: boolean
          has_staff: boolean
          has_students: boolean
          has_subjects: boolean
          id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          completion_percentage?: number
          has_academic_year?: boolean
          has_at_least_one_invoice?: boolean
          has_at_least_one_payment?: boolean
          has_classes?: boolean
          has_current_term?: boolean
          has_fee_structure?: boolean
          has_grade_levels?: boolean
          has_logo?: boolean
          has_messaging_config?: boolean
          has_mpesa_config?: boolean
          has_staff?: boolean
          has_students?: boolean
          has_subjects?: boolean
          id?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          completion_percentage?: number
          has_academic_year?: boolean
          has_at_least_one_invoice?: boolean
          has_at_least_one_payment?: boolean
          has_classes?: boolean
          has_current_term?: boolean
          has_fee_structure?: boolean
          has_grade_levels?: boolean
          has_logo?: boolean
          has_messaging_config?: boolean
          has_mpesa_config?: boolean
          has_staff?: boolean
          has_students?: boolean
          has_subjects?: boolean
          id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "setup_progress_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff: {
        Row: {
          alt_phone: string | null
          bank_account_number: string | null
          bank_name: string | null
          basic_salary: number | null
          contract_end_date: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          department_id: string | null
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          employment_type:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          exit_date: string | null
          exit_reason: string | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_enum"] | null
          hire_date: string | null
          id: string
          job_title: string | null
          kra_pin: string | null
          last_name: string
          licence_number: string | null
          metadata: Json
          middle_name: string | null
          national_id_number: string | null
          nhif_or_shif_number: string | null
          notes: string | null
          nssf_number: string | null
          phone: string | null
          photo_url: string | null
          qualification: string | null
          residential_address: string | null
          role: string
          specialization: string | null
          staff_number: string | null
          staff_type: string | null
          status: Database["public"]["Enums"]["staff_status_enum"]
          tenant_id: string
          tsc_number: string | null
          updated_at: string
          user_id: string | null
          years_experience: number | null
        }
        Insert: {
          alt_phone?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          contract_end_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          exit_date?: string | null
          exit_reason?: string | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          kra_pin?: string | null
          last_name: string
          licence_number?: string | null
          metadata?: Json
          middle_name?: string | null
          national_id_number?: string | null
          nhif_or_shif_number?: string | null
          notes?: string | null
          nssf_number?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          residential_address?: string | null
          role?: string
          specialization?: string | null
          staff_number?: string | null
          staff_type?: string | null
          status?: Database["public"]["Enums"]["staff_status_enum"]
          tenant_id: string
          tsc_number?: string | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Update: {
          alt_phone?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          basic_salary?: number | null
          contract_end_date?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          department_id?: string | null
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type_enum"]
            | null
          exit_date?: string | null
          exit_reason?: string | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          hire_date?: string | null
          id?: string
          job_title?: string | null
          kra_pin?: string | null
          last_name?: string
          licence_number?: string | null
          metadata?: Json
          middle_name?: string | null
          national_id_number?: string | null
          nhif_or_shif_number?: string | null
          notes?: string | null
          nssf_number?: string | null
          phone?: string | null
          photo_url?: string | null
          qualification?: string | null
          residential_address?: string | null
          role?: string
          specialization?: string | null
          staff_number?: string | null
          staff_type?: string | null
          status?: Database["public"]["Enums"]["staff_status_enum"]
          tenant_id?: string
          tsc_number?: string | null
          updated_at?: string
          user_id?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_compensation: {
        Row: {
          bank_account: string | null
          bank_name: string | null
          base_salary: number
          created_at: string
          currency: string
          deductions: Json
          effective_from: string
          effective_to: string | null
          housing_allowance: number
          id: string
          mpesa_number: string | null
          notes: string | null
          other_allowances: Json
          payment_frequency: string
          staff_id: string
          tenant_id: string
          transport_allowance: number
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_name?: string | null
          base_salary: number
          created_at?: string
          currency?: string
          deductions?: Json
          effective_from: string
          effective_to?: string | null
          housing_allowance?: number
          id?: string
          mpesa_number?: string | null
          notes?: string | null
          other_allowances?: Json
          payment_frequency?: string
          staff_id: string
          tenant_id: string
          transport_allowance?: number
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_name?: string | null
          base_salary?: number
          created_at?: string
          currency?: string
          deductions?: Json
          effective_from?: string
          effective_to?: string | null
          housing_allowance?: number
          id?: string
          mpesa_number?: string | null
          notes?: string | null
          other_allowances?: Json
          payment_frequency?: string
          staff_id?: string
          tenant_id?: string
          transport_allowance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_compensation_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
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
      staff_qualifications: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          institution: string | null
          is_verified: boolean
          qualification_name: string
          qualification_type: string
          staff_id: string
          tenant_id: string
          updated_at: string
          year_completed: number | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          institution?: string | null
          is_verified?: boolean
          qualification_name: string
          qualification_type: string
          staff_id: string
          tenant_id: string
          updated_at?: string
          year_completed?: number | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          institution?: string | null
          is_verified?: boolean
          qualification_name?: string
          qualification_type?: string
          staff_id?: string
          tenant_id?: string
          updated_at?: string
          year_completed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_qualifications_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_qualifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      strands: {
        Row: {
          code: string | null
          created_at: string
          grade_level: number | null
          id: string
          learning_area_id: string
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          grade_level?: number | null
          id?: string
          learning_area_id: string
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          grade_level?: number | null
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
          {
            foreignKeyName: "strands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
          metadata: Json
          occurred_at: string
          related_entity_id: string | null
          related_entity_type: string | null
          student_id: string
          tenant_id: string
          title: string
        }
        Insert: {
          actor_user_id?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          student_id: string
          tenant_id: string
          title: string
        }
        Update: {
          actor_user_id?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          related_entity_id?: string | null
          related_entity_type?: string | null
          student_id?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_activity_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_activity_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_discounts: {
        Row: {
          academic_year_id: string | null
          amount: number | null
          applies_to_fee_items: string[] | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          discount_type: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          percentage: number | null
          student_id: string
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          amount?: number | null
          applies_to_fee_items?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          discount_type: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          percentage?: number | null
          student_id: string
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          amount?: number | null
          applies_to_fee_items?: string[] | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          discount_type?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          percentage?: number | null
          student_id?: string
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_discounts_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discounts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_discounts_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          enrolled_date: string
          id: string
          reason: string | null
          status: string
          student_id: string
          tenant_id: string
          unenrolled_date: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          enrolled_date?: string
          id?: string
          reason?: string | null
          status?: string
          student_id: string
          tenant_id: string
          unenrolled_date?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          enrolled_date?: string
          id?: string
          reason?: string | null
          status?: string
          student_id?: string
          tenant_id?: string
          unenrolled_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_exam_results: {
        Row: {
          class_id: string | null
          created_at: string
          entered_at: string | null
          entered_by: string | null
          exam_id: string
          exam_subject_id: string
          grade_letter: string | null
          id: string
          is_locked: boolean
          locked_at: string | null
          max_marks: number
          performance_level: string | null
          raw_marks: number | null
          student_id: string
          teacher_comment: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          entered_at?: string | null
          entered_by?: string | null
          exam_id: string
          exam_subject_id: string
          grade_letter?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          max_marks?: number
          performance_level?: string | null
          raw_marks?: number | null
          student_id: string
          teacher_comment?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          entered_at?: string | null
          entered_by?: string | null
          exam_id?: string
          exam_subject_id?: string
          grade_letter?: string | null
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          max_marks?: number
          performance_level?: string | null
          raw_marks?: number | null
          student_id?: string
          teacher_comment?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_exam_results_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_results_entered_by_fkey"
            columns: ["entered_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_results_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_exam_results_exam_subject_id_fkey"
            columns: ["exam_subject_id"]
            isOneToOne: false
            referencedRelation: "exam_subjects"
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
            foreignKeyName: "student_exam_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_structures: {
        Row: {
          academic_year_id: string
          assigned_at: string
          created_at: string
          fee_structure_id: string
          id: string
          reason: string | null
          student_id: string
          tenant_id: string
          unassigned_at: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          assigned_at?: string
          created_at?: string
          fee_structure_id: string
          id?: string
          reason?: string | null
          student_id: string
          tenant_id: string
          unassigned_at?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          assigned_at?: string
          created_at?: string
          fee_structure_id?: string
          id?: string
          reason?: string | null
          student_id?: string
          tenant_id?: string
          unassigned_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_structures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_structures_fee_structure_id_fkey"
            columns: ["fee_structure_id"]
            isOneToOne: false
            referencedRelation: "fee_structures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_structures_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_structures_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
        Relationships: [
          {
            foreignKeyName: "student_guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_guardians_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_receipts: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          is_regenerated: boolean
          issued_at: string
          issued_by: string | null
          metadata: Json
          payment_id: string
          pdf_generated_at: string | null
          pdf_url: string | null
          receipt_number: string | null
          regenerated_at: string | null
          student_id: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          id?: string
          is_regenerated?: boolean
          issued_at?: string
          issued_by?: string | null
          metadata?: Json
          payment_id: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          receipt_number?: string | null
          regenerated_at?: string | null
          student_id: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          is_regenerated?: boolean
          issued_at?: string
          issued_by?: string | null
          metadata?: Json
          payment_id?: string
          pdf_generated_at?: string | null
          pdf_url?: string | null
          receipt_number?: string | null
          regenerated_at?: string | null
          student_id?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_receipts_issued_by_fkey"
            columns: ["issued_by"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_receipts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_receipts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      student_transport: {
        Row: {
          assigned_from: string
          assigned_to: string | null
          created_at: string
          dropoff_stop_id: string | null
          id: string
          pickup_stop_id: string | null
          route_id: string
          status: string
          student_id: string
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          assigned_from?: string
          assigned_to?: string | null
          created_at?: string
          dropoff_stop_id?: string | null
          id?: string
          pickup_stop_id?: string | null
          route_id: string
          status?: string
          student_id: string
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          assigned_from?: string
          assigned_to?: string | null
          created_at?: string
          dropoff_stop_id?: string | null
          id?: string
          pickup_stop_id?: string | null
          route_id?: string
          status?: string
          student_id?: string
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_transport_dropoff_stop_id_fkey"
            columns: ["dropoff_stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_pickup_stop_id_fkey"
            columns: ["pickup_stop_id"]
            isOneToOne: false
            referencedRelation: "route_stops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_transport_term_id_fkey"
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
          created_at: string
          current_class_id: string | null
          date_of_birth: string | null
          doctor_name: string | null
          doctor_phone: string | null
          documents: Json
          email: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          enrollment_status: Database["public"]["Enums"]["enrollment_status_enum"]
          ethiopia_moe_id: string | null
          ethiopian_birth_date: string | null
          exit_date: string | null
          exit_reason: string | null
          expected_graduation_year: number | null
          first_name: string
          gender: Database["public"]["Enums"]["gender_enum"] | null
          grade: string | null
          graduation_date: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          has_special_needs: boolean
          health_info: Json
          house: string | null
          huduma_number: string | null
          id: string
          iep_on_file: boolean
          immunization_status: Json
          insurance_policy_number: string | null
          insurance_provider: string | null
          is_repeater: boolean
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
          metadata: Json
          middle_name: string | null
          moe_student_id: string | null
          national_id_number: string | null
          nationality: string | null
          necta_index_number: string | null
          nemis_upi: string | null
          nhif_or_shif_number: string | null
          notes: string | null
          phone: string | null
          photo_url: string | null
          portal_user_id: string | null
          postal_code: string | null
          preferred_name: string | null
          prems_number: string | null
          previous_school: string | null
          reb_student_id: string | null
          religion: string | null
          residential_address: string | null
          rwanda_national_id: string | null
          rwanda_reb_id: string | null
          sne_category: string | null
          special_needs_details: string | null
          status: string
          stream: string | null
          tanzania_prems_id: string | null
          tenant_id: string
          transfer_in_date: string | null
          transfer_out_date: string | null
          uganda_lin: string | null
          une_index_number: string | null
          uneb_index_number: string | null
          updated_at: string
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
          created_at?: string
          current_class_id?: string | null
          date_of_birth?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          documents?: Json
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_status?: Database["public"]["Enums"]["enrollment_status_enum"]
          ethiopia_moe_id?: string | null
          ethiopian_birth_date?: string | null
          exit_date?: string | null
          exit_reason?: string | null
          expected_graduation_year?: number | null
          first_name: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          grade?: string | null
          graduation_date?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          has_special_needs?: boolean
          health_info?: Json
          house?: string | null
          huduma_number?: string | null
          id?: string
          iep_on_file?: boolean
          immunization_status?: Json
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_repeater?: boolean
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
          metadata?: Json
          middle_name?: string | null
          moe_student_id?: string | null
          national_id_number?: string | null
          nationality?: string | null
          necta_index_number?: string | null
          nemis_upi?: string | null
          nhif_or_shif_number?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          prems_number?: string | null
          previous_school?: string | null
          reb_student_id?: string | null
          religion?: string | null
          residential_address?: string | null
          rwanda_national_id?: string | null
          rwanda_reb_id?: string | null
          sne_category?: string | null
          special_needs_details?: string | null
          status?: string
          stream?: string | null
          tanzania_prems_id?: string | null
          tenant_id: string
          transfer_in_date?: string | null
          transfer_out_date?: string | null
          uganda_lin?: string | null
          une_index_number?: string | null
          uneb_index_number?: string | null
          updated_at?: string
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
          created_at?: string
          current_class_id?: string | null
          date_of_birth?: string | null
          doctor_name?: string | null
          doctor_phone?: string | null
          documents?: Json
          email?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          enrollment_status?: Database["public"]["Enums"]["enrollment_status_enum"]
          ethiopia_moe_id?: string | null
          ethiopian_birth_date?: string | null
          exit_date?: string | null
          exit_reason?: string | null
          expected_graduation_year?: number | null
          first_name?: string
          gender?: Database["public"]["Enums"]["gender_enum"] | null
          grade?: string | null
          graduation_date?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          has_special_needs?: boolean
          health_info?: Json
          house?: string | null
          huduma_number?: string | null
          id?: string
          iep_on_file?: boolean
          immunization_status?: Json
          insurance_policy_number?: string | null
          insurance_provider?: string | null
          is_repeater?: boolean
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
          metadata?: Json
          middle_name?: string | null
          moe_student_id?: string | null
          national_id_number?: string | null
          nationality?: string | null
          necta_index_number?: string | null
          nemis_upi?: string | null
          nhif_or_shif_number?: string | null
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          portal_user_id?: string | null
          postal_code?: string | null
          preferred_name?: string | null
          prems_number?: string | null
          previous_school?: string | null
          reb_student_id?: string | null
          religion?: string | null
          residential_address?: string | null
          rwanda_national_id?: string | null
          rwanda_reb_id?: string | null
          sne_category?: string | null
          special_needs_details?: string | null
          status?: string
          stream?: string | null
          tanzania_prems_id?: string | null
          tenant_id?: string
          transfer_in_date?: string | null
          transfer_out_date?: string | null
          uganda_lin?: string | null
          une_index_number?: string | null
          uneb_index_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_current_class_id_fkey"
            columns: ["current_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_strands: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
          strand_id: string
          suggested_lessons: number | null
          tenant_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          strand_id: string
          suggested_lessons?: number | null
          tenant_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          strand_id?: string
          suggested_lessons?: number | null
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
          {
            foreignKeyName: "sub_strands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          assessment_type: string
          category: string | null
          code: string
          created_at: string
          grade_levels: string[]
          id: string
          is_active: boolean
          learning_area_id: string | null
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assessment_type?: string
          category?: string | null
          code: string
          created_at?: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean
          learning_area_id?: string | null
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assessment_type?: string
          category?: string | null
          code?: string
          created_at?: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean
          learning_area_id?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subjects_learning_area_id_fkey"
            columns: ["learning_area_id"]
            isOneToOne: false
            referencedRelation: "learning_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subjects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
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
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          tenant_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          tenant_id?: string
          updated_at?: string
          value?: Json | null
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
      tenants: {
        Row: {
          address: string | null
          country_code: string
          created_at: string
          currency_code: string
          curriculum: string | null
          email: string | null
          id: string
          is_demo: boolean
          locale: string
          logo_url: string | null
          name: string
          nemis_code: string | null
          phone: string | null
          primary_color: string | null
          registration_number: string | null
          school_type: string | null
          slug: string
          subscription_plan: string
          subscription_status: string
          timezone: string
          trial_ends_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          curriculum?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          locale?: string
          logo_url?: string | null
          name: string
          nemis_code?: string | null
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          school_type?: string | null
          slug: string
          subscription_plan?: string
          subscription_status?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          country_code?: string
          created_at?: string
          currency_code?: string
          curriculum?: string | null
          email?: string | null
          id?: string
          is_demo?: boolean
          locale?: string
          logo_url?: string | null
          name?: string
          nemis_code?: string | null
          phone?: string | null
          primary_color?: string | null
          registration_number?: string | null
          school_type?: string | null
          slug?: string
          subscription_plan?: string
          subscription_status?: string
          timezone?: string
          trial_ends_at?: string | null
          updated_at?: string
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
          term_number: number
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
          term_number: number
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
          term_number?: number
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
          {
            foreignKeyName: "terms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      timetable_slots: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          day_of_week: string
          id: string
          notes: string | null
          period_id: string
          room_id: string | null
          subject_id: string | null
          teacher_id: string | null
          tenant_id: string
          term_id: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          day_of_week: string
          id?: string
          notes?: string | null
          period_id: string
          room_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id: string
          term_id?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          day_of_week?: string
          id?: string
          notes?: string | null
          period_id?: string
          room_id?: string | null
          subject_id?: string | null
          teacher_id?: string | null
          tenant_id?: string
          term_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timetable_slots_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "timetable_slots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
      user_roles: {
        Row: {
          id: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          role_id?: string
          tenant_id?: string
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
      user_tenants: {
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
            foreignKeyName: "user_tenants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_assignments: {
        Row: {
          assigned_from: string
          assigned_to: string | null
          created_at: string
          driver_id: string | null
          id: string
          is_active: boolean
          route_id: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_from?: string
          assigned_to?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          is_active?: boolean
          route_id: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_from?: string
          assigned_to?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          is_active?: boolean
          route_id?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_route_id_fkey"
            columns: ["route_id"]
            isOneToOne: false
            referencedRelation: "routes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_assignments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_locations: {
        Row: {
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string
          speed_kmh: number | null
          tenant_id: string
          vehicle_id: string
        }
        Insert: {
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string
          speed_kmh?: number | null
          tenant_id: string
          vehicle_id: string
        }
        Update: {
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string
          speed_kmh?: number | null
          tenant_id?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_locations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_locations_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          capacity: number
          color: string | null
          created_at: string
          id: string
          inspection_expiry: string | null
          insurance_expiry: string | null
          is_active: boolean
          make: string | null
          model: string | null
          registration_number: string
          tenant_id: string
          updated_at: string
          vehicle_type: string | null
          year: number | null
        }
        Insert: {
          capacity: number
          color?: string | null
          created_at?: string
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          is_active?: boolean
          make?: string | null
          model?: string | null
          registration_number: string
          tenant_id: string
          updated_at?: string
          vehicle_type?: string | null
          year?: number | null
        }
        Update: {
          capacity?: number
          color?: string | null
          created_at?: string
          id?: string
          inspection_expiry?: string | null
          insurance_expiry?: string | null
          is_active?: boolean
          make?: string | null
          model?: string | null
          registration_number?: string
          tenant_id?: string
          updated_at?: string
          vehicle_type?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ai_cost_this_month: { Args: { p_tenant_id: string }; Returns: number }
      ai_usage_this_month: { Args: { p_tenant_id: string }; Returns: number }
      auth_user_id: { Args: never; Returns: string }
      calc_kenya_paye: { Args: { p_gross: number }; Returns: number }
      calc_kenya_payroll: {
        Args: { p_gross: number; p_staff_id: string }
        Returns: Json
      }
      cbc_performance_level: {
        Args: { p_marks: number; p_max: number }
        Returns: string
      }
      current_academic_year: { Args: { p_tenant_id: string }; Returns: string }
      current_term: { Args: { p_tenant_id: string }; Returns: string }
      enroll_student: {
        Args: { p_class_id: string; p_student_id: string; p_year_id: string }
        Returns: string
      }
      generate_admission_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_application_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_credit_note_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_expense_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_invoice_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_payment_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_receipt_number: {
        Args: { p_tenant_id: string }
        Returns: string
      }
      generate_staff_number: { Args: { p_tenant_id: string }; Returns: string }
      has_perm: {
        Args: { _permission: string; _tenant: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
      is_tenant_member: { Args: { _tenant: string }; Returns: boolean }
      portal_link_guardian_user: {
        Args: { _phone: string; _user_id: string }
        Returns: number
      }
      portal_link_student_user: {
        Args: { _phone: string; _user_id: string }
        Returns: number
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
      recompute_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      recompute_setup_progress: {
        Args: { p_tenant_id: string }
        Returns: undefined
      }
      user_has_permission: {
        Args: { p_permission: string; p_tenant_id: string }
        Returns: boolean
      }
      user_tenant_ids: { Args: never; Returns: string[] }
      verify_cron_key: { Args: { _key: string }; Returns: boolean }
    }
    Enums: {
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
      document_owner_type_enum: "student" | "staff" | "guardian"
      employment_type_enum:
        | "permanent"
        | "contract"
        | "part_time"
        | "intern"
        | "volunteer"
        | "bom"
        | "tsc"
      enrollment_status_enum:
        | "active"
        | "alumni"
        | "transferred"
        | "dropped_out"
        | "suspended"
        | "deceased"
        | "on_leave"
        | "inactive"
        | "graduated"
        | "expelled"
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
        | "tertiary"
      guardian_relationship_enum:
        | "father"
        | "mother"
        | "guardian"
        | "grandparent"
        | "uncle"
        | "aunt"
        | "sibling"
        | "other"
      learner_category_enum:
        | "day_scholar"
        | "boarder"
        | "weekly_boarder"
        | "special_needs"
      room_type_enum:
        | "classroom"
        | "lab"
        | "library"
        | "hall"
        | "office"
        | "other"
        | "sports"
        | "staffroom"
      staff_status_enum:
        | "active"
        | "on_leave"
        | "suspended"
        | "inactive"
        | "terminated"
        | "retired"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      document_owner_type_enum: ["student", "staff", "guardian"],
      employment_type_enum: [
        "permanent",
        "contract",
        "part_time",
        "intern",
        "volunteer",
        "bom",
        "tsc",
      ],
      enrollment_status_enum: [
        "active",
        "alumni",
        "transferred",
        "dropped_out",
        "suspended",
        "deceased",
        "on_leave",
        "inactive",
        "graduated",
        "expelled",
      ],
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
        "tertiary",
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
      learner_category_enum: [
        "day_scholar",
        "boarder",
        "weekly_boarder",
        "special_needs",
      ],
      room_type_enum: [
        "classroom",
        "lab",
        "library",
        "hall",
        "office",
        "other",
        "sports",
        "staffroom",
      ],
      staff_status_enum: [
        "active",
        "on_leave",
        "suspended",
        "inactive",
        "terminated",
        "retired",
      ],
    },
  },
} as const
