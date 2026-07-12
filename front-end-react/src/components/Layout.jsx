import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Package, Users, LogOut, Tags, Truck, FileText, Activity } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Products', href: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Categories', href: '/categories', icon: Tags, roles: ['ADMIN', 'MANAGER'] },
    { name: 'Inventory', href: '/inventory', icon: Truck, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Orders', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
    { name: 'Activity Logs', href: '/activity-logs', icon: Activity, roles: ['ADMIN'] },
    { name: 'Users', href: '/users', icon: Users, roles: ['ADMIN'] },
  ].filter(item => item.roles.includes(user?.role));

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <span className="text-xl font-bold text-indigo-600">InventorySystem</span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigation.map((item) => {
            const active = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${active ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
          <h2 className="text-xl font-semibold text-slate-800">
            {navigation.find(n => n.href === location.pathname)?.name || 'Dashboard'}
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-2">
                {user?.username?.[0]?.toUpperCase()}
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">{user?.username}</p>
                <p className="text-xs text-slate-500">{user?.role}</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-500 hover:text-slate-700 p-2">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
