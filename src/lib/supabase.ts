import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database helpers
export const db = {
  // Products
  products: {
    getAll: () => supabase.from('products').select('*, categories(name)'),
    getAvailableProducts: () => supabase.from('available_products').select('*, categories(name)'),
    getExclusive: () => supabase.from('products').select('*, categories(name)').eq('is_exclusive', true),
    getById: (id: string) => supabase.from('products').select('*, categories(name)').eq('id', id).single(),
    getByCategory: (categoryId: string) => 
      supabase.from('products').select('*, categories(name)').eq('category_id', categoryId),
  },

  // Categories
  categories: {
    getAll: () => supabase.from('categories').select('*'),
    getById: (id: string) => supabase.from('categories').select('*').eq('id', id).single(),
  },

  // Orders
  orders: {
    create: (order: any) => supabase.from('orders').insert(order).select().single(),
    getById: (id: string) => supabase.from('orders').select('*').eq('id', id).single(),
    getByCustomer: (customerId: string) => 
      supabase.from('orders').select('*').eq('customer_id', customerId),
    updateStatus: (id: string, status: string) => 
      supabase.from('orders').update({ status }).eq('id', id),
  },

  // Customers
  customers: {
    create: (customer: any) => supabase.from('customers').insert(customer).select().single(),
    getByEmail: (email: string) => 
      supabase.from('customers').select('*').eq('email', email).single(),
  },

  // Users (Discord auth)
  users: {
    getByDiscordId: (discordId: string) => 
      supabase.from('users').select('*').eq('discord_id', discordId).single(),
    create: (user: any) => supabase.from('users').insert(user).select().single(),
    update: (id: string, updates: any) => 
      supabase.from('users').update(updates).eq('id', id),
  },
}; 