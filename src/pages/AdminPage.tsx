import React, { useState, useEffect } from 'react';
import { Package, Users, BarChart3, Settings, Eye, Edit, CheckCircle, XCircle, Clock, Truck, Trash2, Search, X, ChevronDown, AlertTriangle } from 'lucide-react';
import { OrderService } from '../lib/order-service';
import { Order, OrderStatus, DeliveryMethod } from '../lib/types';
import { supabase } from '../lib/supabase';
import CategoryAdminPage from './CategoryAdminPage';
import CustomerAdminPage from './CustomerAdminPage';
import AnalyticsPage from './AnalyticsPage';
import ProductAdminPage from './ProductAdminPage';
import ReservedProductsOverview from '../components/ReservedProductsOverview';
import WarehouseSelectionModal from '../components/WarehouseSelectionModal';

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [loadingOrderItems, setLoadingOrderItems] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'customers' | 'categories' | 'analytics' | 'reserved'>(() => {
    const savedTab = localStorage.getItem('adminActiveTab') as 'orders' | 'products' | 'customers' | 'categories' | 'analytics' | 'reserved';
    return savedTab || 'orders';
  });

  // Warehouse selection modal state
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [orderToShip, setOrderToShip] = useState<Order | null>(null);
  const [orderItemsToShip, setOrderItemsToShip] = useState<any[]>([]);
  const [warehouseTargetStatus, setWarehouseTargetStatus] = useState<OrderStatus>('shipped');

  useEffect(() => {
    loadOrders();
  }, []);

  // Uložiť aktívnu tabuľku do localStorage
  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await OrderService.getAllOrders();
      setOrders(ordersData);
      setFilteredOrders(ordersData);
    } catch (error) {
      console.error('Error loading orders:', error);
      alert('Chyba pri načítaní objednávok: ' + error);
      // Fallback to empty array if error
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      setLoadingOrderItems(true);
      const orderWithItems = await OrderService.getOrderWithItems(orderId);
      console.log('Order with items:', orderWithItems);
      setSelectedOrderItems(orderWithItems.items || []);
    } catch (error) {
      console.error('Error loading order items:', error);
      setSelectedOrderItems([]);
    } finally {
      setLoadingOrderItems(false);
    }
  };

  const loadCustomerData = async (customerId: string) => {
    try {
      const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (error) throw error;
      setSelectedCustomer(customer);
    } catch (error) {
      console.error('Error loading customer data:', error);
      setSelectedCustomer(null);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // Ak sa mení na "shipped", zobraziť modal pre výber skladu
      if (newStatus === 'shipped' || newStatus === 'delivered') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          const orderWithItems = await OrderService.getOrderWithItems(orderId);
          console.log('Order with items for shipping:', orderWithItems);
          console.log('Items to ship:', orderWithItems.items);
          console.log('Order ID used:', orderId);
          console.log('Full orderWithItems object:', JSON.stringify(orderWithItems, null, 2));
          setOrderToShip(order);
          setOrderItemsToShip(orderWithItems.items);
          setShowWarehouseModal(true);
          // Uložiť cieľový status
          setWarehouseTargetStatus(newStatus);
          return;
        }
      }

      await OrderService.updateOrderStatus(orderId, newStatus);
      
      // Aktualizovať orders list
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
      
      // Aktualizovať selectedOrder ak je otvorený
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Chyba pri aktualizácii stavu objednávky');
    }
  };

  const handleWarehouseSelection = async (warehouseSelections: { [productId: string]: 'bratislava' | 'ruzomberok' | 'bezo' }) => {
    if (!orderToShip) return;

    try {
      await OrderService.updateOrderStatusWithWarehouse(orderToShip.id, warehouseTargetStatus, warehouseSelections);
      
      // Aktualizovať orders list
      setOrders(prev => prev.map(order => 
        order.id === orderToShip.id ? { ...order, status: warehouseTargetStatus } : order
      ));
      
      // Aktualizovať selectedOrder ak je otvorený
      if (selectedOrder && selectedOrder.id === orderToShip.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: warehouseTargetStatus } : null);
      }

      setShowWarehouseModal(false);
      setOrderToShip(null);
      setOrderItemsToShip([]);
    } catch (error) {
      console.error('Error updating order status with warehouse:', error);
      alert('Chyba pri aktualizácii stavu objednávky');
    }
  };

  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [showEditAlert, setShowEditAlert] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    status: 'new' as OrderStatus,
    delivery_method: 'personal' as DeliveryMethod,
    delivery_address: '',
    notes: '',
    total_amount: 0
  });

  const deleteOrder = async (orderId: string) => {
    setOrderToDelete(orderId);
    setShowDeleteAlert(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;

    try {
      await OrderService.deleteOrder(orderToDelete);
      setOrders(prev => prev.filter(order => order.id !== orderToDelete));
      if (selectedOrder?.id === orderToDelete) {
        setSelectedOrder(null);
      }
      setShowDeleteAlert(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Chyba pri mazaní objednávky');
    }
  };

  const cancelDelete = () => {
    setShowDeleteAlert(false);
    setOrderToDelete(null);
  };

  const editOrder = (order: Order) => {
    setOrderToEdit(order);
    setEditForm({
      status: order.status,
      delivery_method: order.delivery_method,
      delivery_address: order.delivery_address,
      notes: order.notes || '',
      total_amount: order.total_amount
    });
    setShowEditAlert(true);
  };

  const closeEditAlert = () => {
    setShowEditAlert(false);
    setOrderToEdit(null);
    setEditForm({
      status: 'new' as OrderStatus,
      delivery_method: 'personal' as DeliveryMethod,
      delivery_address: '',
      notes: '',
      total_amount: 0
    });
  };

  const closeDeleteAlert = () => {
    setShowDeleteAlert(false);
    setOrderToDelete(null);
  };

  // Filter orders based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => {
      const searchLower = searchTerm.toLowerCase();
      
      // Search by order number
      if (order.order_number.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by customer name (if available)
      if ((order as any).customers?.name?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by customer email (if available)
      if ((order as any).customers?.email?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      // Search by customer phone (if available)
      if ((order as any).customers?.phone?.toLowerCase().includes(searchLower)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

  // ESC key handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showEditAlert) closeEditAlert();
        if (showDeleteAlert) closeDeleteAlert();
        if (selectedOrder) setSelectedOrder(null);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [showEditAlert, showDeleteAlert, selectedOrder]);

  const saveOrderChanges = async () => {
    if (!orderToEdit) return;

    try {
      await OrderService.updateOrder(orderToEdit.id, editForm);
      
      // Aktualizovať lokálny stav
      setOrders(prev => prev.map(order => 
        order.id === orderToEdit.id 
          ? { ...order, ...editForm }
          : order
      ));

      // Aktualizovať selectedOrder ak je otvorený
      if (selectedOrder?.id === orderToEdit.id) {
        setSelectedOrder({ ...selectedOrder, ...editForm });
      }

      closeEditAlert();
    } catch (error) {
      console.error('Error updating order:', error);
      alert('Chyba pri ukladaní zmien');
    }
  };

  const getStatusColor = (status: OrderStatus) => {
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

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'new': return <Clock className="h-4 w-4" />;
      case 'waiting_payment': return <Clock className="h-4 w-4" />;
      case 'paid_waiting_shipment': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 'Nová';
      case 'waiting_payment': return 'Čaká na platbu';
      case 'paid_waiting_shipment': return 'Zaplatená';
      case 'shipped': return 'Odoslaná';
      case 'delivered': return 'Doručená';
      case 'cancelled': return 'Zrušená';
      default: return 'Neznámy stav';
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

  const formatAddressForDisplay = (address: string) => {
    if (address.includes('Ľudové námestie 503/34, 831 03 Bratislava, Slovakia')) {
      return 'Yogapit - Bratislava, Ľudové námestie 503/34';
    }
    return address;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Načítavam admin rozhranie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Admin Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-4">
            <h1 className="text-lg md:text-xl font-bold text-white">Admin rozhranie</h1>
            <span className="hidden md:inline text-gray-400 text-sm">•</span>
            <p className="hidden md:block text-gray-400 text-sm">Správa objednávok, produktov a zákazníkov</p>
          </div>
          <a 
            href="/" 
            className="text-gray-300 hover:text-purple-400 transition-colors text-sm font-medium px-3 py-1 rounded-lg hover:bg-gray-700"
          >
            ← Späť na web
          </a>
        </div>
      </div>

      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-8 overflow-auto">

        {/* Navigation Tabs */}
        <div className="mb-8">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'orders'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Objednávky
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'products'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Produkty
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'categories'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Package className="h-4 w-4 mr-2" />
              Kategórie
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'customers'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <Users className="h-4 w-4 mr-2" />
              Zákazníci
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Analýzy
            </button>
            <button
              onClick={() => setActiveTab('reserved')}
              className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reserved'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              V riešení
            </button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'orders'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Objednávky
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'products'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Produkty
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'categories'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Package className="h-4 w-4 mr-2" />
                Kategórie
              </button>
              <button
                onClick={() => setActiveTab('customers')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'customers'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Users className="h-4 w-4 mr-2" />
                Zákazníci
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'analytics'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analýzy
              </button>
              <button
                onClick={() => setActiveTab('reserved')}
                className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'reserved'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                V riešení
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Nové</p>
                    <p className="text-xl font-bold text-white">
                      {orders.filter(o => o.status === 'new').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Čaká na platbu</p>
                    <p className="text-xl font-bold text-white">
                      {orders.filter(o => o.status === 'waiting_payment').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-yellow-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="h-4 w-4 text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Zaplatené</p>
                    <p className="text-xl font-bold text-white">
                      {orders.filter(o => o.status === 'paid_waiting_shipment').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                    <Package className="h-4 w-4 text-purple-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Odoslané</p>
                    <p className="text-xl font-bold text-white">
                      {orders.filter(o => o.status === 'shipped').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                    <Truck className="h-4 w-4 text-orange-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Doručené</p>
                    <p className="text-xl font-bold text-white">
                      {orders.filter(o => o.status === 'delivered').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs font-medium">Zrušené</p>
                    <p className="text-xl font-bold text-white">
                      {orders.filter(o => o.status === 'cancelled').length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
                    <XCircle className="h-4 w-4 text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-white">Objednávky</h2>
                  <p className="text-gray-400 text-sm mt-1">
                    Celkovo: {filteredOrders.length} {filteredOrders.length === 1 ? 'objednávka' : filteredOrders.length < 5 ? 'objednávky' : 'objednávok'} • 
                    <span className="text-purple-400 font-medium ml-1">
                      {filteredOrders.reduce((sum, order) => sum + order.total_amount, 0).toFixed(2)} € celkovo
                    </span>
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Vyhľadávacie pole s ikonou */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Hľadať objednávky..."
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
                  
                  {/* Filter dropdown */}
                  <div className="relative">
                    <select className="bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-200 shadow-lg appearance-none pr-10">
                      <option value="all">Všetky stavy</option>
                      <option value="new">Nové</option>
                      <option value="waiting_payment">Čakajú na platbu</option>
                      <option value="paid_waiting_shipment">Zaplatené</option>
                      <option value="shipped">Odoslané</option>
                      <option value="delivered">Doručené</option>
                      <option value="cancelled">Zrušené</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {filteredOrders.map((order) => (
                  <div key={order.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-white font-medium text-sm">#{order.order_number.slice(-3)}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-1">
                            <h3 className="text-white font-semibold">
                              {(order as any).customers?.name || 'Neznámy zákazník'}
                            </h3>
                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{getStatusText(order.status)}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>#{order.order_number}</span>
                            <span>{new Date(order.created_at).toLocaleDateString('sk-SK')}</span>
                            <span>{getDeliveryMethodText(order.delivery_method)}</span>
                            <span className="text-white font-medium">
                              {order.total_amount.toFixed(2)} €
                            </span>
                          </div>
                        </div>
                      </div>
                      
                                            <div className="flex items-center space-x-2">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                          className="bg-gray-700 border border-gray-600 rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500"
                        >
                          <option value="new">Nová</option>
                          <option value="waiting_payment">Čaká na platbu</option>
                          <option value="paid_waiting_shipment">Zaplatená</option>
                          <option value="shipped">Odoslaná</option>
                          <option value="delivered">Doručená</option>
                          <option value="cancelled">Zrušená</option>
                        </select>
                        
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            loadOrderItems(order.id);
                            loadCustomerData(order.customer_id);
                          }}
                          className="text-gray-400 hover:text-white p-1.5 rounded-md hover:bg-gray-700 transition-colors"
                          title="Zobraziť detaily"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => editOrder(order)}
                          className="text-blue-400 hover:text-blue-300 p-1.5 rounded-md hover:bg-gray-700 transition-colors"
                          title="Upraviť objednávku"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteOrder(order.id)}
                          className="text-red-400 hover:text-red-300 p-1.5 rounded-md hover:bg-gray-700 transition-colors"
                          title="Vymazať objednávku"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredOrders.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">Žiadne objednávky</h3>
                    <p className="text-gray-400">Zatiaľ nebola vytvorená žiadna objednávka</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <ProductAdminPage />
        )}

        {activeTab === 'categories' && (
          <CategoryAdminPage />
        )}

        {activeTab === 'customers' && (
          <CustomerAdminPage />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage />
        )}
        
        {activeTab === 'reserved' && (
          <ReservedProductsOverview />
        )}
      </div>

      {/* Warehouse Selection Modal */}
      {showWarehouseModal && orderToShip && (
        <WarehouseSelectionModal
          isOpen={showWarehouseModal}
          onClose={() => {
            setShowWarehouseModal(false);
            setOrderToShip(null);
            setOrderItemsToShip([]);
          }}
          onConfirm={handleWarehouseSelection}
          orderItems={orderItemsToShip}
          orderNumber={orderToShip.order_number}
        />
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">#{selectedOrder.order_number.slice(-3)}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">
                    Objednávka {selectedOrder.order_number}
                  </h3>
                  <p className="text-gray-400">
                    Vytvorená {new Date(selectedOrder.created_at).toLocaleString('sk-SK')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Status Card */}
                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Stav objednávky</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {getStatusIcon(selectedOrder.status)}
                        <span className="ml-2">{getStatusText(selectedOrder.status)}</span>
                      </span>
                    </div>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as OrderStatus)}
                      className="bg-gray-600 border border-gray-500 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="new">Nová</option>
                      <option value="waiting_payment">Čaká na platbu</option>
                      <option value="paid_waiting_shipment">Zaplatená</option>
                      <option value="shipped">Odoslaná</option>
                      <option value="delivered">Doručená</option>
                      <option value="cancelled">Zrušená</option>
                    </select>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Údaje zákazníka</h4>
                  {selectedCustomer ? (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400">👤 Meno:</span>
                        <span className="text-white font-medium">{selectedCustomer.name}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400">📧 Email:</span>
                        <span className="text-white">{selectedCustomer.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400">📞 Telefón:</span>
                        <span className="text-white">{selectedCustomer.phone}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400">🎯 Typ zákazníka:</span>
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          selectedCustomer.customer_type === 'yogapit_member' 
                            ? 'bg-purple-900/20 text-purple-400' 
                            : 'bg-gray-900/20 text-gray-400'
                        }`}>
                          {selectedCustomer.customer_type === 'yogapit_member' ? 'Yogapit člen' : 'Bežný zákazník'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-600 rounded-lg p-4">
                      <p className="text-gray-300 text-center">Načítavam údaje o zákazníkovi...</p>
                    </div>
                  )}
                </div>

                {/* Delivery Info */}
                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Informácie o doručení</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-400">🚚 Spôsob:</span>
                      <span className="text-white font-medium">
                        {getDeliveryMethodText(selectedOrder.delivery_method)}
                      </span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <span className="text-gray-400">📍 Adresa:</span>
                      <span className="text-white">{formatAddressForDisplay(selectedOrder.delivery_address)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Položky objednávky</h4>
                  {loadingOrderItems ? (
                    <div className="bg-gray-600 rounded-lg p-4">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
                        <p className="text-gray-300">Načítavam položky...</p>
                      </div>
                    </div>
                  ) : selectedOrderItems.length > 0 ? (
                    <div className="space-y-3">
                      {selectedOrderItems.map((item, index) => (
                        <div key={index} className="bg-gray-600 rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
                              {item.products?.image_url ? (
                                <img 
                                  src={item.products.image_url} 
                                  alt={item.products.name}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h5 className="text-white font-medium">{item.products?.name || 'Neznámy produkt'}</h5>
                              <p className="text-gray-400 text-sm">Množstvo: {item.quantity} {item.quantity === 1 ? 'kus' : item.quantity < 5 ? 'kusy' : 'kusov'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{item.price.toFixed(2)} €</p>
                            <p className="text-gray-400 text-sm">Celkom: {(item.price * item.quantity).toFixed(2)} €</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-600 rounded-lg p-4">
                      <p className="text-gray-300 text-center">Žiadne položky neboli nájdené</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Summary Card */}
                <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Súhrn objednávky</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Celková suma:</span>
                      <span className="text-white font-bold text-xl">
                        {selectedOrder.total_amount.toFixed(2)} €
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Doručenie:</span>
                      <span className="text-white">
                        {selectedOrder.delivery_method === 'personal' ? 'Bezplatné' : 'Platné'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedOrder.notes && (
                  <div className="bg-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Poznámka zákazníka</h4>
                    <div className="bg-gray-600 rounded-lg p-4">
                      <p className="text-gray-300 italic">"{selectedOrder.notes}"</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                  <div className="bg-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Akcie</h4>
                    <div className="space-y-3">
                      <button 
                        onClick={() => editOrder(selectedOrder)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Edit className="h-4 w-4" />
                        <span>Upraviť objednávku</span>
                      </button>
                      <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                        Oznámiť zákazníkovi
                      </button>
                      <button 
                        onClick={() => deleteOrder(selectedOrder.id)}
                        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Vymazať objednávku</span>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Info for completed/cancelled orders */}
                {(selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') && (
                  <div className="bg-gray-700 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Informácia</h4>
                    <div className="bg-gray-600 rounded-lg p-4">
                      <p className="text-gray-300 text-center">
                        {selectedOrder.status === 'delivered' 
                          ? 'Objednávka je dokončená a nie je možné ju upravovať'
                          : 'Objednávka je zrušená a nie je možné ju upravovať'
                        }
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditAlert && orderToEdit && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeEditAlert}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 max-w-6xl w-full h-[75vh] border border-gray-700 flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Edit className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Upraviť objednávku</h3>
                  <p className="text-gray-400 text-sm">Objednávka {orderToEdit.order_number}</p>
                </div>
              </div>
              <button
                onClick={closeEditAlert}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
              {/* Left Column */}
              <div className="space-y-4 overflow-y-auto">
                {/* Status & Delivery Method */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Stav objednávky</p>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as OrderStatus }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="new">Nová</option>
                      <option value="waiting_payment">Čaká na platbu</option>
                      <option value="paid_waiting_shipment">Zaplatená</option>
                      <option value="shipped">Odoslaná</option>
                      <option value="delivered">Doručená</option>
                      <option value="cancelled">Zrušená</option>
                    </select>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-300 mb-2">Spôsob doručenia</p>
                    <select
                      value={editForm.delivery_method}
                      onChange={(e) => setEditForm(prev => ({ ...prev, delivery_method: e.target.value as DeliveryMethod }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="personal">Osobne</option>
                      <option value="post">Slovenská pošta</option>
                      <option value="packeta">Packeta</option>
                    </select>
                  </div>
                </div>

                {/* Total Amount */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Celková suma</p>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={editForm.total_amount}
                      onChange={(e) => setEditForm(prev => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">€</span>
                  </div>
                </div>

                {/* Delivery Address */}
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-2">Dodacia adresa</p>
                  <textarea
                    value={editForm.delivery_address}
                    onChange={(e) => setEditForm(prev => ({ ...prev, delivery_address: e.target.value }))}
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Zadajte dodaciu adresu..."
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4 overflow-y-auto">
                {/* Notes */}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-300 mb-2">Poznámky</p>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500 resize-none"
                    placeholder="Zadajte poznámky..."
                    style={{ height: 'calc(100% - 2rem)' }}
                  />
                </div>

                {/* Preview Card */}
                <div className="bg-gray-700 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-300 mb-2">Náhľad zmien</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stav:</span>
                      <span className="text-white">{getStatusText(editForm.status)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Doručenie:</span>
                      <span className="text-white">{getDeliveryMethodText(editForm.delivery_method)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Suma:</span>
                      <span className="text-white font-medium">{editForm.total_amount.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mt-6 pt-4 border-t border-gray-700">
              <button
                onClick={closeEditAlert}
                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Zrušiť
              </button>
              <button
                onClick={saveOrderChanges}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Uložiť zmeny
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Alert */}
      {showDeleteAlert && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={closeDeleteAlert}
        >
          <div 
            className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Vymazať objednávku</h3>
                <p className="text-gray-400 text-sm">Táto akcia sa nedá vrátiť späť</p>
              </div>
            </div>
            
            <p className="text-gray-300 mb-6">
              Naozaj chcete vymazať túto objednávku? Všetky údaje o objednávke budú trvalo odstránené.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={cancelDelete}
                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Zrušiť
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Vymazať
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 