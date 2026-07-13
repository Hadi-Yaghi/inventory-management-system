import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export const ProtectedRoute = ({ allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100 text-center max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Not Authorized</h1>
          <p className="text-slate-600 mb-6">You don't have permission to view this page.</p>
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
};
