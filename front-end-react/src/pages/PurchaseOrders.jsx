import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { getPurchaseOrders, createPurchaseOrder, receiveShipment, cancelPurchaseOrder } from '../api/purchaseOrders';
import { getSuppliers } from '../api/suppliers';
import { getStores } from '../api/misc';
import { getProducts } from '../api/products';
import { 
  FileText, Plus, Search, Trash2, Loader2, X, Eye, 
  ChevronLeft, ChevronRight, Truck, Calendar, Ban, CheckCircle 
} from 'lucide-react';

const PurchaseOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canModify = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  // State for search / filters / pagination
  const [page, setPage] = useState(0);
  const [supplierId, setSupplierId] = useState('');
  const [storeId, setStoreId] = useState('');
  const [status, setStatus] = useState('');

  // Modals / Forms visibility
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);

  // Form states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newPO, setNewPO] = useState({
    supplierId: '',
    storeId: '',
    expectedDate: '',
    items: []
  });

  // Shipment receive state (productId -> quantityReceived)
  const [receiveQuantities, setReceiveQuantities] = useState({});

  // Queries
  const { data: poResponse, isLoading, isError } = useQuery({
    queryKey: ['purchase-orders', page, supplierId, storeId, status],
    queryFn: () => getPurchaseOrders({
      supplierId: supplierId || undefined,
      storeId: storeId || undefined,
      status: status || undefined,
      page: page,
      size: 10,
      sort: 'orderDate,desc'
    })
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers
  });

  const { data: stores } = useQuery({
    queryKey: ['stores'],
    queryFn: getStores
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setSuccess('Purchase order created successfully!');
      setError('');
      setShowCreateForm(false);
      resetPOForm();
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to create purchase order');
      setSuccess('');
    }
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, items }) => receiveShipment(id, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setSuccess('Shipment quantities received successfully!');
      setError('');
      setShowReceiveModal(false);
      setSelectedPO(null);
      setReceiveQuantities({});
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to receive shipment');
      setSuccess('');
    }
  });

  const cancelMutation = useMutation({
    mutationFn: cancelPurchaseOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setSuccess('Purchase order cancelled successfully.');
      setError('');
      setSelectedPO(null);
      setShowDetailsModal(false);
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to cancel purchase order');
      setSuccess('');
    }
  });

  // Handlers
  const resetPOForm = () => {
    setNewPO({
      supplierId: '',
      storeId: '',
      expectedDate: '',
      items: []
    });
  };

  const handleAddLineItem = () => {
    if (!products || products.length === 0) return;
    const defaultProduct = products[0];
    setNewPO({
      ...newPO,
      items: [
        ...newPO.items,
        { productId: defaultProduct.id, quantityOrdered: 1, unitCost: defaultProduct.price || 0 }
      ]
    });
  };

  const handleRemoveLineItem = (index) => {
    const updatedItems = [...newPO.items];
    updatedItems.splice(index, 1);
    setNewPO({ ...newPO, items: updatedItems });
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedItems = [...newPO.items];
    updatedItems[index][field] = value;
    setNewPO({ ...newPO, items: updatedItems });
  };

  const handleCreatePOSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPO.supplierId || !newPO.storeId) {
      setError('Supplier and Store are required.');
      return;
    }
    if (newPO.items.length === 0) {
      setError('At least one item line must be added.');
      return;
    }

    for (let i = 0; i < newPO.items.length; i++) {
      const it = newPO.items[i];
      if (!it.productId || it.quantityOrdered <= 0 || it.unitCost < 0) {
        setError('Ensure all lines have a valid product, quantity > 0, and cost >= 0.');
        return;
      }
    }

    // Convert expected date to LocalDateTime format if filled
    const payload = {
      supplierId: parseInt(newPO.supplierId),
      storeId: parseInt(newPO.storeId),
      expectedDate: newPO.expectedDate ? `${newPO.expectedDate}:00` : undefined,
      items: newPO.items.map(it => ({
        productId: parseInt(it.productId),
        quantityOrdered: parseInt(it.quantityOrdered),
        unitCost: parseFloat(it.unitCost)
      }))
    };

    createMutation.mutate(payload);
  };

  const handleReceiveShipmentSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const payloadItems = Object.entries(receiveQuantities)
      .map(([prodId, qty]) => ({
        productId: parseInt(prodId),
        quantityReceived: parseInt(qty) || 0
      }))
      .filter(item => item.quantityReceived > 0);

    if (payloadItems.length === 0) {
      setError('Please specify a received quantity greater than 0 for at least one item.');
      return;
    }

    receiveMutation.mutate({
      id: selectedPO.id,
      items: payloadItems
    });
  };

  const handleCancelClick = (id) => {
    if (window.confirm('Are you sure you want to cancel this purchase order? This action cannot be undone.')) {
      cancelMutation.mutate(id);
    }
  };

  const handleOpenReceiveModal = (po) => {
    setSelectedPO(po);
    // Auto-fill receive quantites with difference (ordered - received)
    const initialQtys = {};
    po.items.forEach(item => {
      const remaining = item.quantityOrdered - item.quantityReceived;
      initialQtys[item.product.id] = remaining > 0 ? remaining : 0;
    });
    setReceiveQuantities(initialQtys);
    setShowReceiveModal(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'ORDERED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Ordered</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Partially Received</span>;
      case 'RECEIVED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Received</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelled</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const calculateTotalCost = (items) => {
    return items.reduce((sum, item) => sum + (item.quantityOrdered * item.unitCost), 0).toFixed(2);
  };

  const poList = poResponse?.content || [];
  const totalPages = poResponse?.totalPages || 0;
  const currentPage = poResponse?.currentPage || 0;
  const totalItems = poResponse?.totalItems || 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Orders</h1>
          <p className="text-sm text-slate-500">Order stock from suppliers and manage incoming shipments.</p>
        </div>
        {canModify && (
          <button
            onClick={() => {
              setShowCreateForm(!showCreateForm);
              setError('');
              setSuccess('');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium transition flex items-center space-x-2 shadow-sm"
          >
            {showCreateForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            <span>{showCreateForm ? 'Cancel Form' : 'Create PO'}</span>
          </button>
        )}
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg text-sm flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
        </div>
      )}

      {/* Create PO Form Drawer/Panel */}
      {showCreateForm && (
        <form onSubmit={handleCreatePOSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h2 className="text-lg font-semibold text-slate-900">New Purchase Order</h2>
            <button type="button" onClick={() => setShowCreateForm(false)} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Supplier *</label>
              <select
                required
                value={newPO.supplierId}
                onChange={(e) => setNewPO({ ...newPO, supplierId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Select Supplier</option>
                {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Destination Store/Warehouse *</label>
              <select
                required
                value={newPO.storeId}
                onChange={(e) => setNewPO({ ...newPO, storeId: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
              >
                <option value="">Select Store</option>
                {stores?.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Expected Delivery Date</label>
              <input
                type="datetime-local"
                value={newPO.expectedDate}
                onChange={(e) => setNewPO({ ...newPO, expectedDate: e.target.value })}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Line Items List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-slate-800 text-sm">Stock Items Order List</h3>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
              >
                <Plus className="h-3 w-3" />
                <span>Add Item Line</span>
              </button>
            </div>

            {newPO.items.length === 0 ? (
              <div className="p-4 border border-dashed border-slate-200 text-center rounded-md text-slate-500 text-sm">
                No items added. Click 'Add Item Line' to start ordering items.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-medium border-b border-slate-200">
                      <th className="p-3">Product Name</th>
                      <th className="p-3 w-32">Quantity</th>
                      <th className="p-3 w-40">Unit Cost ($)</th>
                      <th className="p-3 w-32">Total Cost</th>
                      <th className="p-3 w-16 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newPO.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => handleLineItemChange(idx, 'productId', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white text-sm"
                          >
                            {products?.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            required
                            min="1"
                            value={item.quantityOrdered}
                            onChange={(e) => handleLineItemChange(idx, 'quantityOrdered', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-sm"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.01"
                            value={item.unitCost}
                            onChange={(e) => handleLineItemChange(idx, 'unitCost', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-sm"
                          />
                        </td>
                        <td className="p-2 text-slate-600 font-medium align-middle">
                          ${((item.quantityOrdered || 0) * (item.unitCost || 0)).toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-red-500 hover:text-red-700 p-1.5 rounded hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false);
                resetPOForm();
              }}
              className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium flex items-center space-x-2"
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Submit PO</span>
            </button>
          </div>
        </form>
      )}

      {/* Filter and Search Panel */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => { setSupplierId(e.target.value); setPage(0); }}
            className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
          >
            <option value="">All Suppliers</option>
            {suppliers?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Store</label>
          <select
            value={storeId}
            onChange={(e) => { setStoreId(e.target.value); setPage(0); }}
            className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
          >
            <option value="">All Stores</option>
            {stores?.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Filter by Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            className="w-full p-2 border border-slate-300 rounded-md bg-white text-sm"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ORDERED">Ordered</option>
            <option value="PARTIALLY_RECEIVED">Partially Received</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <button
          onClick={() => {
            setSupplierId('');
            setStoreId('');
            setStatus('');
            setPage(0);
          }}
          className="w-full p-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md font-medium text-sm transition"
        >
          Clear Filters
        </button>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500">
            Failed to load purchase orders. Please try reloading the page.
          </div>
        ) : poList.length === 0 ? (
          <div className="p-12 text-center text-slate-500 font-medium">
            No purchase orders found matching the filter options.
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs font-semibold">
                    <th className="p-4">PO ID</th>
                    <th className="p-4">Supplier</th>
                    <th className="p-4">Destination Store</th>
                    <th className="p-4">Order Date</th>
                    <th className="p-4">Expected Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Creator</th>
                    <th className="p-4">Total Cost</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {poList.map((po) => (
                    <tr key={po.id} className="hover:bg-slate-50/50 transition">
                      <td className="p-4 font-semibold text-indigo-600">#{po.id}</td>
                      <td className="p-4 font-medium text-slate-900">{po.supplier?.name}</td>
                      <td className="p-4">{po.store?.name}</td>
                      <td className="p-4 text-xs text-slate-500">
                        {po.orderDate ? new Date(po.orderDate).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {po.expectedDate ? new Date(po.expectedDate).toLocaleString() : 'N/A'}
                      </td>
                      <td className="p-4">{getStatusBadge(po.status)}</td>
                      <td className="p-4 text-xs font-medium text-slate-600">{po.createdBy?.username || 'System'}</td>
                      <td className="p-4 font-medium text-slate-800">${calculateTotalCost(po.items)}</td>
                      <td className="p-4 text-right space-x-1.5">
                        <button
                          onClick={() => {
                            setSelectedPO(po);
                            setShowDetailsModal(true);
                          }}
                          title="View Details"
                          className="p-1 border border-slate-200 rounded text-slate-600 hover:bg-slate-100 hover:text-indigo-600 inline-flex items-center justify-center transition"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {canModify && po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
                          <button
                            onClick={() => handleOpenReceiveModal(po)}
                            title="Receive Shipment"
                            className="p-1 border border-indigo-200 text-indigo-600 rounded hover:bg-indigo-50 inline-flex items-center justify-center transition"
                          >
                            <Truck className="h-4 w-4" />
                          </button>
                        )}
                        {canModify && (po.status === 'PENDING' || po.status === 'ORDERED') && (
                          <button
                            onClick={() => handleCancelClick(po.id)}
                            title="Cancel PO"
                            className="p-1 border border-red-200 text-red-600 rounded hover:bg-red-50 inline-flex items-center justify-center transition"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-150 flex items-center justify-between text-sm text-slate-500 bg-slate-50/50">
              <div>
                Showing <span className="font-semibold text-slate-700">{poList.length}</span> of{' '}
                <span className="font-semibold text-slate-700">{totalItems}</span> purchase orders.
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                  className="p-2 border border-slate-350 bg-white rounded-md hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="font-medium text-slate-700">
                  Page {currentPage + 1} of {totalPages || 1}
                </span>
                <button
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage(page + 1)}
                  className="p-2 border border-slate-350 bg-white rounded-md hover:bg-slate-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receive Shipment Modal */}
      {showReceiveModal && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Receive Shipment: PO #{selectedPO.id}</h3>
                <p className="text-xs text-slate-500">Destination: {selectedPO.store?.name} | Supplier: {selectedPO.supplier?.name}</p>
              </div>
              <button onClick={() => { setShowReceiveModal(false); setSelectedPO(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleReceiveShipmentSubmit} className="flex-1 overflow-auto p-6 space-y-4">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                    <th className="p-3">Product</th>
                    <th className="p-3">Ordered</th>
                    <th className="p-3">Received So Far</th>
                    <th className="p-3 w-40">Add New Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPO.items.map((item) => (
                    <tr key={item.id}>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{item.product?.name}</div>
                        <div className="text-xs text-slate-500">SKU: {item.product?.sku}</div>
                      </td>
                      <td className="p-3 font-medium text-slate-700">{item.quantityOrdered}</td>
                      <td className="p-3 text-slate-500">{item.quantityReceived}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          min="0"
                          max={item.quantityOrdered - item.quantityReceived}
                          value={receiveQuantities[item.product.id] ?? ''}
                          onChange={(e) => setReceiveQuantities({
                            ...receiveQuantities,
                            [item.product.id]: parseInt(e.target.value) || 0
                          })}
                          disabled={item.quantityReceived >= item.quantityOrdered}
                          className="w-full p-1.5 border border-slate-350 rounded text-sm disabled:bg-slate-50 disabled:text-slate-400"
                          placeholder={item.quantityReceived >= item.quantityOrdered ? "Fully Received" : "Enter received qty"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowReceiveModal(false); setSelectedPO(null); }}
                  className="px-4 py-2 border border-slate-300 rounded-md text-slate-700 hover:bg-slate-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={receiveMutation.isPending}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition font-medium flex items-center space-x-2"
                >
                  {receiveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Record Shipment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Detail View Modal */}
      {showDetailsModal && selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Purchase Order details: #{selectedPO.id}</h3>
                <div className="mt-1 flex items-center space-x-2">
                  {getStatusBadge(selectedPO.status)}
                  <span className="text-xs text-slate-500">Ordered: {new Date(selectedPO.orderDate).toLocaleDateString()}</span>
                </div>
              </div>
              <button onClick={() => { setShowDetailsModal(false); setSelectedPO(null); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-auto p-6 space-y-6">
              {/* Header Grid */}
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <h4 className="font-semibold text-slate-600 uppercase tracking-wider text-xs mb-2">Supplier Info</h4>
                  <p className="font-bold text-slate-900">{selectedPO.supplier?.name}</p>
                  <p className="text-slate-500 text-xs">{selectedPO.supplier?.contactEmail || 'No email'}</p>
                  <p className="text-slate-500 text-xs">{selectedPO.supplier?.phone || 'No phone'}</p>
                  <p className="text-slate-500 text-xs">{selectedPO.supplier?.address || 'No address'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-600 uppercase tracking-wider text-xs mb-2">Delivery Store</h4>
                  <p className="font-bold text-slate-900">{selectedPO.store?.name}</p>
                  <p className="text-slate-500 text-xs">{selectedPO.store?.address}</p>
                  <p className="text-slate-500 text-xs mt-2">
                    Creator: <span className="font-semibold">{selectedPO.createdBy?.username || 'System'}</span>
                  </p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-600 uppercase tracking-wider text-xs">Ordered Line Items</h4>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 text-xs font-semibold border-b border-slate-200">
                      <th className="p-3">Product</th>
                      <th className="p-3">Cost ($)</th>
                      <th className="p-3">Qty Ordered</th>
                      <th className="p-3">Qty Received</th>
                      <th className="p-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedPO.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{item.product?.name}</div>
                          <div className="text-xs text-slate-500 font-mono">SKU: {item.product?.sku}</div>
                        </td>
                        <td className="p-3">${item.unitCost.toFixed(2)}</td>
                        <td className="p-3">{item.quantityOrdered}</td>
                        <td className="p-3">
                          <span className={item.quantityReceived >= item.quantityOrdered ? "text-green-600 font-semibold" : "text-slate-500"}>
                            {item.quantityReceived}
                          </span>
                        </td>
                        <td className="p-3 text-right font-medium">
                          ${(item.quantityOrdered * item.unitCost).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50/50">
                      <td colSpan="4" className="p-3 text-right font-bold text-slate-800">Total:</td>
                      <td className="p-3 text-right font-extrabold text-slate-900">${calculateTotalCost(selectedPO.items)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end space-x-3">
              {canModify && (selectedPO.status === 'PENDING' || selectedPO.status === 'ORDERED') && (
                <button
                  onClick={() => handleCancelClick(selectedPO.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-md font-medium transition"
                >
                  Cancel Purchase Order
                </button>
              )}
              <button
                onClick={() => { setShowDetailsModal(false); setSelectedPO(null); }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-md font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PurchaseOrders;
