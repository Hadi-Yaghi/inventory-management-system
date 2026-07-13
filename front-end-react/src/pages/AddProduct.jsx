import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { getSuppliers } from '../api/suppliers';
import { createProduct } from '../api/products';
import { ArrowLeft, Save, AlertCircle, Loader2 } from 'lucide-react';

const AddProduct = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    price: '',
    categoryId: '',
    supplierId: '',
  });

  const [errorMessage, setErrorMessage] = useState('');

  // Fetch categories for dropdown
  const { data: categories, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  // Fetch suppliers for dropdown
  const { data: suppliers, isLoading: isSuppliersLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  });

  // Mutation to create a product
  const mutation = useMutation({
    mutationFn: createProduct,
    onSuccess: (data) => {
      // The backend returns a map like { "message": "Product added successfully" } or { "message": "Product already present..." }
      if (data.message && data.message.includes('already present')) {
        setErrorMessage(data.message);
      } else if (data.message && data.message.includes('SKU should be unique')) {
        setErrorMessage(data.message);
      } else {
        // Success
        queryClient.invalidateQueries({ queryKey: ['products'] });
        navigate('/products');
      }
    },
    onError: (error) => {
      const serverMsg = error.response?.data?.message || error.message || 'Failed to create product';
      setErrorMessage(serverMsg);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    // Client-side simple validation checks
    if (!formData.name.trim()) {
      setErrorMessage('Product name cannot be empty');
      return;
    }
    if (!formData.sku.trim()) {
      setErrorMessage('SKU cannot be empty');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setErrorMessage('Price must be a positive number');
      return;
    }

    // Construct the payload matching the Product model
    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      price: parseFloat(formData.price),
      category: formData.categoryId ? { id: parseInt(formData.categoryId, 10) } : null,
      supplier: formData.supplierId ? { id: parseInt(formData.supplierId, 10) } : null,
    };

    mutation.mutate(payload);
  };

  const isFormLoading = isCategoriesLoading || isSuppliersLoading || mutation.isPending;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition"
          aria-label="Go back to products"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Product</h1>
          <p className="text-slate-500 text-sm">Create a new item in your inventory</p>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg flex items-start space-x-3 text-sm">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="e.g. Wireless Mouse"
                value={formData.name}
                onChange={handleChange}
                disabled={isFormLoading}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="sku" className="block text-sm font-medium text-slate-700">
                SKU <span className="text-red-500">*</span>
              </label>
              <input
                id="sku"
                name="sku"
                type="text"
                required
                placeholder="e.g. TECH-MSE-001"
                value={formData.sku}
                onChange={handleChange}
                disabled={isFormLoading}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="price" className="block text-sm font-medium text-slate-700">
                Price ($) <span className="text-red-500">*</span>
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                disabled={isFormLoading}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="categoryId" className="block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                id="categoryId"
                name="categoryId"
                value={formData.categoryId}
                onChange={handleChange}
                disabled={isFormLoading}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select a Category</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label htmlFor="supplierId" className="block text-sm font-medium text-slate-700">
                Supplier
              </label>
              <select
                id="supplierId"
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                disabled={isFormLoading}
                className="w-full p-2.5 border border-slate-300 rounded-md shadow-sm bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition disabled:bg-slate-50 disabled:text-slate-500"
              >
                <option value="">Select a Supplier</option>
                {suppliers?.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate('/products')}
              disabled={isFormLoading}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 font-medium transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isFormLoading}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition flex items-center space-x-2 disabled:bg-indigo-400"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Product</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
