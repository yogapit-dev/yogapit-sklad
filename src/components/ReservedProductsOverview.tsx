import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ReservedProduct {
  product_id: string;
  reserved_quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    stock_bratislava: number;
    stock_ruzomberok: number;
    stock_bezo: number;
    image_url?: string;
  };
}

export default function ReservedProductsOverview() {
  const [reservedProducts, setReservedProducts] = useState<ReservedProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReservedProducts();
  }, []);

  const loadReservedProducts = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('reserved_products')
        .select(`
          product_id,
          reserved_quantity,
          products (
            id,
            name,
            price,
            stock_bratislava,
            stock_ruzomberok,
            stock_bezo,
            image_url
          )
        `)
        .order('reserved_quantity', { ascending: false });

      if (error) {
        console.error('Error loading reserved products:', error);
        return;
      }

      // Transform data to match interface (products is returned as array from Supabase)
      const transformedData = (data || []).map(item => ({
        ...item,
        products: Array.isArray(item.products) ? item.products[0] : item.products
      }));
      setReservedProducts(transformedData as ReservedProduct[]);
    } catch (error) {
      console.error('Error loading reserved products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStock = (product: ReservedProduct['products']) => {
    return product.stock_bratislava + product.stock_ruzomberok + product.stock_bezo;
  };

  const getAvailableStock = (product: ReservedProduct['products'], reservedQuantity: number) => {
    return getTotalStock(product) - reservedQuantity;
  };

  const getStockStatus = (availableStock: number, reservedQuantity: number) => {
    if (availableStock <= 0) {
      return {
        status: 'critical',
        icon: <AlertTriangle className="h-4 w-4 text-red-400" />,
        text: 'Kritický stav',
        color: 'text-red-400'
      };
    } else if (availableStock <= reservedQuantity * 0.5) {
      return {
        status: 'warning',
        icon: <Clock className="h-4 w-4 text-yellow-400" />,
        text: 'Nízky stav',
        color: 'text-yellow-400'
      };
    } else {
      return {
        status: 'good',
        icon: <CheckCircle className="h-4 w-4 text-green-400" />,
        text: 'Dostupné',
        color: 'text-green-400'
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <Package className="h-6 w-6 text-purple-400" />
          <h2 className="text-xl font-bold text-white">Produkty v riešení</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-400">Načítavam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Package className="h-6 w-6 text-purple-400" />
        <h2 className="text-xl font-bold text-white">Produkty v riešení</h2>
        <span className="bg-purple-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {reservedProducts.length}
        </span>
      </div>

      {reservedProducts.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Žiadne rezervované produkty</h3>
          <p className="text-gray-400">Všetky objednávky sú vybavené</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reservedProducts.map((item) => {
            const totalStock = getTotalStock(item.products);
            const availableStock = getAvailableStock(item.products, item.reserved_quantity);
            const stockStatus = getStockStatus(availableStock, item.reserved_quantity);

            return (
              <div key={item.product_id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center space-x-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
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
                    <h3 className="text-white font-medium truncate">{item.products.name}</h3>
                    <p className="text-gray-400 text-sm">{item.products.price.toFixed(2)} €</p>
                  </div>
                  
                  {/* Stock Info */}
                  <div className="text-right">
                    <div className="flex items-center space-x-2 mb-1">
                      {stockStatus.icon}
                      <span className={`text-sm font-medium ${stockStatus.color}`}>
                        {stockStatus.text}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 space-y-1">
                                      <div>Rezervované: <span className="text-orange-400 font-medium">{item.reserved_quantity} {item.reserved_quantity === 1 ? 'kus' : item.reserved_quantity < 5 ? 'kusy' : 'kusov'}</span></div>
                <div>Dostupné: <span className="text-green-400 font-medium">{availableStock} {availableStock === 1 ? 'kus' : availableStock < 5 ? 'kusy' : 'kusov'}</span></div>
                <div>Celkovo: <span className="text-gray-300 font-medium">{totalStock} {totalStock === 1 ? 'kus' : totalStock < 5 ? 'kusy' : 'kusov'}</span></div>
                    </div>
                  </div>
                </div>

                {/* Stock Breakdown */}
                <div className="mt-4 pt-4 border-t border-gray-600">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className="text-gray-400">Bratislava</div>
                      <div className="text-white font-medium">{item.products.stock_bratislava} {item.products.stock_bratislava === 1 ? 'kus' : item.products.stock_bratislava < 5 ? 'kusy' : 'kusov'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Ružomberok</div>
                      <div className="text-white font-medium">{item.products.stock_ruzomberok} {item.products.stock_ruzomberok === 1 ? 'kus' : item.products.stock_ruzomberok < 5 ? 'kusy' : 'kusov'}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Bezo</div>
                      <div className="text-white font-medium">{item.products.stock_bezo} {item.products.stock_bezo === 1 ? 'kus' : item.products.stock_bezo < 5 ? 'kusy' : 'kusov'}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
} 