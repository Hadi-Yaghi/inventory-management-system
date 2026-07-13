import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import api from '../api/axios';
import { Tags, Plus, Trash2, Loader2, X } from 'lucide-react';

const Categories = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/category', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowForm(false);
      setNewName('');
      setNewDesc('');
      setError('');
    },
    onError: (err) => setError(err.response?.data?.message || 'Failed to create category'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/category/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeletingId(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to delete category');
      setDeletingId(null);
    },
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('Category name is required');
      return;
    }
    setError('');
    createMutation.mutate({ name: newName.trim(), description: newDesc.trim() });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete category "${name}"?`)) {
      setDeletingId(id);
      setError('');
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          <span>{showForm ? 'Cancel' : 'Add Category'}</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
              disabled={createMutation.isPending}
              className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              placeholder="e.g. Electronics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              disabled={createMutation.isPending}
              className="w-full p-2.5 border border-slate-300 rounded-md outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:bg-slate-50"
              placeholder="Optional description"
            />
          </div>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center space-x-2"
          >
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span>{createMutation.isPending ? 'Creating...' : 'Create Category'}</span>
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : isError ? (
          <div className="col-span-full p-8 text-center text-red-500">
            Failed to load categories.
          </div>
        ) : categories?.length === 0 ? (
          <div className="col-span-full p-8 text-center text-slate-500 bg-white rounded-lg shadow-sm border border-slate-200">
            No categories found.
          </div>
        ) : (
          categories?.map((category) => (
            <div key={category.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col items-center text-center relative group">
              <button
                onClick={() => handleDelete(category.id, category.name)}
                disabled={deletingId === category.id}
                className="absolute top-2 right-2 text-slate-300 hover:text-red-500 transition opacity-0 group-hover:opacity-100 disabled:opacity-50"
              >
                {deletingId === category.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
              <div className="h-12 w-12 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <Tags className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-slate-900">{category.name}</h3>
              <p className="text-sm text-slate-500 mt-1">{category.description || 'No description'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Categories;
