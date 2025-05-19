// Make sure this file only contains Supabase types, not Prisma types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      positions: {
        Row: {
          id: string;
          title: string;
          skills: string[];
          experience_level: string;
          created_at: string;
          created_by: string;
          description: string | null;
          contract_type: string | null;
          soft_skills: string[] | null;
        };
        Insert: {
          id?: string;
          title: string;
          skills: string[];
          experience_level: string;
          created_at?: string;
          created_by: string;
          description?: string | null;
          contract_type?: string | null;
          soft_skills?: string[] | null;
        };
        Update: {
          id?: string;
          title?: string;
          skills?: string[];
          experience_level?: string;
          created_at?: string;
          created_by?: string;
          description?: string | null;
          contract_type?: string | null;
          soft_skills?: string[] | null;
        };
      };
      quizzes: {
        Row: {
          id: string;
          position_id: string;
          questions: Json;
          time_limit: number | null;
          created_at: string;
          created_by: string;
          title: string;
        };
        Insert: {
          id?: string;
          position_id: string;
          questions: Json;
          time_limit?: number | null;
          created_at?: string;
          created_by: string;
          title: string;
        };
        Update: {
          id?: string;
          position_id?: string;
          questions?: Json;
          time_limit?: number | null;
          created_at?: string;
          created_by?: string;
          title?: string;
        };
      };
      candidates: {
        Row: {
          id: string;
          name: string;
          email: string;
          position_id: string;
          status: string;
          created_at: string;
          created_by: string;
          resume_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          position_id: string;
          status?: string;
          created_at?: string;
          created_by: string;
          resume_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          email?: string;
          position_id?: string;
          status?: string;
          created_at?: string;
          created_by?: string;
          resume_url?: string | null;
        };
      };
      interviews: {
        Row: {
          id: string;
          candidate_id: string;
          quiz_id: string;
          status: string;
          started_at: string | null;
          completed_at: string | null;
          score: number | null;
          answers: Json | null;
          token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          candidate_id: string;
          quiz_id: string;
          status?: string;
          started_at?: string | null;
          completed_at?: string | null;
          score?: number | null;
          answers?: Json | null;
          token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          candidate_id?: string;
          quiz_id?: string;
          status?: string;
          started_at?: string | null;
          completed_at?: string | null;
          score?: number | null;
          answers?: Json | null;
          token?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          created_at: string;
          full_name: string | null;
          company: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          role?: string;
          created_at?: string;
          full_name?: string | null;
          company?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          created_at?: string;
          full_name?: string | null;
          company?: string | null;
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
      [_ in never]: never;
    };
  };
}

export type Position = Database["public"]["Tables"]["positions"]["Row"];
export type PositionInsert =
  Database["public"]["Tables"]["positions"]["Insert"];
export type PositionUpdate =
  Database["public"]["Tables"]["positions"]["Update"];

export type Quiz = Database["public"]["Tables"]["quizzes"]["Row"];
export type QuizInsert = Database["public"]["Tables"]["quizzes"]["Insert"];
export type QuizUpdate = Database["public"]["Tables"]["quizzes"]["Update"];

export type Candidate = Database["public"]["Tables"]["candidates"]["Row"];
export type CandidateInsert =
  Database["public"]["Tables"]["candidates"]["Insert"];
export type CandidateUpdate =
  Database["public"]["Tables"]["candidates"]["Update"];

export type Interview = Database["public"]["Tables"]["interviews"]["Row"];
export type InterviewInsert =
  Database["public"]["Tables"]["interviews"]["Insert"];
export type InterviewUpdate =
  Database["public"]["Tables"]["interviews"]["Update"];

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
