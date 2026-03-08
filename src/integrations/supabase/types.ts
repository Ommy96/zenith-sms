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
          school_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          school_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          school_id: string
          title: string
        }
        Insert: {
          audience?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          school_id: string
          title: string
        }
        Update: {
          audience?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          priority?: string | null
          school_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          school_id: string
          status: string
          student_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          school_id: string
          status?: string
          student_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          notes?: string | null
          recorded_by?: string | null
          school_id?: string
          status?: string
          student_id?: string
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
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
      classes: {
        Row: {
          academic_year: string | null
          capacity: number | null
          created_at: string | null
          grade_level: string | null
          id: string
          name: string
          school_id: string
          teacher_id: string | null
        }
        Insert: {
          academic_year?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name: string
          school_id: string
          teacher_id?: string | null
        }
        Update: {
          academic_year?: string | null
          capacity?: number | null
          created_at?: string | null
          grade_level?: string | null
          id?: string
          name?: string
          school_id?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          school_id: string
          score: number | null
          student_id: string
          subject: string
        }
        Insert: {
          created_at?: string | null
          exam_id: string
          grade?: string | null
          id?: string
          remarks?: string | null
          school_id: string
          score?: number | null
          student_id: string
          subject: string
        }
        Update: {
          created_at?: string | null
          exam_id?: string
          grade?: string | null
          id?: string
          remarks?: string | null
          school_id?: string
          score?: number | null
          student_id?: string
          subject?: string
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
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          school_id: string
          start_date: string | null
          status: string | null
          term: string | null
          type: string | null
        }
        Insert: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name: string
          school_id: string
          start_date?: string | null
          status?: string | null
          term?: string | null
          type?: string | null
        }
        Update: {
          academic_year?: string | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          name?: string
          school_id?: string
          start_date?: string | null
          status?: string | null
          term?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exams_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          school_id: string
          status: string | null
          student_id: string
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
          school_id: string
          status?: string | null
          student_id: string
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
          school_id?: string
          status?: string | null
          student_id?: string
          term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string
          id: string
          phone: string | null
          school_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name: string
          id: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          academic_calendar: Json | null
          academic_year_end: string | null
          academic_year_start: string | null
          address: string | null
          code: string | null
          country: string | null
          created_at: string | null
          email: string | null
          grading_system: Json | null
          id: string
          is_active: boolean | null
          language_of_instruction: string | null
          logo_url: string | null
          motto: string | null
          name: string
          payment_config: Json | null
          phone: string | null
          primary_color: string | null
          regulatory_body: string | null
          school_levels: Json | null
          subjects: Json | null
          updated_at: string | null
        }
        Insert: {
          academic_calendar?: Json | null
          academic_year_end?: string | null
          academic_year_start?: string | null
          address?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          grading_system?: Json | null
          id?: string
          is_active?: boolean | null
          language_of_instruction?: string | null
          logo_url?: string | null
          motto?: string | null
          name: string
          payment_config?: Json | null
          phone?: string | null
          primary_color?: string | null
          regulatory_body?: string | null
          school_levels?: Json | null
          subjects?: Json | null
          updated_at?: string | null
        }
        Update: {
          academic_calendar?: Json | null
          academic_year_end?: string | null
          academic_year_start?: string | null
          address?: string | null
          code?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          grading_system?: Json | null
          id?: string
          is_active?: boolean | null
          language_of_instruction?: string | null
          logo_url?: string | null
          motto?: string | null
          name?: string
          payment_config?: Json | null
          phone?: string | null
          primary_color?: string | null
          regulatory_body?: string | null
          school_levels?: Json | null
          subjects?: Json | null
          updated_at?: string | null
        }
        Relationships: []
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
          school_id: string
          status: string | null
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
          school_id: string
          status?: string | null
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
          school_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
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
          school_id: string
          status: string | null
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
          school_id: string
          status?: string | null
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
          school_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "school_admin"
        | "teacher"
        | "parent"
        | "student"
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
      app_role: ["super_admin", "school_admin", "teacher", "parent", "student"],
    },
  },
} as const
