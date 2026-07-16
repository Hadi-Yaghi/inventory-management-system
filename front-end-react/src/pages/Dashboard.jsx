import React from 'react';
import { useAuth } from '../context/auth-context';
import DashboardAdmin from '../components/DashboardAdmin';
import DashboardManager from '../components/DashboardManager';
import DashboardEmployee from '../components/DashboardEmployee';
import QuickActions from '../components/QuickActions';

const Dashboard = () => {
  const { user, activeStore } = useAuth();

  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'ADMIN':
        return <DashboardAdmin activeStore={activeStore} />;
      case 'MANAGER':
        return <DashboardManager activeStore={activeStore} user={user} />;
      case 'EMPLOYEE':
        return <DashboardEmployee activeStore={activeStore} user={user} />;
      default:
        return (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center animate-fade-in">
            <h2 className="text-lg font-semibold text-slate-800 mb-2">Welcome, {user?.username || 'User'}!</h2>
            <p className="text-slate-500 text-sm">Please log in with appropriate credentials to access the ERP dashboard.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 min-h-screen pb-16">
      {/* Dynamic Role Dashboard Content */}
      {renderDashboardByRole()}

      {/* Floating Action Trigger for Role Actions */}
      <QuickActions />
    </div>
  );
};

export default Dashboard;
