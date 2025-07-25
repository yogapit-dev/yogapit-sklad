import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, User, Mail, Phone, MapPin, Star, Eye, Package, Calendar, Euro, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Customer } from '../lib/types';
import { AdminSecurity, InputValidator, SecurityUtils } from '../lib/security';

export default function CustomerAdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    customer_type: 'regular' as 'regular' | 'yogapit_member'
  });
  const [showNewForm, setShowNewForm] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  // Filter customers based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers);
      return;
    }

    const filtered = customers.filter(customer => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by name
      if (customer.name.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by email
      if (customer.email.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by phone
      if (customer.phone && customer.phone.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredCustomers(filtered);
  }, [searchTerm, customers]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error loading customers:', error);
        return;
      }

      setCustomers(data || []);
      setFilteredCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.email.trim()) {
      alert('Meno a email sú povinné');
      return;
    }

    // Bezpečnostná validácia zákazníka
    const validation = AdminSecurity.validateCustomerData(newCustomer);
    if (!validation.valid) {
      alert(validation.error || 'Neplatné údaje zákazníka');
      return;
    }

    try {
      // Sanitizácia údajov
      const sanitizedCustomer = SecurityUtils.sanitizeObject(newCustomer);
      
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: InputValidator.sanitizeString(sanitizedCustomer.name, 100),
          email: sanitizedCustomer.email.trim(),
          phone: sanitizedCustomer.phone?.trim() || null,
          customer_type: sanitizedCustomer.customer_type
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating customer:', error);
        alert('Chyba pri vytváraní zákazníka');
        return;
      }

      setCustomers(prev => [...prev, data]);
      setNewCustomer({
        name: '', email: '', phone: '', customer_type: 'regular'
      });
      setShowNewForm(false);
    } catch (error) {
      console.error('Error creating customer:', error);
      alert('Chyba pri vytváraní zákazníka');
    }
  };

  const handleUpdateCustomer = async () => {
    if (!editingCustomer || !editingCustomer.name.trim() || !editingCustomer.email.trim()) {
      alert('Meno a email sú povinné');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .update({
          name: editingCustomer.name.trim(),
          email: editingCustomer.email.trim(),
          phone: editingCustomer.phone.trim() || null,
          customer_type: editingCustomer.customer_type
        })
        .eq('id', editingCustomer.id)
        .select();

      if (error) {
        console.error('Error updating customer:', error);
        alert('Chyba pri aktualizácii zákazníka');
        return;
      }

      setCustomers(prev => prev.map(cust => 
        cust.id === editingCustomer.id ? editingCustomer : cust
      ));
      setEditingCustomer(null);
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Chyba pri aktualizácii zákazníka');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Naozaj chcete vymazať tohto zákazníka? Táto akcia sa nedá vrátiť späť.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);

      if (error) {
        console.error('Error deleting customer:', error);
        alert('Chyba pri mazaní zákazníka');
        return;
      }

      setCustomers(prev => prev.filter(cust => cust.id !== customerId));
    } catch (error) {
      console.error('Error deleting customer:', error);
      alert('Chyba pri mazaní zákazníka');
    }
  };

  const formatAddress = (customer: Customer) => {
    const parts = [customer.address, customer.city, customer.zip_code, customer.country];
    return parts.filter(part => part && part.trim()).join(', ');
  };

  const loadCustomerOrders = async (customerId: string) => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading customer orders:', error);
        return;
      }

      setCustomerOrders(data || []);
    } catch (error) {
      console.error('Error loading customer orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Nová';
      case 'waiting_payment': return 'Čaká na platbu';
      case 'paid_waiting_shipment': return 'Zaplatená';
      case 'shipped': return 'Odoslaná';
      case 'delivered': return 'Doručená';
      case 'cancelled': return 'Zrušená';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-blue-400 bg-blue-900/20';
      case 'waiting_payment': return 'text-yellow-400 bg-yellow-900/20';
      case 'paid_waiting_shipment': return 'text-purple-400 bg-purple-900/20';
      case 'shipped': return 'text-orange-400 bg-orange-900/20';
      case 'delivered': return 'text-green-400 bg-green-900/20';
      case 'cancelled': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getDeliveryMethodText = (method: string) => {
    switch (method) {
      case 'post': return 'Slovenská pošta';
      case 'packeta': return 'Packeta';
      case 'personal': return 'Osobne';
      default: return method;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Vytvoriť mini toast notifikáciu
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      toast.textContent = 'Email skopírovaný!';
      document.body.appendChild(toast);
      
      // Zobraziť toast
      setTimeout(() => {
        toast.classList.remove('translate-x-full');
      }, 100);
      
      // Skryť toast po 3 sekundách
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    } catch (err) {
      console.error('Chyba pri kopírovaní:', err);
      // Vytvoriť error toast
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
      toast.textContent = 'Chyba pri kopírovaní';
      document.body.appendChild(toast);
      
      setTimeout(() => {
        toast.classList.remove('translate-x-full');
      }, 100);
      
      setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    }
  };

  const handlePhoneClick = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self');
    }
  };

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedCustomer) {
        setSelectedCustomer(null);
      }
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [selectedCustomer]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Načítavam zákazníkov...</p>
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
            <h2 className="text-2xl font-bold text-white">Zákazníci</h2>
            <p className="text-gray-400">Správa zákazníkov</p>
          </div>
        </div>



        {/* New Customer Form */}
        {showNewForm && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Nový zákazník</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meno *
                </label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="Meno a priezvisko"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Telefón
                </label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                  placeholder="+421..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Typ zákazníka
                </label>
                <select
                  value={newCustomer.customer_type}
                  onChange={(e) => setNewCustomer(prev => ({ ...prev, customer_type: e.target.value as 'regular' | 'yogapit_member' }))}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="regular">Bežný zákazník</option>
                  <option value="yogapit_member">Yogapit člen</option>
                </select>
              </div>

            </div>
            <div className="mt-6 flex space-x-3">
              <button
                onClick={handleCreateCustomer}
                className="bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition-colors flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Vytvoriť
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setNewCustomer({
                    name: '', email: '', phone: '', customer_type: 'regular'
                  });
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition-colors flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Zrušiť
              </button>
            </div>
          </div>
        )}

        {/* Customers List */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">Zákazníci ({filteredCustomers.length})</h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Hľadať zákazníkov..."
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
              <button
                onClick={() => setShowNewForm(true)}
                className="bg-purple-600 text-white px-6 py-3 rounded-xl hover:bg-purple-700 transition-colors flex items-center shadow-lg"
              >
                <Plus className="h-4 w-4 mr-2" />
                Pridať nového zákazníka
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredCustomers.map((customer) => (
              <div key={customer.id} className="bg-gray-700 rounded-xl p-6 hover:bg-gray-600/50 transition-all duration-200 border border-gray-600 hover:border-gray-500 group">
                {/* Header with Avatar and Actions */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingCustomer?.id === customer.id ? (
                        <input
                          type="text"
                          value={editingCustomer.name}
                          onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, name: e.target.value } : null)}
                          className="w-full px-3 py-1 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500 text-lg font-semibold"
                        />
                      ) : (
                        <h3 className="text-white font-semibold text-lg truncate">{customer.name}</h3>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingCustomer?.id === customer.id ? (
                      <>
                        <button
                          onClick={handleUpdateCustomer}
                          className="p-2 bg-green-600 hover:bg-green-500 rounded-lg text-white transition-colors"
                          title="Uložiť"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingCustomer(null)}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Zrušiť"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setEditingCustomer(customer)}
                          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Upraviť"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (customer) {
                              setSelectedCustomer(customer);
                              loadCustomerOrders(customer.id);
                            }
                          }}
                          className="p-2 bg-gray-600 hover:bg-purple-500 rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Zobraziť detaily"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="p-2 bg-gray-600 hover:bg-red-500 rounded-lg text-gray-300 hover:text-white transition-colors"
                          title="Vymazať"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Email:</span>
                    {editingCustomer?.id === customer.id ? (
                      <input
                        type="email"
                        value={editingCustomer.email}
                        onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, email: e.target.value } : null)}
                        className="px-3 py-1 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
                        placeholder="Email"
                      />
                    ) : (
                      <div className="flex items-center text-sm text-gray-300">
                        <Mail className="h-3 w-3 mr-1" />
                        <button
                          onClick={() => copyToClipboard(customer.email)}
                          className="truncate hover:text-purple-400 transition-colors cursor-pointer"
                          title="Kliknite pre skopírovanie emailu"
                        >
                          {customer.email}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Telefón:</span>
                    {editingCustomer?.id === customer.id ? (
                      <input
                        type="tel"
                        value={editingCustomer.phone || ''}
                        onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        className="px-3 py-1 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
                        placeholder="Telefón"
                      />
                    ) : (
                      <div className="flex items-center text-sm text-gray-300">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone ? (
                          <button
                            onClick={() => handlePhoneClick(customer.phone)}
                            className="hover:text-purple-400 transition-colors cursor-pointer"
                            title="Kliknite pre volanie"
                          >
                            {customer.phone}
                          </button>
                        ) : (
                          <span>Neuvedené</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Type */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-600">
                  <span className="text-gray-400 text-sm">Typ:</span>
                  {editingCustomer?.id === customer.id ? (
                    <select
                      value={editingCustomer.customer_type}
                      onChange={(e) => setEditingCustomer(prev => prev ? { ...prev, customer_type: e.target.value as 'regular' | 'yogapit_member' } : null)}
                      className="px-3 py-1 bg-gray-600 border border-gray-500 rounded-lg text-white focus:outline-none focus:border-purple-500 text-sm"
                    >
                      <option value="regular">Bežný zákazník</option>
                      <option value="yogapit_member">Yogapit člen</option>
                    </select>
                  ) : (
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      customer.customer_type === 'yogapit_member'
                        ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                        : 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                    }`}>
                      {customer.customer_type === 'yogapit_member' ? (
                        <>
                          <Star className="h-3 w-3 mr-1" />
                          Yogapit člen
                        </>
                      ) : (
                        'Bežný zákazník'
                      )}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Žiadni zákazníci</h3>
              <p className="text-gray-400">Zatiaľ neboli vytvorení žiadni zákazníci</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCustomer(null)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    {selectedCustomer?.name}
                  </h3>
                  <p className="text-gray-400">
                    {selectedCustomer?.customer_type === 'yogapit_member' ? 'Yogapit člen' : 'Bežný zákazník'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer Info */}
              <div className="space-y-6">
                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Kontaktné údaje</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">Email:</span>
                      <button
                        onClick={() => copyToClipboard(selectedCustomer?.email || '')}
                        className="text-white hover:text-purple-400 transition-colors cursor-pointer"
                        title="Kliknite pre skopírovanie emailu"
                      >
                        {selectedCustomer?.email}
                      </button>
                    </div>
                    {selectedCustomer?.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-400">Telefón:</span>
                        <button
                          onClick={() => handlePhoneClick(selectedCustomer.phone)}
                          className="text-white hover:text-purple-400 transition-colors cursor-pointer"
                          title="Kliknite pre volanie"
                        >
                          {selectedCustomer.phone}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Adresa</h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="text-white">
                        {selectedCustomer ? (formatAddress(selectedCustomer as Customer) || 'Adresa neuvedená') : 'Adresa neuvedená'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Štatistiky</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {customerOrders.length}
                      </div>
                      <div className="text-sm text-gray-400">Objednávky</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {customerOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)} €
                      </div>
                      <div className="text-sm text-gray-400">Celková suma</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders */}
              <div className="space-y-6">
                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Objednávky</h4>
                  {loadingOrders ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400 mx-auto"></div>
                      <p className="mt-2 text-gray-300">Načítavam objednávky...</p>
                    </div>
                  ) : customerOrders.length > 0 ? (
                    <div className="space-y-3">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="bg-gray-600 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-white font-medium">
                                #{order.order_number}
                              </span>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(order.created_at).toLocaleDateString('sk-SK')}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Euro className="h-3 w-3" />
                              <span>{order.total_amount.toFixed(2)} €</span>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-400">
                            {getDeliveryMethodText(order.delivery_method)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Žiadne objednávky</h3>
                      <p className="text-gray-400">Zákazník zatiaľ nemá žiadne objednávky</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 