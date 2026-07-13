import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus } from '../api/orders';
import { useAuth } from '../context/auth-context';
import { Search, Filter, Loader2 } from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setUpdatingId(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to update order status');
      setUpdatingId(null);
    },
  });

  const handleStatusChange = (id, newStatus) => {
    setUpdatingId(id);
    setError('');
    statusMutation.mutate({ id, status: newStatus });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getNextActions = (status) => {
    switch (status) {
      case 'PENDING': return [{ label: 'Confirm', value: 'CONFIRMED' }, { label: 'Cancel', value: 'CANCELLED' }];
      case 'CONFIRMED': return [{ label: 'Complete', value: 'COMPLETED' }, { label: 'Cancel', value: 'CANCELLED' }];
      default: return [];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Orders</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center">
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="pl-9 w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>
          <button className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 px-3 py-2 rounded-md border border-slate-200 hover:border-indigo-200 transition">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-medium">Filter</span>
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load orders. Please try again.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium">Order ID</th>
                  <th className="p-4 font-medium">Customer</th>
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Total</th>
                  {canManage && <th className="p-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-200">
                {orders?.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 6 : 5} className="p-8 text-center text-slate-500">
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders?.map((order) => {
                    const actions = getNextActions(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-medium text-indigo-600">#{order.id}</td>
                        <td className="p-4 text-slate-900">{order.customer?.name || 'Walk-in Customer'}</td>
                        <td className="p-4 text-slate-600">{order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600">${order.totalAmount?.toFixed(2) || '0.00'}</td>
                        {canManage && (
                          <td className="p-4 text-right space-x-2">
                            {updatingId === order.id ? (
                              <Loader2 className="h-4 w-4 animate-spin inline" />
                            ) : (
                              actions.map((action) => (
                                <button
                                  key={action.value}
                                  onClick={() => handleStatusChange(order.id, action.value)}
                                  disabled={updatingId !== null}
                                  className={`text-xs font-medium px-2 py-1 rounded transition disabled:opacity-50 ${
                                    action.value === 'CANCELLED'
                                      ? 'text-red-600 hover:bg-red-50 border border-red-200'
                                      : 'text-indigo-600 hover:bg-indigo-50 border border-indigo-200'
                                  }`}
                                >
                                  {action.label}
                                </button>
                              ))
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
