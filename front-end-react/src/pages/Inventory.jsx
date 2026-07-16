import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getInventory } from '../api/inventory';
import { getProducts } from '../api/products';
import { getStores, initiateTransfer } from '../api/misc';
import api from '../api/axios';
import { useAuth } from '../context/auth-context';
import { AlertTriangle, X, Loader2, Plus, Check, Ban, ClipboardList } from 'lucide-react';

const Inventory = () => {
  const queryClient = useQueryClient();
  const { user, activeStore } = useAuth();
  
  const [activeTab, setActiveTab] = useState('stock'); // 'stock' or 'adjustments'
  const [showTransfer, setShowTransfer] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [error, setError] = useState('');
  
  const [transferForm, setTransferForm] = useState({
    productId: '',
    fromStoreId: '',
    toStoreId: '',
    quantity: '',
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    productId: '',
    proposedStockLevel: '',
    reason: '',
  });

  const isEmployee = user?.role === 'EMPLOYEE';
  const isManagerOrAdmin = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // ═══════════════════════════════════════════════════════════════════════
  // QUERIES
  // ═══════════════════════════════════════════════════════════════════════

  const { data: inventory, isLoading, isError } = useQuery({
    queryKey: ['inventory', activeStore?.id],
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
    enabled: showTransfer || showAdjustmentModal,
  });

  const { data: adjustments, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['adjustments'],
    queryFn: async () => (await api.get('/inventory/adjustments')).data,
    enabled: activeTab === 'adjustments',
  });

  // ═══════════════════════════════════════════════════════════════════════
  // MUTATIONS
  // ═══════════════════════════════════════════════════════════════════════

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

  const adjustmentMutation = useMutation({
    mutationFn: async (payload) => {
      return (await api.post('/inventory/adjustments', null, {
        params: {
          productId: payload.productId,
          storeId: payload.storeId,
          proposedStockLevel: payload.proposedStockLevel,
          reason: payload.reason,
        }
      })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      setShowAdjustmentModal(false);
      setAdjustmentForm({ productId: '', proposedStockLevel: '', reason: '' });
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to submit adjustment request');
    },
  });

  const approveAdjustmentMutation = useMutation({
    mutationFn: async (id) => {
      return (await api.post(`/inventory/adjustments/${id}/approve`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });

  const rejectAdjustmentMutation = useMutation({
    mutationFn: async (id) => {
      return (await api.post(`/inventory/adjustments/${id}/reject`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adjustments'] });
    },
  });

  // ═══════════════════════════════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════════════════════════════

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

  const handleAdjustmentSubmit = (e) => {
    e.preventDefault();
    setError('');
    const targetStoreId = activeStore?.id;
    if (!targetStoreId) {
      setError('Please select an active store from the dropdown header first');
      return;
    }
    if (!adjustmentForm.productId || !adjustmentForm.proposedStockLevel) {
      setError('Product and Proposed Stock Level are required');
      return;
    }
    adjustmentMutation.mutate({
      productId: parseInt(adjustmentForm.productId),
      storeId: targetStoreId,
      proposedStockLevel: parseInt(adjustmentForm.proposedStockLevel),
      reason: adjustmentForm.reason,
    });
  };

  // Filter inventory items based on current active store
  const filteredInventory = inventory?.filter(item => 
    !activeStore || (item.store && item.store.id === activeStore.id)
  );

  // Filter adjustments based on current active store
  const filteredAdjustments = adjustments?.filter(item =>
    !activeStore || (item.store && item.store.id === activeStore.id)
  );

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex justify-between items-center border-b border-slate-200">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('stock')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'stock' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Current Stock Levels
          </button>
          <button
            onClick={() => setActiveTab('adjustments')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'adjustments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Count Adjustments
          </button>
        </div>

        {activeTab === 'stock' && isManagerOrAdmin && (
          <button
            onClick={() => setShowTransfer(!showTransfer)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center space-x-2 text-sm font-medium mb-2"
          >
            {showTransfer ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showTransfer ? 'Cancel' : 'New Stock Transfer'}</span>
          </button>
        )}

        {activeTab === 'adjustments' && (
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center space-x-2 text-sm font-medium mb-2"
          >
            <ClipboardList className="h-4 w-4" />
            <span>Request Stock Count Adjustment</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: STOCK LEVELS VIEW
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'stock' && (
        <>
          {showTransfer && (
            <form onSubmit={handleTransfer} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4 animate-fade-in">
              <h3 className="text-lg font-semibold text-slate-900">Initiate Stock Transfer</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Product *</label>
                  <select
                    value={transferForm.productId}
                    onChange={(e) => setTransferForm({ ...transferForm, productId: e.target.value })}
                    disabled={transferMutation.isPending}
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 text-slate-700 font-medium"
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
                    className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 text-slate-700"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">From Store *</label>
                  <select
                    value={transferForm.fromStoreId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromStoreId: e.target.value })}
                    disabled={transferMutation.isPending}
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 text-slate-700 font-medium"
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
                    className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50 text-slate-700 font-medium"
                  >
                    <option value="">Select Destination Store</option>
                    {stores?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <button
                type="submit"
                disabled={transferMutation.isPending}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center space-x-2 font-medium"
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
                    <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4 font-semibold">Store</th>
                      <th className="p-4 font-semibold">Product</th>
                      <th className="p-4 font-semibold text-center">Available</th>
                      <th className="p-4 font-semibold text-center">Reserved</th>
                      <th className="p-4 font-semibold text-center">On Hand</th>
                      <th className="p-4 font-semibold text-center">Min Threshold</th>
                      <th className="p-4 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm divide-y divide-slate-200">
                    {filteredInventory?.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500 font-medium">
                          No inventory records found for the selected store.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory?.map((item) => {
                        const stockLevel = item.stockLevel ?? item.quantity ?? 0;
                        const reserved = item.reservedQuantity ?? 0;
                        const available = item.availableQuantity ?? (stockLevel - reserved);
                        const threshold = item.lowStockThreshold ?? item.minThreshold ?? 10;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-medium text-slate-900">
                              {item.store?.name || 'Store'}
                            </td>
                            <td className="p-4 text-slate-600 font-medium">{item.product?.name}</td>
                            <td className="p-4 text-slate-900 font-bold text-center">{available}</td>
                            <td className="p-4 text-slate-500 font-semibold text-center">{reserved}</td>
                            <td className="p-4 text-slate-600 font-semibold text-center">{stockLevel}</td>
                            <td className="p-4 text-slate-600 text-center">{threshold}</td>
                            <td className="p-4 font-semibold">
                              {available <= threshold ? (
                                <span className="flex items-center text-red-600 font-semibold text-xs bg-red-50 px-2.5 py-1 rounded-full w-fit">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="text-green-700 font-semibold text-xs bg-green-50 px-2.5 py-1 rounded-full w-fit">
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
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: STOCK ADJUSTMENT REQUESTS VIEW
          ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'adjustments' && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {adjustmentsLoading ? (
            <div className="p-8 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider border-b border-slate-200">
                    <th className="p-4 font-semibold">Store</th>
                    <th className="p-4 font-semibold">Product</th>
                    <th className="p-4 font-semibold text-center">Proposed Count</th>
                    <th className="p-4 font-semibold">Reason</th>
                    <th className="p-4 font-semibold">Requested By</th>
                    <th className="p-4 font-semibold">Status</th>
                    {isManagerOrAdmin && <th className="p-4 font-semibold text-center">Actions</th>}
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-200">
                  {filteredAdjustments?.length === 0 ? (
                    <tr>
                      <td colSpan={isManagerOrAdmin ? 7 : 6} className="p-8 text-center text-slate-500 font-medium">
                        No adjustment requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdjustments?.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50 transition">
                        <td className="p-4 font-medium text-slate-900">{adj.store?.name}</td>
                        <td className="p-4 text-slate-600 font-medium">{adj.product?.name}</td>
                        <td className="p-4 text-slate-900 font-bold text-center">{adj.proposedStockLevel}</td>
                        <td className="p-4 text-slate-600">{adj.reason || '-'}</td>
                        <td className="p-4 text-slate-500">{adj.requestedBy?.username}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                            adj.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                            adj.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                            'bg-amber-50 text-amber-700'
                          }`}>
                            {adj.status}
                          </span>
                        </td>
                        {isManagerOrAdmin && (
                          <td className="p-4 flex justify-center space-x-2">
                            {adj.status === 'PENDING' ? (
                              <>
                                <button
                                  onClick={() => approveAdjustmentMutation.mutate(adj.id)}
                                  className="p-1 bg-green-50 text-green-700 rounded hover:bg-green-100 transition"
                                  title="Approve Adjustment"
                                >
                                  <Check className="h-4.5 w-4.5" />
                                </button>
                                <button
                                  onClick={() => rejectAdjustmentMutation.mutate(adj.id)}
                                  className="p-1 bg-red-50 text-red-700 rounded hover:bg-red-100 transition"
                                  title="Reject Adjustment"
                                >
                                  <Ban className="h-4.5 w-4.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-slate-400 text-xs">Finalized</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 space-y-4 border border-slate-100 relative">
            <button
              onClick={() => setShowAdjustmentModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-lg font-bold text-slate-900">Request Physical Stock Adjustment</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Submit a stock count correction request. This will route to a manager/admin for approval before updating the active store inventory.
            </p>
            
            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Active Store</label>
                <input
                  type="text"
                  disabled
                  value={activeStore?.name || 'No Active Store Selected'}
                  className="w-full p-2.5 border border-slate-200 roundedbg-slate-50 text-slate-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Product *</label>
                <select
                  value={adjustmentForm.productId}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, productId: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md bg-white outline-none focus:border-indigo-500 text-sm font-medium text-slate-700"
                >
                  <option value="">Select Product</option>
                  {products?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Proposed Count *</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Enter physical stock count"
                  value={adjustmentForm.proposedStockLevel}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, proposedStockLevel: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 text-sm font-medium text-slate-700"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
                <textarea
                  rows="3"
                  placeholder="e.g. Broken package, count error, audit update..."
                  value={adjustmentForm.reason}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, reason: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 text-sm text-slate-700"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjustmentMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm font-medium transition disabled:opacity-50 flex items-center space-x-1"
                >
                  {adjustmentMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Submit Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
