import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getActivityLogs } from '../api/misc';

const ActivityLogs = () => {
  const { data: logs, isLoading } = useQuery({ queryKey: ['activity-logs'], queryFn: getActivityLogs });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">System Activity Logs</h1>
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">User</th>
              <th className="p-4 font-medium">Action</th>
              <th className="p-4 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200">
            {logs?.map(log => (
              <tr key={log.id} className="hover:bg-slate-50">
                <td className="p-4 text-slate-600">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 font-medium text-slate-900">{log.user?.username || 'System'}</td>
                <td className="p-4 text-slate-600">{log.action}</td>
                <td className="p-4 text-slate-500 text-xs truncate max-w-md">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default ActivityLogs;
