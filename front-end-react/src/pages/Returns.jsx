import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getReturns } from '../api/misc';

const Returns = () => {
  const { data: returns, isLoading } = useQuery({ queryKey: ['returns'], queryFn: getReturns });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Returns Management</h1>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Return ID</th>
              <th className="p-4 font-medium">Order ID</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Reason</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200">
            {returns?.map(r => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-indigo-600">#{r.id}</td>
                <td className="p-4 text-slate-600">#{r.order?.id}</td>
                <td className="p-4"><span className="px-2 py-1 bg-yellow-50 text-yellow-700 rounded-full text-xs font-medium">{r.status}</span></td>
                <td className="p-4 text-slate-600">{r.reason}</td>
                <td className="p-4 text-right text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">Review</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Returns;
