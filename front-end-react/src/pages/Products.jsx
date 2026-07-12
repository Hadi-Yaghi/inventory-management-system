import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/products';
import { Package, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Products = () => {
  const { data: products, isLoading, isError } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <Link
          to="/products/new"
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Link>
      </div>

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
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-slate-200">
                {products?.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
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
                      <td className="p-4 text-right">
                        <Link
                          to={`/products/${product.id}`}
                          className="text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          View
                        </Link>
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
