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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          hide_product_prices: boolean
          id: string
          show_carousel: boolean | null
          updated_at: string
          updated_by: string | null
          vacation_mode: boolean
          vacation_mode_message: string | null
        }
        Insert: {
          hide_product_prices?: boolean
          id?: string
          show_carousel?: boolean | null
          updated_at?: string
          updated_by?: string | null
          vacation_mode?: boolean
          vacation_mode_message?: string | null
        }
        Update: {
          hide_product_prices?: boolean
          id?: string
          show_carousel?: boolean | null
          updated_at?: string
          updated_by?: string | null
          vacation_mode?: boolean
          vacation_mode_message?: string | null
        }
        Relationships: []
      }
      content_flags: {
        Row: {
          comment_id: string | null
          created_at: string
          details: string | null
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          details?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_flags_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_flags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_emoji_sets: {
        Row: {
          created_at: string
          created_by: string | null
          emojis: Json
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          emojis?: Json
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          emojis?: Json
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      discount_rules: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          free_product_id: string | null
          free_product_quantity: number | null
          id: string
          min_quantity: number
          name: string
          priority: number
          rule_type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          free_product_id?: string | null
          free_product_quantity?: number | null
          id?: string
          min_quantity?: number
          name: string
          priority?: number
          rule_type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          free_product_id?: string | null
          free_product_quantity?: number | null
          id?: string
          min_quantity?: number
          name?: string
          priority?: number
          rule_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_rules_free_product_id_fkey"
            columns: ["free_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      disease_reports: {
        Row: {
          anonymous: boolean
          created_at: string
          crop_type: string
          description: string | null
          disease_type: string
          id: string
          image_url: string | null
          location_latitude: number | null
          location_longitude: number | null
          location_name: string | null
          severity_level: string
          updated_at: string
          user_id: string
          verified: boolean
          verified_by: string | null
        }
        Insert: {
          anonymous?: boolean
          created_at?: string
          crop_type: string
          description?: string | null
          disease_type: string
          id?: string
          image_url?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          severity_level: string
          updated_at?: string
          user_id: string
          verified?: boolean
          verified_by?: string | null
        }
        Update: {
          anonymous?: boolean
          created_at?: string
          crop_type?: string
          description?: string | null
          disease_type?: string
          id?: string
          image_url?: string | null
          location_latitude?: number | null
          location_longitude?: number | null
          location_name?: string | null
          severity_level?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          verified_by?: string | null
        }
        Relationships: []
      }
      fees: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          fee_name: string
          fee_type: string
          fee_value: number
          id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          fee_name: string
          fee_type: string
          fee_value?: number
          id?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          fee_name?: string
          fee_type?: string
          fee_value?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_comment_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_eula_acceptance: {
        Row: {
          accepted_at: string
          eula_version: string
          id: string
          user_id: string
        }
        Insert: {
          accepted_at?: string
          eula_version?: string
          id?: string
          user_id: string
        }
        Update: {
          accepted_at?: string
          eula_version?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          author_id: string
          category: string | null
          content: string
          created_at: string | null
          flagged_content: string[] | null
          id: string
          images: string[] | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_status: string | null
          published: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          category?: string | null
          content: string
          created_at?: string | null
          flagged_content?: string[] | null
          id?: string
          images?: string[] | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          published?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          category?: string | null
          content?: string
          created_at?: string | null
          flagged_content?: string[] | null
          id?: string
          images?: string[] | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_status?: string | null
          published?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      forum_reactions: {
        Row: {
          created_at: string
          emoji_code: string
          id: string
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji_code?: string
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji_code?: string
          id?: string
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read: boolean
          recipient_id: string
          sender_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id: string
          sender_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read?: boolean
          recipient_id?: string
          sender_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_sales: {
        Row: {
          active: boolean
          created_at: string
          discount_percentage: number
          event_code: string
          event_name: string
          id: string
          updated_at: string
          valid_date_end: string
          valid_date_start: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          discount_percentage?: number
          event_code: string
          event_name: string
          id?: string
          updated_at?: string
          valid_date_end: string
          valid_date_start: string
        }
        Update: {
          active?: boolean
          created_at?: string
          discount_percentage?: number
          event_code?: string
          event_name?: string
          id?: string
          updated_at?: string
          valid_date_end?: string
          valid_date_start?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          published: boolean | null
          published_date: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          published_date?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          published?: boolean | null
          published_date?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          message: string
          post_id: string | null
          read: boolean
          ticket_id: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          message: string
          post_id?: string | null
          read?: boolean
          ticket_id?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          message?: string
          post_id?: string | null
          read?: boolean
          ticket_id?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_approved_at: string | null
          cancellation_approved_by: string | null
          cancellation_details: string | null
          cancellation_reason: string | null
          cancellation_requested_at: string | null
          created_at: string
          id: string
          items: Json
          notes: string | null
          order_number: string
          payment_method: string
          shipping_address: Json
          shipping_fee: number | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          voucher_code: string | null
          voucher_discount: number | null
        }
        Insert: {
          cancellation_approved_at?: string | null
          cancellation_approved_by?: string | null
          cancellation_details?: string | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          created_at?: string
          id?: string
          items: Json
          notes?: string | null
          order_number: string
          payment_method: string
          shipping_address: Json
          shipping_fee?: number | null
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
          voucher_code?: string | null
          voucher_discount?: number | null
        }
        Update: {
          cancellation_approved_at?: string | null
          cancellation_approved_by?: string | null
          cancellation_details?: string | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          created_at?: string
          id?: string
          items?: Json
          notes?: string | null
          order_number?: string
          payment_method?: string
          shipping_address?: Json
          shipping_fee?: number | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          voucher_code?: string | null
          voucher_discount?: number | null
        }
        Relationships: []
      }
      outbreak_predictions: {
        Row: {
          active: boolean
          confidence_score: number | null
          created_at: string
          crop_type: string
          disease_type: string
          historical_data: Json | null
          id: string
          predicted_peak_date: string | null
          predicted_start_date: string | null
          prevention_tips: string[] | null
          region: string
          risk_level: string
          updated_at: string
          weather_factors: Json | null
        }
        Insert: {
          active?: boolean
          confidence_score?: number | null
          created_at?: string
          crop_type: string
          disease_type: string
          historical_data?: Json | null
          id?: string
          predicted_peak_date?: string | null
          predicted_start_date?: string | null
          prevention_tips?: string[] | null
          region: string
          risk_level: string
          updated_at?: string
          weather_factors?: Json | null
        }
        Update: {
          active?: boolean
          confidence_score?: number | null
          created_at?: string
          crop_type?: string
          disease_type?: string
          historical_data?: Json | null
          id?: string
          predicted_peak_date?: string | null
          predicted_start_date?: string | null
          prevention_tips?: string[] | null
          region?: string
          risk_level?: string
          updated_at?: string
          weather_factors?: Json | null
        }
        Relationships: []
      }
      plant_scan_history: {
        Row: {
          confidence_score: number | null
          created_at: string
          disease_detected: string | null
          id: string
          image_url: string | null
          recommendations: string | null
          scan_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          disease_detected?: string | null
          id?: string
          image_url?: string | null
          recommendations?: string | null
          scan_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          disease_detected?: string | null
          id?: string
          image_url?: string | null
          recommendations?: string | null
          scan_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean | null
          category: string | null
          created_at: string | null
          description: string
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          price: number | null
          stock_quantity: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description: string
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          price?: number | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          category?: string | null
          created_at?: string | null
          description?: string
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number | null
          stock_quantity?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      profanity_words: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          severity: string | null
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          severity?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          severity?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      profile_access_logs: {
        Row: {
          access_timestamp: string
          access_type: string
          accessed_fields: string[]
          accessed_profile_id: string
          accessor_id: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          access_timestamp?: string
          access_type: string
          accessed_fields: string[]
          accessed_profile_id: string
          accessor_id: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          access_timestamp?: string
          access_type?: string
          accessed_fields?: string[]
          accessed_profile_id?: string
          accessor_id?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          barangay: string | null
          birthday: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          gender: string | null
          id: string
          last_name: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          role: string | null
          street_number: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          barangay?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          role?: string | null
          street_number?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          barangay?: string | null
          birthday?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          role?: string | null
          street_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotional_carousel: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          image_url: string
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          image_url: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          image_url?: string
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      sales_reports: {
        Row: {
          admin_id: string
          created_at: string | null
          date_range_end: string
          date_range_start: string
          id: string
          total_orders: number
          total_products_ordered: number
          total_sales: number
          updated_at: string | null
        }
        Insert: {
          admin_id: string
          created_at?: string | null
          date_range_end: string
          date_range_start: string
          id?: string
          total_orders: number
          total_products_ordered: number
          total_sales: number
          updated_at?: string | null
        }
        Update: {
          admin_id?: string
          created_at?: string | null
          date_range_end?: string
          date_range_start?: string
          id?: string
          total_orders?: number
          total_products_ordered?: number
          total_sales?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_internal_note: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_internal_note?: boolean
          message?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          category: string
          created_at: string
          description: string
          earned: boolean
          earned_at: string | null
          icon: string
          id: string
          points: number
          progress: number
          rarity: string
          target: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          category: string
          created_at?: string
          description: string
          earned?: boolean
          earned_at?: string | null
          icon: string
          id?: string
          points?: number
          progress?: number
          rarity?: string
          target?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          category?: string
          created_at?: string
          description?: string
          earned?: boolean
          earned_at?: string | null
          icon?: string
          id?: string
          points?: number
          progress?: number
          rarity?: string
          target?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_user_id: string
          blocker_id: string
          created_at: string
          id: string
          reason: string | null
        }
        Insert: {
          blocked_user_id: string
          blocker_id: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_user_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
          reason?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          id: string
          last_scan_date: string | null
          total_credits_purchased: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          id?: string
          last_scan_date?: string | null
          total_credits_purchased?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          id?: string
          last_scan_date?: string | null
          total_credits_purchased?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          available_points: number
          created_at: string
          id: string
          points_spent: number
          total_points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_points?: number
          created_at?: string
          id?: string
          points_spent?: number
          total_points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_points?: number
          created_at?: string
          id?: string
          points_spent?: number
          total_points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          created_at: string
          current_streak: number
          id: string
          last_login_date: string | null
          longest_streak: number
          streak_start_date: string | null
          total_logins: number
          updated_at: string
          user_id: string
          vouchers_earned: number
        }
        Insert: {
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          total_logins?: number
          updated_at?: string
          user_id: string
          vouchers_earned?: number
        }
        Update: {
          created_at?: string
          current_streak?: number
          id?: string
          last_login_date?: string | null
          longest_streak?: number
          streak_start_date?: string | null
          total_logins?: number
          updated_at?: string
          user_id?: string
          vouchers_earned?: number
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_discount: number | null
          min_purchase: number
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_purchase?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount?: number | null
          min_purchase?: number
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_order_info: {
        Row: {
          full_name: string | null
          id: string | null
          masked_email: string | null
          masked_phone: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          masked_email?: never
          masked_phone?: never
        }
        Update: {
          full_name?: string | null
          id?: string | null
          masked_email?: never
          masked_phone?: never
        }
        Relationships: []
      }
    }
    Functions: {
      add_credits: {
        Args: { credits_to_add: number; user_id_param: string }
        Returns: undefined
      }
      cleanup_old_scan_history: { Args: never; Returns: undefined }
      consume_credit: { Args: { user_id_param: string }; Returns: boolean }
      create_notification: {
        Args: {
          p_actor_id: string
          p_message: string
          p_post_id: string
          p_type: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_nearby_disease_reports: {
        Args: { radius_km?: number; user_lat: number; user_lng: number }
        Returns: {
          created_at: string
          crop_type: string
          disease_type: string
          distance_km: number
          id: string
          location_name: string
          report_count: number
          severity_level: string
        }[]
      }
      get_unread_notification_count: {
        Args: { user_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_user_achievements: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      initialize_user_credits: {
        Args: { user_id_param: string }
        Returns: undefined
      }
      log_profile_access: {
        Args: {
          p_access_type: string
          p_accessed_fields: string[]
          p_accessed_profile_id: string
        }
        Returns: undefined
      }
      update_achievement_progress: {
        Args: {
          achievement_id_param: string
          progress_increment?: number
          user_id_param: string
        }
        Returns: Json
      }
      update_login_streak: { Args: { user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "sales" | "field_technician"
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
      app_role: ["admin", "user", "sales", "field_technician"],
    },
  },
} as const
