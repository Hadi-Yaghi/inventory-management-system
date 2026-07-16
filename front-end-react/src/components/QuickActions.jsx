import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { 
  Zap, Plus, UserPlus, Store, FileBarChart, Users,
  ShoppingCart, ArrowLeftRight, PackagePlus, CheckSquare,
  ClipboardList, QrCode, X, PlusCircle, AlertCircle
} from 'lucide-react';

const QuickActions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'barcode', 'count', 'store', 'user'
  
  // Custom dialog state values
  const [scanResult, setScanResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [countProduct, setCountProduct] = useState('');
  const [countQty, setCountQty] = useState('');
  const [countStatus, setCountStatus] = useState('');

  const [newStoreName, setNewStoreName] = useState('');
  const [newStoreLocation, setNewStoreLocation] = useState('');
  const [newStoreStatus, setNewStoreStatus] = useState('');

  const handleAction = (action) => {
    setIsOpen(false);
    
    // Admin Actions
    if (action === 'create_user') {
      navigate('/users');
    } else if (action === 'create_store') {
      setActiveModal('store');
    } else if (action === 'view_reports') {
      navigate('/reports');
    } else if (action === 'manage_suppliers') {
      navigate('/purchase-orders');
    }
    
    // Manager Actions
    else if (action === 'create_po') {
      navigate('/purchase-orders');
    } else if (action === 'transfer_stock') {
      navigate('/inventory');
    } else if (action === 'receive_shipment') {
      navigate('/purchase-orders');
    } else if (action === 'add_product') {
      navigate('/products/new');
    }
    
    // Employee Actions
    else if (action === 'create_order') {
      navigate('/orders');
    } else if (action === 'create_customer') {
      navigate('/orders');
    } else if (action === 'scan_barcode') {
      setActiveModal('barcode');
    } else if (action === 'inventory_count') {
      setActiveModal('count');
    }
  };

  const simulateBarcodeScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const mockCodes = ['SKU-TSHIRT-L-RED', 'SKU-JEANS-M-BLU', 'SKU-JACKET-XL-BLK', 'SKU-SHOES-10-WHT'];
      const randomCode = mockCodes[Math.floor(Math.random() * mockCodes.length)];
      setScanResult(randomCode);
      setIsScanning(false);
    }, 2000);
  };

  const simulateStoreCreation = (e) => {
    e.preventDefault();
    setNewStoreStatus('creating');
    setTimeout(() => {
      setNewStoreStatus('success');
      setTimeout(() => {
        setNewStoreName('');
        setNewStoreLocation('');
        setNewStoreStatus('');
        setActiveModal(null);
      }, 1500);
    }, 1500);
  };

  const getActionsByRole = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { id: 'create_user', label: 'Create User', icon: UserPlus, color: 'bg-red-500 text-white' },
          { id: 'create_store', label: 'Create Store', icon: Store, color: 'bg-orange-500 text-white' },
          { id: 'view_reports', label: 'View Reports', icon: FileBarChart, color: 'bg-emerald-500 text-white' },
          { id: 'manage_suppliers', label: 'Manage Suppliers', icon: Users, color: 'bg-indigo-500 text-white' },
        ];
      case 'MANAGER':
        return [
          { id: 'create_po', label: 'Create Purchase Order', icon: ShoppingCart, color: 'bg-amber-500 text-white' },
          { id: 'transfer_stock', label: 'Transfer Stock', icon: ArrowLeftRight, color: 'bg-blue-500 text-white' },
          { id: 'receive_shipment', label: 'Receive Shipment', icon: PackagePlus, color: 'bg-purple-500 text-white' },
          { id: 'add_product', label: 'Add Product', icon: PlusCircle, color: 'bg-teal-500 text-white' },
        ];
      case 'EMPLOYEE':
        return [
          { id: 'create_order', label: 'Create Order', icon: ShoppingCart, color: 'bg-indigo-500 text-white' },
          { id: 'create_customer', label: 'Create Customer', icon: UserPlus, color: 'bg-teal-500 text-white' },
          { id: 'scan_barcode', label: 'Scan Barcode', icon: QrCode, color: 'bg-pink-500 text-white' },
          { id: 'inventory_count', label: 'Inventory Count', icon: ClipboardList, color: 'bg-emerald-500 text-white' },
        ];
      default:
        return [];
    }
  };

  const actions = getActionsByRole();

  return (
    <>
      {/* Floating Action Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 space-y-1 divide-y divide-slate-100 animate-slide-up">
            <div className="px-3 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider font-display">
              Quick Tasks
            </div>
            <div className="pt-1.5 space-y-1">
              {actions.map((act) => (
                <button
                  key={act.id}
                  onClick={() => handleAction(act.id)}
                  className="w-full flex items-center px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <span className={`p-1.5 rounded-lg mr-2.5 ${act.color}`}>
                    <act.icon className="h-4 w-4" />
                  </span>
                  {act.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-12 w-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform focus:outline-none ${
            isOpen ? 'bg-slate-800 rotate-45' : 'bg-brand-600 hover:bg-brand-700 hover:scale-105 active:scale-95'
          }`}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
        </button>
      </div>

      {/* Simulated Modals */}
      {activeModal === 'barcode' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <QrCode className="h-5 w-5 text-pink-500" />
                Barcode Scanner Simulator
              </span>
              <button onClick={() => { setActiveModal(null); setScanResult(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-6 text-center space-y-5">
              <div className="relative border-2 border-dashed border-slate-300 rounded-lg p-8 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden h-40">
                {isScanning ? (
                  <div className="space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto" />
                    <p className="text-xs text-slate-500">Accessing device camera...</p>
                  </div>
                ) : scanResult ? (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400 font-bold uppercase">Barcode Detected</p>
                    <p className="text-sm font-mono font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1.5 rounded">
                      {scanResult}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <QrCode className="h-10 w-10 text-slate-300 mx-auto" />
                    <p className="text-xs text-slate-500">Align barcode within the grid</p>
                  </div>
                )}
                {isScanning && (
                  <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={simulateBarcodeScan}
                  disabled={isScanning}
                  className="flex-1 py-2 bg-pink-600 text-white rounded-lg text-xs font-semibold hover:bg-pink-700 disabled:opacity-50 transition-colors"
                >
                  {isScanning ? 'Scanning...' : 'Simulate Scan'}
                </button>
                {scanResult && (
                  <button
                    onClick={() => {
                      navigate(`/products?search=${scanResult}`);
                      setActiveModal(null);
                      setScanResult('');
                    }}
                    className="flex-1 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition-colors"
                  >
                    View Product
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'count' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-emerald-500" />
                Cycle Stock Count Entry
              </span>
              <button onClick={() => { setActiveModal(null); setCountStatus(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              setCountStatus('submitting');
              setTimeout(() => {
                setCountStatus('success');
                setTimeout(() => {
                  setCountProduct('');
                  setCountQty('');
                  setCountStatus('');
                  setActiveModal(null);
                }, 1500);
              }, 1200);
            }} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Product SKU / ID</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. SKU-TSHIRT-L-RED"
                  value={countProduct}
                  onChange={(e) => setCountProduct(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Physical Qty Counted</label>
                <input 
                  type="number" 
                  required
                  min="0"
                  placeholder="e.g. 45"
                  value={countQty}
                  onChange={(e) => setCountQty(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              {countStatus === 'success' && (
                <div className="bg-emerald-50 text-emerald-700 text-xs p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Stock verification submitted successfully!
                </div>
              )}
              <button
                type="submit"
                disabled={countStatus === 'submitting' || countStatus === 'success'}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {countStatus === 'submitting' ? 'Submitting Count...' : 'Submit Physical Audit'}
              </button>
            </form>
          </div>
        </div>
      )}

      {activeModal === 'store' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-xl shadow-xl overflow-hidden border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Store className="h-5 w-5 text-orange-500" />
                Initialize ERP Storefront
              </span>
              <button onClick={() => { setActiveModal(null); setNewStoreStatus(''); }} className="text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={simulateStoreCreation} className="p-5 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Store Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. New York Logistics Hub"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Location Details</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. 5th Avenue, NYC"
                  value={newStoreLocation}
                  onChange={(e) => setNewStoreLocation(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              {newStoreStatus === 'success' && (
                <div className="bg-emerald-50 text-emerald-700 text-xs p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2 animate-fade-in">
                  <CheckSquare className="h-4 w-4" />
                  ERP storefront initialized and mapped!
                </div>
              )}
              <button
                type="submit"
                disabled={newStoreStatus === 'creating' || newStoreStatus === 'success'}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors"
              >
                {newStoreStatus === 'creating' ? 'Mapping Warehouse...' : 'Provision Store Location'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickActions;
