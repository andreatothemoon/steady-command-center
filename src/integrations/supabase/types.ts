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
      account_snapshots: {
        Row: {
          account_id: string
          balance: number
          created_at: string
          id: string
          snapshot_date: string
        }
        Insert: {
          account_id: string
          balance: number
          created_at?: string
          id?: string
          snapshot_date: string
        }
        Update: {
          account_id?: string
          balance?: number
          created_at?: string
          id?: string
          snapshot_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"]
          confidence: Database["public"]["Enums"]["confidence_level"]
          created_at: string
          current_value: number
          household_id: string
          id: string
          institution_id: string | null
          interest_rate: number | null
          last_updated: string
          linked_account_id: string | null
          name: string
          owner_name: string
          source_type: Database["public"]["Enums"]["source_type"]
          term_remaining_months: number | null
          updated_at: string
          wrapper_type: Database["public"]["Enums"]["wrapper_type"]
        }
        Insert: {
          account_type: Database["public"]["Enums"]["account_type"]
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          current_value?: number
          household_id: string
          id?: string
          institution_id?: string | null
          interest_rate?: number | null
          last_updated?: string
          linked_account_id?: string | null
          name: string
          owner_name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          term_remaining_months?: number | null
          updated_at?: string
          wrapper_type?: Database["public"]["Enums"]["wrapper_type"]
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"]
          confidence?: Database["public"]["Enums"]["confidence_level"]
          created_at?: string
          current_value?: number
          household_id?: string
          id?: string
          institution_id?: string | null
          interest_rate?: number | null
          last_updated?: string
          linked_account_id?: string | null
          name?: string
          owner_name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          term_remaining_months?: number | null
          updated_at?: string
          wrapper_type?: Database["public"]["Enums"]["wrapper_type"]
        }
        Relationships: [
          {
            foreignKeyName: "accounts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_institution_id_fkey"
            columns: ["institution_id"]
            isOneToOne: false
            referencedRelation: "institutions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_linked_account_id_fkey"
            columns: ["linked_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_flows: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          description: string | null
          flow_date: string
          flow_type: string
          household_id: string
          id: string
          tag: string | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string
          description?: string | null
          flow_date: string
          flow_type: string
          household_id: string
          id?: string
          tag?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          flow_date?: string
          flow_type?: string
          household_id?: string
          id?: string
          tag?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_flows_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_flows_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          extracted_data: Json | null
          file_name: string
          file_url: string | null
          household_id: string
          id: string
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_data?: Json | null
          file_name: string
          file_url?: string | null
          household_id: string
          id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          extracted_data?: Json | null
          file_name?: string
          file_url?: string | null
          household_id?: string
          id?: string
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      holding_snapshots: {
        Row: {
          created_at: string
          holding_id: string
          id: string
          snapshot_date: string
          value: number
        }
        Insert: {
          created_at?: string
          holding_id: string
          id?: string
          snapshot_date: string
          value: number
        }
        Update: {
          created_at?: string
          holding_id?: string
          id?: string
          snapshot_date?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "holding_snapshots_holding_id_fkey"
            columns: ["holding_id"]
            isOneToOne: false
            referencedRelation: "holdings"
            referencedColumns: ["id"]
          },
        ]
      }
      holdings: {
        Row: {
          account_id: string
          created_at: string
          current_price: number | null
          household_id: string
          id: string
          name: string
          purchase_price: number | null
          quantity: number
          symbol: string | null
          updated_at: string
        }
        Insert: {
          account_id: string
          created_at?: string
          current_price?: number | null
          household_id: string
          id?: string
          name: string
          purchase_price?: number | null
          quantity?: number
          symbol?: string | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          created_at?: string
          current_price?: number | null
          household_id?: string
          id?: string
          name?: string
          purchase_price?: number | null
          quantity?: number
          symbol?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "holdings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_members: {
        Row: {
          created_at: string
          household_id: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["household_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_profiles: {
        Row: {
          created_at: string
          date_of_birth: string | null
          household_id: string
          id: string
          is_primary: boolean
          name: string
          ni_number: string | null
          role: Database["public"]["Enums"]["member_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          household_id: string
          id?: string
          is_primary?: boolean
          name: string
          ni_number?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          household_id?: string
          id?: string
          is_primary?: boolean
          name?: string
          ni_number?: string | null
          role?: Database["public"]["Enums"]["member_role"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_profiles_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
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
      import_jobs: {
        Row: {
          column_mapping: Json | null
          created_at: string
          file_name: string
          file_url: string | null
          household_id: string
          id: string
          row_count: number | null
          status: Database["public"]["Enums"]["import_status"]
          updated_at: string
        }
        Insert: {
          column_mapping?: Json | null
          created_at?: string
          file_name: string
          file_url?: string | null
          household_id: string
          id?: string
          row_count?: number | null
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
        }
        Update: {
          column_mapping?: Json | null
          created_at?: string
          file_name?: string
          file_url?: string | null
          household_id?: string
          id?: string
          row_count?: number | null
          status?: Database["public"]["Enums"]["import_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      institutions: {
        Row: {
          created_at: string
          household_id: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "institutions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      retirement_results: {
        Row: {
          created_at: string
          estimated_income: number | null
          id: string
          nominal_value: number
          projection_year: number
          real_value: number
          scenario_id: string
        }
        Insert: {
          created_at?: string
          estimated_income?: number | null
          id?: string
          nominal_value: number
          projection_year: number
          real_value: number
          scenario_id: string
        }
        Update: {
          created_at?: string
          estimated_income?: number | null
          id?: string
          nominal_value?: number
          projection_year?: number
          real_value?: number
          scenario_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "retirement_results_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "retirement_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      retirement_scenarios: {
        Row: {
          created_at: string
          current_age: number
          current_pot: number
          employer_contribution: number
          expected_return: number
          household_id: string
          id: string
          inflation_rate: number
          monthly_contribution: number
          name: string
          retirement_age: number
          target_income: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_age?: number
          current_pot?: number
          employer_contribution?: number
          expected_return?: number
          household_id: string
          id?: string
          inflation_rate?: number
          monthly_contribution?: number
          name?: string
          retirement_age?: number
          target_income?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_age?: number
          current_pot?: number
          employer_contribution?: number
          expected_return?: number
          household_id?: string
          id?: string
          inflation_rate?: number
          monthly_contribution?: number
          name?: string
          retirement_age?: number
          target_income?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retirement_scenarios_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_year_summaries: {
        Row: {
          adjusted_net_income: number | null
          capital_gains: number | null
          created_at: string
          gross_income: number | null
          household_id: string
          id: string
          isa_contributions: number | null
          member_profile_id: string | null
          pension_contributions: number | null
          tax_year: string
          updated_at: string
        }
        Insert: {
          adjusted_net_income?: number | null
          capital_gains?: number | null
          created_at?: string
          gross_income?: number | null
          household_id: string
          id?: string
          isa_contributions?: number | null
          member_profile_id?: string | null
          pension_contributions?: number | null
          tax_year: string
          updated_at?: string
        }
        Update: {
          adjusted_net_income?: number | null
          capital_gains?: number | null
          created_at?: string
          gross_income?: number | null
          household_id?: string
          id?: string
          isa_contributions?: number | null
          member_profile_id?: string | null
          pension_contributions?: number | null
          tax_year?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_year_summaries_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tax_year_summaries_member_profile_id_fkey"
            columns: ["member_profile_id"]
            isOneToOne: false
            referencedRelation: "household_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_household_ids: { Args: { _user_id: string }; Returns: string[] }
      is_household_member: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      account_type:
        | "current_account"
        | "savings"
        | "cash_isa"
        | "stocks_and_shares_isa"
        | "gia"
        | "sipp"
        | "workplace_pension"
        | "db_pension"
        | "mortgage"
        | "crypto"
        | "employer_share_scheme"
        | "property"
      confidence_level: "high" | "medium" | "low"
      document_status: "pending" | "approved" | "rejected"
      document_type:
        | "pension_statement"
        | "broker_statement"
        | "payslip"
        | "mortgage"
        | "other"
      household_role: "owner" | "member"
      import_status:
        | "pending"
        | "mapping"
        | "previewing"
        | "completed"
        | "failed"
      member_role: "adult" | "child"
      source_type: "manual" | "imported" | "api"
      wrapper_type: "none" | "isa" | "sipp" | "workplace_pension" | "db_pension"
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
      account_type: [
        "current_account",
        "savings",
        "cash_isa",
        "stocks_and_shares_isa",
        "gia",
        "sipp",
        "workplace_pension",
        "db_pension",
        "mortgage",
        "crypto",
        "employer_share_scheme",
        "property",
      ],
      confidence_level: ["high", "medium", "low"],
      document_status: ["pending", "approved", "rejected"],
      document_type: [
        "pension_statement",
        "broker_statement",
        "payslip",
        "mortgage",
        "other",
      ],
      household_role: ["owner", "member"],
      import_status: [
        "pending",
        "mapping",
        "previewing",
        "completed",
        "failed",
      ],
      member_role: ["adult", "child"],
      source_type: ["manual", "imported", "api"],
      wrapper_type: ["none", "isa", "sipp", "workplace_pension", "db_pension"],
    },
  },
} as const
