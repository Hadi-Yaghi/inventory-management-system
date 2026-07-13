import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrders, updateOrderStatus, placeOrder } from '../api/orders';
import { getStores } from '../api/misc';
import { getProducts } from '../api/products';
import { useAuth } from '../context/auth-context';
import { Search, Filter, Loader2, Plus, X, Trash2 } from 'lucide-react';

const Orders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [updatingId, setUpdatingId] = useState(null);
  const [error, setError] = useState('');
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    storeId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    items: [{ productId: '', quantity: 1, name: '', price: 0 }]
  });

  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
    enabled: showPlaceOrder,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled: showPlaceOrder,
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

  const placeOrderMutation = useMutation({
    mutationFn: placeOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowPlaceOrder(false);
      setOrderForm({
        storeId: '',
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        items: [{ productId: '', quantity: 1, name: '', price: 0 }]
      });
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.error || err.response?.data?.message || 'Failed to place order');
    }
  });

  const handleStatusChange = (id, newStatus) => {
    setUpdatingId(id);
    setError('');
    statusMutation.mutate({ id, status: newStatus });
  };

  const handleAddItem = () => {
    setOrderForm({
      ...orderForm,
      items: [...orderForm.items, { productId: '', quantity: 1, name: '', price: 0 }]
    });
  };

  const handleRemoveItem = (index) => {
    const updated = orderForm.items.filter((_, i) => i !== index);
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleItemChange = (index, field, value) => {
    const updated = orderForm.items.map((item, i) => {
      if (i === index) {
        const newItem = { ...item, [field]: value };
        if (field === 'productId') {
          const selectedProd = products?.find(p => p.id === parseInt(value));
          if (selectedProd) {
            newItem.name = selectedProd.name;
            newItem.price = selectedProd.price;
          }
        }
        return newItem;
      }
      return item;
    });
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    setError('');
    if (!orderForm.storeId || !orderForm.customerName || !orderForm.customerEmail || !orderForm.customerPhone) {
      setError('All customer and store details are required');
      return;
    }
    if (orderForm.items.length === 0 || orderForm.items.some(item => !item.productId || item.quantity <= 0)) {
      setError('Please add at least one product with quantity greater than 0');
      return;
    }

    const payload = {
      storeId: parseInt(orderForm.storeId),
      customerName: orderForm.customerName,
      customerEmail: orderForm.customerEmail,
      customerPhone: orderForm.customerPhone,
      datetime: new Date().toISOString(),
      purchaseProduct: orderForm.items.map(item => ({
        id: parseInt(item.productId),
        name: item.name,
        price: item.price,
        quantity: parseInt(item.quantity),
        total: item.price * parseInt(item.quantity)
      })),
      totalPrice: orderForm.items.reduce((sum, item) => sum + (item.price * parseInt(item.quantity)), 0)
    };

    placeOrderMutation.mutate(payload);
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
        <button
          onClick={() => setShowPlaceOrder(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Place New Order</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {showPlaceOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900">Place New Order</h2>
              <button onClick={() => setShowPlaceOrder(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={handleSubmitOrder} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Store *</label>
                  <select
                    value={orderForm.storeId}
                    onChange={(e) => setOrderForm({ ...orderForm, storeId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">Select Store</option>
                    {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm({ ...orderForm, customerName: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Email *</label>
                  <input
                    type="email"
                    value={orderForm.customerEmail}
                    onChange={(e) => setOrderForm({ ...orderForm, customerEmail: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter customer email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Phone *</label>
                  <input
                    type="text"
                    value={orderForm.customerPhone}
                    onChange={(e) => setOrderForm({ ...orderForm, customerPhone: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="Enter customer phone"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center border-t pt-4 border-slate-100">
                  <h3 className="font-semibold text-slate-900">Order Items</h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center space-x-1"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                {orderForm.items.map((item, index) => (
                  <div key={index} className="flex items-end gap-3 bg-slate-50 p-3 rounded-lg relative">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Product *</label>
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded bg-white text-sm"
                      >
                        <option value="">Select Product</option>
                        {products?.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (${p.price})</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded text-sm"
                      />
                    </div>
                    <div className="w-24 text-right pr-2 py-2">
                      <span className="text-xs font-medium text-slate-500 block mb-1">Subtotal</span>
                      <span className="text-sm font-semibold text-slate-800">
                        ${(item.price * (parseInt(item.quantity) || 0)).toFixed(2)}
                      </span>
                    </div>
                    {orderForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-t pt-4 border-slate-200 flex justify-between items-center text-lg font-bold text-slate-900">
                <span>Total Amount:</span>
                <span>
                  ${orderForm.items.reduce((sum, item) => sum + (item.price * (parseInt(item.quantity) || 0)), 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlaceOrder(false)}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placeOrderMutation.isPending}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center space-x-2"
                >
                  {placeOrderMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  <span>{placeOrderMutation.isPending ? 'Placing...' : 'Submit Order'}</span>
                </button>
              </div>
            </form>
          </div>
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
