import React, { useEffect, useMemo, useState } from 'react';
import { Menu, Bell, User, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roleLabels } from './Sidebar';
import { getNotificationsForRole, markNotificationsRead, readNotifications } from '../../utils/notifications';

export default function Topbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [items, setItems] = useState(() => getNotificationsForRole(user?.role));

  useEffect(() => {
    const sync = () => setItems(getNotificationsForRole(user?.role));
    sync();
    window.addEventListener('smartsociety-notifications-updated', sync);
    return () => window.removeEventListener('smartsociety-notifications-updated', sync);
  }, [user?.role]);

  const notifications = useMemo(
    () => items.filter((n) => n.targetRole === user?.role || n.targetRole === 'all'),
    [items, user?.role]
  );
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleToggleNotifications() {
    const next = !showNotifications;
    setShowNotifications(next);

    if (next) {
      markNotificationsRead(user?.role);
      setItems(readNotifications().filter((n) => n.targetRole === user?.role || n.targetRole === 'all'));
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 backdrop-blur-md lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg border border-slate-800 p-2 text-slate-300 hover:bg-slate-900 hover:text-white lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <h1 className="text-sm font-bold text-white sm:text-base">
            Welcome back, <span className="text-cyan-400">{user?.name?.split(' ')[0] || 'User'}</span>
          </h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            Clifton Heights Management Portal
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        <div className="relative">
          <button
            onClick={handleToggleNotifications}
            className="relative rounded-full border border-slate-800 bg-slate-900 p-2 text-slate-300 transition-colors hover:border-slate-700 hover:text-white"
            aria-label="Open notifications"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-cyan-400 px-1 text-[10px] font-bold text-slate-950">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
              <div className="border-b border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
                Notifications
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-3 py-4 text-sm text-slate-400">No new alerts.</div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification.id} className="border-b border-slate-800 px-3 py-3 last:border-b-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-white">{notification.title}</p>
                        {!notification.read && <span className="h-2 w-2 rounded-full bg-cyan-400" />}
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{notification.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-slate-800 bg-slate-900/80 px-3 py-1.5 sm:flex">
          <Shield size={14} className="text-cyan-400" />
          <span className="text-xs font-semibold text-slate-300">
            {roleLabels[user?.role] || 'User'}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-400 transition-all hover:bg-rose-500 hover:text-white"
        >
          <LogOut size={14} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}