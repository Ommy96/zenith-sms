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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auth_user_id: { Args: never; Returns: string }
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
      user_has_permission: {
        Args: { p_permission: string; p_tenant_id: string }
        Returns: boolean
      }
      user_tenant_ids: { Args: never; Returns: string[] }
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
