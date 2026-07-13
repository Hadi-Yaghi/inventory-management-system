import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalytics } from '../api/misc';
import { useAuth } from '../context/auth-context';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useAuth();
  const canViewAnalytics = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: getAnalytics,
    enabled: canViewAnalytics,
  });

  if (isLoading && canViewAnalytics) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  const mockChartData = [
    { name: 'Jan', revenue: 4000 }, { name: 'Feb', revenue: 3000 }, { name: 'Mar', revenue: 2000 },
    { name: 'Apr', revenue: 2780 }, { name: 'May', revenue: 1890 }, { name: 'Jun', revenue: 2390 },
  ];

  if (!canViewAnalytics) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
          <h2 className="text-lg font-semibold text-slate-800 mb-2">Welcome, {user?.username}!</h2>
          <p className="text-slate-600">Use the sidebar to navigate to Products, Inventory, Orders, and more.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Total Revenue</p>
          <p className="text-3xl font-bold text-slate-900">${data?.totalRevenue?.toFixed(2) || '0.00'}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Active Orders</p>
          <p className="text-3xl font-bold text-slate-900">{data?.activeOrders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <p className="text-sm font-medium text-slate-500 mb-1">Low Stock Items</p>
          <p className="text-3xl font-bold text-slate-900">{data?.lowStockCount || 0}</p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 h-96">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Revenue Trend</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mockChartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={3} dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
