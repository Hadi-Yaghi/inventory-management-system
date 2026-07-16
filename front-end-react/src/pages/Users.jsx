import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsers, deleteUser } from '../api/misc';
import api from '../api/axios';
import { Trash2, Loader2, UserPlus, X, ShieldAlert, Check, Key, Mail, User } from 'lucide-react';

const Users = () => {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');
  
  // Create User States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('EMPLOYEE');
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Fetch Users
  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers });

  // Delete Mutation
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

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await api.post('/auth/register', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateSuccess('User registered successfully!');
      setCreateError('');
      setTimeout(() => {
        setNewUsername('');
        setNewEmail('');
        setNewPassword('');
        setNewRole('EMPLOYEE');
        setCreateSuccess('');
        setShowCreateModal(false);
      }, 1500);
    },
    onError: (err) => {
      setCreateError(err.response?.data?.message || 'Failed to register user');
      setCreateSuccess('');
    }
  });

  const handleDelete = (id, username) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This cannot be undone.`)) {
      setDeletingId(id);
      setError('');
      deleteMutation.mutate(id);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    createMutation.mutate({
      username: newUsername,
      email: newEmail,
      password: newPassword,
      role: newRole
    });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>;

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex justify-between items-center bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold font-display text-slate-800">User Management</h1>
          <p className="text-xs text-slate-400">Add, monitor, and configure role credentials for Aegis ERP members</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-xs font-semibold shadow-sm transition-all focus:outline-none"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Users table card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold border-b border-slate-200 uppercase tracking-wider">
              <th className="p-4">Username</th>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {users?.map(u => (
              <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="p-4 font-semibold text-slate-800">{u.username}</td>
                <td className="p-4 text-slate-600">{u.email}</td>
                <td className="p-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    u.role === 'ADMIN' ? 'bg-red-55/10 text-red-75 border border-red-200/50' : 
                    u.role === 'MANAGER' ? 'bg-amber-50 text-amber-700 border border-amber-200/50' : 
                    'bg-blue-50 text-blue-700 border border-blue-200/50'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => handleDelete(u.id, u.username)}
                    disabled={deletingId === u.id}
                    className="text-red-500 hover:text-red-700 disabled:opacity-50 inline-flex items-center p-1 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    {deletingId === u.id ? (
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

      {/* Create User Modal Form */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden border border-slate-200 animate-slide-up">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-brand-600" />
                Register New System Member
              </span>
              <button 
                onClick={() => { setShowCreateModal(false); setCreateError(''); setCreateSuccess(''); }} 
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
              {createError && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              {createSuccess && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-2.5 rounded-lg text-xs flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>{createSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. jdoe"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="email" 
                    required
                    placeholder="e.g. john@company.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-slate-400" />
                  </span>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs pl-9 border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Security Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-500 font-medium text-slate-700 cursor-pointer"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Operations)</option>
                  <option value="MANAGER">MANAGER (Store Oversight)</option>
                  <option value="ADMIN">ADMIN (Full Security Control)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={createMutation.isPending || createSuccess !== ''}
                className="w-full py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 focus:outline-none"
              >
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Provisioning Account...</span>
                  </>
                ) : (
                  <span>Register User Credentials</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
