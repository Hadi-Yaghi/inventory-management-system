import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory } from '../api/inventory';
import { getProducts } from '../api/products';
import { getStores, initiateTransfer } from '../api/misc';
import { AlertTriangle, X, Loader2, Plus } from 'lucide-react';

const Inventory = () => {
  const queryClient = useQueryClient();
  const [showTransfer, setShowTransfer] = useState(false);
  const [error, setError] = useState('');
  const [transferForm, setTransferForm] = useState({
    productId: '',
    fromStoreId: '',
    toStoreId: '',
    quantity: '',
  });

  const { data: inventory, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: getStores,
    enabled: showTransfer,
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
    enabled: showTransfer,
  });

  const transferMutation = useMutation({
    mutationFn: initiateTransfer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setShowTransfer(false);
      setTransferForm({ productId: '', fromStoreId: '', toStoreId: '', quantity: '' });
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to initiate transfer');
    },
  });

  const handleTransfer = (e) => {
    e.preventDefault();
    setError('');
    if (!transferForm.productId || !transferForm.fromStoreId || !transferForm.toStoreId || !transferForm.quantity) {
      setError('All fields are required');
      return;
    }
    if (transferForm.fromStoreId === transferForm.toStoreId) {
      setError('Source and destination stores must be different');
      return;
    }
    if (parseInt(transferForm.quantity) <= 0) {
      setError('Quantity must be positive');
      return;
    }
    transferMutation.mutate({
      productId: parseInt(transferForm.productId),
      fromStoreId: parseInt(transferForm.fromStoreId),
      toStoreId: parseInt(transferForm.toStoreId),
      quantity: parseInt(transferForm.quantity),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <button
          onClick={() => setShowTransfer(!showTransfer)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center space-x-2"
        >
          {showTransfer ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showTransfer ? 'Cancel' : 'New Stock Transfer'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {showTransfer && (
        <form onSubmit={handleTransfer} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <h3 className="text-lg font-semibold text-slate-900">Initiate Stock Transfer</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
              <select
                value={transferForm.productId}
                onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                disabled={transferMutation.isPending}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">Select Product</option>
                {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                min="1"
                value={transferForm.quantity}
                onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                disabled={transferMutation.isPending}
                className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">From Store *</label>
              <select
                value={transferForm.fromStoreId}
                onChange={(e) => setTransferForm({ ...transferForm, fromStoreId: e.target.value })}
                disabled={transferMutation.isPending}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">Select Source Store</option>
                {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">To Store *</label>
              <select
                value={transferForm.toStoreId}
                onChange={(e) => setTransferForm({ ...transferForm, toStoreId: e.target.value })}
                disabled={transferMutation.isPending}
                className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              >
                <option value="">Select Destination Store</option>
                {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={transferMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center space-x-2"
          >
            {transferMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            <span>{transferMutation.isPending ? 'Transferring...' : 'Initiate Transfer'}</span>
          </button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load inventory data.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium">Store</th>
                  <th className="p-4 font-medium">Product</th>
                  <th className="p-4 font-medium">Quantity</th>
                  <th className="p-4 font-medium">Min Threshold</th>
                  <th className="p-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-200">
                {inventory?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No inventory records found.
                    </td>
                  </tr>
                ) : (
                  inventory?.map((item) => {
                    const stockLevel = item.stockLevel ?? item.quantity ?? 0;
                    const threshold = item.lowStockThreshold ?? item.minThreshold ?? 10;

                    return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-900">
                        {item.store?.name || 'Main Warehouse'}
                      </td>
                      <td className="p-4 text-slate-600">{item.product?.name}</td>
                      <td className="p-4 text-slate-900 font-medium">{stockLevel}</td>
                      <td className="p-4 text-slate-600">{threshold}</td>
                      <td className="p-4">
                        {stockLevel <= threshold ? (
                          <span className="flex items-center text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full w-fit">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full">
                            In Stock
                          </span>
                        )}
                      </td>
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

export default Inventory;
