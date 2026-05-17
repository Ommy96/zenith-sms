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
          class_id: string | null
          created_at: string | null
          date: string
          id: string
          notes: string | null
          recorded_by: string | null
          status: string
          student_id: string
          tenant_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          status?: string
          student_id: string
          tenant_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
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
      mpesa_config: {
        Row: {
          consumer_key: string | null
          consumer_secret: string | null
          created_at: string
          environment: string
          id: string
          initiator_name: string | null
          is_active: boolean
          passkey: string | null
          shortcode: string | null
          shortcode_type: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          passkey?: string | null
          shortcode?: string | null
          shortcode_type?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          consumer_key?: string | null
          consumer_secret?: string | null
          created_at?: string
          environment?: string
          id?: string
          initiator_name?: string | null
          is_active?: boolean
          passkey?: string | null
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
          amount: number
          bill_ref_number: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          matched_invoice_id: string | null
          matched_student_id: string | null
          middle_name: string | null
          mpesa_receipt: string
          org_account_balance: number | null
          phone: string | null
          raw_payload: Json | null
          status: string
          tenant_id: string
          transaction_time: string
          transaction_type: string | null
        }
        Insert: {
          account_reference?: string | null
          amount?: number
          bill_ref_number?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_invoice_id?: string | null
          matched_student_id?: string | null
          middle_name?: string | null
          mpesa_receipt: string
          org_account_balance?: number | null
          phone?: string | null
          raw_payload?: Json | null
          status?: string
          tenant_id: string
          transaction_time?: string
          transaction_type?: string | null
        }
        Update: {
          account_reference?: string | null
          amount?: number
          bill_ref_number?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          matched_invoice_id?: string | null
          matched_student_id?: string | null
          middle_name?: string | null
          mpesa_receipt?: string
          org_account_balance?: number | null
          phone?: string | null
          raw_payload?: Json | null
          status?: string
          tenant_id?: string
          transaction_time?: string
          transaction_type?: string | null
        }
        Relationships: []
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
      recompute_exam_positions: { Args: { _exam: string }; Returns: undefined }
      seed_cbc_competencies_and_values: {
        Args: { _tenant: string }
        Returns: undefined
      }
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
      curriculum_type: "cbc" | "8-4-4" | "igcse" | "ib" | "cambridge" | "mixed"
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
      learner_category_enum:
        | "day_scholar"
        | "boarder"
        | "weekly_boarder"
        | "special_needs"
      lesson_status_enum: "draft" | "pending_review" | "approved" | "rejected"
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
      subject_assessment_enum: "continuous" | "exam" | "both"
      subject_category_enum:
        | "core"
        | "elective"
        | "co_curricular"
        | "life_skills"
      subscription_plan: "free" | "starter" | "standard" | "pro" | "enterprise"
      subscription_status: "trial" | "active" | "past_due" | "cancelled"
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
      curriculum_type: ["cbc", "8-4-4", "igcse", "ib", "cambridge", "mixed"],
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
      learner_category_enum: [
        "day_scholar",
        "boarder",
        "weekly_boarder",
        "special_needs",
      ],
      lesson_status_enum: ["draft", "pending_review", "approved", "rejected"],
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
      subject_assessment_enum: ["continuous", "exam", "both"],
      subject_category_enum: [
        "core",
        "elective",
        "co_curricular",
        "life_skills",
      ],
      subscription_plan: ["free", "starter", "standard", "pro", "enterprise"],
      subscription_status: ["trial", "active", "past_due", "cancelled"],
    },
  },
} as const
