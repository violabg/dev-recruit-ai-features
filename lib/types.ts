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
      candidates: {
        Row: {
          created_at: string | null;
          created_by: string;
          email: string;
          id: string;
          name: string;
          position_id: string;
          resume_url: string | null;
          status: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          email: string;
          id?: string;
          name: string;
          position_id: string;
          resume_url?: string | null;
          status?: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          email?: string;
          id?: string;
          name?: string;
          position_id?: string;
          resume_url?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "candidates_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          }
        ];
      };
      interviews: {
        Row: {
          answers: Json | null;
          candidate_id: string;
          completed_at: string | null;
          created_at: string | null;
          id: string;
          quiz_id: string;
          score: number | null;
          started_at: string | null;
          status: string;
          token: string;
        };
        Insert: {
          answers?: Json | null;
          candidate_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          quiz_id: string;
          score?: number | null;
          started_at?: string | null;
          status?: string;
          token: string;
        };
        Update: {
          answers?: Json | null;
          candidate_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          id?: string;
          quiz_id?: string;
          score?: number | null;
          started_at?: string | null;
          status?: string;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "interviews_candidate_id_fkey";
            columns: ["candidate_id"];
            isOneToOne: false;
            referencedRelation: "candidates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "interviews_quiz_id_fkey";
            columns: ["quiz_id"];
            isOneToOne: false;
            referencedRelation: "quizzes";
            referencedColumns: ["id"];
          }
        ];
      };
      positions: {
        Row: {
          contract_type: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          experience_level: string;
          id: string;
          skills: string[];
          soft_skills: string[] | null;
          title: string;
        };
        Insert: {
          contract_type?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          experience_level: string;
          id?: string;
          skills: string[];
          soft_skills?: string[] | null;
          title: string;
        };
        Update: {
          contract_type?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          experience_level?: string;
          id?: string;
          skills?: string[];
          soft_skills?: string[] | null;
          title?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          company: string | null;
          created_at: string | null;
          full_name: string | null;
          id: string;
          role: string;
          user_id: string;
        };
        Insert: {
          company?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          role?: string;
          user_id: string;
        };
        Update: {
          company?: string | null;
          created_at?: string | null;
          full_name?: string | null;
          id?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      quizzes: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          position_id: string;
          questions: Json;
          time_limit: number | null;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          position_id: string;
          questions: Json;
          time_limit?: number | null;
          title: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          position_id?: string;
          questions?: Json;
          time_limit?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "quizzes_position_id_fkey";
            columns: ["position_id"];
            isOneToOne: false;
            referencedRelation: "positions";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      count_quizzes_by_position: {
        Args: Record<PropertyKey, never>;
        Returns: {
          position_id: string;
          position_title: string;
          count: number;
        }[];
      };
      generate_unique_token: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      get_current_user: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      user_owns_candidate: {
        Args: { candidate_id: string };
        Returns: boolean;
      };
      user_owns_position: {
        Args: { position_id: string };
        Returns: boolean;
      };
      user_owns_quiz: {
        Args: { quiz_id: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
      DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
      DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
    ? R
    : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I;
    }
    ? I
    : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U;
    }
    ? U
    : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;

export type Interview = Tables<"interviews">;
export type Candidate = Tables<"candidates">;
export type Position = Tables<"positions">;
export type Quiz = Tables<"quizzes">;
export type Profile = Tables<"profiles">;
