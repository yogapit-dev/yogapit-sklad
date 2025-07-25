// Yogapit E-shop Database Types

export interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  status: 'active' | 'inactive' | 'unavailable';
  stock_bratislava: number;
  stock_ruzomberok: number;
  stock_bezo: number;
  stock?: number; // dostupný sklad z available_products pohľadu
  language: 'SK' | 'CZ' | 'EN';
  image_url?: string;
  last_check_date: string;
  category_id?: string;
  is_exclusive: boolean; // pre Yogapit členov
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_exclusive: boolean;
  is_custom: boolean;
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  zip_code: string;
  country: string;
  customer_type: 'regular' | 'yogapit_member';
  discord_id?: string;
  created_at: string;
}

export interface Order {
  id: string;
  customer_id: string;
  order_number: string; // YYYYNNN format
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  delivery_address: string;
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface User {
  id: string;
  discord_id: string;
  email: string;
  role: UserRole;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 
  | 'new'
  | 'waiting_payment'
  | 'paid_waiting_shipment'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export type DeliveryMethod = 
  | 'personal'
  | 'post'
  | 'packeta';

export type UserRole = 
  | 'customer'
  | 'yogapit_member'
  | 'warehouse_manager'
  | 'admin';

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
} 