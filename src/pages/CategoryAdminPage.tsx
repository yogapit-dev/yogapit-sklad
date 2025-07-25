import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Star, Settings, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Category } from '../lib/types';

export default function CategoryAdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    is_exclusive: false,
    is_custom: false
  });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  // Filter categories based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by name
      if (category.name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredCategories(filtered);
  }, [searchTerm, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading categories:', error);
        return;
      }

      setCategories(data || []);
      setFilteredCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      alert('Názov kategórie je povinný');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategory.name.trim(),
          is_exclusive: newCategory.is_exclusive,
          is_custom: true // Vlastné kategórie sú vždy označené ako custom
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        alert('Chyba pri vytváraní kategórie');
        return;
      }

      setCategories(prev => [...prev, data]);
      setNewCategory({ name: '', is_exclusive: false, is_custom: false });
      setShowNewForm(false);
    } catch (error) {
      console.error('Error creating category:', error);
      alert('Chyba pri vytváraní kategórie');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !editingCategory.name.trim()) {
      alert('Názov kategórie je povinný');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name.trim(),
          is_exclusive: editingCategory.is_exclusive,
          is_custom: editingCategory.is_custom
        })
        .eq('id', editingCategory.id)
        .select();

      if (error) {
        console.error('Error updating category:', error);
        alert('Chyba pri aktualizácii kategórie: ' + error.message);
        return;
      }

      // Aktualizovať lokálny stav s novými údajmi
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? {
          ...cat,
          name: editingCategory.name.trim(),
          is_exclusive: editingCategory.is_exclusive,
          is_custom: editingCategory.is_custom
        } : cat
      ));
      setEditingCategory(null);
    } catch (error) {
      console.error('Error updating category:', error);
      alert('Chyba pri aktualizácii kategórie');
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Naozaj chcete vymazať túto kategóriu? Táto akcia sa nedá vrátiť späť.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting category:', error);
        alert('Chyba pri mazaní kategórie');
        return;
      }

      setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Chyba pri mazaní kategórie');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Načítavam kategórie...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">Kategórie</h2>
            <p className="text-gray-400">Správa kategórií produktov</p>
          </div>
          <button
            onClick={() => setShowNewForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Pridať novú kategóriu
          </button>
        </div>
        {/* New Category Form */}
        {showNewForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Pridať novú kategóriu</h2>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Názov kategórie *
              </label>
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                placeholder="Názov kategórie"
              />
            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={async () => {
                  setNewCategory(prev => ({ ...prev, is_exclusive: false }));
                  await handleCreateCategory();
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Pridať pre všetkých
              </button>
              <button
                onClick={async () => {
                  setNewCategory(prev => ({ ...prev, is_exclusive: true }));
                  await handleCreateCategory();
                }}
                className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Pridať pre Yogapit
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewCategory({ name: '', is_exclusive: false, is_custom: false });
                }}
                className="bg-gray-600 text-white px-6 py-3 rounded-full hover:bg-gray-700 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Zrušiť
              </button>
            </div>
          </div>
        )}
        {/* Categories List */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Kategórie ({filteredCategories.length})</h2>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Hľadať kategórie..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border-2 border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 min-w-80 shadow-lg"
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
          
          <div className="bg-gray-900 rounded-xl p-4 shadow-lg">
            <div className="space-y-3">
              {filteredCategories.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg shadow hover:bg-gray-700 transition-colors">
                  <div className="flex items-center">
                    {editingCategory?.id === category.id ? (
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                        className="w-full px-3 py-1 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                      />
                    ) : (
                      <span className="text-white font-medium">{category.name}</span>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {editingCategory?.id === category.id ? (
                      <>
                        <button
                          onClick={handleUpdateCategory}
                          className="text-green-400 hover:text-green-300 p-1"
                          title="Uložiť"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCategory(null)}
                          className="text-gray-400 hover:text-gray-300 p-1"
                          title="Zrušiť"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Upraviť"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        {category.is_custom && (
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Vymazať"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Žiadne kategórie</h3>
              <p className="text-gray-400">
                {searchTerm ? 'Nenašli sa žiadne kategórie pre daný vyhľadávací výraz' : 'Zatiaľ neboli vytvorené žiadne kategórie'}
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
} 