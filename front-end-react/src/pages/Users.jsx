import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getUsers } from '../api/misc';
import { UserPlus } from 'lucide-react';

const Users = () => {
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-md flex items-center space-x-2 hover:bg-indigo-700">
          <UserPlus className="h-4 w-4" /><span>Add User</span>
        </button>
      </div>
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
                <td className="p-4 text-right text-indigo-600 hover:text-indigo-800 cursor-pointer font-medium">Edit</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Users;
