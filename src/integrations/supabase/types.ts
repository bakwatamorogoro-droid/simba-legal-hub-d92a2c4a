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
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string
          id: string
          password_hash: string
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          password_hash: string
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          password_hash?: string
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          academic_year_id: string
          course_id: string
          created_at: string
          deadline: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["assignment_kind"]
          question_name: string | null
          question_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          course_id: string
          created_at?: string
          deadline: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["assignment_kind"]
          question_name?: string | null
          question_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          course_id?: string
          created_at?: string
          deadline?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["assignment_kind"]
          question_name?: string | null
          question_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_chat_messages: {
        Row: {
          academic_year_id: string
          assignment_id: string
          course_id: string
          created_at: string
          full_name: string
          id: string
          message: string
          reg_number: string
          student_id: string
        }
        Insert: {
          academic_year_id: string
          assignment_id: string
          course_id: string
          created_at?: string
          full_name: string
          id?: string
          message: string
          reg_number: string
          student_id: string
        }
        Update: {
          academic_year_id?: string
          assignment_id?: string
          course_id?: string
          created_at?: string
          full_name?: string
          id?: string
          message?: string
          reg_number?: string
          student_id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          confirmed_at: string | null
          created_at: string
          group_id: string
          id: string
          status: string
          student_id: string
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string
          group_id: string
          id?: string
          status?: string
          student_id: string
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string
          group_id?: string
          id?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      group_submissions: {
        Row: {
          ai_reason: string | null
          ai_score: number | null
          annotations: Json
          assignment_id: string
          file_name: string
          file_path: string
          group_id: string
          id: string
          marked_at: string | null
          marks: number | null
          participants: Json
          remarks: string | null
          submitted_at: string
          submitted_by_student_id: string
        }
        Insert: {
          ai_reason?: string | null
          ai_score?: number | null
          annotations?: Json
          assignment_id: string
          file_name: string
          file_path: string
          group_id: string
          id?: string
          marked_at?: string | null
          marks?: number | null
          participants?: Json
          remarks?: string | null
          submitted_at?: string
          submitted_by_student_id: string
        }
        Update: {
          ai_reason?: string | null
          ai_score?: number | null
          annotations?: Json
          assignment_id?: string
          file_name?: string
          file_path?: string
          group_id?: string
          id?: string
          marked_at?: string | null
          marks?: number | null
          participants?: Json
          remarks?: string | null
          submitted_at?: string
          submitted_by_student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_submissions_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: true
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_submissions_submitted_by_student_id_fkey"
            columns: ["submitted_by_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          academic_year_id: string
          assignment_id: string
          course_id: string
          created_at: string
          id: string
          leader_student_id: string
          name: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          assignment_id: string
          course_id: string
          created_at?: string
          id?: string
          leader_student_id: string
          name: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          assignment_id?: string
          course_id?: string
          created_at?: string
          id?: string
          leader_student_id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "groups_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "groups_leader_student_id_fkey"
            columns: ["leader_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_year_id: string
          course_id: string
          created_at: string
          exam_number: string | null
          full_name: string
          id: string
          last_name: string | null
          phone: string
          reg_number: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          course_id: string
          created_at?: string
          exam_number?: string | null
          full_name: string
          id?: string
          last_name?: string | null
          phone: string
          reg_number: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          course_id?: string
          created_at?: string
          exam_number?: string | null
          full_name?: string
          id?: string
          last_name?: string | null
          phone?: string
          reg_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          ai_reason: string | null
          ai_score: number | null
          annotations: Json
          assignment_id: string
          file_name: string
          file_path: string
          id: string
          locked: boolean
          marked_at: string | null
          marks: number | null
          remarks: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          ai_reason?: string | null
          ai_score?: number | null
          annotations?: Json
          assignment_id: string
          file_name: string
          file_path: string
          id?: string
          locked?: boolean
          marked_at?: string | null
          marks?: number | null
          remarks?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          ai_reason?: string | null
          ai_score?: number | null
          annotations?: Json
          assignment_id?: string
          file_name?: string
          file_path?: string
          id?: string
          locked?: boolean
          marked_at?: string | null
          marks?: number | null
          remarks?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assignment_kind: "individual" | "group"
      assignment_type: "individual" | "group"
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
      assignment_kind: ["individual", "group"],
      assignment_type: ["individual", "group"],
    },
  },
} as const
