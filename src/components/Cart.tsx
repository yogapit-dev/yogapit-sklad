import React from 'react';
import { X, Plus, Minus, ShoppingCart } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  
  // Počítať total priamo v komponente
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Cart Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-900 border-l border-gray-700 shadow-xl transform transition-transform">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-6 w-6 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">Košík</h2>
              <span className="bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {items.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Košík je prázdny
                </h3>
                <p className="text-gray-400">
                  Pridajte si produkty do košíka
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex space-x-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">📚</span>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-sm text-gray-300 mt-1">
                        {item.product.price.toFixed(2)} €
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors text-white"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium w-8 text-center text-white">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => {
                            const totalStock = item.product.stock_bratislava + item.product.stock_ruzomberok + item.product.stock_bezo;
                            // Pre teraz používame celkový sklad, neskôr sa to nahradí API volaním
                            const availableStock = totalStock;
                            if (item.quantity >= availableStock) {
                              alert(`Produkt "${item.product.name}" nie je dostupný v väčšom množstve. Dostupné: ${availableStock} kusov`);
                              return;
                            }
                            updateQuantity(item.product.id, item.quantity + 1);
                          }}
                          className="w-6 h-6 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors text-white"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.product.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-700 p-4 bg-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold text-white">Celková suma:</span>
                <span className="text-2xl font-bold text-purple-400">
                  {total.toFixed(2)} €
                </span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    // TODO: Navigate to checkout
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-4 rounded-full hover:from-purple-700 hover:to-purple-800 transition-colors font-medium"
                >
                  Pokračovať v objednávke
                </button>
                
                <button
                  onClick={clearCart}
                  className="w-full bg-gray-700 text-gray-300 py-2 px-4 rounded-full hover:bg-gray-600 transition-colors text-sm"
                >
                  Vyprázdniť košík
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 