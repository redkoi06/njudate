export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;
type UUID = string;

export interface Database {
  public: {
    Tables: {
      announcements: {
        Row: {
          archived_at: Timestamp | null;
          audience: "public" | "user" | "admin" | "all";
          body: string;
          created_at: Timestamp;
          created_by: UUID | null;
          ends_at: Timestamp;
          eyebrow: string;
          id: UUID;
          published_at: Timestamp | null;
          starts_at: Timestamp;
          status: "draft" | "published" | "archived";
          title: string;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["announcements"]["Row"]> & {
          audience: "public" | "user" | "admin" | "all";
          body: string;
          ends_at: Timestamp;
          eyebrow: string;
          title: string;
          starts_at: Timestamp;
          status: "draft" | "published" | "archived";
        };
        Update: Partial<Database["public"]["Tables"]["announcements"]["Row"]>;
        Relationships: [];
      };
      app_configs: {
        Row: {
          config_key: string;
          description: string;
          updated_at: Timestamp;
          updated_by: UUID | null;
          value_json: Json;
        };
        Insert: Database["public"]["Tables"]["app_configs"]["Row"];
        Update: Partial<Database["public"]["Tables"]["app_configs"]["Row"]>;
        Relationships: [];
      };
      app_users: {
        Row: {
          account_status: "active" | "restricted" | "delete_requested" | "deleted";
          account_status_reason: string | null;
          bio: string | null;
          created_at: Timestamp;
          deleted_at: Timestamp | null;
          department: string | null;
          gender: string | null;
          grade: string | null;
          id: UUID;
          interests: string[];
          major: string | null;
          nickname: string | null;
          notify_match_result: boolean;
          notify_platform_digest: boolean;
          notify_weekly_reminder: boolean;
          role: "user" | "admin";
          show_nickname: boolean;
          target_preference: string | null;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["app_users"]["Row"]> & {
          id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["app_users"]["Row"]>;
        Relationships: [];
      };
      batch_participations: {
        Row: {
          batch_id: UUID;
          cancelled_at: Timestamp | null;
          created_at: Timestamp;
          id: UUID;
          joined_at: Timestamp | null;
          locked_at: Timestamp | null;
          profile_snapshot_json: Json;
          questionnaire_submission_id: UUID;
          questionnaire_version_id: UUID;
          status: "joined" | "cancelled" | "locked";
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: Partial<Database["public"]["Tables"]["batch_participations"]["Row"]> & {
          batch_id: UUID;
          profile_snapshot_json: Json;
          questionnaire_submission_id: UUID;
          questionnaire_version_id: UUID;
          status: "joined" | "cancelled" | "locked";
          user_id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["batch_participations"]["Row"]>;
        Relationships: [];
      };
      match_batches: {
        Row: {
          code: string;
          created_at: Timestamp;
          id: UUID;
          label: string;
          match_run_at: Timestamp;
          notes: string | null;
          paused_reason: string | null;
          processed_at: Timestamp | null;
          published_at: Timestamp | null;
          questionnaire_version_id: UUID;
          result_publish_at: Timestamp;
          signup_end_at: Timestamp;
          signup_start_at: Timestamp;
          status:
            | "draft"
            | "open"
            | "locked"
            | "processing"
            | "published"
            | "cancelled"
            | "failed";
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["match_batches"]["Row"]> & {
          code: string;
          label: string;
          match_run_at: Timestamp;
          questionnaire_version_id: UUID;
          result_publish_at: Timestamp;
          signup_end_at: Timestamp;
          signup_start_at: Timestamp;
          status:
            | "draft"
            | "open"
            | "locked"
            | "processing"
            | "published"
            | "cancelled"
            | "failed";
        };
        Update: Partial<Database["public"]["Tables"]["match_batches"]["Row"]>;
        Relationships: [];
      };
      match_pairs: {
        Row: {
          batch_id: UUID;
          contact_error: string | null;
          contact_payload_json: Json | null;
          contact_status: "idle" | "confirming" | "triggered" | "failed" | "completed";
          contact_triggered_at: Timestamp | null;
          contact_triggered_by: UUID | null;
          created_at: Timestamp;
          expires_at: Timestamp | null;
          id: UUID;
          left_participation_id: UUID;
          left_user_id: UUID;
          right_participation_id: UUID;
          right_user_id: UUID;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["match_pairs"]["Row"]> & {
          batch_id: UUID;
          left_participation_id: UUID;
          left_user_id: UUID;
          right_participation_id: UUID;
          right_user_id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["match_pairs"]["Row"]>;
        Relationships: [];
      };
      match_results: {
        Row: {
          batch_id: UUID;
          counterpart_snapshot_json: Json | null;
          created_at: Timestamp;
          error_detail: string | null;
          id: UUID;
          match_pair_id: UUID | null;
          participation_id: UUID;
          preview_text: string | null;
          reasons: string[] | null;
          released_at: Timestamp | null;
          score: number | null;
          shared_signals: string[] | null;
          status: "pending" | "matched" | "unmatched" | "error" | "expired";
          updated_at: Timestamp;
          user_id: UUID;
          viewed_at: Timestamp | null;
        };
        Insert: Partial<Database["public"]["Tables"]["match_results"]["Row"]> & {
          batch_id: UUID;
          participation_id: UUID;
          status: "pending" | "matched" | "unmatched" | "error" | "expired";
          user_id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["match_results"]["Row"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          category: string;
          created_at: Timestamp;
          emailed_at: Timestamp | null;
          email_status: "not_needed" | "pending" | "sent" | "failed";
          id: UUID;
          is_read: boolean;
          level: "info" | "success" | "warning";
          read_at: Timestamp | null;
          source_id: UUID | null;
          source_type: string;
          title: string;
          user_id: UUID;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]> & {
          body: string;
          category: string;
          source_type: string;
          title: string;
          user_id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [];
      };
      operation_logs: {
        Row: {
          action_type: string;
          actor_role: string;
          actor_user_id: UUID | null;
          created_at: Timestamp;
          entity_id: UUID | null;
          entity_type: string;
          id: UUID;
          payload_json: Json | null;
          target_user_id: UUID | null;
        };
        Insert: Partial<Database["public"]["Tables"]["operation_logs"]["Row"]> & {
          action_type: string;
          actor_role: string;
          entity_type: string;
        };
        Update: Partial<Database["public"]["Tables"]["operation_logs"]["Row"]>;
        Relationships: [];
      };
      questionnaire_questions: {
        Row: {
          created_at: Timestamp;
          helper_text: string | null;
          id: UUID;
          is_required: boolean;
          kind: "text" | "single" | "multiple" | "scale";
          options_json: Json | null;
          placeholder: string | null;
          prompt: string;
          question_code: string;
          questionnaire_version_id: UUID;
          scale_left_label: string | null;
          scale_max: number | null;
          scale_min: number | null;
          scale_right_label: string | null;
          section_id: UUID;
          sort_order: number;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["questionnaire_questions"]["Row"]> & {
          kind: "text" | "single" | "multiple" | "scale";
          prompt: string;
          question_code: string;
          questionnaire_version_id: UUID;
          section_id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["questionnaire_questions"]["Row"]>;
        Relationships: [];
      };
      questionnaire_sections: {
        Row: {
          code: string;
          created_at: Timestamp;
          description: string;
          id: UUID;
          questionnaire_version_id: UUID;
          sort_order: number;
          subtitle: string;
          title: string;
          updated_at: Timestamp;
        };
        Insert: Partial<Database["public"]["Tables"]["questionnaire_sections"]["Row"]> & {
          code: string;
          questionnaire_version_id: UUID;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["questionnaire_sections"]["Row"]>;
        Relationships: [];
      };
      questionnaire_submissions: {
        Row: {
          answers_json: Json;
          created_at: Timestamp;
          id: UUID;
          questionnaire_version_id: UUID;
          status: "draft" | "submitted";
          submission_no: number;
          submitted_at: Timestamp | null;
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: Partial<Database["public"]["Tables"]["questionnaire_submissions"]["Row"]> & {
          answers_json: Json;
          questionnaire_version_id: UUID;
          status: "draft" | "submitted";
          submission_no: number;
          user_id: UUID;
        };
        Update: Partial<Database["public"]["Tables"]["questionnaire_submissions"]["Row"]>;
        Relationships: [];
      };
      questionnaire_versions: {
        Row: {
          archived_at: Timestamp | null;
          created_at: Timestamp;
          created_by: UUID | null;
          description: string;
          id: UUID;
          published_at: Timestamp | null;
          status: "draft" | "published" | "archived";
          title: string;
          updated_at: Timestamp;
          version_no: number;
        };
        Insert: Partial<Database["public"]["Tables"]["questionnaire_versions"]["Row"]> & {
          description: string;
          status: "draft" | "published" | "archived";
          title: string;
          version_no: number;
        };
        Update: Partial<Database["public"]["Tables"]["questionnaire_versions"]["Row"]>;
        Relationships: [];
      };
      service_requests: {
        Row: {
          admin_reply: string | null;
          completed_at: Timestamp | null;
          created_at: Timestamp;
          handled_at: Timestamp | null;
          handled_by: UUID | null;
          id: UUID;
          internal_note: string | null;
          message: string | null;
          priority: "normal" | "urgent";
          request_type: "consultation" | "report" | "export_data" | "delete_account";
          sender_email: string;
          sender_name: string | null;
          status: "open" | "processing" | "resolved" | "closed";
          topic: string | null;
          updated_at: Timestamp;
          user_id: UUID | null;
        };
        Insert: Partial<Database["public"]["Tables"]["service_requests"]["Row"]> & {
          priority: "normal" | "urgent";
          request_type: "consultation" | "report" | "export_data" | "delete_account";
          sender_email: string;
          status?: "open" | "processing" | "resolved" | "closed";
        };
        Update: Partial<Database["public"]["Tables"]["service_requests"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      cancel_current_batch_join: {
        Args: Record<string, never>;
        Returns: UUID;
      };
      create_service_request: {
        Args: {
          p_message?: string | null;
          p_priority?: string | null;
          p_request_type: string;
          p_sender_email?: string | null;
          p_sender_name?: string | null;
          p_topic?: string | null;
        };
        Returns: UUID;
      };
      current_user_email: {
        Args: Record<string, never>;
        Returns: string;
      };
      get_allowed_email_domains: {
        Args: Record<string, never>;
        Returns: string[];
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      join_current_batch: {
        Args: Record<string, never>;
        Returns: UUID;
      };
      mark_match_result_viewed: {
        Args: {
          p_match_result_id: UUID;
        };
        Returns: UUID;
      };
      mark_notification_read: {
        Args: {
          p_notification_id: UUID;
        };
        Returns: UUID;
      };
      save_questionnaire_draft: {
        Args: {
          p_answers_json?: Json;
        };
        Returns: UUID;
      };
      submit_questionnaire: {
        Args: {
          p_answers_json?: Json;
        };
        Returns: UUID;
      };
      trigger_match_contact: {
        Args: {
          p_match_pair_id: UUID;
        };
        Returns: Json;
      };
      validate_questionnaire_answers: {
        Args: {
          p_answers_json: Json;
          p_questionnaire_version_id: UUID;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
