import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, UserCircle, Receipt, QrCode, Wrench, CalendarClock,
  Megaphone, PhoneCall, ScanLine, ShieldAlert, ClipboardList, Building2,
  Landmark, Siren, X, LogOut, UserCheck, MapPinned
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const navByRole = {
  resident: [
    { to: '/resident/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/resident/profile', label: 'My Profile', icon: UserCircle },
    { to: '/resident/bills', label: 'Maintenance Bills', icon: Receipt },
    { to: '/resident/visitors', label: 'Visitor Passes', icon: QrCode },
    { to: '/resident/complaints', label: 'Complaints', icon: Wrench },
    { to: '/resident/amenities', label: 'Amenity Booking', icon: CalendarClock },
    { to: '/resident/notices', label: 'Notices & Polls', icon: Megaphone },
    { to: '/resident/emergency', label: 'Emergency', icon: PhoneCall },
    { to: '/society-map', label: 'Society Map', icon: MapPinned },
  ],
  guard: [
    { to: '/guard/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/guard/visitor-log', label: 'Visitor Log Entry', icon: ClipboardList },
    { to: '/guard/verify', label: 'Pass Verification', icon: ScanLine },
    { to: '/guard/overstay', label: 'Overstay Alerts', icon: ShieldAlert },
    { to: '/society-map', label: 'Society Map', icon: MapPinned },
  ],
  staff: [
    { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/helpdesk', label: 'Helpdesk Routing', icon: Wrench },
    { to: '/admin/security-logs', label: 'Security Logs', icon: ShieldAlert },
    { to: '/society-map', label: 'Society Map', icon: MapPinned },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/residents', label: 'Residents', icon: UserCheck },
    { to: '/admin/flats', label: 'Flats', icon: Building2 },
    { to: '/admin/billing', label: 'Billing Engine', icon: Landmark },
    { to: '/admin/helpdesk', label: 'Helpdesk Routing', icon: Wrench },
    { to: '/admin/amenities', label: 'Amenity Bookings', icon: CalendarClock },
    { to: '/admin/security-logs', label: 'Security Logs', icon: ShieldAlert },
    { to: '/admin/notices', label: 'Notices & Alerts', icon: Siren },
    { to: '/admin/staff', label: 'Staff Management', icon: UserCheck },
    { to: '/society-map', label: 'Society Map', icon: MapPinned },
  ],
};

export const roleLabels = {
  resident: 'Resident',
  guard: 'Security Guard',
  staff: 'Staff Member',
  admin: 'Administrator',
};

export default function Sidebar({ role, open, onNavigate }) {
  const { logout, user } = useAuth();
  const navItems = navByRole[role] || navByRole.resident;

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-800/80 bg-slate-950 text-slate-100 lg:sticky lg:top-0 lg:h-screen lg:inset-y-0 lg:left-auto ${
        open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } lg:opacity-100 lg:pointer-events-auto`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800/80 px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 font-bold text-slate-950 shadow-md shadow-cyan-500/20">
            S
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">
              Smart<span className="text-cyan-400">Society</span>
            </span>
            <p className="text-[10px] uppercase tracking-wider text-slate-400">
              {roleLabels[role] || 'Portal'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigate}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Profile & Logout */}
      <div className="border-t border-slate-800/80 p-4">
        <div className="flex items-center justify-between rounded-xl bg-slate-900/60 p-3 border border-slate-800">
          <div className="truncate">
            <p className="truncate text-xs font-bold text-slate-200">{user?.name || 'Logged User'}</p>
            <p className="truncate text-[10px] text-slate-400">{user?.email || 'user@smartsociety.com'}</p>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}