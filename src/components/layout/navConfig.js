import {
  LayoutDashboard, UserCircle, Receipt, QrCode, Wrench, CalendarClock,
  Megaphone, PhoneCall, ScanLine, ShieldAlert, ClipboardList, Building2,
  Landmark, Siren, Users,
} from 'lucide-react';

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
  ],
  guard: [
    { to: '/guard/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/guard/visitor-log', label: 'Visitor Log Entry', icon: ClipboardList },
    { to: '/guard/verify', label: 'Pass Verification', icon: ScanLine },
    { to: '/guard/overstay', label: 'Overstay Alerts', icon: ShieldAlert },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/residents', label: 'Residents', icon: Users },
    { to: '/admin/flats', label: 'Flats', icon: Building2 },
    { to: '/admin/billing', label: 'Billing Engine', icon: Landmark },
    { to: '/admin/helpdesk', label: 'Helpdesk Routing', icon: Wrench },
    { to: '/admin/security-logs', label: 'Security Logs', icon: ShieldAlert },
    { to: '/admin/notices', label: 'Notices & Alerts', icon: Siren },
  ],
};

export const roleLabels = {
  resident: 'Resident',
  guard: 'Security Guard',
  admin: 'Administrator',
};
