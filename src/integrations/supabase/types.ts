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
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          created_at: string | null
          grade_level: string | null
          id: string
          name: string
          teacher_id: string | null
          tenant_id: string
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name: string
          teacher_id?: string | null
          tenant_id: string
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          teacher_id?: string | null
          tenant_id?: string
        }
        Relationships: [
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
          type: string | null
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
          type?: string | null
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
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
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
      staff: {
        Row: {
          created_at: string | null
          department: string | null
          email: string | null
          first_name: string
          hire_date: string | null
          id: string
          last_name: string
          phone: string | null
          role: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          hire_date?: string | null
          id?: string
          last_name: string
          phone?: string | null
          role?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          hire_date?: string | null
          id?: string
          last_name?: string
          phone?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
          user_id?: string | null
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
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          admission_number: string | null
          created_at: string | null
          date_of_birth: string | null
          documents: Json | null
          email: string | null
          first_name: string
          gender: string | null
          grade: string | null
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          health_info: Json | null
          id: string
          last_name: string
          phone: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          admission_number?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          first_name: string
          gender?: string | null
          grade?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          health_info?: Json | null
          id?: string
          last_name: string
          phone?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          admission_number?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          documents?: Json | null
          email?: string | null
          first_name?: string
          gender?: string | null
          grade?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          health_info?: Json | null
          id?: string
          last_name?: string
          phone?: string | null
          status?: string | null
          tenant_id?: string
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
    }
    Enums: {
      curriculum_type: "cbc" | "8-4-4" | "igcse" | "ib" | "cambridge" | "mixed"
      school_type:
        | "primary"
        | "junior_secondary"
        | "senior_secondary"
        | "combined"
        | "tertiary"
        | "tvet"
        | "international"
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
      curriculum_type: ["cbc", "8-4-4", "igcse", "ib", "cambridge", "mixed"],
      school_type: [
        "primary",
        "junior_secondary",
        "senior_secondary",
        "combined",
        "tertiary",
        "tvet",
        "international",
      ],
      subscription_plan: ["free", "starter", "standard", "pro", "enterprise"],
      subscription_status: ["trial", "active", "past_due", "cancelled"],
    },
  },
} as const
