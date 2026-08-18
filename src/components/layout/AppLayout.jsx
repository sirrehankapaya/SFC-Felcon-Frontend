import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import EmergencySOS from '../EmergencySOS';

export default function AppLayout() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 1024;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    const syncLayout = () => {
      const desktop = mediaQuery.matches;
      setIsDesktop(desktop);
      if (desktop) setSidebarOpen(true);
      else if (!sidebarOpen) setSidebarOpen(false);
    };

    syncLayout();
    mediaQuery.addEventListener?.('change', syncLayout);

    return () => mediaQuery.removeEventListener?.('change', syncLayout);
  }, []);

  const handleSidebarToggle = () => {
    if (isDesktop) return;
    setSidebarOpen((prev) => !prev);
  };

  const sidebarVisible = isDesktop || sidebarOpen;

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar role={user?.role} open={sidebarVisible} onNavigate={() => setSidebarOpen(false)} />

      {!isDesktop && sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1">
        <Topbar onMenuClick={handleSidebarToggle} />
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
        <EmergencySOS />
      </div>
    </div>
  );
}
