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
          subject_id: string
          teacher_id: string | null
          tenant_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          periods_per_week?: number
          subject_id: string
          teacher_id?: string | null
          tenant_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          periods_per_week?: number
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
          salary_scale: string | null
          staff_number: string | null
          status: string | null
          subjects_taught: Json | null
          tenant_id: string
          tsc_number: string | null
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
          salary_scale?: string | null
          staff_number?: string | null
          status?: string | null
          subjects_taught?: Json | null
          tenant_id: string
          tsc_number?: string | null
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
          salary_scale?: string | null
          staff_number?: string | null
          status?: string | null
          subjects_taught?: Json | null
          tenant_id?: string
          tsc_number?: string | null
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
          special_needs_details: string | null
          status: string | null
          stream: string | null
          tenant_id: string
          une_index_number: string | null
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
          special_needs_details?: string | null
          status?: string | null
          stream?: string | null
          tenant_id: string
          une_index_number?: string | null
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
          special_needs_details?: string | null
          status?: string | null
          stream?: string | null
          tenant_id?: string
          une_index_number?: string | null
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
          tenant_id?: string
        }
        Relationships: []
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
      transport_routes: {
        Row: {
          avg_trip_minutes: number | null
          created_at: string | null
          driver_name: string | null
          id: string
          name: string
          status: string
          student_count: number | null
          tenant_id: string
          vehicle_number: string | null
        }
        Insert: {
          avg_trip_minutes?: number | null
          created_at?: string | null
          driver_name?: string | null
          id?: string
          name: string
          status?: string
          student_count?: number | null
          tenant_id: string
          vehicle_number?: string | null
        }
        Update: {
          avg_trip_minutes?: number | null
          created_at?: string | null
          driver_name?: string | null
          id?: string
          name?: string
          status?: string
          student_count?: number | null
          tenant_id?: string
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
      generate_expense_number: { Args: { _tenant: string }; Returns: string }
      generate_invoice_number: { Args: { _tenant: string }; Returns: string }
      generate_receipt_number: { Args: { _tenant: string }; Returns: string }
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
      assessment_type_enum:
        | "assignment"
        | "quiz"
        | "project"
        | "practical"
        | "oral"
        | "other"
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
      payment_method_enum:
        | "cash"
        | "mpesa"
        | "airtel_money"
        | "bank_transfer"
        | "cheque"
        | "card"
        | "pos"
        | "other"
      reminder_channel_enum: "sms" | "whatsapp" | "email"
      report_run_status_enum: "queued" | "running" | "ready" | "failed"
      room_type_enum:
        | "classroom"
        | "lab"
        | "hall"
        | "sports"
        | "library"
        | "other"
      scheme_status_enum: "draft" | "pending_review" | "approved" | "rejected"
      school_type:
        | "primary"
        | "junior_secondary"
        | "senior_secondary"
        | "combined"
        | "tertiary"
        | "tvet"
        | "international"
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
      assessment_type_enum: [
        "assignment",
        "quiz",
        "project",
        "practical",
        "oral",
        "other",
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
      reminder_channel_enum: ["sms", "whatsapp", "email"],
      report_run_status_enum: ["queued", "running", "ready", "failed"],
      room_type_enum: [
        "classroom",
        "lab",
        "hall",
        "sports",
        "library",
        "other",
      ],
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
    },
  },
} as const
