import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getAnalytics, getTopSellingProducts, getLowStockAnalytics, 
  getNotifications, getReturns, getTransfers
} from '../api/misc';
import { getProducts } from '../api/products';
import { getOrders } from '../api/orders';
import { getPurchaseOrders } from '../api/purchaseOrders';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  DollarSign, ShoppingCart, AlertTriangle, RotateCcw, 
  Clock, Package, ClipboardCheck, ArrowLeftRight, 
  ArrowUpRight, ShoppingBag, ShieldAlert, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardManager = ({ activeStore, user }) => {
  // Query operations
  const { data: analytics } = useQuery({
    queryKey: ['analytics', activeStore?.id],
    queryFn: () => getAnalytics(activeStore?.id)
  });

  const { data: topSelling } = useQuery({
    queryKey: ['top-selling', activeStore?.id],
    queryFn: () => getTopSellingProducts(5, activeStore?.id)
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock-analytics', activeStore?.id],
    queryFn: () => getLowStockAnalytics(activeStore?.id)
  });

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications
  });

  const { data: purchaseOrders } = useQuery({
    queryKey: ['purchase-orders', { storeId: activeStore?.id }],
    queryFn: () => getPurchaseOrders(activeStore?.id ? { storeId: activeStore?.id } : {})
  });

  const { data: returns } = useQuery({
    queryKey: ['returns', activeStore?.id],
    queryFn: () => getReturns(activeStore?.id)
  });

  const { data: products } = useQuery({
    queryKey: ['products', activeStore?.id],
    queryFn: getProducts
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: getTransfers
  });

  // Extract PO list array (handling pagination envelope)
  const poList = useMemo(() => {
    return purchaseOrders?.content || (Array.isArray(purchaseOrders) ? purchaseOrders : []);
  }, [purchaseOrders]);

  // Calculate stats
  const stats = useMemo(() => {
    // Filter orders for activeStore
    const storeOrders = orders?.filter(o => !activeStore || o.store?.id === activeStore.id) || [];
    
    // Filter orders matching today's date
    const today = new Date();
    const todayOrders = storeOrders.filter(o => {
      if (!o.orderDate) return false;
      const d = new Date(o.orderDate);
      return d.getDate() === today.getDate() &&
             d.getMonth() === today.getMonth() &&
             d.getFullYear() === today.getFullYear();
    });

    const todayRev = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const lowStockCount = lowStock?.length || 0;
    const pendingReturnsCount = returns?.filter(r => r.status === 'REQUESTED')?.length || 0;
    const pendingPOsCount = poList.filter(po => po.status === 'PENDING' || po.status === 'ORDERED')?.length || 0;
    
    // Inventory value calculation
    const invValue = products?.reduce((sum, p) => sum + (p.price * (p.stockLevel || 0)), 0) || 0;

    return {
      todayRevenue: todayRev,
      todayOrders: todayOrders.length,
      lowStock: lowStockCount,
      pendingReturns: pendingReturnsCount,
      pendingPOs: pendingPOsCount,
      inventoryValue: invValue
    };
  }, [orders, lowStock, returns, purchaseOrders, products, activeStore]);

  // Aggregate Sales Trend line chart
  const salesTrendData = useMemo(() => {
    const storeOrders = orders?.filter(o => !activeStore || o.store?.id === activeStore.id) || [];
    
    if (storeOrders.length === 0) {
      return [
        { date: 'Mon', sales: 1200 },
        { date: 'Tue', sales: 1900 },
        { date: 'Wed', sales: 1500 },
        { date: 'Thu', sales: 2400 },
        { date: 'Fri', sales: 2100 },
        { date: 'Sat', sales: 3000 },
        { date: 'Sun', sales: 2800 }
      ];
    }

    // Group by day of week or date string
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const grouped = {};
    
    // Show last 7 days of sales
    storeOrders.slice(-20).forEach(o => {
      if (!o.orderDate) return;
      const d = new Date(o.orderDate);
      const dayLabel = days[d.getDay()];
      grouped[dayLabel] = (grouped[dayLabel] || 0) + (o.totalAmount || 0);
    });

    return days.map(d => ({
      date: d,
      sales: parseFloat((grouped[d] || 0).toFixed(2))
    }));
  }, [orders, activeStore]);

  // Capacity indicators / Inventory Levels bar chart
  const inventoryLevelsData = useMemo(() => {
    if (!products || products.length === 0) {
      return [
        { name: 'Apparel', current: 150, target: 300 },
        { name: 'Electronics', current: 80, target: 150 },
        { name: 'Footwear', current: 120, target: 200 }
      ];
    }

    const grouped = {};
    products.slice(0, 15).forEach(p => {
      const cat = p.category?.name || 'Other';
      if (!grouped[cat]) grouped[cat] = { name: cat, current: 0, target: 0 };
      grouped[cat].current += p.stockLevel || 0;
      grouped[cat].target += 150; // mock target threshold
    });

    return Object.values(grouped).slice(0, 6);
  }, [products]);

  // Aggregate top selling products
  const topProductsData = useMemo(() => {
    if (!topSelling?.topByQuantity || topSelling.topByQuantity.length === 0) {
      return [
        { name: 'Casual Hoodie', sales: 120 },
        { name: 'Cargo Pants', sales: 90 },
        { name: 'Athletic Shoes', sales: 85 }
      ];
    }

    return topSelling.topByQuantity.map(p => ({
      name: p.productName,
      sales: p.totalQuantitySold
    }));
  }, [topSelling]);

  // List of manager assigned stores revenue comparisons
  const storeRevenueData = useMemo(() => {
    const assigned = user?.assignedStores || [];
    const grouped = {};
    
    orders?.forEach(o => {
      if (assigned.some(s => s.id === o.store?.id)) {
        const name = o.store?.name;
        grouped[name] = (grouped[name] || 0) + (o.totalAmount || 0);
      }
    });

    return Object.keys(grouped).map(name => ({
      name,
      revenue: parseFloat(grouped[name].toFixed(2))
    }));
  }, [orders, user]);

  // Filter transfers for approvals (transfers arriving at manager's assigned stores that are PENDING)
  const pendingApprovals = useMemo(() => {
    const storeIds = user?.assignedStores?.map(s => s.id) || [];
    return transfers?.filter(t => t.status === 'PENDING' && storeIds.includes(t.toStore?.id)) || [];
  }, [transfers, user]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Dynamic Title */}
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800">
            {activeStore ? `Dashboard - ${activeStore.name}` : 'My Assigned Locations'}
          </h2>
          <p className="text-xs text-slate-400">Assigned locations monitoring & operations center</p>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 uppercase block">Last Sync</span>
          <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">Real-time active</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        {/* Today's Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Today's Sales</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><DollarSign className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">${stats.todayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> Live calculations
            </p>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Today's Orders</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><ShoppingCart className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">{stats.todayOrders}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Dispatched count</p>
          </div>
        </div>

        {/* Low Stock count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Low Stock Alerts</span>
            <span className={`p-1.5 rounded-lg ${stats.lowStock > 0 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3">
            <h3 className={`text-xl font-bold font-display ${stats.lowStock > 0 ? 'text-red-600' : 'text-slate-800'}`}>{stats.lowStock}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Reorder warnings</p>
          </div>
        </div>

        {/* Pending Returns count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Pending Returns</span>
            <span className="p-1.5 rounded-lg bg-orange-50 text-orange-500"><RotateCcw className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">{stats.pendingReturns}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Awaiting approval</p>
          </div>
        </div>

        {/* Pending POs count */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Pending POs</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-500"><Clock className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">{stats.pendingPOs}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Requisitions active</p>
          </div>
        </div>

        {/* Active Inventory Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Asset Value</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-500"><Package className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">${stats.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Assigned inventory cost</p>
          </div>
        </div>

      </div>

      {/* Recharts trend graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sales Trend graph */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-80 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">Weekly Sales Velocity</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip formatter={(v) => [`$${v}`, 'Sales']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Line type="monotone" dataKey="sales" stroke="#2563eb" strokeWidth={2.5} dot={{ fill: '#2563eb', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory capacity comparison */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-80 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">Category Inventory Load</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryLevelsData} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Bar name="Stock count" dataKey="current" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Safety threshold" dataKey="target" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Top products & Store distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Top products bar gauge */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-72 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">Top Products Demands</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProductsData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 9 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Bar dataKey="sales" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Assigned Store comparison */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs h-72 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">My Stores Sales Comparison</h4>
          <div className="flex-1 min-h-0">
            {storeRevenueData.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-20">No revenue data generated on assigned stores.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeRevenueData} margin={{ left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Tooltip formatter={(v) => [`$${v}`, 'Revenue']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Actionable lists & task trackers */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Recent Orders table */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold font-display text-slate-800">Assigned Stores Sales Feed</h4>
              <p className="text-[11px] text-slate-400">Latest customer invoice orders</p>
            </div>
            <Link to="/orders" className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
              Full Log
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3">ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Revenue</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {(orders?.filter(o => !activeStore || o.store?.id === activeStore.id)?.slice(0, 5) || []).length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400">No recent orders.</td>
                  </tr>
                ) : (
                  orders?.filter(o => !activeStore || o.store?.id === activeStore.id)?.slice(0, 5).map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-semibold text-brand-600">#{o.id}</td>
                      <td className="p-3 text-slate-800">{o.customer?.name || 'Guest'}</td>
                      <td className="p-3 font-bold text-slate-800">${o.totalAmount?.toFixed(2)}</td>
                      <td className="p-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          o.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {o.orderDate ? new Date(o.orderDate).toLocaleDateString() : ''}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Approvals & Checklists */}
        <div className="space-y-6">
          
          {/* Stock Transfer Approvals */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
            <h4 className="text-sm font-bold font-display text-slate-800 mb-3 flex items-center gap-1.5">
              <ArrowLeftRight className="h-4 w-4 text-brand-500" />
              Incoming Approvals
            </h4>
            <div className="space-y-3 flex-1 overflow-y-auto">
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No pending store transfers awaiting receipt.
                </div>
              ) : (
                pendingApprovals.slice(0, 3).map(t => (
                  <div key={t.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2.5">
                    <div className="flex justify-between text-xs items-center">
                      <span className="font-semibold text-slate-800">#{t.id} - SKU Transfer</span>
                      <span className="font-bold text-brand-600">Qty: {t.quantity}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">From: {t.fromStore?.name} → {t.toStore?.name}</p>
                    <div className="flex gap-2">
                      <Link 
                        to="/inventory"
                        className="flex-1 py-1 text-center bg-slate-800 text-white rounded text-[10px] font-bold hover:bg-slate-900 transition-colors"
                      >
                        Action Request
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Checklist Task Manager */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-bold font-display text-slate-800 mb-3 flex items-center gap-1.5">
              <ClipboardCheck className="h-4 w-4 text-emerald-500" />
              Store Manager Checklist
            </h4>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700">
                <input type="checkbox" defaultChecked className="rounded text-brand-600 focus:ring-brand-500" />
                <span>Verify morning cash registers</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700">
                <input type="checkbox" defaultChecked={stats.lowStock === 0} className="rounded text-brand-600 focus:ring-brand-500" />
                <span>Replenish critical low-stock items</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700">
                <input type="checkbox" defaultChecked={pendingApprovals.length === 0} className="rounded text-brand-600 focus:ring-brand-500" />
                <span>Approve pending stock transfers</span>
              </label>
              <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700">
                <input type="checkbox" className="rounded text-brand-600 focus:ring-brand-500" />
                <span>Perform physical inventory cycle count</span>
              </label>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default DashboardManager;
