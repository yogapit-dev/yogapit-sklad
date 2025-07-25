import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Search, Package, Calendar, Euro, Image as ImageIcon, Flag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminSecurity, InputValidator, SecurityUtils } from '../lib/security';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  condition: 'new' | 'used' | 'worn' | 'heavily_worn';
  stock_bratislava: number;
  stock_ruzomberok: number;
  stock_bezo: number;
  language: 'SK' | 'CZ' | 'EN';
  image_url?: string;
  last_check_date: string;
  category_id: string;
  is_exclusive: boolean;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
  is_exclusive: boolean;
  is_custom: boolean;
}

export default function ProductAdminPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    price: 0,
    condition: 'new' as 'new' | 'used' | 'worn' | 'heavily_worn',
    stock_bratislava: 0,
    stock_ruzomberok: 0,
    stock_bezo: 0,
    language: 'SK' as 'SK' | 'CZ' | 'EN',
    category_id: '',
    is_exclusive: false,
    last_check_date: new Date().toISOString().split('T')[0],
    image_url: ''
  });
  const [showNewForm, setShowNewForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingDateProductId, setEditingDateProductId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, []);

  // Event listener pre Escape klávesu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && editingDateProductId) {
        setEditingDateProductId(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [editingDateProductId]);

  // Filter products based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by name
      if (product.name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredProducts(filtered);
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            is_exclusive,
            is_custom
          )
        `)
        .order('name');

      if (error) {
        console.error('Error loading products:', error);
        return;
      }

      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Generovanie unikátneho názvu súboru
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      // Upload súboru do Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading image:', error);
        alert('Chyba pri nahrávaní obrázka');
        return null;
      }

      // Získanie verejnej URL
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Chyba pri nahrávaní obrázka');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || newProduct.price <= 0 || !newProduct.category_id) {
      alert('Názov, cena a kategória sú povinné');
      return;
    }

    // Bezpečnostná validácia produktu
    const validation = AdminSecurity.validateProductData(newProduct);
    if (!validation.valid) {
      alert(validation.error || 'Neplatné údaje produktu');
      return;
    }

    try {
      // Sanitizácia údajov
      const sanitizedProduct = SecurityUtils.sanitizeObject(newProduct);
      
      // Ak je vybraný súbor, nahraj ho
      let imageUrl: string | undefined = sanitizedProduct.image_url;
      if (sanitizedProduct.image_url && sanitizedProduct.image_url.startsWith('data:')) {
        // Konvertuj base64 na File objekt
        const response = await fetch(sanitizedProduct.image_url);
        const blob = await response.blob();
        const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
        
        const uploadedUrl = await uploadImage(file);
        if (!uploadedUrl) {
          return; // Upload zlyhal
        }
        imageUrl = uploadedUrl;
      }

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: InputValidator.sanitizeString(sanitizedProduct.name, 200),
          ...(sanitizedProduct.description?.trim() && { 
            description: InputValidator.sanitizeString(sanitizedProduct.description, 2000) 
          }),
          price: sanitizedProduct.price,
          condition: sanitizedProduct.condition,
          stock_bratislava: sanitizedProduct.stock_bratislava,
          stock_ruzomberok: sanitizedProduct.stock_ruzomberok,
          stock_bezo: sanitizedProduct.stock_bezo,
          language: sanitizedProduct.language,
          category_id: sanitizedProduct.category_id || null,
          is_exclusive: sanitizedProduct.is_exclusive,
          last_check_date: sanitizedProduct.last_check_date,
          ...(imageUrl && { image_url: imageUrl }),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating product:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        alert(`Chyba pri vytváraní produktu: ${error.message}`);
        return;
      }

      setProducts(prev => [...prev, data]);
      setNewProduct({
        name: '',
        description: '',
        price: 0,
        condition: 'new',
        stock_bratislava: 0,
        stock_ruzomberok: 0,
        stock_bezo: 0,
        language: 'CZ',
        category_id: '',
        is_exclusive: false,
        last_check_date: new Date().toISOString().split('T')[0],
        image_url: ''
      });
      setShowNewForm(false);
    } catch (error) {
      console.error('Error creating product:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      alert(`Chyba pri vytváraní produktu: ${error instanceof Error ? error.message : 'Neznáma chyba'}`);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct || !editingProduct.name.trim() || editingProduct.price <= 0 || !editingProduct.category_id) {
      alert('Názov, cena a kategória sú povinné');
      return;
    }

    try {
      // Ak je vybraný nový súbor, nahraj ho
      let imageUrl: string | undefined = editingProduct.image_url;
      if (editingProduct.image_url && editingProduct.image_url.startsWith('data:')) {
        // Konvertuj base64 na File objekt
        const response = await fetch(editingProduct.image_url);
        const blob = await response.blob();
        const file = new File([blob], 'product-image.jpg', { type: 'image/jpeg' });
        
        const uploadedUrl = await uploadImage(file);
        if (!uploadedUrl) {
          return; // Upload zlyhal
        }
        imageUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('products')
        .update({
          name: editingProduct.name.trim(),
          ...(editingProduct.description?.trim() && { description: editingProduct.description.trim() }),
          price: editingProduct.price,
          condition: editingProduct.condition,
          stock_bratislava: editingProduct.stock_bratislava,
          stock_ruzomberok: editingProduct.stock_ruzomberok,
          stock_bezo: editingProduct.stock_bezo,
          language: editingProduct.language,
          category_id: editingProduct.category_id || null,
          is_exclusive: editingProduct.is_exclusive,
          last_check_date: editingProduct.last_check_date,
          ...(imageUrl && { image_url: imageUrl })
        })
        .eq('id', editingProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        alert('Chyba pri aktualizácii produktu');
        return;
      }

      setProducts(prev => prev.map(p => p.id === editingProduct.id ? editingProduct : p));
      setEditingProduct(null);
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Chyba pri aktualizácii produktu');
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) {
        console.error('Error deleting product:', error);
        alert('Chyba pri mazaní produktu');
        return;
      }

      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Chyba pri mazaní produktu');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const handleDateChange = async (productId: string, newDate: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ last_check_date: newDate })
        .eq('id', productId);

      if (error) {
        console.error('Error updating date:', error);
        alert('Chyba pri aktualizácii dátumu');
        return;
      }

      // Aktualizuj lokálny stav
      setProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, last_check_date: newDate } : p
      ));
      
      setEditingDateProductId(null);
    } catch (error) {
      console.error('Error updating date:', error);
      alert('Chyba pri aktualizácii dátumu');
    }
  };

  const getLanguageFlag = (language: string) => {
    switch (language) {
      case 'SK': return '🇸🇰';
      case 'CZ': return '🇨🇿';
      case 'EN': return '🇬🇧';
      default: return '🏳️';
    }
  };



  const getConditionText = (condition: string) => {
    switch (condition) {
      case 'new': return 'Nová';
      case 'used': return 'Použitá';
      case 'worn': return 'Opotrebovaná';
      case 'heavily_worn': return 'Výrazne opotrebovaná';
      default: return condition;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'text-green-400 bg-green-900/20';
      case 'used': return 'text-blue-400 bg-blue-900/20';
      case 'worn': return 'text-yellow-400 bg-yellow-900/20';
      case 'heavily_worn': return 'text-orange-400 bg-orange-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getTotalStock = (product: Product) => {
    return product.stock_bratislava + product.stock_ruzomberok + product.stock_bezo;
  };



  const getStockDisplay = (product: Product) => {
    const total = getTotalStock(product);
    const parts = [
      product.stock_bratislava,
      product.stock_ruzomberok,
      product.stock_bezo
    ];
    
    if (total === 0) {
      return (
        <span className="text-red-400 font-medium">
          Nie je na sklade
        </span>
      );
    }
    
    return (
      <span>
        <span className="font-medium text-green-400">{total} ks</span>
        <span className="font-normal text-gray-300"> ({parts.join('+')})</span>
      </span>
    );
  };

  const calculateStats = () => {
    const totalProducts = products.length;
    const productsInStock = products.filter(p => getTotalStock(p) > 0).length;
    const totalStock = products.reduce((sum, p) => sum + getTotalStock(p), 0);
    const totalValue = products.reduce((sum, p) => sum + (p.price * getTotalStock(p)), 0);

    return { totalProducts, productsInStock, totalStock, totalValue };
  };

  const stats = calculateStats();

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Produkty</h2>
          <p className="text-gray-400">Správa produktov a skladu</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nový produkt</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Celkovo</p>
              <p className="text-xl font-bold text-white">{stats.totalProducts}</p>
            </div>
            <Package className="h-6 w-6 text-purple-400" />
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Na sklade</p>
              <p className="text-xl font-bold text-white">{stats.productsInStock}</p>
            </div>
            <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Sklad</p>
              <p className="text-xl font-bold text-white">{stats.totalStock}</p>
            </div>
            <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-400" />
            </div>
          </div>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Hodnota</p>
              <p className="text-xl font-bold text-white">{stats.totalValue.toFixed(0)} €</p>
            </div>
            <Euro className="h-6 w-6 text-green-400" />
          </div>
        </div>
      </div>

      {/* New Product Modal */}
      {showNewForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowNewForm(false)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">Nový produkt</h3>
              <button
                onClick={() => setShowNewForm(false)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Obrázok produktu */}
            <div className="col-span-full mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">Obrázok produktu</label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-gray-600 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-500">
                  {newProduct.image_url ? (
                    <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setNewProduct(prev => ({ ...prev, image_url: e.target?.result as string }));
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingImage && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                      <span>Nahrávam obrázok...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Názov produktu</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="Zadajte názov produktu"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Cena (€)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Kategória *</label>
                <select
                  value={newProduct.category_id}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                >
                  <option value="">Vyberte kategóriu</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Viditeľnosť</label>
                <select
                  value={newProduct.is_exclusive ? 'exclusive' : 'regular'}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, is_exclusive: e.target.value === 'exclusive' }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                >
                  <option value="regular">Všetci</option>
                  <option value="exclusive">Yogapit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Jazyk</label>
                <select
                  value={newProduct.language}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, language: e.target.value as 'SK' | 'CZ' | 'EN' }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="SK">🇸🇰 Slovenský</option>
                  <option value="CZ">🇨🇿 Český</option>
                  <option value="EN">🇬🇧 Anglický</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Stav knihy</label>
                <select
                  value={newProduct.condition}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, condition: e.target.value as 'new' | 'used' | 'worn' | 'heavily_worn' }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="new">🟢 Nová</option>
                  <option value="used">🔵 Použitá</option>
                  <option value="worn">🟡 Opotrebovaná</option>
                  <option value="heavily_worn">🟠 Výrazne opotrebovaná</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Celkový počet ks</label>
                <div className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-xl text-white">
                  {newProduct.stock_bratislava + newProduct.stock_ruzomberok + newProduct.stock_bezo} ks
                </div>
              </div>
              

              

              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Dátum kontroly</label>
                <input
                  type="date"
                  value={newProduct.last_check_date}
                  onChange={(e) => setNewProduct(prev => ({ ...prev, last_check_date: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>
            
            <div className="mt-8">
              <label className="block text-lg font-medium text-gray-300 mb-6">Sklad</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Bratislava</label>
                  <input
                    type="number"
                    value={newProduct.stock_bratislava}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock_bratislava: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Ružomberok</label>
                  <input
                    type="number"
                    value={newProduct.stock_ruzomberok}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock_ruzomberok: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Bezo</label>
                  <input
                    type="number"
                    value={newProduct.stock_bezo}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock_bezo: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-4 text-lg text-gray-300 font-medium">
                Celkovo: {newProduct.stock_bratislava + newProduct.stock_ruzomberok + newProduct.stock_bezo} kusov
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowNewForm(false)}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors text-lg"
              >
                Zrušiť
              </button>
              <button
                onClick={handleCreateProduct}
                disabled={uploadingImage}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Nahrávam...' : 'Vytvoriť produkt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="bg-gray-800 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">Zoznam produktov ({filteredProducts.length})</h3>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Hľadať produkty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 border-2 border-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 min-w-80 shadow-lg"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
                <div className="bg-gray-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Obrázok</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Názov</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Kategória</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Cena</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Stav knihy</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Viditeľnosť</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Sklad</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Jazyk</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Kontrola</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-300">Akcie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-600">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-600/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-white font-medium">{product.name}</div>
                        <div className="text-sm text-gray-400">
                          {product.description && product.description.length > 50 
                            ? `${product.description.substring(0, 50)}...` 
                            : product.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">
                        {(product as any).categories?.name || 'Bez kategórie'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white font-semibold">{product.price.toFixed(2)} €</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getConditionColor(product.condition)}`}>
                        {getConditionText(product.condition)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        product.is_exclusive 
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30' 
                          : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {product.is_exclusive ? 'Yogapit' : 'Všetci'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-white text-sm">{getStockDisplay(product)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getLanguageFlag(product.language)}</span>
                        <span className="text-white text-sm">{product.language}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {editingDateProductId === product.id ? (
                        <input
                          type="date"
                          value={product.last_check_date}
                          onChange={(e) => handleDateChange(product.id, e.target.value)}
                          onBlur={() => setEditingDateProductId(null)}
                          className="px-3 py-1 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20"
                          autoFocus
                        />
                      ) : (
                        <div 
                          className="text-sm text-gray-300 cursor-pointer hover:text-white transition-colors px-3 py-1 rounded-lg hover:bg-gray-600"
                          onClick={() => setEditingDateProductId(product.id)}
                          title="Kliknite pre zmenu dátumu"
                        >
                          {new Date(product.last_check_date).toLocaleDateString('sk-SK')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Upraviť"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product)}
                          className="p-2 bg-gray-600 hover:bg-red-500 rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Vymazať"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Žiadne produkty</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Nenašli sa žiadne produkty pre daný vyhľadávací výraz' : 'Zatiaľ neboli vytvorené žiadne produkty'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setEditingProduct(null)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-white">Upraviť produkt: {editingProduct.name}</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {/* Obrázok produktu */}
            <div className="col-span-full mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-3">Obrázok produktu</label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-gray-600 rounded-xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-500">
                  {editingProduct.image_url ? (
                    <img src={editingProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setEditingProduct(prev => prev ? { ...prev, image_url: e.target?.result as string } : null);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {uploadingImage && (
                    <div className="mt-2 flex items-center space-x-2 text-sm text-gray-400">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                      <span>Nahrávam obrázok...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Názov produktu</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Cena (€)</label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, price: parseFloat(e.target.value) || 0 } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Kategória *</label>
                <select
                  value={editingProduct.category_id}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category_id: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                >
                  <option value="">Vyberte kategóriu</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Viditeľnosť</label>
                <select
                  value={editingProduct.is_exclusive ? 'exclusive' : 'regular'}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, is_exclusive: e.target.value === 'exclusive' } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  required
                >
                  <option value="regular">Všetci</option>
                  <option value="exclusive">Yogapit</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Jazyk</label>
                <select
                  value={editingProduct.language}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, language: e.target.value as 'SK' | 'CZ' | 'EN' } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="SK">🇸🇰 Slovenský</option>
                  <option value="CZ">🇨🇿 Český</option>
                  <option value="EN">🇬🇧 Anglický</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Stav knihy</label>
                <select
                  value={editingProduct.condition}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, condition: e.target.value as 'new' | 'used' | 'worn' | 'heavily_worn' } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                >
                  <option value="new">🟢 Nová</option>
                  <option value="used">🔵 Použitá</option>
                  <option value="worn">🟡 Opotrebovaná</option>
                  <option value="heavily_worn">🟠 Výrazne opotrebovaná</option>
                </select>
              </div>
              

              

              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">Dátum kontroly</label>
                <input
                  type="date"
                  value={editingProduct.last_check_date}
                  onChange={(e) => setEditingProduct(prev => prev ? { ...prev, last_check_date: e.target.value } : null)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
            </div>
            
            <div className="mt-8">
              <label className="block text-lg font-medium text-gray-300 mb-6">Sklad</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Bratislava</label>
                  <input
                    type="number"
                    value={editingProduct.stock_bratislava}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, stock_bratislava: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-3">Ružomberok</label>
                  <input
                    type="number"
                    value={editingProduct.stock_ruzomberok}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, stock_ruzomberok: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-3">Bezo</label>
                  <input
                    type="number"
                    value={editingProduct.stock_bezo}
                    onChange={(e) => setEditingProduct(prev => prev ? { ...prev, stock_bezo: parseInt(e.target.value) || 0 } : null)}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-4 text-lg text-gray-300 font-medium">
                Celkovo: {getTotalStock(editingProduct)} kusov
              </div>
            </div>
            
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setEditingProduct(null)}
                className="px-6 py-3 text-gray-300 hover:text-white transition-colors text-lg"
              >
                Zrušiť
              </button>
              <button
                onClick={handleUpdateProduct}
                disabled={uploadingImage}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl transition-colors text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Nahrávam...' : 'Uložiť zmeny'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={cancelDelete}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-8 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="h-8 w-8 text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-4">Vymazať produkt</h3>
              
              <p className="text-gray-300 mb-6">
                Naozaj chcete vymazať produkt <span className="font-semibold text-white">"{productToDelete.name}"</span>?
              </p>
              
              <p className="text-sm text-gray-400 mb-8">
                Táto akcia sa nedá vrátiť späť.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={cancelDelete}
                  className="px-6 py-3 text-gray-300 hover:text-white transition-colors text-lg"
                >
                  Zrušiť
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl transition-colors text-lg font-medium"
                >
                  Vymazať
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 