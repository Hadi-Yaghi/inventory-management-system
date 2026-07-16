import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getProducts, deleteProduct } from '../api/products';
import { useAuth } from '../context/auth-context';
import { Package, Plus, Search, Trash2, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
  const { user, activeStore } = useAuth();
  const queryClient = useQueryClient();
  const canMutate = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products', activeStore?.id],
    queryFn: getProducts,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeletingId(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to delete product');
      setDeletingId(null);
    },
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      setDeletingId(id);
      setError('');
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        {canMutate && (
          <Link
            to="/products/new"
            className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Add Product</span>
          </Link>
        )}
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
              placeholder="Search products..."
              className="pl-9 w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500">
            Failed to load products. Please try again.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
                  <th className="p-4 font-medium">Product Name</th>
                  <th className="p-4 font-medium">SKU</th>
                  <th className="p-4 font-medium">Price</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Available</th>
                  <th className="p-4 font-medium">Reserved</th>
                  <th className="p-4 font-medium">On Hand</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-200">
                {products?.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-slate-500">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products?.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-medium text-slate-900 flex items-center space-x-3">
                        <div className="h-10 w-10 bg-slate-100 rounded-md flex items-center justify-center">
                          <Package className="h-5 w-5 text-slate-400" />
                        </div>
                        <span>{product.name}</span>
                      </td>
                      <td className="p-4 text-slate-600">{product.sku}</td>
                      <td className="p-4 text-slate-600">${product.price?.toFixed(2)}</td>
                      <td className="p-4 text-slate-600">{product.category?.name || 'N/A'}</td>
                      <td className="p-4 text-slate-900 font-medium">{product.availableQuantity ?? 0}</td>
                      <td className="p-4 text-slate-500 font-medium">{product.reservedQuantity ?? 0}</td>
                      <td className="p-4 text-slate-600 font-medium">{product.stockLevel ?? 0}</td>
                      <td className="p-4 text-right space-x-3">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View
                        </Link>
                        {canMutate && (
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={deletingId === product.id}
                            className="text-red-500 hover:text-red-700 font-medium disabled:opacity-50 inline-flex items-center"
                          >
                            {deletingId === product.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
