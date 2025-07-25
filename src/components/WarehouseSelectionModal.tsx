import React, { useState } from 'react';
import { X, Package, Check } from 'lucide-react';

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url?: string;
  };
}

interface WarehouseSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selections: { [productId: string]: 'bratislava' | 'ruzomberok' | 'bezo' }) => void;
  orderItems: OrderItem[];
  orderNumber: string;
}

export default function WarehouseSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  orderItems,
  orderNumber
}: WarehouseSelectionModalProps) {
  const [selections, setSelections] = useState<{ [productId: string]: 'bratislava' | 'ruzomberok' | 'bezo' }>({});

  if (!isOpen) return null;

  const handleSelection = (productId: string, warehouse: 'bratislava' | 'ruzomberok' | 'bezo') => {
    setSelections(prev => ({
      ...prev,
      [productId]: warehouse
    }));
  };

  const handleConfirm = () => {
    // Skontrolovať, či sú všetky položky vybrané
    const allSelected = orderItems.every(item => selections[item.product_id]);
    if (!allSelected) {
      alert('Prosím, vyberte sklad pre všetky položky objednávky.');
      return;
    }
    
    onConfirm(selections);
    onClose();
  };

  const getWarehouseName = (warehouse: string) => {
    switch (warehouse) {
      case 'bratislava': return 'Bratislava';
      case 'ruzomberok': return 'Ružomberok';
      case 'bezo': return 'Bezo';
      default: return warehouse;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <Package className="h-6 w-6 text-purple-400" />
              <div>
                <h2 className="text-xl font-bold text-white">Výber skladu pre expedíciu</h2>
                <p className="text-gray-400 text-sm">Objednávka #{orderNumber}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            
            <div className="space-y-4">
              {orderItems.map((item) => (
                <div key={item.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center space-x-4 mb-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.products.image_url ? (
                        <img
                          src={item.products.image_url}
                          alt={item.products.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs text-center">Obrázok</div>
                      )}
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-medium">{item.products.name}</h3>
                                              <p className="text-gray-400 text-sm">Množstvo: {item.quantity} {item.quantity === 1 ? 'kus' : item.quantity < 5 ? 'kusy' : 'kusov'}</p>
                      <p className="text-gray-400 text-sm">Cena: {item.price.toFixed(2)} €</p>
                    </div>
                  </div>

                  {/* Warehouse Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Vyberte sklad, z ktorého sa produkt odosiela:
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['bratislava', 'ruzomberok', 'bezo'] as const).map((warehouse) => (
                        <button
                          key={warehouse}
                          onClick={() => handleSelection(item.product_id, warehouse)}
                          className={`p-3 rounded-xl border-2 transition-all ${
                            selections[item.product_id] === warehouse
                              ? 'border-purple-500 bg-purple-500/10 text-purple-400'
                              : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {selections[item.product_id] === warehouse && (
                              <Check className="h-4 w-4" />
                            )}
                            <span className="font-medium">{getWarehouseName(warehouse)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700 bg-gray-800">
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-full bg-gray-700 text-gray-300 hover:bg-gray-600 transition-colors"
            >
              Zrušiť
            </button>
            <button
              onClick={handleConfirm}
              className="px-6 py-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-colors font-medium"
            >
              Potvrdiť expedíciu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 