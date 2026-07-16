import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  getNotifications, getTransfers, getLowStockAnalytics
} from '../api/misc';
import { getProducts } from '../api/products';
import { getOrders } from '../api/orders';
import { 
  ClipboardList, ShoppingCart, ArrowLeftRight, AlertTriangle, 
  QrCode, Bell, CheckSquare, Clock, Package, Eye, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import QuickActions from './QuickActions';

const DashboardEmployee = ({ activeStore, user }) => {
  // Query operations
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: getTransfers
  });

  const { data: products } = useQuery({
    queryKey: ['products', activeStore?.id],
    queryFn: getProducts
  });

  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock-analytics', activeStore?.id],
    queryFn: () => getLowStockAnalytics(activeStore?.id)
  });

  // Checklist states
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Confirm arrival of Shipment #PO-4091', completed: false, priority: 'High' },
    { id: 2, text: 'Perform cycle count on Apparel Category', completed: true, priority: 'Medium' },
    { id: 3, text: 'Restock shelf corridor B3 with Hoodies', completed: false, priority: 'High' },
    { id: 4, text: 'Scan barcodes for returns claims', completed: false, priority: 'Low' },
  ]);

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const activeTasksCount = tasks.filter(t => !t.completed).length;

  // Calculate stats
  const stats = useMemo(() => {
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

    const storeTransfers = transfers?.filter(t => 
      !activeStore || t.fromStore?.id === activeStore.id || t.toStore?.id === activeStore.id
    ) || [];
    const pendingTransfers = storeTransfers.filter(t => t.status === 'PENDING');

    const lowStockCount = lowStock?.length || 0;

    return {
      todayOrders: todayOrders.length,
      assignedTasks: activeTasksCount,
      pendingTransfers: pendingTransfers.length,
      lowStock: lowStockCount
    };
  }, [orders, transfers, lowStock, activeStore, activeTasksCount]);

  // Filter transfers list
  const activeTransfersList = useMemo(() => {
    const storeTransfers = transfers?.filter(t => 
      !activeStore || t.fromStore?.id === activeStore.id || t.toStore?.id === activeStore.id
    ) || [];
    return storeTransfers.slice(0, 5);
  }, [transfers, activeStore]);

  // Product audits checklist (select first few items with low stock or needing counting)
  const productsToCount = useMemo(() => {
    if (!products) return [];
    return products.slice(0, 4).map(p => ({
      ...p,
      status: p.stockLevel < 15 ? 'Needs Restock' : 'Scheduled Audit'
    }));
  }, [products]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-5 rounded-xl border border-slate-200 gap-4">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-800">
            {activeStore ? `Operations Hub - ${activeStore.name}` : 'My Operational Station'}
          </h2>
          <p className="text-xs text-slate-400">Warehouse task manager, scanner access, and transfers list</p>
        </div>
        <div className="flex gap-2">
          {/* Action to trigger simulated scan workflow by forcing click of float */}
          <button 
            onClick={() => {
              // Programmatically click the barcode quick action trigger if it's there
              const btn = document.querySelector('[title="Scan Barcode"]');
              if (btn) btn.click();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <QrCode className="h-4 w-4" />
            Quick Scan Barcode
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Today's Orders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">My Today's Orders</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><ShoppingCart className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">{stats.todayOrders}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Processed today</p>
          </div>
        </div>

        {/* Assigned Tasks */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Assigned Tasks</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600"><ClipboardList className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">{stats.assignedTasks}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Pending checklist</p>
          </div>
        </div>

        {/* Pending Transfers */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Transfers Pending</span>
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><ArrowLeftRight className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold font-display text-slate-800">{stats.pendingTransfers}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">In/Out transit</p>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 erp-card-hover shadow-xs">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-display">Low Stock Alerts</span>
            <span className={`p-1.5 rounded-lg ${stats.lowStock > 0 ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-50 text-slate-500'}`}><AlertTriangle className="h-4 w-4" /></span>
          </div>
          <div className="mt-3">
            <h3 className={`text-xl font-bold font-display ${stats.lowStock > 0 ? 'text-red-500' : 'text-slate-800'}`}>{stats.lowStock}</h3>
            <p className="text-[10px] text-slate-400 font-semibold mt-1">Under stock threshold</p>
          </div>
        </div>

      </div>

      {/* Main operational tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Active checklists & tasks */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3 flex items-center gap-1.5">
            <ClipboardList className="h-4 w-4 text-brand-500" />
            Active Tasks Queue
          </h4>
          <div className="flex-1 space-y-2">
            {tasks.map(t => (
              <div 
                key={t.id} 
                onClick={() => toggleTask(t.id)}
                className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                  t.completed 
                    ? 'border-slate-100 bg-slate-50/50 text-slate-400' 
                    : 'border-slate-200 hover:border-slate-350 text-slate-700 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-4 w-4 rounded flex items-center justify-center border ${
                    t.completed ? 'bg-emerald-500 border-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {t.completed && <CheckSquare className="h-3 w-3" />}
                  </span>
                  <span className={`text-xs ${t.completed ? 'line-through' : 'font-medium'}`}>{t.text}</span>
                </div>
                {!t.completed && (
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    t.priority === 'High' ? 'bg-red-50 text-red-700' : t.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-500'
                  }`}>
                    {t.priority}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Products needing physical counts */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold font-display text-slate-800">Warehouse Stock Count Directives</h4>
              <p className="text-[11px] text-slate-400">Products flagged for physical quantity audit verification</p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">Corridors A-D</span>
          </div>
          <div className="flex-1 overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3">Product Item</th>
                  <th className="p-3">SKU</th>
                  <th className="p-3">On Hand</th>
                  <th className="p-3">Directives</th>
                  <th className="p-3 text-right">Audit</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {productsToCount.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400">No active counting audit scheduled.</td>
                  </tr>
                ) : (
                  productsToCount.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-3 font-semibold text-slate-800 flex items-center gap-2">
                        <Package className="h-4 w-4 text-slate-400" />
                        {p.name}
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-[10px]">{p.sku}</td>
                      <td className="p-3 font-bold text-slate-800">{p.stockLevel}</td>
                      <td className="p-3">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                          p.status === 'Needs Restock' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {/* Simulation trigger */}
                        <button 
                          onClick={() => {
                            const btn = document.querySelector('[title="Inventory Count"]');
                            if (btn) btn.click();
                          }}
                          className="text-[10px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
                        >
                          Perform Count
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Assigned transfers & Alert feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Stock transfers feed */}
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold font-display text-slate-800">My Station Stock Transfers</h4>
              <p className="text-[11px] text-slate-400">Inter-store shipment arrivals & dispatches</p>
            </div>
            <Link to="/inventory" className="text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-lg">
              Manage Transfers
            </Link>
          </div>
          <div className="flex-1 overflow-x-auto min-h-0">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="p-3">ID</th>
                  <th className="p-3">Direction</th>
                  <th className="p-3">Quantity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {activeTransfersList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-6 text-center text-slate-400">No active stock transfers at this location.</td>
                  </tr>
                ) : (
                  activeTransfersList.map(t => {
                    const isIncoming = t.toStore?.id === activeStore?.id;
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">#{t.id}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                            isIncoming ? 'text-blue-600' : 'text-purple-600'
                          }`}>
                            {isIncoming ? 'Incoming Arrival' : 'Outgoing Dispatch'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-slate-800">{t.quantity} items</td>
                        <td className="p-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                            t.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Link to="/inventory" className="text-slate-400 hover:text-slate-600 inline-block p-1">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Notifications center widget */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <h4 className="text-sm font-bold font-display text-slate-800 mb-3 flex items-center gap-1.5">
            <Bell className="h-4 w-4 text-brand-500" />
            Alerts & Advisories
          </h4>
          <div className="space-y-3.5 overflow-y-auto flex-1">
            {(notifications || []).length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">No operational alerts found.</p>
            ) : (
              notifications?.slice(0, 4).map(n => (
                <div key={n.id} className="p-3 rounded-lg border border-slate-100 flex gap-2.5 items-start bg-slate-50/30">
                  <Clock className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-700 leading-tight">{n.title}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardEmployee;
