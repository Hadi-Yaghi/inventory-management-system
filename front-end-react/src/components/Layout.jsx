import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/auth-context';
import { getNotifications, markNotificationAsRead } from '../api/misc';
import {
  LayoutDashboard, Package, Users, LogOut, Tags, Truck, FileText,
  Activity, RotateCcw, Star, Download, ShoppingCart, Bell, Search,
  Menu, X, ChevronLeft, ChevronRight, Store, ShieldAlert,
  User, Check, AlertCircle, Info, HelpCircle, Building2
} from 'lucide-react';

const Layout = () => {
  const { user, logout, activeStore, changeActiveStore } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [allStores, setAllStores] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notificationRef = useRef(null);

  // Load all stores for Admin
  useEffect(() => {
    if (user?.role === 'ADMIN') {
      import('../api/axios').then(({ default: api }) => {
        api.get('/store')
          .then(res => setAllStores(res.data))
          .catch(err => console.error(err));
      });
    }
  }, [user]);

  // Notifications API Integration
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 20000, // Poll notifications every 20 seconds
    enabled: !!user,
  });

  const readMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  // Close notifications modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const navGroups = [
    {
      title: 'Overview',
      items: [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'Inventory Control',
      items: [
        { name: 'Products', href: '/products', icon: Package, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        { name: 'Categories', href: '/categories', icon: Tags, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Stock Levels', href: '/inventory', icon: Truck, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Orders', href: '/orders', icon: FileText, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        { name: 'Purchase Orders', href: '/purchase-orders', icon: ShoppingCart, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        { name: 'Returns', href: '/returns', icon: RotateCcw, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
        { name: 'Reviews', href: '/reviews', icon: Star, roles: ['ADMIN', 'MANAGER', 'EMPLOYEE'] },
      ]
    },
    {
      title: 'Administration',
      items: [
        { name: 'Reports', href: '/reports', icon: Download, roles: ['ADMIN', 'MANAGER'] },
        { name: 'Activity Logs', href: '/activity-logs', icon: Activity, roles: ['ADMIN'] },
        { name: 'User Directory', href: '/users', icon: Users, roles: ['ADMIN'] },
        { name: 'Organization', href: '/organization-settings', icon: Building2, roles: ['ADMIN', 'MANAGER'] },
      ]
    }
  ];

  // Helper for notification type colors & icons
  const getNotificationIcon = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('low') || t.includes('stock')) return <AlertCircle className="h-5 w-5 text-amber-500" />;
    if (t.includes('transfer') || t.includes('transfer completed')) return <Truck className="h-5 w-5 text-blue-500" />;
    if (t.includes('error') || t.includes('fail')) return <ShieldAlert className="h-5 w-5 text-red-500" />;
    return <Info className="h-5 w-5 text-neutral-500" />;
  };

  const getRoleColorBadge = (role) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-50 border-red-200 text-red-700';
      case 'MANAGER': return 'bg-amber-50 border-amber-200 text-amber-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* Sidebar - Desktop */}
      <div 
        className={`bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-300 hidden md:flex ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
          {!sidebarCollapsed && (
            <span className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
              <Store className="h-5 w-5 text-brand-500" />
              Aegis <span className="text-brand-500">ERP</span>
            </span>
          )}
          {sidebarCollapsed && (
            <Store className="h-6 w-6 text-brand-500 mx-auto" />
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-white transition-colors focus:outline-none"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {navGroups.map((group, idx) => {
            const filteredItems = group.items.filter(item => item.roles.includes(user?.role));
            if (filteredItems.length === 0) return null;

            return (
              <div key={idx} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-display">
                    {group.title}
                  </p>
                )}
                {filteredItems.map((item) => {
                  const active = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      title={sidebarCollapsed ? item.name : undefined}
                      className={`flex items-center rounded-lg text-sm font-medium transition-all duration-150 py-2.5 ${
                        sidebarCollapsed ? 'justify-center px-0' : 'px-3'
                      } ${
                        active 
                          ? 'bg-brand-600 text-white shadow-md shadow-brand-500/10' 
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                      {!sidebarCollapsed && <span>{item.name}</span>}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button 
            onClick={logout}
            className={`w-full flex items-center rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-all py-2.5 ${
              sidebarCollapsed ? 'justify-center px-0' : 'px-3'
            }`}
          >
            <LogOut className="h-5 w-5" />
            {!sidebarCollapsed && <span className="ml-3">Sign Out</span>}
          </button>
        </div>
      </div>

      {/* Sidebar - Mobile / Drawer overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm">
          <div className="w-64 bg-slate-900 flex flex-col h-full animate-slide-in shadow-xl">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950">
              <span className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
                <Store className="h-5 w-5 text-brand-500" />
                Aegis <span className="text-brand-500">ERP</span>
              </span>
              <button 
                onClick={() => setMobileSidebarOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
              {navGroups.map((group, idx) => {
                const filteredItems = group.items.filter(item => item.roles.includes(user?.role));
                if (filteredItems.length === 0) return null;

                return (
                  <div key={idx} className="space-y-1">
                    <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 font-display">
                      {group.title}
                    </p>
                    {filteredItems.map((item) => {
                      const active = location.pathname === item.href;
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileSidebarOpen(false)}
                          className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            active 
                              ? 'bg-brand-600 text-white' 
                              : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <item.icon className="mr-3 h-5 w-5" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800 bg-slate-950/40">
              <button 
                onClick={logout}
                className="w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-red-950/30 hover:text-red-400 transition-all"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Panel Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-40 sticky top-0 shadow-sm">
          {/* Mobile Drawer Trigger */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileSidebarOpen(true)}
              className="text-slate-600 hover:text-slate-900 md:hidden focus:outline-none"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* ERP Search Simulation */}
            <div className="relative hidden sm:block max-w-xs md:max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </span>
              <input 
                type="text" 
                placeholder="Search inventory, orders... (Ctrl+K)" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 md:w-64 pl-9 pr-3 py-1.5 bg-slate-100 hover:bg-slate-150 focus:bg-white text-sm text-slate-700 placeholder-slate-400 rounded-lg border border-transparent focus:border-brand-500 focus:outline-none transition-all focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* User & Store Actions */}
          <div className="flex items-center space-x-4">
            {/* Dynamic Store Switcher dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-semibold hidden md:inline uppercase tracking-wider">Store:</span>
              {user?.role === 'ADMIN' ? (
                <select
                  value={activeStore?.id || 'all'}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      changeActiveStore(null);
                    } else {
                      const selectedStore = allStores.find(s => s.id === parseInt(e.target.value));
                      changeActiveStore(selectedStore);
                    }
                  }}
                  className="text-xs md:text-sm border border-slate-200 rounded-lg py-1 px-2.5 bg-slate-50 hover:bg-slate-100 cursor-pointer font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Stores (Global)</option>
                  {allStores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={activeStore?.id || ''}
                  onChange={(e) => {
                    const selectedStore = user?.assignedStores?.find(s => s.id === parseInt(e.target.value));
                    changeActiveStore(selectedStore);
                  }}
                  className="text-xs md:text-sm border border-slate-200 rounded-lg py-1 px-2.5 bg-slate-50 hover:bg-slate-100 cursor-pointer font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {user?.assignedStores?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Notification Bell Dropdown Panel */}
            <div className="relative" ref={notificationRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-slate-500 hover:bg-slate-100 hover:text-slate-800 p-2 rounded-lg relative transition-all"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-red-500 text-[10px] font-extrabold text-white flex items-center justify-center animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 animate-fade-in">
                  <div className="px-4 py-3 bg-slate-50 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-800">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-medium text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full">
                        {unreadCount} unread
                      </span>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center text-slate-500 text-xs">
                        No notifications found.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (!n.read) readMutation.mutate(n.id);
                          }}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-slate-50 flex gap-3 items-start ${
                            !n.read ? 'bg-blue-50/30' : ''
                          }`}
                        >
                          <div className="mt-0.5 shrink-0">
                            {getNotificationIcon(n.title)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs text-slate-900 truncate font-semibold ${!n.read ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5 break-words line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </p>
                          </div>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-brand-600 shrink-0 mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2 text-center bg-slate-50">
                    <span className="text-[11px] font-semibold text-slate-500">Auto-refresh active</span>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Card */}
            <div className="flex items-center border-l border-slate-200 pl-4 mr-1">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-sm mr-2.5">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="hidden lg:block text-left mr-2">
                <p className="text-xs font-semibold text-slate-800 leading-3">{user?.username}</p>
                <span className={`inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border mt-1 ${getRoleColorBadge(user?.role)}`}>
                  {user?.role}
                </span>
              </div>
            </div>
            {/* Header Sign Out */}
            <button 
              onClick={logout}
              title="Sign Out"
              className="text-slate-400 hover:text-red-500 p-2 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none shrink-0"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 overflow-auto bg-[#f8fafc] p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
