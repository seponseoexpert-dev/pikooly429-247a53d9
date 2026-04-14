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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      blogs: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_url: string | null
          is_published: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bouquet_flowers: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      bouquet_materials: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      bouquet_orders: {
        Row: {
          created_at: string
          flowers: Json
          gift_message: string | null
          id: string
          material_id: string | null
          order_id: string | null
          size_id: string | null
          total_price: number
        }
        Insert: {
          created_at?: string
          flowers?: Json
          gift_message?: string | null
          id?: string
          material_id?: string | null
          order_id?: string | null
          size_id?: string | null
          total_price?: number
        }
        Update: {
          created_at?: string
          flowers?: Json
          gift_message?: string | null
          id?: string
          material_id?: string | null
          order_id?: string | null
          size_id?: string | null
          total_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bouquet_orders_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "bouquet_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouquet_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bouquet_orders_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "bouquet_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      bouquet_sizes: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          extra_price: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          extra_price?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          extra_price?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          allow_custom_image: boolean
          allow_custom_text: boolean
          category_type: string
          created_at: string
          description: string | null
          display_order: number
          faq: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          long_description: string | null
          name: string
          seo_title: string | null
          short_description: string | null
          show_in_header: boolean
          show_in_homepage: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          allow_custom_image?: boolean
          allow_custom_text?: boolean
          category_type?: string
          created_at?: string
          description?: string | null
          display_order?: number
          faq?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name: string
          seo_title?: string | null
          short_description?: string | null
          show_in_header?: boolean
          show_in_homepage?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          allow_custom_image?: boolean
          allow_custom_text?: boolean
          category_type?: string
          created_at?: string
          description?: string | null
          display_order?: number
          faq?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name?: string
          seo_title?: string | null
          short_description?: string | null
          show_in_header?: boolean
          show_in_homepage?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      celebrations: {
        Row: {
          bg_color: string | null
          created_at: string
          date_label: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          name: string
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          created_at?: string
          date_label: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          created_at?: string
          date_label?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      currencies: {
        Row: {
          code: string
          created_at: string
          display_order: number
          exchange_rate: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          symbol: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          display_order?: number
          exchange_rate?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          symbol: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          display_order?: number
          exchange_rate?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          symbol?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_bookings: {
        Row: {
          booking_number: string
          category_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          event_date: string
          event_time: string | null
          guest_count: number | null
          id: string
          notes: string | null
          package_id: string | null
          payment_method: string
          payment_status: string
          special_requests: string | null
          status: string
          total: number
          updated_at: string
          user_id: string | null
          venue_address: string
        }
        Insert: {
          booking_number: string
          category_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          event_date: string
          event_time?: string | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          package_id?: string | null
          payment_method?: string
          payment_status?: string
          special_requests?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          venue_address: string
        }
        Update: {
          booking_number?: string
          category_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          event_date?: string
          event_time?: string | null
          guest_count?: number | null
          id?: string
          notes?: string | null
          package_id?: string | null
          payment_method?: string
          payment_status?: string
          special_requests?: string | null
          status?: string
          total?: number
          updated_at?: string
          user_id?: string | null
          venue_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_bookings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "event_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      event_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean
          long_description: string | null
          name: string
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_packages: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          features: Json
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          name: string
          original_price: number | null
          price: number
          seo_description: string | null
          seo_title: string | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          original_price?: number | null
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          features?: Json
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          original_price?: number | null
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_packages_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      gifting_stories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          label: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string | null
          views_count: number
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          label?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number
        }
        Relationships: []
      }
      home_living_gifts: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
        }
        Relationships: []
      }
      offer_banners: {
        Row: {
          bg_color: string | null
          bg_image_url: string | null
          created_at: string
          cta_text: string | null
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          logo_url: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          bg_image_url?: string | null
          created_at?: string
          cta_text?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          logo_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          bg_image_url?: string | null
          created_at?: string
          cta_text?: string | null
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          logo_url?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          custom_images: string[] | null
          id: string
          order_id: string
          price: number
          product_id: string | null
          product_name: string
          quantity: number
          total: number
        }
        Insert: {
          created_at?: string
          custom_images?: string[] | null
          id?: string
          order_id: string
          price?: number
          product_id?: string | null
          product_name: string
          quantity?: number
          total?: number
        }
        Update: {
          created_at?: string
          custom_images?: string[] | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string | null
          product_name?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          alt_phone: string | null
          billing_country: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_date: string | null
          delivery_fee: number
          delivery_time: string | null
          discount: number
          gift_message: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string
          payment_status: string
          recipient_name: string | null
          status: string
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          alt_phone?: string | null
          billing_country?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_date?: string | null
          delivery_fee?: number
          delivery_time?: string | null
          discount?: number
          gift_message?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string
          payment_status?: string
          recipient_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          alt_phone?: string | null
          billing_country?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_date?: string | null
          delivery_fee?: number
          delivery_time?: string | null
          discount?: number
          gift_message?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string
          payment_status?: string
          recipient_name?: string | null
          status?: string
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      photo_bookings: {
        Row: {
          booking_number: string
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          district: string | null
          event_address: string
          event_date: string
          event_time: string | null
          id: string
          location_type: string
          notes: string | null
          package_id: string | null
          service_id: string | null
          status: string
          total: number
          travel_fee: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_number: string
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          district?: string | null
          event_address: string
          event_date: string
          event_time?: string | null
          id?: string
          location_type?: string
          notes?: string | null
          package_id?: string | null
          service_id?: string | null
          status?: string
          total?: number
          travel_fee?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_number?: string
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          district?: string | null
          event_address?: string
          event_date?: string
          event_time?: string | null
          id?: string
          location_type?: string
          notes?: string | null
          package_id?: string | null
          service_id?: string | null
          status?: string
          total?: number
          travel_fee?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "photo_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "photo_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "photo_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "photo_services"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_packages: {
        Row: {
          created_at: string
          display_order: number
          duration: string
          features: Json
          id: string
          is_active: boolean
          name: string
          price: number
          service_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          duration: string
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          price?: number
          service_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          duration?: string
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "photo_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "photo_services"
            referencedColumns: ["id"]
          },
        ]
      }
      photo_portfolio: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          media_type: string
          media_url: string
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_embed_url: string | null
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          media_type?: string
          media_url: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_embed_url?: string | null
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          media_type?: string
          media_url?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_embed_url?: string | null
        }
        Relationships: []
      }
      photo_services: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          is_featured: boolean
          short_description: string | null
          starting_price: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          short_description?: string | null
          starting_price?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_featured?: boolean
          short_description?: string | null
          starting_price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      photo_travel_fees: {
        Row: {
          created_at: string
          district: string
          fee: number
          id: string
          is_available: boolean
          request_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          district: string
          fee?: number
          id?: string
          is_available?: boolean
          request_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string
          fee?: number
          id?: string
          is_available?: boolean
          request_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      popular_gifting: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_subcategories: {
        Row: {
          created_at: string
          id: string
          product_id: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_subcategories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          delivery_time: string | null
          description: string | null
          id: string
          image_url: string | null
          images: string[] | null
          is_active: boolean
          is_featured: boolean
          name: string
          original_price: number | null
          price: number
          rating: number | null
          review_count: number | null
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          slug: string
          specifications: Json | null
          stock: number
          subcategory_id: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug: string
          specifications?: Json | null
          stock?: number
          subcategory_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[] | null
          is_active?: boolean
          is_featured?: boolean
          name?: string
          original_price?: number | null
          price?: number
          rating?: number | null
          review_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          slug?: string
          specifications?: Json | null
          stock?: number
          subcategory_id?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      relationship_categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_addresses: {
        Row: {
          address: string
          created_at: string
          district: string | null
          full_name: string
          id: string
          is_default: boolean
          label: string
          phone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          district?: string | null
          full_name: string
          id?: string
          is_default?: boolean
          label?: string
          phone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          district?: string | null
          full_name?: string
          id?: string
          is_default?: boolean
          label?: string
          phone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shipping_category_fees: {
        Row: {
          category_id: string
          created_at: string
          delivery_fee: number
          delivery_label: string | null
          district_id: string
          id: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          delivery_fee?: number
          delivery_label?: string | null
          district_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          delivery_fee?: number
          delivery_label?: string | null
          district_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_category_fees_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_category_fees_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "shipping_districts"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_districts: {
        Row: {
          created_at: string
          delivery_fee: number
          delivery_label: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number
          delivery_label?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number
          delivery_label?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      sliders: {
        Row: {
          bg_color: string | null
          bg_image_url: string | null
          created_at: string
          cta_text: string | null
          display_order: number
          id: string
          image_url: string | null
          is_active: boolean
          link: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          bg_image_url?: string | null
          created_at?: string
          cta_text?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          bg_image_url?: string | null
          created_at?: string
          cta_text?: string | null
          display_order?: number
          id?: string
          image_url?: string | null
          is_active?: boolean
          link?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subcategories: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          display_order: number
          faq: Json | null
          id: string
          image_url: string | null
          is_active: boolean
          long_description: string | null
          name: string
          seo_title: string | null
          short_description: string | null
          show_in_tailored: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          display_order?: number
          faq?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name: string
          seo_title?: string | null
          short_description?: string | null
          show_in_tailored?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          display_order?: number
          faq?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          long_description?: string | null
          name?: string
          seo_title?: string | null
          short_description?: string | null
          show_in_tailored?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          description: string | null
          id: string
          reference_id: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
