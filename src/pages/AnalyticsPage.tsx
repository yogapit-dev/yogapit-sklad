import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, Package, Users, Calendar, PieChart, Download, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  ordersByStatus: { status: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  customerTypes: { type: string; count: number }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [filteredAnalytics, setFilteredAnalytics] = useState<AnalyticsData | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [allOrderItems, setAllOrderItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAnalytics();
  }, []); // Načítaj dáta len raz pri mountovaní

  // Filtruj dáta podľa časového rozsahu
  useEffect(() => {
    if (allOrders.length > 0 || allCustomers.length > 0 || allOrderItems.length > 0) {
      const analytics = calculateAnalytics(allOrders, allCustomers, allOrderItems);
      setFilteredAnalytics(analytics);
    }
  }, [timeRange, allOrders, allCustomers, allOrderItems]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Načítanie základných štatistík
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*');

      if (ordersError) throw ordersError;

      // Načítanie zákazníkov
      const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Načítanie položiek objednávok s produktmi
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          order_id,
          quantity,
          price,
          products (
            name
          )
        `);

      if (itemsError) throw itemsError;

      // Uložiť všetky dáta pre filtrovanie
      
      setAllOrders(orders || []);
      setAllCustomers(customers || []);
      setAllOrderItems(orderItems || []);
      
      // Okamžite vypočítať analytiky
      if (orders && customers && orderItems) {
        const analytics = calculateAnalytics(orders, customers, orderItems);
        setFilteredAnalytics(analytics);
      }

    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Chyba pri načítaní analytík: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (orders: any[], customers: any[], orderItems: any[]) => {
    // Filtrovanie objednávok podľa časového rozsahu
    const now = new Date();
    const filteredOrders = orders.filter(order => {
      const orderDate = new Date(order.created_at);
      const diffTime = Math.abs(now.getTime() - orderDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      switch (timeRange) {
        case '7d': return diffDays <= 7;
        case '30d': return diffDays <= 30;
        case '90d': return diffDays <= 90;
        case '1y': return diffDays <= 365;
        default: return true;
      }
    });

    // Získanie ID filtrovaných objednávok
    const filteredOrderIds = filteredOrders.map(order => order.id);

    // Filtrovanie order items podľa filtrovaných objednávok
    const filteredOrderItems = orderItems.filter(item => 
      filteredOrderIds.includes(item.order_id)
    );

    // Výpočet štatistík - LEN PREDAJ PRODUKTOV (bez poštovného)
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCustomers = customers.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Štatistiky podľa stavu objednávok
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
      status: getStatusText(status),
      count: count as number
    }));

    // Príjmy podľa mesiacov (posledných 12 mesiacov)
    const revenueByMonth = calculateRevenueByMonth(filteredOrders, filteredOrderItems);

    // Najpopulárnejšie produkty
    const productStats = filteredOrderItems.reduce((acc, item) => {
      const productName = (item.products as any)?.name || 'Neznámy produkt';
      if (!acc[productName]) {
        acc[productName] = { quantity: 0, revenue: 0 };
      }
      acc[productName].quantity += item.quantity;
      acc[productName].revenue += item.price * item.quantity;
      return acc;
    }, {} as Record<string, { quantity: number; revenue: number }>);

    const topProducts = Object.entries(productStats)
      .map(([name, stats]) => ({
        name,
        quantity: (stats as any).quantity,
        revenue: (stats as any).revenue
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Typy zákazníkov
    const customerTypeCounts = customers.reduce((acc, customer) => {
      const type = customer.customer_type === 'yogapit_member' ? 'Yogapit člen' : 'Bežný zákazník';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const customerTypes = Object.entries(customerTypeCounts).map(([type, count]) => ({
      type,
      count: count as number
    }));

    return {
      totalOrders,
      totalRevenue,
      totalCustomers,
      averageOrderValue,
      ordersByStatus,
      revenueByMonth,
      topProducts,
      customerTypes
    };
  };

  const calculateRevenueByMonth = (orders: any[], orderItems: any[]) => {
    const months: Record<string, number> = {};
    const now = new Date();
    
    // Inicializácia posledných 12 mesiacov
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('sk-SK', { month: 'short', year: 'numeric' });
      months[monthKey] = 0;
    }

    // Vytvoriť mapu objednávok podľa dátumu
    const ordersByDate = orders.reduce((acc, order) => {
      const orderDate = new Date(order.created_at);
      const monthKey = orderDate.toLocaleDateString('sk-SK', { month: 'short', year: 'numeric' });
      if (!acc[monthKey]) acc[monthKey] = [];
      acc[monthKey].push(order.id);
      return acc;
    }, {} as Record<string, string[]>);

    // Pridanie príjmov z produktov do mesiacov (bez poštovného)
    orderItems.forEach(item => {
      const order = orders.find(o => o.id === item.order_id);
      if (order) {
        const orderDate = new Date(order.created_at);
        const monthKey = orderDate.toLocaleDateString('sk-SK', { month: 'short', year: 'numeric' });
        if (months[monthKey] !== undefined) {
          months[monthKey] += item.price * item.quantity;
        }
      }
    });

    return Object.entries(months).map(([month, revenue]) => ({
      month,
      revenue
    }));
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
      case 'Nová': return 'text-blue-400 bg-blue-900/20';
      case 'Čaká na platbu': return 'text-yellow-400 bg-yellow-900/20';
      case 'Zaplatená': return 'text-purple-400 bg-purple-900/20';
      case 'Odoslaná': return 'text-orange-400 bg-orange-900/20';
      case 'Doručená': return 'text-green-400 bg-green-900/20';
      case 'Zrušená': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Načítavam analýzy...</p>
        </div>
      </div>
    );
  }

  if (!filteredAnalytics) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Chyba pri načítaní</h3>
          <p className="text-gray-400">Nepodarilo sa načítať analytické údaje</p>
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
            <h2 className="text-2xl font-bold text-white">Analýzy</h2>
            <p className="text-gray-400">Prehľad predajov, zákazníkov a produktov</p>
          </div>
        </div>

        {/* Search and Time Range */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex space-x-2 bg-gray-800 p-1 rounded-lg w-fit">
            {(['7d', '30d', '90d', '1y'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {range === '7d' && '7 dní'}
                {range === '30d' && '30 dní'}
                {range === '90d' && '90 dní'}
                {range === '1y' && '1 rok'}
              </button>
            ))}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Hľadať v reportoch..."
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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Celkové objednávky</p>
                <p className="text-2xl font-bold text-white">{filteredAnalytics.totalOrders}</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Celkové príjmy</p>
                <p className="text-2xl font-bold text-white">{filteredAnalytics.totalRevenue.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Zákazníci</p>
                <p className="text-2xl font-bold text-white">{filteredAnalytics.totalCustomers}</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm font-medium">Priemerná objednávka</p>
                <p className="text-2xl font-bold text-white">{filteredAnalytics.averageOrderValue.toFixed(2)} €</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Orders by Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Objednávky podľa stavu</h3>
              <PieChart className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {filteredAnalytics.ordersByStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                    <span className="text-gray-300">{item.status}</span>
                  </div>
                  <span className="text-white font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Types */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Typy zákazníkov</h3>
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {filteredAnalytics.customerTypes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      item.type === 'Yogapit člen' ? 'bg-purple-400' : 'bg-gray-400'
                    }`}></div>
                    <span className="text-gray-300">{item.type}</span>
                  </div>
                  <span className="text-white font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Revenue by Month */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Príjmy podľa mesiacov</h3>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {filteredAnalytics.revenueByMonth.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-gray-300">{item.month}</span>
                  <span className="text-white font-medium">{item.revenue.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Najpopulárnejšie produkty</h3>
              <Package className="h-5 w-5 text-gray-400" />
            </div>
            <div className="space-y-3">
              {filteredAnalytics.topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-300 truncate">{product.name}</p>
                                            <p className="text-sm text-gray-500">{product.quantity} {product.quantity === 1 ? 'kus' : product.quantity < 5 ? 'kusy' : 'kusov'}</p>
                  </div>
                  <span className="text-white font-medium">{product.revenue.toFixed(2)} €</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Export Button */}
        <div className="mt-8">
          <button
            onClick={() => {
              // TODO: Implement export functionality
              alert('Export funkcia bude implementovaná neskôr');
            }}
            className="bg-purple-600 text-white px-6 py-3 rounded-full hover:bg-purple-700 transition-colors flex items-center"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportovať report
          </button>
        </div>
      </div>
    </>
  );
} 