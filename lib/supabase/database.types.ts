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
      classes: {
        Row: {
          id: string
          level: Database["public"]["Enums"]["school_level"]
          name: string
          school_id: string
          teacher_id: string | null
        }
        Insert: {
          id?: string
          level: Database["public"]["Enums"]["school_level"]
          name: string
          school_id: string
          teacher_id?: string | null
        }
        Update: {
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
          icon: string
          id: string
          requires_signature: boolean
          school_id: string
          size_bytes: number
          storage_path: string | null
          student_id: string | null
          title: string
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
          reply_to: string | null
          school_id: string
          sender_id: string
          sent_at: string
          subject: string
        }
        Insert: {
          body: string
          id?: string
          reply_to?: string | null
          school_id: string
          sender_id: string
          sent_at?: string
          subject: string
        }
        Update: {
          body?: string
          id?: string
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
          comment: string
          level: Database["public"]["Enums"]["eval_value"]
          position: number
          report_card_id: string
          subject_id: string
        }
        Insert: {
          comment: string
          level: Database["public"]["Enums"]["eval_value"]
          position?: number
          report_card_id: string
          subject_id: string
        }
        Update: {
          comment?: string
          level?: Database["public"]["Enums"]["eval_value"]
          position?: number
          report_card_id?: string
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
          domain: string
          grading: Database["public"]["Enums"]["grading_mode"]
          id: string
          name: string
          year_label: string
        }
        Insert: {
          domain: string
          grading?: Database["public"]["Enums"]["grading_mode"]
          id?: string
          name: string
          year_label: string
        }
        Update: {
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
      justify_life_event: {
        Args: { p_comment?: string; p_event: string; p_reason: string }
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
      post_liaison_note: {
        Args: { p_body: string; p_class: string; p_requires_signature?: boolean; p_title: string }
        Returns: string
      }
      publish_assessment: { Args: { p_assessment: string }; Returns: undefined }
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
