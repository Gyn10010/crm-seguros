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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          max_hours: number
          name: string
          order_index: number
          responsible_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_hours?: number
          name: string
          order_index?: number
          responsible_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          max_hours?: number
          name?: string
          order_index?: number
          responsible_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          details: Json | null
          id: string
          ip_address: unknown | null
          record_id: string | null
          table_name: string
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          record_id?: string | null
          table_name?: string
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      client_field_config: {
        Row: {
          created_at: string
          field_name: string
          id: string
          is_required: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          is_required?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          is_required?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          birth_date: string | null
          business_sector: string | null
          city: string | null
          created_at: string
          document: string | null
          email: string
          gender: string | null
          id: string
          is_active: boolean | null
          license_expiry: string | null
          marital_status: string | null
          monthly_income: number | null
          name: string
          person_type: string | null
          phone: string
          profession: string | null
          related_clients: Json | null
          salesperson: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          birth_date?: string | null
          business_sector?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          license_expiry?: string | null
          marital_status?: string | null
          monthly_income?: number | null
          name: string
          person_type?: string | null
          phone: string
          profession?: string | null
          related_clients?: Json | null
          salesperson?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          birth_date?: string | null
          business_sector?: string | null
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          license_expiry?: string | null
          marital_status?: string | null
          monthly_income?: number | null
          name?: string
          person_type?: string | null
          phone?: string
          profession?: string | null
          related_clients?: Json | null
          salesperson?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      credentials: {
        Row: {
          created_at: string
          encrypted_password: string | null
          id: string
          insurance_company_id: string
          login: string
          password: string | null
          system_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          encrypted_password?: string | null
          id?: string
          insurance_company_id: string
          login: string
          password?: string | null
          system_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          encrypted_password?: string | null
          id?: string
          insurance_company_id?: string
          login?: string
          password?: string | null
          system_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "credentials_insurance_company_id_fkey"
            columns: ["insurance_company_id"]
            isOneToOne: false
            referencedRelation: "insurance_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      encryption_keys: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          key_name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          key_name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          key_name?: string
        }
        Relationships: []
      }
      funnel_activities: {
        Row: {
          assigned_to: string
          completed: boolean
          created_at: string
          due_date: string | null
          due_time: string | null
          id: string
          opportunity_id: string
          stage: string
          text: string
          updated_at: string
        }
        Insert: {
          assigned_to: string
          completed?: boolean
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          opportunity_id: string
          stage: string
          text: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string
          completed?: boolean
          created_at?: string
          due_date?: string | null
          due_time?: string | null
          id?: string
          opportunity_id?: string
          stage?: string
          text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_activity_templates: {
        Row: {
          activity_text: string
          created_at: string
          funnel_type: string
          id: string
          max_hours: number
          order_index: number
          responsible_type: string
          stage: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_text: string
          created_at?: string
          funnel_type: string
          id?: string
          max_hours?: number
          order_index?: number
          responsible_type?: string
          stage: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_text?: string
          created_at?: string
          funnel_type?: string
          id?: string
          max_hours?: number
          order_index?: number
          responsible_type?: string
          stage?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funnel_configurations: {
        Row: {
          created_at: string
          funnel_key: string
          funnel_name: string
          id: string
          is_active: boolean
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          funnel_key: string
          funnel_name: string
          id?: string
          is_active?: boolean
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          funnel_key?: string
          funnel_name?: string
          id?: string
          is_active?: boolean
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      funnel_stages: {
        Row: {
          created_at: string
          funnel_key: string
          id: string
          order_index: number
          stage_key: string
          stage_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          funnel_key: string
          id?: string
          order_index?: number
          stage_key: string
          stage_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          funnel_key?: string
          id?: string
          order_index?: number
          stage_key?: string
          stage_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insurance_companies: {
        Row: {
          contact_person: string
          created_at: string
          email: string
          id: string
          name: string
          phone: string
          portal_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_person: string
          created_at?: string
          email: string
          id?: string
          name: string
          phone: string
          portal_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_person?: string
          created_at?: string
          email?: string
          id?: string
          name?: string
          phone?: string
          portal_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_roles: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          order_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          client_id: string
          commission: number
          created_at: string
          deal_type: string
          expected_close_date: string
          funnel_type: string
          id: string
          insurance_company: string
          insurance_type: string
          notes: string | null
          origin: string
          renewal_responsible: string
          salesperson: string
          stage: string
          technical_responsible: string
          title: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          client_id: string
          commission?: number
          created_at?: string
          deal_type: string
          expected_close_date: string
          funnel_type: string
          id?: string
          insurance_company: string
          insurance_type: string
          notes?: string | null
          origin: string
          renewal_responsible: string
          salesperson: string
          stage: string
          technical_responsible: string
          title: string
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          client_id?: string
          commission?: number
          created_at?: string
          deal_type?: string
          expected_close_date?: string
          funnel_type?: string
          id?: string
          insurance_company?: string
          insurance_type?: string
          notes?: string | null
          origin?: string
          renewal_responsible?: string
          salesperson?: string
          stage?: string
          technical_responsible?: string
          title?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      origins: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      policies: {
        Row: {
          branch: string | null
          client_id: string
          commission: number
          created_at: string
          document_type: string | null
          end_date: string
          endorsement: string | null
          endorsement_proposal: string | null
          generated_commission: number | null
          id: string
          installments: number | null
          insurance_company: string
          item: string | null
          net_premium: number | null
          payment_type: string | null
          policy_number: string
          premium: number
          product: string | null
          proposal: string | null
          seller_transfer: number | null
          start_date: string
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          branch?: string | null
          client_id: string
          commission?: number
          created_at?: string
          document_type?: string | null
          end_date: string
          endorsement?: string | null
          endorsement_proposal?: string | null
          generated_commission?: number | null
          id?: string
          installments?: number | null
          insurance_company: string
          item?: string | null
          net_premium?: number | null
          payment_type?: string | null
          policy_number: string
          premium?: number
          product?: string | null
          proposal?: string | null
          seller_transfer?: number | null
          start_date: string
          status: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          branch?: string | null
          client_id?: string
          commission?: number
          created_at?: string
          document_type?: string | null
          end_date?: string
          endorsement?: string | null
          endorsement_proposal?: string | null
          generated_commission?: number | null
          id?: string
          installments?: number | null
          insurance_company?: string
          item?: string | null
          net_premium?: number | null
          payment_type?: string | null
          policy_number?: string
          premium?: number
          product?: string | null
          proposal?: string | null
          seller_transfer?: number | null
          start_date?: string
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_field_config: {
        Row: {
          created_at: string
          field_name: string
          id: string
          is_required: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          field_name: string
          id?: string
          is_required?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          field_name?: string
          id?: string
          is_required?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      policy_types: {
        Row: {
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          id: string
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      renewals: {
        Row: {
          client_id: string
          created_at: string
          id: string
          next_contact_date: string | null
          notes: string | null
          policy_id: string
          salesperson: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          next_contact_date?: string | null
          notes?: string | null
          policy_id: string
          salesperson: string
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          next_contact_date?: string | null
          notes?: string | null
          policy_id?: string
          salesperson?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "renewals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "renewals_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          company_name: string
          created_at: string
          currency: string
          id: string
          renewal_alert_days: number
          theme_color: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string
          created_at?: string
          currency?: string
          id?: string
          renewal_alert_days?: number
          theme_color?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          currency?: string
          id?: string
          renewal_alert_days?: number
          theme_color?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          client_id: string | null
          created_at: string
          description: string
          due_date: string | null
          id: string
          opportunity_id: string | null
          recurrence: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          description: string
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          recurrence: string
          status: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          opportunity_id?: string | null
          recurrence?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
          role: Database["public"]["Enums"]["app_role"]
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
      create_default_funnel_configs: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      create_default_funnel_templates: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      decrypt_credential: {
        Args: { p_encrypted: string; p_key: string }
        Returns: string
      }
      encrypt_credential: {
        Args: { p_key: string; p_plaintext: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_details?: Json
          p_record_id: string
          p_table_name: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
