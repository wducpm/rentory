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
      building_settings: {
        Row: {
          building_id: string
          common_fee: number
          invoice_note: string | null
          elec_price: number
          internet_fee: number
          updated_at: string
          water_price: number
        }
        Insert: {
          building_id: string
          common_fee?: number
          invoice_note?: string | null
          elec_price?: number
          internet_fee?: number
          updated_at?: string
          water_price?: number
        }
        Update: {
          building_id?: string
          common_fee?: number
          invoice_note?: string | null
          elec_price?: number
          internet_fee?: number
          updated_at?: string
          water_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "building_settings_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: true
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
      buildings: {
        Row: {
          address: string | null
          admin_id: string
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          address?: string | null
          admin_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          address?: string | null
          admin_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          active: boolean
          created_at: string
          deposit: number
          end_date: string | null
          id: string
          occupants: number
          phone: string | null
          rent: number
          room_id: string
          start_date: string
          tenant_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deposit: number
          end_date?: string | null
          id?: string
          occupants?: number
          phone?: string | null
          rent: number
          room_id: string
          start_date: string
          tenant_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deposit?: number
          end_date?: string | null
          id?: string
          occupants?: number
          phone?: string | null
          rent?: number
          room_id?: string
          start_date?: string
          tenant_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          fee: Database["public"]["Enums"]["fee_type"]
          id: string
          invoice_id: string
          is_deposit: boolean
        }
        Insert: {
          amount: number
          fee: Database["public"]["Enums"]["fee_type"]
          id?: string
          invoice_id: string
          is_deposit?: boolean
        }
        Update: {
          amount?: number
          fee?: Database["public"]["Enums"]["fee_type"]
          id?: string
          invoice_id?: string
          is_deposit?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          building_id: string
          code: string
          contract_id: string
          created_at: string
          elec_end: number
          elec_start: number
          id: string
          issue_date: string
          note: string | null
          room_id: string
          service_period: string | null
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at: string
          utility_period: string | null
          water_end: number
          water_start: number
        }
        Insert: {
          building_id: string
          code: string
          contract_id: string
          created_at?: string
          elec_end: number
          elec_start: number
          id?: string
          issue_date: string
          note?: string | null
          room_id: string
          service_period?: string | null
          type: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
          utility_period?: string | null
          water_end: number
          water_start: number
        }
        Update: {
          building_id?: string
          code?: string
          contract_id?: string
          created_at?: string
          elec_end?: number
          elec_start?: number
          id?: string
          issue_date?: string
          note?: string | null
          room_id?: string
          service_period?: string | null
          type?: Database["public"]["Enums"]["invoice_type"]
          updated_at?: string
          utility_period?: string | null
          water_end?: number
          water_start?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoices_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meter_mark_logs: {
        Row: {
          created_at: string
          effective_date: string
          elec: number
          id: string
          invoice_id: string | null
          note: string | null
          prev_elec: number | null
          prev_water: number | null
          room_id: string
          source: Database["public"]["Enums"]["mark_source"]
          water: number
        }
        Insert: {
          created_at?: string
          effective_date: string
          elec: number
          id?: string
          invoice_id?: string | null
          note?: string | null
          prev_elec?: number | null
          prev_water?: number | null
          room_id: string
          source: Database["public"]["Enums"]["mark_source"]
          water: number
        }
        Update: {
          created_at?: string
          effective_date?: string
          elec?: number
          id?: string
          invoice_id?: string | null
          note?: string | null
          prev_elec?: number | null
          prev_water?: number | null
          room_id?: string
          source?: Database["public"]["Enums"]["mark_source"]
          water?: number
        }
        Relationships: [
          {
            foreignKeyName: "meter_mark_logs_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meter_mark_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      receipt_items: {
        Row: {
          amount: number
          fee: Database["public"]["Enums"]["fee_type"]
          id: string
          receipt_id: string
        }
        Insert: {
          amount: number
          fee: Database["public"]["Enums"]["fee_type"]
          id?: string
          receipt_id: string
        }
        Update: {
          amount?: number
          fee?: Database["public"]["Enums"]["fee_type"]
          id?: string
          receipt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "recognized_items"
            referencedColumns: ["receipt_id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          edited: boolean
          id: string
          invoice_id: string
          receipt_date: string
        }
        Insert: {
          created_at?: string
          edited?: boolean
          id?: string
          invoice_id: string
          receipt_date: string
        }
        Update: {
          created_at?: string
          edited?: boolean
          id?: string
          invoice_id?: string
          receipt_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          archived: boolean
          base_rent: number
          building_id: string
          code: string
          created_at: string
          current_elec: number
          current_water: number
          floor: number | null
          id: string
          status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          archived?: boolean
          base_rent?: number
          building_id: string
          code: string
          created_at?: string
          current_elec?: number
          current_water?: number
          floor?: number | null
          id?: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          archived?: boolean
          base_rent?: number
          building_id?: string
          code?: string
          created_at?: string
          current_elec?: number
          current_water?: number
          floor?: number | null
          id?: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_building_id_fkey"
            columns: ["building_id"]
            isOneToOne: false
            referencedRelation: "buildings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      recognized_items: {
        Row: {
          amount: number | null
          fee: Database["public"]["Enums"]["fee_type"] | null
          invoice_id: string | null
          receipt_date: string | null
          receipt_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_meter_mark: {
        Args: {
          p_effective_date: string
          p_elec: number
          p_invoice_id?: string
          p_note?: string
          p_room_id: string
          p_source: Database["public"]["Enums"]["mark_source"]
          p_water: number
        }
        Returns: undefined
      }
      building_of_invoice: { Args: { i: string }; Returns: string }
      building_of_receipt: { Args: { rc: string }; Returns: string }
      building_of_room: { Args: { r: string }; Returns: string }
      create_periodic_invoice: {
        Args: {
          p_code: string
          p_contract_id: string
          p_elec_end: number
          p_elec_start: number
          p_issue_date: string
          p_items: Json
          p_note?: string
          p_room_id: string
          p_service_period: string
          p_utility_period: string
          p_water_end: number
          p_water_start: number
        }
        Returns: string
      }
      create_receipt: {
        Args: { p_invoice_id: string; p_items: Json; p_receipt_date: string }
        Returns: string
      }
      insert_invoice_with_mark: {
        Args: {
          p_code: string
          p_contract_id: string
          p_elec_end: number
          p_elec_start: number
          p_issue_date: string
          p_items: Json
          p_note?: string
          p_room_id: string
          p_service_period: string
          p_type: Database["public"]["Enums"]["invoice_type"]
          p_utility_period: string
          p_water_end: number
          p_water_start: number
        }
        Returns: string
      }
      is_my_building: { Args: { b: string }; Returns: boolean }
      move_in:
        | {
            Args: {
              p_code: string
              p_deposit: number
              p_elec: number
              p_items: Json
              p_note?: string
              p_occupants: number
              p_phone: string
              p_rent: number
              p_room_id: string
              p_service_period: string
              p_start_date: string
              p_tenant_name: string
              p_water: number
            }
            Returns: string
          }
        | {
            Args: {
              p_code: string
              p_contract_start?: string
              p_deposit: number
              p_elec: number
              p_end_date?: string
              p_items: Json
              p_note?: string
              p_occupants: number
              p_phone: string
              p_rent: number
              p_room_id: string
              p_service_period: string
              p_start_date: string
              p_tenant_name: string
              p_water: number
            }
            Returns: string
          }
      move_out: {
        Args: {
          p_code: string
          p_contract_id: string
          p_elec_end: number
          p_elec_start: number
          p_issue_date: string
          p_items: Json
          p_note?: string
          p_utility_period: string
          p_water_end: number
          p_water_start: number
        }
        Returns: string
      }
      replace_invoice_items: {
        Args: { p_invoice_id: string; p_items: Json }
        Returns: undefined
      }
      set_meter_mark: {
        Args: {
          p_effective_date: string
          p_elec: number
          p_note?: string
          p_room_id: string
          p_water: number
        }
        Returns: undefined
      }
      update_contract: {
        Args: {
          p_contract_id: string
          p_end_date?: string
          p_occupants: number
          p_phone: string
          p_rent: number
          p_tenant_name: string
        }
        Returns: undefined
      }
      update_invoice: {
        Args: {
          p_elec_end?: number
          p_elec_start?: number
          p_invoice_id: string
          p_issue_date: string
          p_items?: Json
          p_note?: string
          p_service_period?: string
          p_utility_period?: string
          p_water_end?: number
          p_water_start?: number
        }
        Returns: boolean
      }
      update_receipt_item: {
        Args: {
          p_amount: number
          p_fee: Database["public"]["Enums"]["fee_type"]
          p_receipt_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      fee_type:
        | "rent"
        | "elec"
        | "water"
        | "internet"
        | "common"
        | "deposit"
        | "deposit_refund"
      invoice_type: "move_in" | "periodic" | "move_out"
      mark_source:
        | "invoice_move_in"
        | "invoice_periodic"
        | "invoice_move_out"
        | "manual"
      room_status: "occupied" | "vacant" | "maintenance"
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
      fee_type: [
        "rent",
        "elec",
        "water",
        "internet",
        "common",
        "deposit",
        "deposit_refund",
      ],
      invoice_type: ["move_in", "periodic", "move_out"],
      mark_source: [
        "invoice_move_in",
        "invoice_periodic",
        "invoice_move_out",
        "manual",
      ],
      room_status: ["occupied", "vacant", "maintenance"],
    },
  },
} as const
