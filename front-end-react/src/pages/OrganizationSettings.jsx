import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { Building2, Mail, Clock, UserPlus, Users, Ticket, Copy, Check, Trash2, Shield, Loader2, AlertCircle } from 'lucide-react';

export default function OrganizationSettings() {
  const [organization, setOrganization] = useState({ name: '', slug: '', contactEmail: '', timezone: 'UTC' });
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [invite, setInvite] = useState({ email: '', role: 'EMPLOYEE' });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [inviting, setInviting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [orgRes, membersRes, invRes] = await Promise.all([
        api.get('/organizations/current'),
        api.get('/organizations/members').catch(() => ({ data: [] })),
        api.get('/organizations/invitations').catch(() => ({ data: [] })),
      ]);
      setOrganization(orgRes.data || {});
      setMembers(membersRes.data || []);
      setInvitations(invRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to load organization settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setSaving(true);
    try {
      const { data } = await api.put('/organizations/current', organization);
      setOrganization(data);
      setMessage('Organization settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save organization settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendInvite = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setInviting(true);
    try {
      const { data } = await api.post('/organizations/invitations', invite);
      setInvite({ email: '', role: 'EMPLOYEE' });
      setMessage(`Invitation generated successfully! Token: ${data.token}`);
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (id) => {
    try {
      await api.delete(`/organizations/invitations/${id}`);
      setInvitations(invitations.filter((item) => item.id !== id));
      setMessage('Invitation revoked successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to revoke invitation.');
    }
  };

  const copyInviteLink = (token) => {
    const link = `${window.location.origin}/signup?token=${token}`;
    navigator.clipboard.writeText(link);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 md:p-6 text-slate-100">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400">
              <Building2 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Organization Settings</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage workspace details, team members, and member invitations.</p>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-xs font-medium rounded-xl flex items-center justify-between animate-fade-in">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-emerald-400 hover:text-emerald-200">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/60 text-red-400 text-xs font-medium rounded-xl flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-200">✕</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Details Form */}
        <form onSubmit={handleSaveSettings} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Building2 className="h-4 w-4 text-brand-400" />
            <h2 className="font-bold text-sm text-white uppercase tracking-wider">Workspace Details</h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Organization Name</label>
            <input
              type="text"
              required
              value={organization.name || ''}
              onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Organization Slug (URL identifier)</label>
            <input
              type="text"
              disabled
              value={organization.slug || ''}
              className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-850 rounded-xl text-xs text-slate-400 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                value={organization.contactEmail || ''}
                onChange={(e) => setOrganization({ ...organization, contactEmail: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Timezone</label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                type="text"
                value={organization.timezone || 'UTC'}
                onChange={(e) => setOrganization({ ...organization, timezone: e.target.value })}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
          </button>
        </form>

        {/* Invite Member Form */}
        <form onSubmit={handleSendInvite} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <UserPlus className="h-4 w-4 text-indigo-400" />
            <h2 className="font-bold text-sm text-white uppercase tracking-wider">Invite Team Member</h2>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Member Email</label>
            <input
              type="email"
              required
              placeholder="colleague@example.com"
              value={invite.email}
              onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Assign Role</label>
            <select
              value={invite.role}
              onChange={(e) => setInvite({ ...invite, role: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-brand-500 transition-all"
            >
              <option value="EMPLOYEE">Employee (Read & Operations)</option>
              <option value="MANAGER">Manager (Full Inventory & Store Access)</option>
              <option value="ADMIN">Administrator (Full Admin Access)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={inviting}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Invitation Link'}
          </button>
        </form>
      </div>

      {/* Team Members List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            <h2 className="font-bold text-sm text-white uppercase tracking-wider">Organization Members ({members.length})</h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">User</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {members.length === 0 ? (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-slate-500">No members found.</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-3 font-semibold text-white flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 text-[11px]">
                        {m.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{m.username}</span>
                    </td>
                    <td className="p-3 text-slate-400">{m.email}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        m.role === 'ADMIN' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        m.role === 'MANAGER' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {m.role}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pending Invitations List */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Ticket className="h-4 w-4 text-amber-400" />
          <h2 className="font-bold text-sm text-white uppercase tracking-wider">Pending Invitations ({invitations.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">Recipient Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Invitation Link</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invitations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-500">No pending invitations.</td>
                </tr>
              ) : (
                invitations.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-all">
                    <td className="p-3 text-white font-medium">{inv.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => copyInviteLink(inv.token)}
                        className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-all"
                      >
                        {copiedToken === inv.token ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        <span>{copiedToken === inv.token ? 'Copied!' : 'Copy Signup Link'}</span>
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleRevokeInvite(inv.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-all"
                        title="Revoke Invitation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
