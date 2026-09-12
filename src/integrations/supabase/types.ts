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
      classes: {
        Row: {
          academic_year: string | null
          academic_year_id: string | null
          capacity: number
          class_teacher_id: string | null
          created_at: string
          current_enrollment: number
          grade_level: string | null
          grade_level_id: string | null
          id: string
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
          capacity?: number
          class_teacher_id?: string | null
          created_at?: string
          current_enrollment?: number
          grade_level?: string | null
          grade_level_id?: string | null
          id?: string
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
          capacity?: number
          class_teacher_id?: string | null
          created_at?: string
          current_enrollment?: number
          grade_level?: string | null
          grade_level_id?: string | null
          id?: string
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
          {
            foreignKeyName: "terms_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
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
