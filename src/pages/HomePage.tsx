import React, { useState, useEffect, useRef } from 'react';
import { Filter, BookOpen, Star, Check, ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useCartStore } from '../lib/cart-store';
import { db } from '../lib/supabase';
import { Product, Category } from '../lib/types';
import { Link } from "react-router-dom";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  
  const { addItem, getItemQuantity, updateQuantity, removeItem, searchTerm, items, getTotal, clearCart, showCartPanel, setShowCartPanel } = useCartStore();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Debug: skontrolovať cart pri zmene items
    console.log('Cart items changed:', items);
    console.log('Cart total changed:', getTotal());
  }, [items, getTotal]);

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        db.products.getAvailableProducts(),
        db.categories.getAll()
      ]);

      if (productsData.data) setProducts(productsData.data);
      if (categoriesData.data) setCategories(categoriesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // TODO: Implement user authentication to check if user is Yogapit member
  const isYogapitMember = false; // This will be replaced with actual auth check

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const isVisible = !product.is_exclusive || isYogapitMember;
    const matchesSearch = !searchTerm || product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && isVisible && matchesSearch;
  });

  // Zoradiť produkty - najprv tie na sklade, potom ostatné
  const sortedProducts = filteredProducts.sort((a, b) => {
    const aStock = a.stock || 0;
    const bStock = b.stock || 0;
    
    if (aStock > 0 && bStock === 0) return -1; // a má sklad, b nemá
    if (aStock === 0 && bStock > 0) return 1;  // a nemá sklad, b má
    return 0; // oba majú alebo nemajú sklad
  });

  // Používame stock z available_products pohľadu (už je vypočítané ako dostupné)
  const productsWithStock = sortedProducts.map(product => {
    return {
      ...product,
      stock: product.stock || 0
    };
  });

  const visibleCategories = categories.filter(category => {
    return !category.is_exclusive || isYogapitMember;
  });

  const handleAddToCart = (product: Product & { stock: number }) => {
    // Skontrolovať dostupnosť skladu (reálny sklad - rezervované)
    const currentQuantity = getItemQuantity(product.id);
    const availableStock = product.stock; // Toto je už vypočítané ako dostupné
    
    if (currentQuantity >= availableStock) {
              alert(`Produkt "${product.name}" už máte v košíku v maximálnom dostupnom množstve (${availableStock} kusov)`);
      return;
    }
    
    addItem(product, 1);
    setShowCartPanel(true);
    setShowSuccess(product.id);
    
    // Reset success state after 2 seconds
    setTimeout(() => {
      setShowSuccess(null);
    }, 2000);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(productId);
    } else {
      // Skontrolovať dostupnosť skladu (reálny sklad - rezervované)
      const productWithStock = productsWithStock.find(p => p.id === productId);
      if (productWithStock) {
        const availableStock = productWithStock.stock; // Toto je už vypočítané ako dostupné
        if (newQuantity > availableStock) {
          alert(`Produkt "${productWithStock.name}" nie je dostupný v požadovanom množstve. Dostupné: ${availableStock} kusov`);
          return;
        }
      }
      updateQuantity(productId, newQuantity);
    }
  };

  const closeCartPanel = () => {
    setShowCartPanel(false);
  };

  // Close cart panel with Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeCartPanel();
      }
    };

    if (showCartPanel) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCartPanel]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Načítavam produkty...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Toast Notification */}
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center space-x-2 transform transition-all duration-500 ease-out animate-in slide-in-from-right">
          <Check className="h-5 w-5" />
          <span>Produkt pridaný do košíka!</span>
        </div>
      )}

      {/* Slide-in Cart Panel */}
      {showCartPanel && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={closeCartPanel}
          />
          
          {/* Cart Panel */}
          <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-gray-900 border-l border-gray-700 z-50 transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
                <div className="flex items-center space-x-3">
                  <ShoppingCart className="h-6 w-6 text-purple-400" />
                  <div>
                    <h2 className="text-lg font-semibold text-white">Košík</h2>
                    <p className="text-xs text-gray-400">
                      {items.length} {items.length === 1 ? 'položka' : items.length < 5 ? 'položky' : 'položiek'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeCartPanel}
                  className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart Items */}
              <div className="flex-1 overflow-y-auto p-4">
                {items.length > 0 ? (
                  <div className="space-y-3">
                                          {items.map((item) => (
                      <div key={item.product.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            {item.product.image_url ? (
                              <img
                                src={item.product.image_url}
                                alt={item.product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <BookOpen className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm truncate">
                              {item.product.name}
                            </h3>
                            <p className="text-gray-300 text-xs">
                              {item.product.price.toFixed(2)} €
                            </p>
                            {/* Stock warning removed */}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                              className="w-7 h-7 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-white font-medium min-w-[25px] text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                              className="w-7 h-7 bg-gray-700 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                              disabled={item.product.stock <= item.quantity}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-semibold text-sm">
                              {(item.product.price * item.quantity).toFixed(2)} €
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-base font-medium text-white mb-1">Košík je prázdny</h3>
                    <p className="text-gray-400 text-sm">Pridajte si produkty do košíka</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {items.length > 0 && (
                <div className="border-t border-gray-700 p-4 bg-gray-800">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-300 text-sm">Celkovo:</span>
                    <span className="text-white font-semibold text-lg">
                      {getTotal().toFixed(2)} €
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Link
                      to="/objednavka"
                      className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-full text-center hover:bg-purple-700 transition-colors block font-medium text-sm"
                    >
                      Pokračovať do košíka
                    </Link>
                    <button
                      onClick={() => clearCart()}
                      className="w-full bg-red-600 text-white py-2 px-4 rounded-full text-center hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      Vyprázdniť košík
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-gray-900 to-gray-900 py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-transparent opacity-50"></div>
        <div className="relative w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600 rounded-full mb-6">
                <img
                  src="https://reinkarnacia.sk/engine/wp-content/themes/reinkarnacia/assets/images/logo.png"
                  alt="Yogapit Logo"
                  className="h-12 w-auto filter brightness-0 invert"
                />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Yogapit
              <span className="block text-purple-400">E-shop</span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Objavte autentické jógové produkty, mantry a spirituálne pomôcky pre váš vnútorný pokoj a rozvoj
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#produkty"
                className="bg-purple-600 text-white px-8 py-4 rounded-full hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 font-semibold text-lg shadow-lg hover:shadow-xl"
              >
                Prezrieť produkty
              </a>
              <button
                onClick={() => setShowCartPanel(true)}
                className="bg-gray-800 text-white px-8 py-4 rounded-full hover:bg-gray-700 transition-all duration-300 transform hover:scale-105 font-semibold text-lg border border-gray-600"
              >
                Zobraziť košík
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main id="produkty" className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Categories Filter */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Kategórie produktov</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Filtrujte produkty podľa kategórií a nájdite presne to, čo hľadáte pre vašu jógovú prax
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                selectedCategory === 'all'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 hover:border-purple-500'
              }`}
            >
              Všetky produkty
            </button>
            
            {visibleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-600 hover:border-purple-500'
                }`}
              >
                {category.name}
                {category.is_exclusive && (
                  <span className="ml-2 text-yellow-400">⭐</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Naše produkty</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Kvalitné jógové produkty pre vašu prax a spirituálny rozvoj
            </p>
          </div>
          
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {productsWithStock.map((product) => {
              // Zistiť či je produkt kniha
              const isBook = (product as any).categories?.name === 'Kniha' || 
                            (product as any).categories?.name === 'Knihy';
              

              
              return (
                <div key={product.id} className="bg-gray-800 rounded-2xl shadow-xl border border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 relative flex flex-col h-full group">
                  <div className="bg-gradient-to-br from-gray-700 to-gray-800 relative overflow-hidden">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className={`w-full group-hover:scale-110 transition-transform duration-300 ${
                          isBook 
                            ? 'aspect-[5/7] object-cover' // Knihy - menší pomer 5:7
                            : 'h-32 object-cover'   // Ostatné produkty - menšie
                        }`}
                      />
                    ) : (
                      <div className={`w-full bg-gradient-to-br from-purple-900 to-gray-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${
                        isBook ? 'aspect-[5/7]' : 'h-32'
                      }`}>
                        <div className="text-center">
                          <BookOpen className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                          <p className="text-purple-300 text-xs">Obrázok produktu</p>
                        </div>
                      </div>
                    )}
                  
                  {/* Jazyk badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className={`text-white text-sm px-4 py-2 rounded-xl flex items-center shadow-2xl font-bold border-2 backdrop-blur-sm ${
                      product.language === 'SK' 
                        ? 'bg-gradient-to-r from-red-600 to-red-700 border-red-300 bg-opacity-90' 
                        : product.language === 'CZ' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 border-blue-300 bg-opacity-90' 
                        : 'bg-gradient-to-r from-green-600 to-green-700 border-green-300 bg-opacity-90'
                    }`}>
                      {product.language === 'SK' ? '🇸🇰 SK' : product.language === 'CZ' ? '🇨🇿 CZ' : '🇬🇧 EN'}
                    </div>
                  </div>
                  
                  {product.is_exclusive && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1.5 rounded-full flex items-center shadow-lg">
                        <Star className="h-3 w-3 mr-1" />
                        Exkluzívne
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300"></div>
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-sm font-bold text-white mb-2 line-clamp-2 min-h-[2rem] group-hover:text-purple-300 transition-colors">
                    {product.name}
                  </h3>
                  
                  <p className="text-gray-300 text-xs mb-3 line-clamp-2 flex-1 leading-relaxed">
                    {product.description}
                  </p>
                  
                  <div className="mt-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-purple-400">
                        {product.price.toFixed(2)} €
                      </div>
                      
                      {product.stock > 0 && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="px-3 py-1.5 rounded-full transition-all duration-300 flex items-center space-x-1 text-xs font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:scale-105 shadow-lg hover:shadow-xl"
                          >
                            <ShoppingCart className="h-3 w-3" />
                            <span>Pridať</span>
                          </button>
                        </div>
                      )}
                    </div>
                  
                    <div className="flex items-center justify-between">
                      {product.stock === 0 ? (
                        <div className="flex items-center text-red-400">
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-1 animate-pulse"></span>
                          <span className="text-xs font-medium">Nie je na sklade</span>
                        </div>
                      ) : product.stock <= 5 ? (
                        <div className="flex items-center text-orange-400">
                          <span className="w-1.5 h-1.5 bg-orange-400 rounded-full mr-1 animate-pulse"></span>
                          <span className="text-xs font-medium">
                            {product.stock === 1 ? 'Posledný 1 kus' : product.stock < 5 ? `Posledné ${product.stock} kusy` : `Posledných ${product.stock} kusov`}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center text-green-400">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1"></span>
                          <span className="text-xs font-medium">Viac ako 5 kusov</span>
                        </div>
                      )}
                      
                      {/* Stock warning for items in cart - ODSTRÁNENÉ */}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          </div>

          {productsWithStock.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-800 rounded-full mb-6">
                <BookOpen className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                Nenašli sa žiadne produkty
              </h3>
              <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
                Skúste zmeniť filter kategórií alebo sa vráťte neskôr
              </p>
              <button
                onClick={() => setSelectedCategory('all')}
                className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 font-medium"
              >
                Zobraziť všetky produkty
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 