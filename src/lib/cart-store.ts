import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from './types';

export interface CartItem {
  product: Product & { stock: number };
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  searchTerm: string;
  showCartPanel: boolean;
  addItem: (product: any, quantity: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setSearchTerm: (term: string) => void;
  getItemQuantity: (productId: string) => number;
  getTotal: () => number;
  setShowCartPanel: (show: boolean) => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      searchTerm: '',
      showCartPanel: false,
      addItem: (product, quantity) => {
        console.log('Adding item to cart:', product, quantity);
        set((state) => {
          const existingItem = state.items.find(item => item.product.id === product.id);
          
          if (existingItem) {
            const newState = {
              items: state.items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
              )
            };
            console.log('Updated cart state:', newState);
            return newState;
          } else {
            const newState = {
                items: [...state.items, {
                  product: {
                    ...product,
                    stock: product.stock || (product.stock_bratislava + product.stock_ruzomberok + product.stock_bezo)
                  },
                  quantity
                }]
            };
            console.log('New cart state:', newState);
            return newState;
          }
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        }));
      },
      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        }));
      },
      clearCart: () => {
        set({ items: [] });
      },
      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },
      setShowCartPanel: (show) => {
        set({ showCartPanel: show });
      },
      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },
      getTotal: () => {
        return get().items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
      version: 1,
      onRehydrateStorage: () => (state) => {
        console.log('Cart rehydrated:', state);
      }
    }
  )
); 