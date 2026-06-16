import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import api from '../utils/api';
import { 
  Home, 
  Receipt, 
  ArrowLeftRight, 
  Activity, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Copy, 
  Check, 
  Menu, 
  X,
  Share2
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, token, room, logout, setRoomData, setBalancesAndSettlements, setNotifications, notifications } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [copied, setCopied] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [desktopNavOpen, setDesktopNavOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Guard
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Room Guard - if not in room, redirect to onboarding pages (create/join room)
  const isOboardingPage = ['/create-room', '/join-room'].includes(location.pathname);
  if (!user.activeRoomId && !isOboardingPage) {
    return <Navigate to="/join-room" replace />;
  }

  // If user IS in room, but on onboarding pages, redirect to dashboard
  if (user.activeRoomId && isOboardingPage) {
    return <Navigate to="/dashboard" replace />;
  }

  // Fetch Room & Balance Data periodically or on mount
  useEffect(() => {
    if (!user.activeRoomId) return;

    const fetchRoomDetails = async () => {
      try {
        const roomRes = await api.get('/rooms/my-room');
        setRoomData(roomRes.data.room, roomRes.data.members);

        const balanceRes = await api.get('/settlements/balances');
        setBalancesAndSettlements(balanceRes.data.balances, balanceRes.data.settlements);

        const notifRes = await api.get('/notifications');
        setNotifications(notifRes.data.notifications);
      } catch (err) {
        console.error('Failed to load active room data:', err.message);
        if (err.response && err.response.status === 401) {
          logout();
        }
      }
    };

    fetchRoomDetails();
  }, [user.activeRoomId]);

  const copyRoomCode = () => {
    if (!room?.roomCode) return;
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      const updatedNotifs = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Expenses', path: '/expenses', icon: Receipt },
    { name: 'Settle Up', path: '/settle', icon: ArrowLeftRight },
    { name: 'Timeline', path: '/timeline', icon: Activity },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* 1. Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300 z-20 ${desktopNavOpen ? 'w-64' : 'w-20'}`}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-extrabold text-sm">₹</span>
            </div>
            {desktopNavOpen && (
              <span className="font-extrabold text-white text-lg tracking-tight">Roomies Khata</span>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/10'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <IconComponent className={`h-5 w-5 ${desktopNavOpen ? 'mr-3' : 'mx-auto'}`} />
                {desktopNavOpen && <span>{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info Bottom */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between">
          {desktopNavOpen ? (
            <div className="flex items-center space-x-3 overflow-hidden">
              <img
                src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
                alt="Avatar"
                className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700"
              />
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-slate-200 truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>
          ) : (
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}
              alt="Avatar"
              className="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 mx-auto"
            />
          )}
          {desktopNavOpen && (
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-danger-500 transition-colors p-1.5 hover:bg-slate-800 rounded-lg"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          )}
        </div>
      </aside>

      {/* 2. Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-10 sticky top-0">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDesktopNavOpen(!desktopNavOpen)}
              className="hidden md:block text-slate-400 hover:text-slate-200"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col">
              {room ? (
                <>
                  <span className="text-sm font-bold text-slate-200">{room.name}</span>
                  <div className="flex items-center space-x-1.5 text-xs text-slate-400">
                    <span>Code: {room.roomCode}</span>
                    <button 
                      onClick={copyRoomCode} 
                      className="hover:text-brand-400 transition-colors"
                      title="Copy Room Invite Code"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-success-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </>
              ) : (
                <span className="font-bold text-slate-200">Roomies Khata</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Notification bell dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-danger-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Box */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
                    <span className="font-bold text-sm text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-brand-400 hover:text-brand-300">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="divide-y divide-slate-800 max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-center text-xs py-6 text-slate-500">No notifications yet</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n._id} className={`p-3 text-xs transition-colors ${n.isRead ? 'opacity-65' : 'bg-slate-800/30'}`}>
                          <p className="font-semibold text-slate-300">{n.title}</p>
                          <p className="text-slate-400 mt-0.5">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Logout button (Mobile only header logout) */}
            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-slate-400 hover:text-danger-500 hover:bg-slate-800 rounded-xl"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
          <Outlet />
        </main>

        {/* 3. Bottom Navigation Bar for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-lg border-t border-slate-800 py-2.5 px-6 flex justify-between items-center z-20 shadow-2xl">
          {navItems.slice(0, 4).map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center space-y-1 ${
                  isActive ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <IconComponent className="h-5 w-5" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
          {/* Settings mobile link */}
          <Link
            to="/settings"
            className={`flex flex-col items-center space-y-1 ${
              location.pathname === '/settings' ? 'text-brand-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="h-5 w-5" />
            <span className="text-[10px] font-medium">Settings</span>
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
