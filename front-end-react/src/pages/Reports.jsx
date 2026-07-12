import React from 'react';
import { Download } from 'lucide-react';

const Reports = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Data Exports & Reports</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Inventory Report</h3>
          <p className="text-sm text-slate-500 mb-4">Export current stock levels across all locations.</p>
          <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium">
            <Download className="h-4 w-4" /><span>Export CSV</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Sales Report</h3>
          <p className="text-sm text-slate-500 mb-4">Export order history and revenue metrics.</p>
          <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium">
            <Download className="h-4 w-4" /><span>Export PDF</span>
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
          <h3 className="font-semibold text-slate-900 mb-2">Customer Report</h3>
          <p className="text-sm text-slate-500 mb-4">Export registered users and activity.</p>
          <button className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium">
            <Download className="h-4 w-4" /><span>Export Excel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default Reports;
