export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          role: "talker" | "listener";
          language_code: string;
          created_at: string;
          banned: boolean;
          reports_count: number;
          rating_avg: number;
          rating_count: number;
        };
        Insert: {
          id: string;
          username: string;
          role: "talker" | "listener";
          language_code?: string;
          created_at?: string;
          banned?: boolean;
          reports_count?: number;
          rating_avg?: number;
          rating_count?: number;
        };
        Update: {
          id?: string;
          username?: string;
          role?: "talker" | "listener";
          language_code?: string;
          created_at?: string;
          banned?: boolean;
          reports_count?: number;
          rating_avg?: number;
          rating_count?: number;
        };
      };
      listener_presence: {
        Row: {
          user_id: string;
          status: "active" | "inactive";
          last_active_at: string;
          session_denies: number;
          activation_until: string | null;
        };
        Insert: {
          user_id: string;
          status?: "active" | "inactive";
          last_active_at?: string;
          session_denies?: number;
          activation_until?: string | null;
        };
        Update: {
          user_id?: string;
          status?: "active" | "inactive";
          last_active_at?: string;
          session_denies?: number;
          activation_until?: string | null;
        };
      };
      favorites: {
        Row: {
          talker_id: string;
          listener_id: string;
          created_at: string;
        };
        Insert: {
          talker_id: string;
          listener_id: string;
          created_at?: string;
        };
        Update: {
          talker_id?: string;
          listener_id?: string;
          created_at?: string;
        };
      };
      call_requests: {
        Row: {
          id: string;
          talker_id: string;
          listener_id: string;
          description: string;
          status: "ringing" | "accepted" | "denied" | "timeout" | "canceled";
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          talker_id: string;
          listener_id: string;
          description: string;
          status?: "ringing" | "accepted" | "denied" | "timeout" | "canceled";
          created_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          talker_id?: string;
          listener_id?: string;
          description?: string;
          status?: "ringing" | "accepted" | "denied" | "timeout" | "canceled";
          created_at?: string;
          expires_at?: string;
        };
      };
      call_sessions: {
        Row: {
          id: string;
          talker_id: string;
          listener_id: string;
          started_at: string;
          ended_at: string | null;
          ended_reason: string | null;
        };
        Insert: {
          id?: string;
          talker_id: string;
          listener_id: string;
          started_at?: string;
          ended_at?: string | null;
          ended_reason?: string | null;
        };
        Update: {
          id?: string;
          talker_id?: string;
          listener_id?: string;
          started_at?: string;
          ended_at?: string | null;
          ended_reason?: string | null;
        };
      };
      ratings: {
        Row: {
          id: string;
          call_session_id: string;
          talker_id: string;
          listener_id: string;
          rating: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_session_id: string;
          talker_id: string;
          listener_id: string;
          rating: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_session_id?: string;
          talker_id?: string;
          listener_id?: string;
          rating?: number;
          created_at?: string;
        };
      };
      misconduct_reports: {
        Row: {
          id: string;
          call_session_id: string;
          reporter_id: string;
          reported_id: string;
          category: "harassment" | "hate" | "sexual_content" | "scam" | "other";
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_session_id: string;
          reporter_id: string;
          reported_id: string;
          category: "harassment" | "hate" | "sexual_content" | "scam" | "other";
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_session_id?: string;
          reporter_id?: string;
          reported_id?: string;
          category?: "harassment" | "hate" | "sexual_content" | "scam" | "other";
          note?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: "talker" | "listener";
      listener_status: "active" | "inactive";
      call_request_status:
        | "ringing"
        | "accepted"
        | "denied"
        | "timeout"
        | "canceled";
      misconduct_category:
        | "harassment"
        | "hate"
        | "sexual_content"
        | "scam"
        | "other";
    };
  };
};
