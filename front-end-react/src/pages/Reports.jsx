import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportReport } from '../api/misc';

import { useAuth } from '../context/auth-context';

const Reports = () => {
  const { activeStore } = useAuth();
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState('');

  const handleExport = async (type, format) => {
    const key = `${type}-${format}`;
    setLoadingKey(key);
    setError('');
    try {
      const response = await exportReport(type, format, activeStore?.id);
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = format === 'excel' ? 'xlsx' : format;
      link.download = `${type}_report.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(`Failed to export ${type} report: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoadingKey(null);
    }
  };

  const reports = [
    { title: 'Inventory Report', description: 'Export current stock levels across all locations.', type: 'inventory', format: 'csv', label: 'Export CSV' },
    { title: 'Sales Report', description: 'Export order history and revenue metrics.', type: 'sales', format: 'pdf', label: 'Export PDF' },
    { title: 'Customer Report', description: 'Export registered users and activity.', type: 'customers', format: 'excel', label: 'Export Excel' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Data Exports & Reports</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reports.map((report) => {
          const key = `${report.type}-${report.format}`;
          const isLoading = loadingKey === key;
          return (
            <div key={report.type} className="bg-white p-6 rounded-lg shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-2">{report.title}</h3>
              <p className="text-sm text-slate-500 mb-4">{report.description}</p>
              <button
                onClick={() => handleExport(report.type, report.format)}
                disabled={loadingKey !== null}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50 transition"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span>{isLoading ? 'Exporting...' : report.label}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default Reports;
