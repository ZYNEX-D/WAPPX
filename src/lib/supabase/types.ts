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
      clients: {
        Row: {
          id: string;
          name: string;
          business_name: string;
          email: string;
          phone: string | null;
          verify_token: string;
          status: "active" | "suspended" | "pending";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          business_name: string;
          email: string;
          phone?: string | null;
          verify_token: string;
          status?: "active" | "suspended" | "pending";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          business_name?: string;
          email?: string;
          phone?: string | null;
          verify_token?: string;
          status?: "active" | "suspended" | "pending";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          phone: string;
          avatar_url: string | null;
          status: "active" | "pending_human" | "resolved";
          assigned_agent: string | null;
          tags: string[];
          unread_count: number;
          last_message_snippet: string;
          last_message_time: string;
          current_flow_node_id: string | null;
          is_bot_active: boolean;
          notes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          name: string;
          phone: string;
          avatar_url?: string | null;
          status?: "active" | "pending_human" | "resolved";
          assigned_agent?: string | null;
          tags?: string[];
          unread_count?: number;
          last_message_snippet?: string;
          last_message_time?: string;
          current_flow_node_id?: string | null;
          is_bot_active?: boolean;
          notes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          phone?: string;
          avatar_url?: string | null;
          status?: "active" | "pending_human" | "resolved";
          assigned_agent?: string | null;
          tags?: string[];
          unread_count?: number;
          last_message_snippet?: string;
          last_message_time?: string;
          current_flow_node_id?: string | null;
          is_bot_active?: boolean;
          notes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          contact_id: string;
          sender: "customer" | "bot" | "agent";
          sender_name: string | null;
          text: string;
          timestamp: string;
          status: "sent" | "delivered" | "read" | "failed";
          buttons: Json | null;
          selected_button_id: string | null;
          media_url: string | null;
          media_type: "image" | "audio" | "document" | null;
          is_internal_note: boolean;
          catalog?: Json | null;
          created_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          contact_id: string;
          sender: "customer" | "bot" | "agent";
          sender_name?: string | null;
          text: string;
          timestamp: string;
          status?: "sent" | "delivered" | "read" | "failed";
          buttons?: Json | null;
          selected_button_id?: string | null;
          media_url?: string | null;
          media_type?: "image" | "audio" | "document" | null;
          catalog?: Json | null;
          is_internal_note?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          contact_id?: string;
          sender?: "customer" | "bot" | "agent";
          sender_name?: string | null;
          text?: string;
          timestamp?: string;
          status?: "sent" | "delivered" | "read" | "failed";
          buttons?: Json | null;
          selected_button_id?: string | null;
          media_url?: string | null;
          media_type?: "image" | "audio" | "document" | null;
          catalog?: Json | null;
          is_internal_note?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "contacts";
            referencedColumns: ["id"];
          }
        ];
      };
      flow_nodes: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          content: string;
          trigger_keywords: string[];
          buttons: Json;
          next_node_id: string | null;
          fallback_node_id: string | null;
          position: Json;
          updated_at: string;
        };
        Insert: {
          id: string;
          user_id?: string;
          type: string;
          title: string;
          content: string;
          trigger_keywords?: string[];
          buttons?: Json;
          next_node_id?: string | null;
          fallback_node_id?: string | null;
          position?: Json;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          content?: string;
          trigger_keywords?: string[];
          buttons?: Json;
          next_node_id?: string | null;
          fallback_node_id?: string | null;
          position?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      meta_config: {
        Row: {
          id: string;
          user_id: string;
          business_name: string;
          phone_number_id: string;
          waba_id: string;
          access_token: string;
          verify_token: string;
          webhook_url: string;
          is_connected: boolean;
          business_category?: string;
          about_text?: string;
          business_email?: string;
          business_website?: string;
          business_address?: string;
          profile_image?: string;
          auto_cutoff_enabled?: boolean;
          cutoff_threshold?: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          business_name?: string;
          phone_number_id?: string;
          waba_id?: string;
          access_token?: string;
          verify_token?: string;
          webhook_url?: string;
          is_connected?: boolean;
          business_category?: string;
          about_text?: string;
          business_email?: string;
          business_website?: string;
          business_address?: string;
          profile_image?: string;
          auto_cutoff_enabled?: boolean;
          cutoff_threshold?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          business_name?: string;
          phone_number_id?: string;
          waba_id?: string;
          access_token?: string;
          verify_token?: string;
          webhook_url?: string;
          is_connected?: boolean;
          business_category?: string;
          about_text?: string;
          business_email?: string;
          business_website?: string;
          business_address?: string;
          profile_image?: string;
          auto_cutoff_enabled?: boolean;
          cutoff_threshold?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      catalogs: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          catalog_id: string | null;
          description: string | null;
          items: Json;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          client_id: string;
          name: string;
          catalog_id?: string | null;
          description?: string | null;
          items?: Json;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          catalog_id?: string | null;
          description?: string | null;
          items?: Json;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
