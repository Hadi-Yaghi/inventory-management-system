import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReturns, approveReturn, rejectReturn } from '../api/misc';
import { useAuth } from '../context/auth-context';
import { Loader2 } from 'lucide-react';

const Returns = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const canManage = user?.role === 'ADMIN' || user?.role === 'MANAGER';
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');

  const { data: returns, isLoading } = useQuery({ queryKey: ['returns'], queryFn: getReturns });

  const approveMutation = useMutation({
    mutationFn: approveReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setActionId(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to approve return');
      setActionId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectReturn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['returns'] });
      setActionId(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to reject return');
      setActionId(null);
    },
  });

  const handleApprove = (id) => {
    setActionId(id);
    setError('');
    approveMutation.mutate(id);
  };

  const handleReject = (id) => {
    setActionId(id);
    setError('');
    rejectMutation.mutate(id);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'REQUESTED': return 'bg-yellow-50 text-yellow-700';
      case 'APPROVED': return 'bg-green-50 text-green-700';
      case 'REJECTED': return 'bg-red-50 text-red-700';
      default: return 'bg-slate-50 text-slate-700';
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Returns Management</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Return ID</th>
              <th className="p-4 font-medium">Order Item ID</th>
              <th className="p-4 font-medium">Quantity</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Reason</th>
              {canManage && <th className="p-4 font-medium text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200">
            {returns?.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="p-8 text-center text-slate-500">No return requests found.</td>
              </tr>
            ) : (
              returns?.map(r => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="p-4 font-medium text-indigo-600">#{r.id}</td>
                  <td className="p-4 text-slate-600">#{r.orderItemId}</td>
                  <td className="p-4 text-slate-600">{r.quantity}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(r.status)}`}>{r.status}</span></td>
                  <td className="p-4 text-slate-600">{r.reason}</td>
                  {canManage && (
                    <td className="p-4 text-right space-x-2">
                      {r.status === 'REQUESTED' ? (
                        actionId === r.id ? (
                          <Loader2 className="h-4 w-4 animate-spin inline" />
                        ) : (
                          <>
                            <button
                              onClick={() => handleApprove(r.id)}
                              disabled={actionId !== null}
                              className="text-xs font-medium px-2 py-1 rounded text-green-600 hover:bg-green-50 border border-green-200 transition disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(r.id)}
                              disabled={actionId !== null}
                              className="text-xs font-medium px-2 py-1 rounded text-red-600 hover:bg-red-50 border border-red-200 transition disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </>
                        )
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Returns;
