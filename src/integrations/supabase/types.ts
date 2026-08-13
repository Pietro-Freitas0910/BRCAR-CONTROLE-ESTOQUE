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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      customers: {
        Row: {
          city: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      garage_expenses: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          value: number
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          value?: number
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          value?: number
        }
        Relationships: []
      }
      garage_settings: {
        Row: {
          address: string | null
          catalog_headline: string | null
          city: string | null
          id: boolean
          instagram: string | null
          name: string
          stale_days: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          address?: string | null
          catalog_headline?: string | null
          city?: string | null
          id?: boolean
          instagram?: string | null
          name?: string
          stale_days?: number
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          address?: string | null
          catalog_headline?: string | null
          city?: string | null
          id?: boolean
          instagram?: string | null
          name?: string
          stale_days?: number
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          id: string
          message: string | null
          name: string
          phone: string
          source: string
          status: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          name: string
          phone: string
          source?: string
          status?: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          source?: string
          status?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "leads_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          type: string
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          type: string
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          type?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "notifications_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email?: string | null
          id: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string | null
          city: string | null
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
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
      vehicle_checklist: {
        Row: {
          created_at: string
          done: boolean
          done_at: string | null
          id: string
          item: string
          position: number
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          item: string
          position?: number
          vehicle_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          done_at?: string | null
          id?: string
          item?: string
          position?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_checklist_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_checklist_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_documents: {
        Row: {
          created_at: string
          created_by: string | null
          doc_type: string
          due_date: string | null
          file_url: string | null
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doc_type: string
          due_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doc_type?: string
          due_date?: string | null
          file_url?: string | null
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_documents_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_entries: {
        Row: {
          amount_paid: number | null
          amount_pending: number | null
          created_at: string
          created_by: string | null
          entry_date: string
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          notes: string | null
          origin: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          purchase_value: number
          seller_name: string | null
          seller_phone: string | null
          trade_value: number | null
          vehicle_id: string
        }
        Insert: {
          amount_paid?: number | null
          amount_pending?: number | null
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          notes?: string | null
          origin?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          purchase_value?: number
          seller_name?: string | null
          seller_phone?: string | null
          trade_value?: number | null
          vehicle_id: string
        }
        Update: {
          amount_paid?: number | null
          amount_pending?: number | null
          created_at?: string
          created_by?: string | null
          entry_date?: string
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          notes?: string | null
          origin?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          purchase_value?: number
          seller_name?: string | null
          seller_phone?: string | null
          trade_value?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_entries_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_expenses: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string
          id: string
          notes: string | null
          receipt_url: string | null
          supplier_id: string | null
          value: number
          vehicle_id: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          value?: number
          vehicle_id: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string
          id?: string
          notes?: string | null
          receipt_url?: string | null
          supplier_id?: string | null
          value?: number
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_history: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          performed_by: string | null
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          performed_by?: string | null
          vehicle_id: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          performed_by?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_photos: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          position: number
          url: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          position?: number
          url: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          position?: number
          url?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_photos_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_price_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value: number
          old_value: number | null
          vehicle_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value: number
          old_value?: number | null
          vehicle_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value?: number
          old_value?: number | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_price_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_price_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_sales: {
        Row: {
          bank: string | null
          buyer_document: string | null
          buyer_name: string | null
          buyer_phone: string | null
          commission_value: number | null
          created_at: string
          customer_id: string | null
          down_payment: number | null
          financed_value: number | null
          id: string
          is_financed: boolean
          notes: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          sale_date: string
          sale_expenses: number | null
          salesperson_id: string | null
          sold_value: number
          trade_in_vehicle: string | null
          vehicle_id: string
        }
        Insert: {
          bank?: string | null
          buyer_document?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_value?: number | null
          created_at?: string
          customer_id?: string | null
          down_payment?: number | null
          financed_value?: number | null
          id?: string
          is_financed?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          sale_date?: string
          sale_expenses?: number | null
          salesperson_id?: string | null
          sold_value: number
          trade_in_vehicle?: string | null
          vehicle_id: string
        }
        Update: {
          bank?: string | null
          buyer_document?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          commission_value?: number | null
          created_at?: string
          customer_id?: string | null
          down_payment?: number | null
          financed_value?: number | null
          id?: string
          is_financed?: boolean
          notes?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          sale_date?: string
          sale_expenses?: number | null
          salesperson_id?: string | null
          sold_value?: number
          trade_in_vehicle?: string | null
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicle_financials"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_sales_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: true
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          brand: string
          category: string | null
          chassi: string | null
          color: string | null
          cover_photo_url: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          doors: number | null
          engine: string | null
          fuel: string | null
          id: string
          listed_price: number | null
          manufacture_year: number | null
          mileage: number | null
          minimum_price: number | null
          model: string
          model_year: number | null
          notes: string | null
          optionals: string[]
          plate: string | null
          renavam: string | null
          status: Database["public"]["Enums"]["vehicle_status"]
          target_price: number | null
          transmission: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          brand: string
          category?: string | null
          chassi?: string | null
          color?: string | null
          cover_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doors?: number | null
          engine?: string | null
          fuel?: string | null
          id?: string
          listed_price?: number | null
          manufacture_year?: number | null
          mileage?: number | null
          minimum_price?: number | null
          model: string
          model_year?: number | null
          notes?: string | null
          optionals?: string[]
          plate?: string | null
          renavam?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          target_price?: number | null
          transmission?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          brand?: string
          category?: string | null
          chassi?: string | null
          color?: string | null
          cover_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          doors?: number | null
          engine?: string | null
          fuel?: string | null
          id?: string
          listed_price?: number | null
          manufacture_year?: number | null
          mileage?: number | null
          minimum_price?: number | null
          model?: string
          model_year?: number | null
          notes?: string | null
          optionals?: string[]
          plate?: string | null
          renavam?: string | null
          status?: Database["public"]["Enums"]["vehicle_status"]
          target_price?: number | null
          transmission?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vehicle_financials: {
        Row: {
          days_in_stock: number | null
          entry_date: string | null
          entry_value: number | null
          expected_margin_pct: number | null
          expected_profit: number | null
          listed_price: number | null
          real_profit: number | null
          sale_date: string | null
          sold_value: number | null
          total_cost: number | null
          total_expenses: number | null
          vehicle_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "vendedor" | "financeiro"
      document_status: "ok" | "pendente" | "incompleta" | "irregular"
      entry_type: "compra_direta" | "troca" | "consignacao"
      payment_method:
        | "a_vista"
        | "financiamento"
        | "troca"
        | "pix"
        | "cartao"
        | "boleto"
        | "outro"
      vehicle_status:
        | "em_preparacao"
        | "disponivel"
        | "reservado"
        | "vendido"
        | "entregue"
        | "consignado"
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
      app_role: ["admin", "vendedor", "financeiro"],
      document_status: ["ok", "pendente", "incompleta", "irregular"],
      entry_type: ["compra_direta", "troca", "consignacao"],
      payment_method: [
        "a_vista",
        "financiamento",
        "troca",
        "pix",
        "cartao",
        "boleto",
        "outro",
      ],
      vehicle_status: [
        "em_preparacao",
        "disponivel",
        "reservado",
        "vendido",
        "entregue",
        "consignado",
      ],
    },
  },
} as const
