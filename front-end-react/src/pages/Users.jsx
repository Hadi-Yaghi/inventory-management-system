import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser } from '../api/misc';
import { Trash2, Loader2 } from 'lucide-react';

const Users = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeletingId(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Failed to delete user');
      setDeletingId(null);
    },
  });

  const handleDelete = (id, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      setDeletingId(id);
      setError('');
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-600 text-sm border-b border-slate-200">
              <th className="p-4 font-medium">Username</th>
              <th className="p-4 font-medium">Email</th>
              <th className="p-4 font-medium">Role</th>
              <th className="p-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-200">
            {users?.map(user => (
              <tr key={user.id} className="hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{user.username}</td>
                <td className="p-4 text-slate-600">{user.email}</td>
                <td className="p-4"><span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium">{user.role}</span></td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(user.id, user.username)}
                    disabled={deletingId === user.id}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 inline-flex items-center space-x-1"
                  >
                    {deletingId === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Users;
