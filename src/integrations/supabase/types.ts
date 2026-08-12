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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      attendance_days: {
        Row: {
          created_at: string
          date: string
          id: string
          remarks: string | null
          status: string
          student_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          remarks?: string | null
          status?: string
          student_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          remarks?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_days_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          marked_by: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          marked_by?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      campuses: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      cce_coscholastic: {
        Row: {
          academic_year: string
          art_education: string | null
          created_at: string
          discipline: string | null
          health_pe: string | null
          id: string
          life_skills: string | null
          participation: string | null
          student_id: string
          term: string
          updated_at: string
          values_grade: string | null
          work_education: string | null
        }
        Insert: {
          academic_year?: string
          art_education?: string | null
          created_at?: string
          discipline?: string | null
          health_pe?: string | null
          id?: string
          life_skills?: string | null
          participation?: string | null
          student_id: string
          term: string
          updated_at?: string
          values_grade?: string | null
          work_education?: string | null
        }
        Update: {
          academic_year?: string
          art_education?: string | null
          created_at?: string
          discipline?: string | null
          health_pe?: string | null
          id?: string
          life_skills?: string | null
          participation?: string | null
          student_id?: string
          term?: string
          updated_at?: string
          values_grade?: string | null
          work_education?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cce_coscholastic_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      cce_scholastic: {
        Row: {
          academic_year: string
          created_at: string
          fa1: number | null
          fa2: number | null
          fa3: number | null
          fa4: number | null
          id: string
          sa1: number | null
          sa2: number | null
          student_id: string
          subject: string
          term: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          fa1?: number | null
          fa2?: number | null
          fa3?: number | null
          fa4?: number | null
          id?: string
          sa1?: number | null
          sa2?: number | null
          student_id: string
          subject: string
          term: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          fa1?: number | null
          fa2?: number | null
          fa3?: number | null
          fa4?: number | null
          id?: string
          sa1?: number | null
          sa2?: number | null
          student_id?: string
          subject?: string
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cce_scholastic_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          campus_id: string
          class_teacher_id: string | null
          created_at: string
          grade: string
          id: string
          section: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          campus_id: string
          class_teacher_id?: string | null
          created_at?: string
          grade: string
          id?: string
          section: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          campus_id?: string
          class_teacher_id?: string | null
          created_at?: string
          grade?: string
          id?: string
          section?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      homework: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          status: string
          subject: string | null
          teacher_id: string
          title: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          subject?: string | null
          teacher_id: string
          title: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          status?: string
          subject?: string | null
          teacher_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_items: {
        Row: {
          assign_all: boolean
          attachments: Json
          chapter: string | null
          class_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          scheduled_for: string | null
          staff_id: string | null
          status: string
          subject: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          assign_all?: boolean
          attachments?: Json
          chapter?: string | null
          class_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          scheduled_for?: string | null
          staff_id?: string | null
          status?: string
          subject: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          assign_all?: boolean
          attachments?: Json
          chapter?: string | null
          class_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          scheduled_for?: string | null
          staff_id?: string | null
          status?: string
          subject?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_items_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_status: {
        Row: {
          homework_id: string
          id: string
          status: string
          student_id: string
          submitted_at: string | null
        }
        Insert: {
          homework_id: string
          id?: string
          status?: string
          student_id: string
          submitted_at?: string | null
        }
        Update: {
          homework_id?: string
          id?: string
          status?: string
          student_id?: string
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "homework_status_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_status_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_targets: {
        Row: {
          homework_id: string
          id: string
          student_id: string
        }
        Insert: {
          homework_id: string
          id?: string
          student_id: string
        }
        Update: {
          homework_id?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_targets_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_targets_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plan_topics: {
        Row: {
          chapter: string
          completed: boolean
          completed_on: string | null
          expected_date: string | null
          id: string
          plan_id: string
          remarks: string | null
          sort_order: number
          topic: string
          updated_at: string
        }
        Insert: {
          chapter: string
          completed?: boolean
          completed_on?: string | null
          expected_date?: string | null
          id?: string
          plan_id: string
          remarks?: string | null
          sort_order?: number
          topic: string
          updated_at?: string
        }
        Update: {
          chapter?: string
          completed?: boolean
          completed_on?: string | null
          expected_date?: string | null
          id?: string
          plan_id?: string
          remarks?: string | null
          sort_order?: number
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_plan_topics_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "lesson_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_plans: {
        Row: {
          academic_year: string
          class_id: string
          created_at: string
          id: string
          staff_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          class_id: string
          created_at?: string
          id?: string
          staff_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          class_id?: string
          created_at?: string
          id?: string
          staff_id?: string | null
          subject?: string
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
            foreignKeyName: "lesson_plans_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_items: {
        Row: {
          attachments: Json
          author_name: string | null
          author_role: string
          body: string | null
          campus_id: string | null
          class_ids: string[]
          created_at: string
          id: string
          pinned: boolean
          published_at: string | null
          scheduled_for: string | null
          scope: string
          student_ids: string[]
          title: string
          updated_at: string
        }
        Insert: {
          attachments?: Json
          author_name?: string | null
          author_role?: string
          body?: string | null
          campus_id?: string | null
          class_ids?: string[]
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string | null
          scheduled_for?: string | null
          scope?: string
          student_ids?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          attachments?: Json
          author_name?: string | null
          author_role?: string
          body?: string | null
          campus_id?: string | null
          class_ids?: string[]
          created_at?: string
          id?: string
          pinned?: boolean
          published_at?: string | null
          scheduled_for?: string | null
          scope?: string
          student_ids?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notice_items_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          audience: string
          author_id: string
          body: string | null
          campus_id: string
          class_id: string | null
          created_at: string
          id: string
          pinned: boolean
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          author_id: string
          body?: string | null
          campus_id: string
          class_id?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          author_id?: string
          body?: string | null
          campus_id?: string
          class_id?: string | null
          created_at?: string
          id?: string
          pinned?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          campus_id: string | null
          created_at: string
          full_name: string | null
          grade: string | null
          house: string | null
          id: string
          student_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          campus_id?: string | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          house?: string | null
          id: string
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          campus_id?: string | null
          created_at?: string
          full_name?: string | null
          grade?: string | null
          house?: string | null
          id?: string
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      pupa_reports: {
        Row: {
          academic_year: string
          class_id: string | null
          created_at: string
          id: string
          improvements: string | null
          observations: string | null
          parent_support: string | null
          remarks: string | null
          staff_id: string | null
          status: string
          strengths: string | null
          student_id: string
          submitted_at: string | null
          term: string
          updated_at: string
        }
        Insert: {
          academic_year?: string
          class_id?: string | null
          created_at?: string
          id?: string
          improvements?: string | null
          observations?: string | null
          parent_support?: string | null
          remarks?: string | null
          staff_id?: string | null
          status?: string
          strengths?: string | null
          student_id: string
          submitted_at?: string | null
          term: string
          updated_at?: string
        }
        Update: {
          academic_year?: string
          class_id?: string | null
          created_at?: string
          id?: string
          improvements?: string | null
          observations?: string | null
          parent_support?: string | null
          remarks?: string | null
          staff_id?: string | null
          status?: string
          strengths?: string | null
          student_id?: string
          submitted_at?: string | null
          term?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pupa_reports_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupa_reports_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pupa_reports_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      regularization_requests: {
        Row: {
          attendance_id: string | null
          created_at: string
          date: string
          document_url: string | null
          email_body: string | null
          explanation: string
          hr_note: string | null
          id: string
          reason: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attendance_id?: string | null
          created_at?: string
          date: string
          document_url?: string | null
          email_body?: string | null
          explanation: string
          hr_note?: string | null
          id?: string
          reason: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attendance_id?: string | null
          created_at?: string
          date?: string
          document_url?: string | null
          email_body?: string | null
          explanation?: string
          hr_note?: string | null
          id?: string
          reason?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regularization_requests_attendance_id_fkey"
            columns: ["attendance_id"]
            isOneToOne: false
            referencedRelation: "teacher_attendance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regularization_requests_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          academic_year: string
          created_at: string
          file_url: string | null
          id: string
          overall_grade: string | null
          percentage: number | null
          published_on: string | null
          student_id: string
          term: string
        }
        Insert: {
          academic_year?: string
          created_at?: string
          file_url?: string | null
          id?: string
          overall_grade?: string | null
          percentage?: number | null
          published_on?: string | null
          student_id: string
          term: string
        }
        Update: {
          academic_year?: string
          created_at?: string
          file_url?: string | null
          id?: string
          overall_grade?: string | null
          percentage?: number | null
          published_on?: string | null
          student_id?: string
          term?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_members: {
        Row: {
          campus_id: string
          created_at: string
          email: string
          employee_no: string | null
          full_name: string
          id: string
          is_portal_demo: boolean
          phone: string | null
          role: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          campus_id: string
          created_at?: string
          email: string
          employee_no?: string | null
          full_name: string
          id?: string
          is_portal_demo?: boolean
          phone?: string | null
          role?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          campus_id?: string
          created_at?: string
          email?: string
          employee_no?: string | null
          full_name?: string
          id?: string
          is_portal_demo?: boolean
          phone?: string | null
          role?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_members_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
      student_enrollments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_no: string
          blood_group: string | null
          class_id: string
          created_at: string
          dob: string | null
          father_email: string | null
          father_name: string | null
          father_occupation: string | null
          father_phone: string | null
          full_name: string
          gender: string | null
          house: string | null
          id: string
          is_portal_demo: boolean
          mother_email: string | null
          mother_name: string | null
          mother_occupation: string | null
          mother_phone: string | null
          photo_url: string | null
          roll_no: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          admission_no: string
          blood_group?: string | null
          class_id: string
          created_at?: string
          dob?: string | null
          father_email?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          full_name: string
          gender?: string | null
          house?: string | null
          id?: string
          is_portal_demo?: boolean
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          photo_url?: string | null
          roll_no: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          admission_no?: string
          blood_group?: string | null
          class_id?: string
          created_at?: string
          dob?: string | null
          father_email?: string | null
          father_name?: string | null
          father_occupation?: string | null
          father_phone?: string | null
          full_name?: string
          gender?: string | null
          house?: string | null
          id?: string
          is_portal_demo?: boolean
          mother_email?: string | null
          mother_name?: string | null
          mother_occupation?: string | null
          mother_phone?: string | null
          photo_url?: string | null
          roll_no?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          class_id: string
          created_at: string
          id: string
          subject: string | null
          teacher_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          subject?: string | null
          teacher_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          subject?: string | null
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_attendance: {
        Row: {
          created_at: string
          date: string
          id: string
          punch_in: string | null
          punch_out: string | null
          staff_id: string
          status: string
          updated_at: string
          working_hours: number | null
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          punch_in?: string | null
          punch_out?: string | null
          staff_id: string
          status?: string
          updated_at?: string
          working_hours?: number | null
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          punch_in?: string | null
          punch_out?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_attendance_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          campus_id: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          campus_id?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          campus_id?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_campus_id_fkey"
            columns: ["campus_id"]
            isOneToOne: false
            referencedRelation: "campuses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_campus_role: {
        Args: {
          _campus_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
        | "student"
        | "parent"
        | "teacher"
        | "campus_admin"
        | "system_admin"
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
      app_role: [
        "student",
        "parent",
        "teacher",
        "campus_admin",
        "system_admin",
      ],
    },
  },
} as const
