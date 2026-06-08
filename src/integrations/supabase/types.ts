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
      cost_settings: {
        Row: {
          desired_margin: number | null
          energy_cost_per_hour: number | null
          filament_price_per_kg: number | null
          id: string
          ml_commission_rate: number | null
          packaging_cost: number | null
          shopee_commission_rate: number | null
          updated_at: string | null
        }
        Insert: {
          desired_margin?: number | null
          energy_cost_per_hour?: number | null
          filament_price_per_kg?: number | null
          id?: string
          ml_commission_rate?: number | null
          packaging_cost?: number | null
          shopee_commission_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          desired_margin?: number | null
          energy_cost_per_hour?: number | null
          filament_price_per_kg?: number | null
          id?: string
          ml_commission_rate?: number | null
          packaging_cost?: number | null
          shopee_commission_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      drops: {
        Row: {
          created_at: string | null
          description: string | null
          discord_message_id: string | null
          drop_image_url: string | null
          drop_link: string | null
          drop_name: string
          id: string
          image_valid: boolean | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discord_message_id?: string | null
          drop_image_url?: string | null
          drop_link?: string | null
          drop_name: string
          id?: string
          image_valid?: boolean | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discord_message_id?: string | null
          drop_image_url?: string | null
          drop_link?: string | null
          drop_name?: string
          id?: string
          image_valid?: boolean | null
          source?: string | null
        }
        Relationships: []
      }
      listings: {
        Row: {
          caption_instagram: string | null
          caption_tiktok: string | null
          description_ml: string | null
          description_shopee: string | null
          hashtags: string | null
          id: string
          piece_id: string | null
          platform: string
          price: number | null
          published_at: string | null
          status: string | null
          title: string | null
        }
        Insert: {
          caption_instagram?: string | null
          caption_tiktok?: string | null
          description_ml?: string | null
          description_shopee?: string | null
          hashtags?: string | null
          id?: string
          piece_id?: string | null
          platform: string
          price?: number | null
          published_at?: string | null
          status?: string | null
          title?: string | null
        }
        Update: {
          caption_instagram?: string | null
          caption_tiktok?: string | null
          description_ml?: string | null
          description_shopee?: string | null
          hashtags?: string | null
          id?: string
          piece_id?: string | null
          platform?: string
          price?: number | null
          published_at?: string | null
          status?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
        ]
      }
      pieces: {
        Row: {
          active: boolean | null
          available_as: string | null
          created_at: string | null
          drive_url: string | null
          drop_id: string | null
          filament_grams: number | null
          full_description: string | null
          height_cm: string | null
          id: string
          image_url: string | null
          image_valid: boolean | null
          makerworld_model_id: string | null
          makerworld_url: string | null
          material: string | null
          name: string
          piece_url: string | null
          price_chaveiro: number | null
          price_figura: number | null
          print_hours: number | null
          print_notes: string | null
          print_time_estimated: string | null
          print_time_mono: string | null
          print_time_multi: string | null
          source: string | null
          status: string | null
          stlflix_code: string | null
          stlflix_slug: string | null
          stlflix_url: string | null
        }
        Insert: {
          active?: boolean | null
          available_as?: string | null
          created_at?: string | null
          drive_url?: string | null
          drop_id?: string | null
          filament_grams?: number | null
          full_description?: string | null
          height_cm?: string | null
          id?: string
          image_url?: string | null
          image_valid?: boolean | null
          makerworld_model_id?: string | null
          makerworld_url?: string | null
          material?: string | null
          name: string
          piece_url?: string | null
          price_chaveiro?: number | null
          price_figura?: number | null
          print_hours?: number | null
          print_notes?: string | null
          print_time_estimated?: string | null
          print_time_mono?: string | null
          print_time_multi?: string | null
          source?: string | null
          status?: string | null
          stlflix_code?: string | null
          stlflix_slug?: string | null
          stlflix_url?: string | null
        }
        Update: {
          active?: boolean | null
          available_as?: string | null
          created_at?: string | null
          drive_url?: string | null
          drop_id?: string | null
          filament_grams?: number | null
          full_description?: string | null
          height_cm?: string | null
          id?: string
          image_url?: string | null
          image_valid?: boolean | null
          makerworld_model_id?: string | null
          makerworld_url?: string | null
          material?: string | null
          name?: string
          piece_url?: string | null
          price_chaveiro?: number | null
          price_figura?: number | null
          print_hours?: number | null
          print_notes?: string | null
          print_time_estimated?: string | null
          print_time_mono?: string | null
          print_time_multi?: string | null
          source?: string | null
          status?: string | null
          stlflix_code?: string | null
          stlflix_slug?: string | null
          stlflix_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pieces_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "drops"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          commission_rate: number | null
          created_at: string | null
          gross_revenue: number | null
          id: string
          listing_id: string | null
          net_profit: number | null
          piece_id: string | null
          platform: string | null
          production_cost: number | null
          quantity: number | null
          sale_date: string | null
          unit_price: number | null
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string | null
          gross_revenue?: number | null
          id?: string
          listing_id?: string | null
          net_profit?: number | null
          piece_id?: string | null
          platform?: string | null
          production_cost?: number | null
          quantity?: number | null
          sale_date?: string | null
          unit_price?: number | null
        }
        Update: {
          commission_rate?: number | null
          created_at?: string | null
          gross_revenue?: number | null
          id?: string
          listing_id?: string | null
          net_profit?: number | null
          piece_id?: string | null
          platform?: string | null
          production_cost?: number | null
          quantity?: number | null
          sale_date?: string | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_piece_id_fkey"
            columns: ["piece_id"]
            isOneToOne: false
            referencedRelation: "pieces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
