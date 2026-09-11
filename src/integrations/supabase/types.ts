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
      availabilities: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          restaurant_id: string
          slot_date: string
          slot_time: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          restaurant_id: string
          slot_date: string
          slot_time?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          restaurant_id?: string
          slot_date?: string
          slot_time?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "availabilities_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_time: string | null
          id: string
          kind: string
          project_slug: string
          restaurant_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: string
          kind?: string
          project_slug?: string
          restaurant_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: string
          kind?: string
          project_slug?: string
          restaurant_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      files: {
        Row: {
          created_at: string
          folder_id: string | null
          id: string
          mime_type: string | null
          name: string
          project_slug: string
          size_bytes: number | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name: string
          project_slug?: string
          size_bytes?: number | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string | null
          id?: string
          mime_type?: string | null
          name?: string
          project_slug?: string
          size_bytes?: number | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      folders: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          project_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          project_slug?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          project_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "folders"
            referencedColumns: ["id"]
          },
        ]
      }
      integrations: {
        Row: {
          access_token: string | null
          account_label: string | null
          created_at: string
          id: string
          last_error: string | null
          last_sync_at: string | null
          provider: string
          refresh_token: string | null
          scopes: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          account_label?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider: string
          refresh_token?: string | null
          scopes?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          account_label?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_sync_at?: string | null
          provider?: string
          refresh_token?: string | null
          scopes?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          content: string
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          project_slug: string
          tags: string[]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          project_slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          project_slug?: string
          tags?: string[]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_records: {
        Row: {
          created_at: string
          data: Json
          id: string
          module_key: string
          position: number
          project_slug: string
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          module_key: string
          position?: number
          project_slug: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          module_key?: string
          position?: number
          project_slug?: string
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          pinned: boolean
          project_slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          project_slug?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          project_slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oauth_states: {
        Row: {
          created_at: string
          provider: string
          redirect_uri: string
          state: string
          user_id: string
        }
        Insert: {
          created_at?: string
          provider: string
          redirect_uri: string
          state: string
          user_id: string
        }
        Update: {
          created_at?: string
          provider?: string
          redirect_uri?: string
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      pins: {
        Row: {
          board: string | null
          clicks: number
          created_at: string
          description: string | null
          external_id: string | null
          id: string
          image_url: string | null
          impressions: number
          manual_score: number | null
          notes: string | null
          outbound_clicks: number
          product: string | null
          published_at: string | null
          saves: number
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board?: string | null
          clicks?: number
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          manual_score?: number | null
          notes?: string | null
          outbound_clicks?: number
          product?: string | null
          published_at?: string | null
          saves?: number
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board?: string | null
          clicks?: number
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          manual_score?: number | null
          notes?: string | null
          outbound_clicks?: number
          product?: string | null
          published_at?: string | null
          saves?: number
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
        }
        Relationships: []
      }
      project_modules: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          fields: Json
          icon: string | null
          id: string
          kind: string
          label: string | null
          module_key: string
          position: number
          project_slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          fields?: Json
          icon?: string | null
          id?: string
          kind?: string
          label?: string | null
          module_key: string
          position?: number
          project_slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          fields?: Json
          icon?: string | null
          id?: string
          kind?: string
          label?: string | null
          module_key?: string
          position?: number
          project_slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          accent: string
          accent_secondary: string
          created_at: string
          effects: string
          font_body: string
          font_display: string
          home_density: string
          home_layout: Json
          id: string
          initials: string | null
          name: string
          radius: number
          slug: string
          sort_order: number
          subtitle: string | null
          surface: string
          tagline: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accent?: string
          accent_secondary?: string
          created_at?: string
          effects?: string
          font_body?: string
          font_display?: string
          home_density?: string
          home_layout?: Json
          id?: string
          initials?: string | null
          name: string
          radius?: number
          slug: string
          sort_order?: number
          subtitle?: string | null
          surface?: string
          tagline?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accent?: string
          accent_secondary?: string
          created_at?: string
          effects?: string
          font_body?: string
          font_display?: string
          home_density?: string
          home_layout?: Json
          id?: string
          initials?: string | null
          name?: string
          radius?: number
          slug?: string
          sort_order?: number
          subtitle?: string | null
          surface?: string
          tagline?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          created_at: string
          cuisine: string | null
          custom_fields: Json
          email: string | null
          id: string
          interest: string
          location: string | null
          name: string
          notes: string | null
          parking: string | null
          phone: string | null
          size: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          cuisine?: string | null
          custom_fields?: Json
          email?: string | null
          id?: string
          interest?: string
          location?: string | null
          name: string
          notes?: string | null
          parking?: string | null
          phone?: string | null
          size?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          cuisine?: string | null
          custom_fields?: Json
          email?: string | null
          id?: string
          interest?: string
          location?: string | null
          name?: string
          notes?: string | null
          parking?: string | null
          phone?: string | null
          size?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string
          currency: string
          external_id: string | null
          id: string
          product: string
          quantity: number
          sold_at: string
          source: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          product: string
          quantity?: number
          sold_at?: string
          source?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          external_id?: string | null
          id?: string
          product?: string
          quantity?: number
          sold_at?: string
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          created_at: string
          done: boolean
          due_date: string | null
          id: string
          notes: string | null
          position: number
          priority: string
          project_slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          position?: number
          priority?: string
          project_slug?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          done?: boolean
          due_date?: string | null
          id?: string
          notes?: string | null
          position?: number
          priority?: string
          project_slug?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
    Enums: {},
  },
} as const
