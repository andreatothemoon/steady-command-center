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
      db_accrual_slices: {
        Row: {
          accrual_rate: number
          created_at: string
          id: string
          pension_earned: number
          pension_id: string
          pensionable_salary: number
          revalued_value: number
          year: number
        }
        Insert: {
          accrual_rate?: number
          created_at?: string
          id?: string
          pension_earned?: number
          pension_id: string
          pensionable_salary?: number
          revalued_value?: number
          year: number
        }
        Update: {
          accrual_rate?: number
          created_at?: string
          id?: string
          pension_earned?: number
          pension_id?: string
          pensionable_salary?: number
          revalued_value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "db_accrual_slices_pension_id_fkey"
            columns: ["pension_id"]
            isOneToOne: false
            referencedRelation: "db_pensions"
            referencedColumns: ["id"]
          },
        ]
      }
      db_pensions: {
        Row: {
          account_id: string | null
          accrual_rate: number
          created_at: string
          current_age: number
          current_salary: number
          early_retirement_factor: number
          existing_income: number
          household_id: string
          id: string
          indexation_cap: number
          indexation_type: Database["public"]["Enums"]["indexation_type"]
          is_active_member: boolean
          name: string
          retirement_age: number
          revaluation_rate: number
          revaluation_type: Database["public"]["Enums"]["revaluation_type"]
          revaluation_uplift: number
          salary_growth_rate: number
          scheme_type: Database["public"]["Enums"]["db_scheme_type"]
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          accrual_rate?: number
          created_at?: string
          current_age?: number
          current_salary?: number
          early_retirement_factor?: number
          existing_income?: number
          household_id: string
          id?: string
          indexation_cap?: number
          indexation_type?: Database["public"]["Enums"]["indexation_type"]
          is_active_member?: boolean
          name?: string
          retirement_age?: number
          revaluation_rate?: number
          revaluation_type?: Database["public"]["Enums"]["revaluation_type"]
          revaluation_uplift?: number
          salary_growth_rate?: number
          scheme_type?: Database["public"]["Enums"]["db_scheme_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          accrual_rate?: number
          created_at?: string
          current_age?: number
          current_salary?: number
          early_retirement_factor?: number
          existing_income?: number
          household_id?: string
          id?: string
          indexation_cap?: number
          indexation_type?: Database["public"]["Enums"]["indexation_type"]
          is_active_member?: boolean
          name?: string
          retirement_age?: number
          revaluation_rate?: number
          revaluation_type?: Database["public"]["Enums"]["revaluation_type"]
          revaluation_uplift?: number
          salary_growth_rate?: number
          scheme_type?: Database["public"]["Enums"]["db_scheme_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "db_pensions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "db_pensions_household_id_fkey"
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
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
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
          selected_retirement_scenario_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          selected_retirement_scenario_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          selected_retirement_scenario_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "households_selected_retirement_scenario_id_fkey"
            columns: ["selected_retirement_scenario_id"]
            isOneToOne: false
            referencedRelation: "retirement_scenarios"
            referencedColumns: ["id"]
          },
        ]
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
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      tax_year_summaries: {
        Row: {
          adjusted_net_income: number | null
          bonus: number | null
          capital_gains: number | null
          created_at: string
          dividend_income: number | null
          employer_pension: number | null
          gift_aid: number | null
          gross_income: number | null
          household_id: string
          id: string
          isa_contributions: number | null
          member_profile_id: string | null
          other_salary_sacrifice: number | null
          pension_contributions: number | null
          personal_pension_net: number | null
          rental_income: number | null
          salary: number | null
          salary_sacrifice_pension: number | null
          tax_year: string
          taxable_benefits: number | null
          updated_at: string
        }
        Insert: {
          adjusted_net_income?: number | null
          bonus?: number | null
          capital_gains?: number | null
          created_at?: string
          dividend_income?: number | null
          employer_pension?: number | null
          gift_aid?: number | null
          gross_income?: number | null
          household_id: string
          id?: string
          isa_contributions?: number | null
          member_profile_id?: string | null
          other_salary_sacrifice?: number | null
          pension_contributions?: number | null
          personal_pension_net?: number | null
          rental_income?: number | null
          salary?: number | null
          salary_sacrifice_pension?: number | null
          tax_year: string
          taxable_benefits?: number | null
          updated_at?: string
        }
        Update: {
          adjusted_net_income?: number | null
          bonus?: number | null
          capital_gains?: number | null
          created_at?: string
          dividend_income?: number | null
          employer_pension?: number | null
          gift_aid?: number | null
          gross_income?: number | null
          household_id?: string
          id?: string
          isa_contributions?: number | null
          member_profile_id?: string | null
          other_salary_sacrifice?: number | null
          pension_contributions?: number | null
          personal_pension_net?: number | null
          rental_income?: number | null
          salary?: number | null
          salary_sacrifice_pension?: number | null
          tax_year?: string
          taxable_benefits?: number | null
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
      user_approvals: {
        Row: {
          created_at: string
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_approval_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["approval_status"]
      }
      get_ni_number: { Args: { _profile_id: string }; Returns: string }
      get_user_email: { Args: { _user_id: string }; Returns: string }
      get_user_household_ids: { Args: { _user_id: string }; Returns: string[] }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_household_member: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { _household_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      set_ni_number: {
        Args: { _ni_number: string; _profile_id: string }
        Returns: undefined
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
        | "loan"
        | "credit_card"
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
      confidence_level: "high" | "medium" | "low"
      db_scheme_type: "CARE" | "FINAL_SALARY"
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
      indexation_type: "CPI" | "capped"
      member_role: "adult" | "child"
      revaluation_type: "CPI" | "fixed"
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
        "loan",
        "credit_card",
      ],
      app_role: ["admin", "user"],
      approval_status: ["pending", "approved", "rejected"],
      confidence_level: ["high", "medium", "low"],
      db_scheme_type: ["CARE", "FINAL_SALARY"],
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
      indexation_type: ["CPI", "capped"],
      member_role: ["adult", "child"],
      revaluation_type: ["CPI", "fixed"],
      source_type: ["manual", "imported", "api"],
      wrapper_type: ["none", "isa", "sipp", "workplace_pension", "db_pension"],
    },
  },
} as const
