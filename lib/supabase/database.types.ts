// Généré depuis le schéma Supabase (projet preau). Ne pas modifier à la main :
// régénérer après chaque migration.

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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      agenda_events: {
        Row: {
          created_by: string | null
          class_id: string | null
          ends_on: string | null
          id: string
          is_holiday: boolean
          school_id: string
          starts_on: string
          title: string
          tone: Database["public"]["Enums"]["tone"]
        }
        Insert: {
          created_by?: string | null
          class_id?: string | null
          ends_on?: string | null
          id?: string
          is_holiday?: boolean
          school_id: string
          starts_on: string
          title: string
          tone?: Database["public"]["Enums"]["tone"]
        }
        Update: {
          created_by?: string | null
          class_id?: string | null
          ends_on?: string | null
          id?: string
          is_holiday?: boolean
          school_id?: string
          starts_on?: string
          title?: string
          tone?: Database["public"]["Enums"]["tone"]
        }
        Relationships: [
          {
            foreignKeyName: "agenda_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      assessment_results: {
        Row: {
          assessment_id: string
          comment: string | null
          level: Database["public"]["Enums"]["eval_value"]
          score: number | null
          skill_levels: Database["public"]["Enums"]["eval_value"][]
          student_id: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          comment?: string | null
          level?: Database["public"]["Enums"]["eval_value"]
          score?: number | null
          skill_levels?: Database["public"]["Enums"]["eval_value"][]
          student_id: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          comment?: string | null
          level?: Database["public"]["Enums"]["eval_value"]
          score?: number | null
          skill_levels?: Database["public"]["Enums"]["eval_value"][]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_results_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assessment_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      assessments: {
        Row: {
          class_id: string
          held_on: string
          id: string
          published_at: string | null
          skills: string[]
          subject_id: string
          teacher_id: string
          term: number
          title: string
        }
        Insert: {
          class_id: string
          held_on: string
          id?: string
          published_at?: string | null
          skills: string[]
          subject_id: string
          teacher_id: string
          term: number
          title: string
        }
        Update: {
          class_id?: string
          held_on?: string
          id?: string
          published_at?: string | null
          skills?: string[]
          subject_id?: string
          teacher_id?: string
          term?: number
          title?: string
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          lesson_id: string
          recorded_at: string
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Insert: {
          lesson_id: string
          recorded_at?: string
          recorded_by?: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
        }
        Update: {
          lesson_id?: string
          recorded_at?: string
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      canteen_accounts: {
        Row: {
          balance_cents: number
          meal_price_cents: number
          student_id: string
        }
        Insert: {
          balance_cents?: number
          meal_price_cents?: number
          student_id: string
        }
        Update: {
          balance_cents?: number
          meal_price_cents?: number
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canteen_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      class_groups: {
        Row: { class_id: string; family: string; id: string; name: string }
        Insert: { class_id: string; family?: string; id?: string; name: string }
        Update: { class_id?: string; family?: string; id?: string; name?: string }
        Relationships: [
          {
            foreignKeyName: "class_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      student_class_groups: {
        Row: { class_id: string; family: string; group_id: string | null; student_id: string }
        Insert: { class_id: string; family?: string; group_id?: string | null; student_id: string }
        Update: { class_id?: string; family?: string; group_id?: string | null; student_id?: string }
        Relationships: [
          {
            foreignKeyName: "student_class_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_groups_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_groups_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      class_members: {
        Row: {
          added_at: string
          class_id: string
          student_id: string
        }
        Insert: {
          added_at?: string
          class_id: string
          student_id: string
        }
        Update: {
          added_at?: string
          class_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_members_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_members_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      class_links: {
        Row: {
          class_id: string
          code: string | null
          created_by: string | null
          id: string
          kind: string
          label: string
          removed: boolean
          updated_at: string
          url: string | null
        }
        Insert: {
          class_id: string
          code?: string | null
          created_by?: string | null
          id?: string
          kind: string
          label: string
          removed?: boolean
          updated_at?: string
          url?: string | null
        }
        Update: {
          class_id?: string
          code?: string | null
          created_by?: string | null
          id?: string
          kind?: string
          label?: string
          removed?: boolean
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "class_links_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      my_apps: {
        Row: {
          app_key: string | null
          created_at: string
          hidden: boolean
          id: string
          login: string | null
          name: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          app_key?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          login?: string | null
          name?: string | null
          url?: string | null
          user_id?: string
        }
        Update: {
          app_key?: string | null
          created_at?: string
          hidden?: boolean
          id?: string
          login?: string | null
          name?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          hidden: boolean
          id: string
          level: Database["public"]["Enums"]["school_level"]
          name: string
          school_id: string
          teacher_id: string | null
        }
        Insert: {
          hidden?: boolean
          id?: string
          level: Database["public"]["Enums"]["school_level"]
          name: string
          school_id: string
          teacher_id?: string | null
        }
        Update: {
          hidden?: boolean
          id?: string
          level?: Database["public"]["Enums"]["school_level"]
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      document_signatures: {
        Row: {
          document_id: string
          profile_id: string
          signed_at: string
        }
        Insert: {
          document_id: string
          profile_id: string
          signed_at?: string
        }
        Update: {
          document_id?: string
          profile_id?: string
          signed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_signatures_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_signatures_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: Database["public"]["Enums"]["doc_category"]
          class_id: string | null
          created_at: string
          created_by: string | null
          icon: string
          id: string
          mime_type: string | null
          requires_signature: boolean
          school_id: string
          size_bytes: number
          storage_path: string | null
          student_id: string | null
          title: string
          uploaded_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["doc_category"]
          class_id?: string | null
          created_at?: string
          icon?: string
          id?: string
          requires_signature?: boolean
          school_id: string
          size_bytes?: number
          storage_path?: string | null
          student_id?: string | null
          title: string
          created_by?: string | null
          mime_type?: string | null
          uploaded_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["doc_category"]
          class_id?: string | null
          created_at?: string
          icon?: string
          id?: string
          requires_signature?: boolean
          school_id?: string
          size_bytes?: number
          storage_path?: string | null
          student_id?: string | null
          title?: string
          created_by?: string | null
          mime_type?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      guardians: {
        Row: {
          guardian_id: string
          student_id: string
        }
        Insert: {
          guardian_id: string
          student_id: string
        }
        Update: {
          guardian_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardians_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      homework: {
        Row: {
          attachment_name: string | null
          class_id: string
          content: string
          due_on: string
          given_on: string
          id: string
          is_exam: boolean
          subject_id: string
          teacher_id: string
        }
        Insert: {
          attachment_name?: string | null
          class_id: string
          content: string
          due_on: string
          given_on: string
          id?: string
          is_exam?: boolean
          subject_id: string
          teacher_id: string
        }
        Update: {
          attachment_name?: string | null
          class_id?: string
          content?: string
          due_on?: string
          given_on?: string
          id?: string
          is_exam?: boolean
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_done: {
        Row: {
          done_at: string
          homework_id: string
          user_id: string
        }
        Insert: {
          done_at?: string
          homework_id: string
          user_id?: string
        }
        Update: {
          done_at?: string
          homework_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_done_homework_id_fkey"
            columns: ["homework_id"]
            isOneToOne: false
            referencedRelation: "homework"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          due_on: string | null
          id: string
          label: string
          method: string | null
          paid_on: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          due_on?: string | null
          id?: string
          label: string
          method?: string | null
          paid_on?: string | null
          status: Database["public"]["Enums"]["invoice_status"]
          student_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          due_on?: string | null
          id?: string
          label?: string
          method?: string | null
          paid_on?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_by: string | null
          group_id: string | null
          series_id: string | null
          attendance_validated_at: string | null
          cancelled: boolean
          class_id: string
          ends_at: string
          id: string
          room: string
          starts_at: string
          subject_id: string
          teacher_id: string
        }
        Insert: {
          created_by?: string | null
          group_id?: string | null
          series_id?: string | null
          attendance_validated_at?: string | null
          cancelled?: boolean
          class_id: string
          ends_at: string
          id?: string
          room: string
          starts_at: string
          subject_id: string
          teacher_id: string
        }
        Update: {
          created_by?: string | null
          group_id?: string | null
          series_id?: string | null
          attendance_validated_at?: string | null
          cancelled?: boolean
          class_id?: string
          ends_at?: string
          id?: string
          room?: string
          starts_at?: string
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "class_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      liaison_notes: {
        Row: {
          author_id: string
          body: string
          class_id: string
          created_at: string
          id: string
          requires_signature: boolean
          title: string
        }
        Insert: {
          author_id: string
          body: string
          class_id: string
          created_at?: string
          id?: string
          requires_signature?: boolean
          title: string
        }
        Update: {
          author_id?: string
          body?: string
          class_id?: string
          created_at?: string
          id?: string
          requires_signature?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "liaison_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liaison_notes_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      liaison_signatures: {
        Row: {
          guardian_id: string
          note_id: string
          signed_at: string
          student_id: string
        }
        Insert: {
          guardian_id: string
          note_id: string
          signed_at?: string
          student_id: string
        }
        Update: {
          guardian_id?: string
          note_id?: string
          signed_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "liaison_signatures_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liaison_signatures_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "liaison_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "liaison_signatures_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      life_events: {
        Row: {
          created_by: string | null
          detail: string
          id: string
          justification_comment: string | null
          justification_reason: string | null
          justified_at: string | null
          justified_by: string | null
          kind: Database["public"]["Enums"]["life_event_kind"]
          minutes: number | null
          occurred_at: string
          status: Database["public"]["Enums"]["life_event_status"]
          student_id: string
          whole_day: boolean
        }
        Insert: {
          created_by?: string | null
          detail: string
          id?: string
          justification_comment?: string | null
          justification_reason?: string | null
          justified_at?: string | null
          justified_by?: string | null
          kind: Database["public"]["Enums"]["life_event_kind"]
          minutes?: number | null
          occurred_at: string
          status: Database["public"]["Enums"]["life_event_status"]
          student_id: string
          whole_day?: boolean
        }
        Update: {
          created_by?: string | null
          detail?: string
          id?: string
          justification_comment?: string | null
          justification_reason?: string | null
          justified_at?: string | null
          justified_by?: string | null
          kind?: Database["public"]["Enums"]["life_event_kind"]
          minutes?: number | null
          occurred_at?: string
          status?: Database["public"]["Enums"]["life_event_status"]
          student_id?: string
          whole_day?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "life_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_events_justified_by_fkey"
            columns: ["justified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "life_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      menus: {
        Row: {
          items: string[]
          school_id: string
          served_on: string
        }
        Insert: {
          items: string[]
          school_id: string
          served_on: string
        }
        Update: {
          items?: string[]
          school_id?: string
          served_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      message_recipients: {
        Row: {
          archived_at: string | null
          message_id: string
          read_at: string | null
          recipient_id: string
        }
        Insert: {
          archived_at?: string | null
          message_id: string
          read_at?: string | null
          recipient_id: string
        }
        Update: {
          archived_at?: string | null
          message_id?: string
          read_at?: string | null
          recipient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_recipients_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_recipients_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          id: string
          notified_at: string | null
          reply_to: string | null
          school_id: string
          sender_id: string
          sent_at: string
          subject: string
        }
        Insert: {
          body: string
          id?: string
          notified_at?: string | null
          reply_to?: string | null
          school_id: string
          sender_id: string
          sent_at?: string
          subject: string
        }
        Update: {
          body?: string
          id?: string
          notified_at?: string | null
          reply_to?: string | null
          school_id?: string
          sender_id?: string
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_cents: number
          confirmed_at: string | null
          created_at: string
          created_by: string
          id: string
          invoice_id: string | null
          kind: Database["public"]["Enums"]["payment_kind"]
          provider: string
          provider_reference: string | null
          status: Database["public"]["Enums"]["payment_status"]
          student_id: string
        }
        Insert: {
          amount_cents: number
          confirmed_at?: string | null
          created_at?: string
          created_by: string
          id?: string
          invoice_id?: string | null
          kind: Database["public"]["Enums"]["payment_kind"]
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id: string
        }
        Update: {
          amount_cents?: number
          confirmed_at?: string | null
          created_at?: string
          created_by?: string
          id?: string
          invoice_id?: string | null
          kind?: Database["public"]["Enums"]["payment_kind"]
          provider?: string
          provider_reference?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      primary_subjects: {
        Row: { subject_id: string }
        Insert: { subject_id: string }
        Update: { subject_id?: string }
        Relationships: [
          {
            foreignKeyName: "primary_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: true
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_links: {
        Row: {
          added_at: string
          profile_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          profile_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          profile_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_links_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profile_private: {
        Row: {
          credit_domestique_account: string | null
          email: string | null
          notification_settings: Json
          phone: string | null
          profile_id: string
        }
        Insert: {
          credit_domestique_account?: string | null
          email?: string | null
          notification_settings?: Json
          phone?: string | null
          profile_id: string
        }
        Update: {
          credit_domestique_account?: string | null
          email?: string | null
          notification_settings?: Json
          phone?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_private_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          civility: Database["public"]["Enums"]["civility"] | null
          created_at: string
          display_name: string
          first_name: string | null
          id: string
          initials: string
          kind: Database["public"]["Enums"]["person_kind"]
          last_name: string | null
          role_label: string | null
          school_id: string
          specialities: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          civility?: Database["public"]["Enums"]["civility"] | null
          created_at?: string
          display_name: string
          first_name?: string | null
          id?: string
          initials: string
          kind: Database["public"]["Enums"]["person_kind"]
          last_name?: string | null
          role_label?: string | null
          school_id: string
          specialities?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          civility?: Database["public"]["Enums"]["civility"] | null
          created_at?: string
          display_name?: string
          first_name?: string | null
          id?: string
          initials?: string
          kind?: Database["public"]["Enums"]["person_kind"]
          last_name?: string | null
          role_label?: string | null
          school_id?: string
          specialities?: string | null
          title?: string | null
          user_id?: string | null
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
      report_card_lines: {
        Row: {
          updated_by: string | null
          comment: string
          level: Database["public"]["Enums"]["eval_value"]
          position: number
          report_card_id: string
          score: number | null
          subject_id: string
        }
        Insert: {
          updated_by?: string | null
          score?: number | null
          comment: string
          level: Database["public"]["Enums"]["eval_value"]
          position?: number
          report_card_id: string
          subject_id: string
        }
        Update: {
          updated_by?: string | null
          comment?: string
          level?: Database["public"]["Enums"]["eval_value"]
          position?: number
          report_card_id?: string
          score?: number | null
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_card_lines_report_card_id_fkey"
            columns: ["report_card_id"]
            isOneToOne: false
            referencedRelation: "report_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_card_lines_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      report_cards: {
        Row: {
          class_name: string
          council_mention: string | null
          council_text: string | null
          head_teacher: string | null
          id: string
          publish_on: string
          school_year: string
          student_id: string
          term: number
        }
        Insert: {
          class_name: string
          council_mention?: string | null
          council_text?: string | null
          head_teacher?: string | null
          id?: string
          publish_on: string
          school_year: string
          student_id: string
          term: number
        }
        Update: {
          class_name?: string
          council_mention?: string | null
          council_text?: string | null
          head_teacher?: string | null
          id?: string
          publish_on?: string
          school_year?: string
          student_id?: string
          term?: number
        }
        Relationships: [
          {
            foreignKeyName: "report_cards_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      schools: {
        Row: {
          week_a_monday: string
          domain: string
          grading: Database["public"]["Enums"]["grading_mode"]
          id: string
          name: string
          year_label: string
        }
        Insert: {
          week_a_monday?: string
          domain: string
          grading?: Database["public"]["Enums"]["grading_mode"]
          id?: string
          name: string
          year_label: string
        }
        Update: {
          week_a_monday?: string
          domain?: string
          grading?: Database["public"]["Enums"]["grading_mode"]
          id?: string
          name?: string
          year_label?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          class_id: string
          profile_id: string
        }
        Insert: {
          class_id: string
          profile_id: string
        }
        Update: {
          class_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          hue: number
          id: string
          name: string
          skills: string[]
        }
        Insert: {
          hue: number
          id: string
          name: string
          skills?: string[]
        }
        Update: {
          hue?: number
          id?: string
          name?: string
          skills?: string[]
        }
        Relationships: []
      }
      teachings: {
        Row: {
          class_id: string
          id: string
          is_head_teacher: boolean
          subject_id: string
          teacher_id: string
        }
        Insert: {
          class_id: string
          id?: string
          is_head_teacher?: boolean
          subject_id: string
          teacher_id: string
        }
        Update: {
          class_id?: string
          id?: string
          is_head_teacher?: boolean
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachings_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachings_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachings_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_document: {
        Args: {
          p_category: Database["public"]["Enums"]["doc_category"]
          p_class: string
          p_file_name: string
          p_mime_type: string
          p_requires_signature: boolean
          p_size_bytes: number
          p_title: string
        }
        Returns: { id: string; storage_path: string }[]
      }
      claim_message_notification: {
        Args: { p_message: string }
        Returns: boolean
      }
      claim_due_notifications: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      cancel_scheduled_message: {
        Args: { p_message: string }
        Returns: undefined
      }
      schedule_message: {
        Args: { p_body: string; p_recipients: string[]; p_send_at: string; p_subject: string }
        Returns: string
      }
      message_email_targets: {
        Args: { p_message: string }
        Returns: {
          email: string
          recipient_name: string
          school_name: string
          sender_name: string
          subject: string
        }[]
      }
      my_teaching_lessons: {
        Args: { p_from: string; p_to: string }
        Returns: {
          cancelled: boolean
          class_name: string
          ends_at: string
          group_id: string | null
          group_name: string | null
          id: string
          room: string
          school_name: string
          series_id: string | null
          starts_at: string
          subject_hue: number
          subject_id: string
          subject_name: string
          teacher_id: string
          teacher_name: string
        }[]
      }
      give_homework: {
        Args: { p_class: string; p_content: string; p_due: string; p_is_exam: boolean; p_subject: string }
        Returns: string
      }
      update_assessment: {
        Args: {
          p_assessment: string
          p_held_on: string
          p_skills?: string[]
          p_term: number
          p_title: string
        }
        Returns: undefined
      }
      update_homework: {
        Args: { p_content: string; p_due: string; p_id: string; p_is_exam: boolean }
        Returns: undefined
      }
      remove_homework: {
        Args: { p_id: string }
        Returns: undefined
      }
      create_assessment: {
        Args: {
          p_class: string
          p_held_on: string
          p_skills?: string[]
          p_subject: string
          p_term: number
          p_title: string
        }
        Returns: string
      }
      create_class_groups: {
        Args: { p_class: string; p_family: string; p_names: string[] }
        Returns: number
      }
      set_student_group: {
        Args: { p_class: string; p_family: string; p_group: string | null; p_student: string }
        Returns: undefined
      }
      set_lesson_group: {
        Args: { p_group: string | null; p_lesson: string; p_scope: string }
        Returns: number
      }
      create_lesson_set: {
        Args: {
          p_class: string
          p_ends: string
          p_from: string
          p_group: string | null
          p_nth: number | null
          p_recurrence: string
          p_room: string
          p_starts: string
          p_subject: string
          p_teacher: string
          p_until: string
          p_weekday: number
        }
        Returns: number
      }
      create_lessons: {
        Args: {
          p_class: string
          p_ends: string
          p_from: string
          p_nth: number
          p_recurrence: string
          p_room: string
          p_starts: string
          p_subject: string
          p_teacher: string
          p_until: string
          p_weekday: number
        }
        Returns: number
      }
      create_lesson_series: {
        Args: {
          p_class: string
          p_ends: string
          p_from: string
          p_room: string
          p_starts: string
          p_subject: string
          p_teacher: string
          p_until: string
          p_weekday: number
        }
        Returns: number
      }
      create_person: {
        Args: {
          p_children: string[]
          p_civility: Database["public"]["Enums"]["civility"]
          p_class: string
          p_first_name: string
          p_kind: Database["public"]["Enums"]["person_kind"]
          p_last_name: string
        }
        Returns: string
      }
      create_report_cards: {
        Args: { p_class: string; p_publish_on: string; p_term: number }
        Returns: number
      }
      delete_report_card: { Args: { p_report_card: string }; Returns: undefined }
      delete_report_cards: { Args: { p_class: string; p_term: number }; Returns: number }
      delete_assessment: { Args: { p_assessment: string }; Returns: undefined }
      delete_lesson: { Args: { p_lesson: string }; Returns: undefined }
      delete_lesson_series: { Args: { p_from: string; p_series: string }; Returns: number }
      delete_agenda_event: { Args: { p_event: string }; Returns: undefined }
      delete_document: { Args: { p_document: string }; Returns: string }
      justify_life_event: {
        Args: { p_comment?: string; p_event: string; p_reason: string }
        Returns: undefined
      }
      add_class_member: { Args: { p_class: string; p_student: string }; Returns: undefined }
      add_agenda_event: {
        Args: {
          p_class: string
          p_ends_on: string
          p_is_holiday: boolean
          p_starts_on: string
          p_title: string
          p_tone: Database["public"]["Enums"]["tone"]
        }
        Returns: string
      }
      assign_teaching: {
        Args: { p_class: string; p_head: boolean; p_subject: string; p_teacher: string }
        Returns: undefined
      }
      cancel_payment: { Args: { p_payment: string }; Returns: undefined }
      confirm_payment: {
        Args: {
          p_payment: string
          p_reference?: string
          p_status: Database["public"]["Enums"]["payment_status"]
        }
        Returns: Database["public"]["Enums"]["payment_status"]
      }
      link_guardian: { Args: { p_guardian: string; p_student: string }; Returns: undefined }
      link_profile_account: { Args: { p_profile: string; p_user: string }; Returns: undefined }
      account_id_by_email: { Args: { p_email: string }; Returns: string }
      my_profiles: {
        Args: never
        Returns: {
          detail: string
          display_name: string
          id: string
          is_primary: boolean
          kind: Database["public"]["Enums"]["person_kind"]
          school: string
        }[]
      }
      manageable_person: { Args: { p_profile: string }; Returns: string }
      post_liaison_note: {
        Args: { p_body: string; p_class: string; p_requires_signature?: boolean; p_title: string }
        Returns: string
      }
      publish_assessment: { Args: { p_assessment: string }; Returns: undefined }
      remove_class_link: { Args: { p_id: string }; Returns: undefined }
      remove_class_member: { Args: { p_class: string; p_student: string }; Returns: undefined }
      save_class_link: {
        Args: {
          p_class: string | null
          p_code: string | null
          p_id: string | null
          p_kind: string
          p_label: string
          p_url: string | null
        }
        Returns: string
      }
      send_message: {
        Args: {
          p_body: string
          p_recipients: string[]
          p_reply_to?: string
          p_subject: string
        }
        Returns: string
      }
      set_assessment_result: {
        Args: {
          p_assessment: string
          p_level: Database["public"]["Enums"]["eval_value"]
          p_skill_levels?: Database["public"]["Enums"]["eval_value"][]
          p_student: string
        }
        Returns: undefined
      }
      set_assessment_score: {
        Args: {
          p_assessment: string
          p_score: number
          p_status?: Database["public"]["Enums"]["eval_value"]
          p_student: string
        }
        Returns: undefined
      }
      set_lesson_cancelled: { Args: { p_cancelled: boolean; p_lesson: string }; Returns: undefined }
      set_report_council: {
        Args: { p_mention: string; p_report_card: string; p_text: string }
        Returns: undefined
      }
      set_report_score: {
        Args: { p_report_card: string; p_score: number | null; p_subject: string }
        Returns: undefined
      }
      set_report_line: {
        Args: {
          p_comment: string
          p_level: Database["public"]["Enums"]["eval_value"]
          p_report_card: string
          p_subject: string
        }
        Returns: undefined
      }
      sign_document: { Args: { p_document: string }; Returns: undefined }
      sign_liaison_note: { Args: { p_note: string; p_student: string }; Returns: undefined }
      start_payment: {
        Args: {
          p_amount_cents?: number
          p_invoice?: string
          p_kind: Database["public"]["Enums"]["payment_kind"]
          p_student: string
        }
        Returns: string
      }
      update_lesson: {
        Args: {
          p_day: string
          p_ends: string
          p_lesson: string
          p_room: string
          p_scope: string
          p_starts: string
          p_subject: string
          p_teacher: string
        }
        Returns: number
      }
      update_person_email: {
        Args: { p_email: string; p_profile: string }
        Returns: undefined
      }
      update_person_name: {
        Args: {
          p_civility: Database["public"]["Enums"]["civility"]
          p_first_name: string
          p_last_name: string
          p_profile: string
        }
        Returns: undefined
      }
      validate_attendance: {
        Args: { p_lesson: string; p_statuses: Json }
        Returns: undefined
      }
    }
    Enums: {
      attendance_status: "present" | "absent" | "late"
      civility: "madame" | "monsieur"
      doc_category: "administratif" | "pedagogique" | "cantine"
      eval_value: "MI" | "MF" | "MS" | "TB" | "NE" | "ABS" | "DISP"
      grading_mode: "competences" | "note20"
      invoice_status: "a_payer" | "payee" | "creditee"
      payment_kind: "facture" | "recharge_cantine"
      payment_status: "en_attente" | "reussi" | "echoue" | "annule"
      life_event_kind:
        | "absence"
        | "retard"
        | "oubli"
        | "sanction"
        | "encouragement"
      life_event_status:
        | "a_justifier"
        | "justificatif_envoye"
        | "justifie"
        | "note"
      person_kind:
        | "eleve"
        | "parent"
        | "prof"
        | "cpe"
        | "direction"
        | "secretariat"
      school_level: "primaire" | "college" | "lycee"
      tone: "ok" | "danger" | "warn" | "info" | "neutral" | "brand"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Row"]

export type Enums<
  T extends keyof DefaultSchema["Enums"],
> = DefaultSchema["Enums"][T]
