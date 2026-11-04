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
      account_controls: {
        Row: {
          suspended: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          suspended?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          suspended?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_audit: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
        }
        Relationships: []
      }
      analyses: {
        Row: {
          analysis: Json | null
          company_id: string | null
          created_at: string
          error_message: string | null
          extracted_data: Json | null
          file_name: string | null
          file_url: string | null
          id: string
          period_label: string | null
          risk_score: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          period_label?: string | null
          risk_score?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          company_id?: string | null
          created_at?: string
          error_message?: string | null
          extracted_data?: Json | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          period_label?: string | null
          risk_score?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analyses_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      app_sessions: {
        Row: {
          last_active_at: string
          revoked: boolean
          session_id: string
          user_id: string
        }
        Insert: {
          last_active_at?: string
          revoked?: boolean
          session_id: string
          user_id: string
        }
        Update: {
          last_active_at?: string
          revoked?: boolean
          session_id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          enforce_subscriptions: boolean
          id: string
          inactivity_minutes: number
          updated_at: string
        }
        Insert: {
          enforce_subscriptions?: boolean
          id?: string
          inactivity_minutes?: number
          updated_at?: string
        }
        Update: {
          enforce_subscriptions?: boolean
          id?: string
          inactivity_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          analysis_id: string | null
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          analysis_id?: string | null
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          analysis_id?: string | null
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          currency: string
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      report_translations: {
        Row: {
          created_at: string
          id: string
          language: string
          presentation: Json
          report_id: string
          source_version: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          language: string
          presentation: Json
          report_id: string
          source_version: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          language?: string
          presentation?: Json
          report_id?: string
          source_version?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_reports: {
        Row: {
          analysis: Json | null
          company: Json | null
          created_at: string
          id: string
          period_label: string | null
          risk_score: number | null
          title: string
          user_id: string
        }
        Insert: {
          analysis?: Json | null
          company?: Json | null
          created_at?: string
          id: string
          period_label?: string | null
          risk_score?: number | null
          title: string
          user_id: string
        }
        Update: {
          analysis?: Json | null
          company?: Json | null
          created_at?: string
          id?: string
          period_label?: string | null
          risk_score?: number | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          active: boolean
          analysis_limit: number | null
          company_limit: number | null
          currency: string | null
          features: Json
          id: string
          name: string
          price_amount: number | null
          report_limit: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          analysis_limit?: number | null
          company_limit?: number | null
          currency?: string | null
          features?: Json
          id: string
          name: string
          price_amount?: number | null
          report_limit?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          analysis_limit?: number | null
          company_limit?: number | null
          currency?: string | null
          features?: Json
          id?: string
          name?: string
          price_amount?: number | null
          report_limit?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          expires_at: string | null
          plan_id: string | null
          provider_subscription_id: string | null
          renews_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          expires_at?: string | null
          plan_id?: string | null
          provider_subscription_id?: string | null
          renews_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          expires_at?: string | null
          plan_id?: string | null
          provider_subscription_id?: string | null
          renews_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          id: string
          kind: string
          operation_id: string
          period_start: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          operation_id: string
          period_start?: string
          state?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          operation_id?: string
          period_start?: string
          state?: string
          user_id?: string
        }
        Relationships: []
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
      admin_overview: { Args: never; Returns: Json }
      admin_set_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user: string }
        Returns: undefined
      }
      admin_set_suspension: {
        Args: { _suspended: boolean; _user: string }
        Returns: undefined
      }
      configure_security: { Args: { _minutes: number }; Returns: undefined }
      feature_allowed: { Args: { _feature: string }; Returns: boolean }
      finish_analysis: {
        Args: { _analysis: string; _success: boolean }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reserve_analysis: { Args: { _analysis: string }; Returns: string }
      reset_own_information: { Args: never; Returns: undefined }
      session_active: { Args: never; Returns: boolean }
      touch_session: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user"
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
      app_role: ["super_admin", "admin", "user"],
    },
  },
} as const
