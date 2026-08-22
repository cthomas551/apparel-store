export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          title: string | null;
          company: string | null;
          birthday_month: number | null;
          birthday_day: number | null;
          gender: string | null;
          phone: string | null;
          mobile_phone: string | null;
          interests: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          title?: string | null;
          company?: string | null;
          birthday_month?: number | null;
          birthday_day?: number | null;
          gender?: string | null;
          phone?: string | null;
          mobile_phone?: string | null;
          interests?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          title?: string | null;
          company?: string | null;
          birthday_month?: number | null;
          birthday_day?: number | null;
          gender?: string | null;
          phone?: string | null;
          mobile_phone?: string | null;
          interests?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          status: "pending" | "shipped" | "delivered";
          subtotal: number;
          discount_total: number;
          shipping_total: number;
          total: number;
          shipping_address: unknown | null;
          promotion_id: string | null;
          stripe_session_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          status?: "pending" | "shipped" | "delivered";
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          total?: number;
          shipping_address?: unknown | null;
          promotion_id?: string | null;
          stripe_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          status?: "pending" | "shipped" | "delivered";
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          total?: number;
          shipping_address?: unknown | null;
          promotion_id?: string | null;
          stripe_session_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          full_name: string;
          line1: string;
          line2: string | null;
          city: string;
          state: string;
          postal_code: string;
          country: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          full_name: string;
          line1: string;
          line2?: string | null;
          city: string;
          state: string;
          postal_code: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          label?: string;
          full_name?: string;
          line1?: string;
          line2?: string | null;
          city?: string;
          state?: string;
          postal_code?: string;
          country?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          product_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          parent_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          parent_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          base_price: number;
          brand: string | null;
          category_id: string | null;
          status: "draft" | "active" | "archived";
          tone: string | null;
          details: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          base_price: number;
          brand?: string | null;
          category_id?: string | null;
          status?: "draft" | "active" | "archived";
          tone?: string | null;
          details?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          base_price?: number;
          brand?: string | null;
          category_id?: string | null;
          status?: "draft" | "active" | "archived";
          tone?: string | null;
          details?: unknown | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          size: string;
          color: string;
          sku: string;
          price_override: number | null;
          stock_quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          size: string;
          color: string;
          sku: string;
          price_override?: number | null;
          stock_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          size?: string;
          color?: string;
          sku?: string;
          price_override?: number | null;
          stock_quantity?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          fit: "cover" | "contain" | null;
          is_model_shot: boolean;
          alt_text: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          fit?: "cover" | "contain" | null;
          is_model_shot?: boolean;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          url?: string;
          fit?: "cover" | "contain" | null;
          is_model_shot?: boolean;
          alt_text?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      product_tags: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      product_tag_map: {
        Row: {
          product_id: string;
          tag_id: string;
        };
        Insert: {
          product_id: string;
          tag_id: string;
        };
        Update: {
          product_id?: string;
          tag_id?: string;
        };
        Relationships: [];
      };
      product_reviews: {
        Row: {
          id: string;
          product_id: string;
          user_id: string;
          rating: number;
          body: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          user_id: string;
          rating: number;
          body?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          user_id?: string;
          rating?: number;
          body?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      promotions: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          starts_at: string | null;
          ends_at: string | null;
          max_uses: number | null;
          times_used: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          starts_at?: string | null;
          ends_at?: string | null;
          max_uses?: number | null;
          times_used?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          description?: string | null;
          discount_type?: "percentage" | "fixed";
          discount_value?: number;
          starts_at?: string | null;
          ends_at?: string | null;
          max_uses?: number | null;
          times_used?: number;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      carts: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cart_items: {
        Row: {
          id: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cart_id: string;
          variant_id: string;
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          cart_id?: string;
          variant_id?: string;
          quantity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string | null;
          quantity: number;
          unit_price: number;
          product_name: string;
          variant_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          variant_id?: string | null;
          quantity: number;
          unit_price: number;
          product_name: string;
          variant_label?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          variant_id?: string | null;
          quantity?: number;
          unit_price?: number;
          product_name?: string;
          variant_label?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      checkout_cart: {
        Args: { p_cart_id: string; p_shipping_address: unknown };
        Returns: string;
      };
      record_paid_order: {
        Args: {
          p_user_id: string;
          p_stripe_session_id: string;
          p_items: unknown;
          p_promotion_id?: string | null;
          p_discount_total?: number;
        };
        Returns: string;
      };
    };
  };
};
