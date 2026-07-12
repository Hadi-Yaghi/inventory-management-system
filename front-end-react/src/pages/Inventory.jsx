import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getInventory } from '../api/inventory';
import { AlertTriangle } from 'lucide-react';

const Inventory = () => {
  const { data: inventory, isLoading, isError } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Inventory Management</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
          New Stock Transfer
        </button>
      </div>

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
