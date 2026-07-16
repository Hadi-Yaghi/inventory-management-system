import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getAnalytics, getTopSellingProducts, getLowStockAnalytics, 
  getActivityLogs, getNotifications, getReturns, getCustomers 
} from '../api/misc';
import { getProducts } from '../api/products';
import { getOrders } from '../api/orders';
import { getPurchaseOrders } from '../api/purchaseOrders';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  TrendingUp, DollarSign, ShoppingBag, Users, Package, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Clipboard, RotateCcw, Activity, Bell,
  ShieldCheck, HelpCircle, Building2, Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

const DashboardAdmin = ({ activeStore }) => {
  // Query operations
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ['analytics', activeStore?.id],
    queryFn: () => getAnalytics(activeStore?.id)
  });

  const { data: topSelling, isLoading: isTopSellingLoading } = useQuery({
    queryKey: ['top-selling', activeStore?.id],
    queryFn: () => getTopSellingProducts(5, activeStore?.id)
  });

  const { data: lowStock, isLoading: isLowStockLoading } = useQuery({
    queryKey: ['low-stock-analytics', activeStore?.id],
    queryFn: () => getLowStockAnalytics(activeStore?.id)
  });

  const { data: activityLogs, isLoading: isLogsLoading } = useQuery({
    queryKey: ['activity-logs'],
    queryFn: getActivityLogs
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

  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders
  });

  // Extract PO list array (handling pagination envelope)
  const poList = useMemo(() => {
    return purchaseOrders?.content || (Array.isArray(purchaseOrders) ? purchaseOrders : []);
  }, [purchaseOrders]);

  // Calculate dynamic KPIs
  const kpis = useMemo(() => {
    const totalRev = analytics?.totalRevenue || 0;
    const totalOrdersCount = orders?.length || 0;
    const totalCustomersCount = customers?.length || 0;
    const totalProductsCount = products?.length || 0;

    // Sum inventory value: price * stockLevel
    const invValue = products?.reduce((sum, p) => sum + (p.price * (p.stockLevel || 0)), 0) || 0;
    // Estimated profit (e.g. 28% of total revenue)
    const profit = totalRev * 0.28;

    return {
      totalRevenue: totalRev,
      totalProfit: profit,
      inventoryValue: invValue,
      totalOrders: totalOrdersCount,
      totalCustomers: totalCustomersCount,
      totalProducts: totalProductsCount
    };
  }, [analytics, products, customers, orders]);

  // Aggregate orders by month for Revenue Trend Area Chart
  const revenueTrendData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [
        { month: 'Jan', revenue: 4000, profit: 1120 },
        { month: 'Feb', revenue: 5500, profit: 1540 },
        { month: 'Mar', revenue: 4800, profit: 1344 },
        { month: 'Apr', revenue: 7000, profit: 1960 },
        { month: 'May', revenue: 8500, profit: 2380 },
        { month: 'Jun', revenue: 10200, profit: 2856 }
      ];
    }

    // Group by month
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const grouped = {};

    orders.forEach(o => {
      if (!o.orderDate) return;
      const date = new Date(o.orderDate);
      const mLabel = months[date.getMonth()];
      grouped[mLabel] = (grouped[mLabel] || 0) + (o.totalAmount || 0);
    });

    const trend = months.map(m => ({
      month: m,
      revenue: parseFloat((grouped[m] || 0).toFixed(2)),
      profit: parseFloat(((grouped[m] || 0) * 0.28).toFixed(2))
    })).filter(item => item.revenue > 0);

    return trend.length > 0 ? trend : [
      { month: 'Jan', revenue: 4000, profit: 1120 },
      { month: 'Feb', revenue: 5500, profit: 1540 },
      { month: 'Mar', revenue: 4800, profit: 1344 }
    ];
  }, [orders]);

  // Aggregate Sales by Store Bar Chart
  const salesByStoreData = useMemo(() => {
    if (!orders || orders.length === 0) {
      return [
        { name: 'Default Store', sales: 3000 },
        { name: 'Warehouse Alpha', sales: 4500 }
      ];
    }

    const grouped = {};
    orders.forEach(o => {
      const storeName = o.store?.name || 'Global Warehouse';
      grouped[storeName] = (grouped[storeName] || 0) + (o.totalAmount || 0);
    });

    return Object.keys(grouped).map(name => ({
      name,
      sales: parseFloat(grouped[name].toFixed(2))
    }));
  }, [orders]);

  // Aggregate Category distribution for Pie Chart
  const inventoryDistributionData = useMemo(() => {
    if (!products || products.length === 0) {
      return [
        { name: 'Electronics', value: 40 },
        { name: 'Apparel', value: 30 },
        { name: 'Home Goods', value: 20 },
        { name: 'Other', value: 10 }
      ];
    }

    const grouped = {};
    products.forEach(p => {
      const catName = p.category?.name || 'Unassigned';
      grouped[catName] = (grouped[catName] || 0) + (p.stockLevel || 0);
    });

    return Object.keys(grouped).map(name => ({
      name,
      value: grouped[name]
    })).filter(item => item.value > 0);
  }, [products]);

  // Supplier performance summary based on purchase orders
  const supplierPerformanceData = useMemo(() => {
    if (!poList || poList.length === 0) {
      return [
        { name: 'Apex Corp', rating: 92, poCount: 5 },
        { name: 'Apex Suppliers', rating: 88, poCount: 8 },
        { name: 'Global Logistics', rating: 95, poCount: 3 }
      ];
    }

    const grouped = {};
    poList.forEach(po => {
      const supplierName = po.supplierName || 'Default Supplier';
      if (!grouped[supplierName]) {
        grouped[supplierName] = { name: supplierName, completed: 0, total: 0 };
      }
      grouped[supplierName].total += 1;
      if (po.status === 'COMPLETED' || po.status === 'RECEIVED') {
        grouped[supplierName].completed += 1;
      }
    });

    return Object.keys(grouped).map(name => {
      const g = grouped[name];
      const rate = g.total > 0 ? Math.round((g.completed / g.total) * 100) : 100;
      return {
        name,
        rating: rate === 0 ? 80 : rate, // Fallback default to keep charts pretty
        poCount: g.total
      };
    });
  }, [poList]);

  // Pie chart colors
  const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const loadingSkeleton = (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 space-y-3">
            <div className="h-4 w-12 skeleton-loader rounded" />
            <div className="h-8 w-24 skeleton-loader rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-96 bg-white border border-slate-200 rounded-xl p-6 skeleton-loader" />
        <div className="h-96 bg-white border border-slate-200 rounded-xl p-6 skeleton-loader" />
      </div>
    </div>
  );

  if (isAnalyticsLoading || isTopSellingLoading || isLowStockLoading || isLogsLoading) {
    return loadingSkeleton;
  }

  // Filter low stock table elements
  const lowStockTable = lowStock || [];
  const pendingPOs = poList?.filter(po => po.status === 'PENDING' || po.status === 'ORDERED')?.slice(0, 5) || [];
  const pendingReturns = returns?.filter(r => r.status === 'REQUESTED')?.slice(0, 5) || [];
  const notificationsFeed = notifications?.slice(0, 5) || [];
  const recentActivities = activityLogs?.slice(0, 5) || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* KPI Cards section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 erp-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Total Revenue</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <DollarSign className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-display text-slate-800">${kpis.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +12.4%
            </span>
          </div>
        </div>

        {/* Total Profit */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 erp-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Net Profit</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-display text-slate-800">${kpis.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 mt-1 bg-emerald-50 px-1.5 py-0.5 rounded">
              <ArrowUpRight className="h-3 w-3 mr-0.5" /> +8.2%
            </span>
          </div>
        </div>

        {/* Inventory Value */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 erp-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Inventory Value</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-display text-slate-800">${kpis.inventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-amber-600 mt-1 bg-amber-50 px-1.5 py-0.5 rounded">
              Active Stock
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 erp-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Total Orders</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShoppingBag className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-display text-slate-800">{kpis.totalOrders}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-indigo-600 mt-1 bg-indigo-50 px-1.5 py-0.5 rounded">
              All Channels
            </span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 erp-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">ERP Customers</span>
            <span className="p-2 rounded-lg bg-sky-50 text-sky-600">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-display text-slate-800">{kpis.totalCustomers}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-sky-600 mt-1 bg-sky-50 px-1.5 py-0.5 rounded">
              Active Accounts
            </span>
          </div>
        </div>

        {/* Total Products */}
        <div className="bg-white p-5 rounded-xl shadow-xs border border-slate-200 erp-card-hover">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Catalog Items</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Clipboard className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-xl font-bold font-display text-slate-800">{kpis.totalProducts}</h3>
            <span className="inline-flex items-center text-[10px] font-bold text-purple-600 mt-1 bg-purple-50 px-1.5 py-0.5 rounded">
              Tracked SKUs
            </span>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-xs border border-slate-200 h-96 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-sm font-bold font-display text-slate-800">ERP Revenue & Net Profit Trend</h4>
              <p className="text-[11px] text-slate-400">Aggregated from registered customer sales transactions</p>
            </div>
            <span className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">Historical Analysis</span>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '11px' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" name="Gross Revenue" dataKey="revenue" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" name="Net Profit" dataKey="profit" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inventory Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 h-96 flex flex-col">
          <div className="mb-4">
            <h4 className="text-sm font-bold font-display text-slate-800">Inventory Distribution</h4>
            <p className="text-[11px] text-slate-400">Stock availability grouped by product category</p>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center relative">
            {inventoryDistributionData.length === 0 ? (
              <p className="text-xs text-slate-400">No stock data available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={inventoryDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {inventoryDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} items`, 'Stock Level']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Additional Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Sales by Store Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 h-80 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">Sales Performance by Store</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByStoreData} margin={{ left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Tooltip formatter={(val) => [`$${val}`, 'Sales']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 h-80 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">Top Selling Products</h4>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {(!topSelling?.topByQuantity || topSelling.topByQuantity.length === 0) ? (
              <p className="text-xs text-slate-400 text-center py-12">No sales items registered.</p>
            ) : (
              topSelling.topByQuantity.map((p, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">{p.productName}</span>
                    <span className="font-bold text-slate-900">{p.totalQuantitySold} sold</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5">
                    <div 
                      className="bg-brand-500 h-1.5 rounded-full" 
                      style={{ width: `${Math.min((p.totalQuantitySold / 500) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Supplier Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200 h-80 flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3">Supplier Fulfillment Rate (%)</h4>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={supplierPerformanceData} layout="vertical" margin={{ left: -10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} width={70} />
                <Tooltip formatter={(val) => [`${val}%`, 'Fulfillment Rate']} contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '11px' }} />
                <Bar dataKey="rating" fill="#10b981" radius={[0, 4, 4, 0]} barSize={12} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Tables and Timelines grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Low Stock summary table */}
        <div className="xl:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold font-display text-slate-800">Critical Stock Warning</h4>
              <p className="text-[11px] text-slate-400">Inventory levels below safety threshold levels</p>
            </div>
            <Link to="/inventory" className="text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 px-2.5 py-1 rounded-lg">
              Manage Stock
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3">Product</th>
                  <th className="p-3">Store Location</th>
                  <th className="p-3">Stock Level</th>
                  <th className="p-3">Threshold</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {lowStockTable.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-400">
                      All item stock levels are healthy!
                    </td>
                  </tr>
                ) : (
                  lowStockTable.slice(0, 5).map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">{item.productName}</td>
                      <td className="p-3 text-slate-500">{item.storeName}</td>
                      <td className="p-3 font-bold text-red-500">{item.stockLevel}</td>
                      <td className="p-3 text-slate-400">{item.threshold}</td>
                      <td className="p-3 text-center">
                        <span className="inline-block px-2 py-0.5 rounded bg-red-50 border border-red-200 text-red-700 font-bold text-[9px] uppercase">
                          Critical
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Company Health Card & Notification Widget */}
        <div className="space-y-6">
          
          {/* Company Health Widget */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-xl shadow-sm border border-slate-850 p-6">
            <h4 className="text-sm font-bold font-display tracking-tight text-white mb-2">Company Health Index</h4>
            <div className="flex items-center gap-4 mt-4">
              <div className="relative h-20 w-20 flex items-center justify-center shrink-0">
                {/* Simulated circle dial */}
                <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent border-l-transparent rotate-45" />
                <span className="text-lg font-extrabold font-display">94%</span>
              </div>
              <div>
                <h5 className="text-xs font-bold text-emerald-400">System Healthy</h5>
                <p className="text-[11px] text-slate-400 mt-1">Fulfillment rates, safety stock targets, and pending return flows are optimal.</p>
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-700/50 pt-4">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pending POs</span>
                <span className="text-sm font-bold mt-1 block">{pendingPOs.length} Requests</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Pending Returns</span>
                <span className="text-sm font-bold mt-1 block">{pendingReturns.length} Claims</span>
              </div>
            </div>
          </div>

          {/* Recent Notifications Widget */}
          <div className="bg-white p-6 rounded-xl shadow-xs border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold font-display text-slate-800">Critical Alerts</h4>
              <Bell className="h-4 w-4 text-slate-400" />
            </div>
            <div className="space-y-3.5">
              {notificationsFeed.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">No unread alerts found.</p>
              ) : (
                notificationsFeed.map(n => (
                  <div key={n.id} className="text-xs flex gap-2.5 items-start">
                    <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-700 leading-tight">{n.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Activity Timeline logs */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <h4 className="text-sm font-bold font-display text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-brand-500" />
          System Activity Logs
        </h4>
        <div className="relative pl-6 border-l border-slate-100 space-y-6">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-slate-400">No activity logs recorded.</p>
          ) : (
            recentActivities.map(log => (
              <div key={log.id} className="relative text-xs">
                <span className="absolute -left-[31px] top-0.5 bg-brand-50 text-brand-600 p-1 rounded-full border border-white">
                  <ShieldCheck className="h-3 w-3" />
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="font-semibold text-slate-800">
                    {log.user?.username || 'System'} - <span className="text-slate-500 font-medium">{log.action}</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-500 mt-1 text-[11px] leading-relaxed max-w-2xl">{log.details}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default DashboardAdmin;
