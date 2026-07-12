import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/categories';
import { Tags, Plus } from 'lucide-react';

const Categories = () => {
  const { data: categories, isLoading, isError } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">Categories</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700 transition">
          <Plus className="h-4 w-4" />
          <span>Add Category</span>
        </button>
      </div>

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
            <div key={category.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 hover:shadow-md transition cursor-pointer flex flex-col items-center text-center">
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
