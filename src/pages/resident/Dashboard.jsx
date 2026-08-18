import { useNavigate } from 'react-router-dom';
import {
  Receipt,
  Wrench,
  QrCode,
  CalendarClock,
  Pin,
  ArrowRight,
  Plus,
  Building,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { getSociety } from '../../data/db';
import Button from '../../components/ui/Button';
import { formatPKR, formatDate } from '../../utils/format';
import CommunityEvents from '../../components/CommunityEvents';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const society = getSociety();

  const residents = useCollection('residents') || [];
  const flats = useCollection('flats') || [];
  const bills = useCollection('bills') || [];
  const complaints = useCollection('complaints') || [];
  const visitors = useCollection('visitors') || [];
  const bookings = useCollection('bookings') || [];
  const amenities = useCollection('amenities') || [];
  const notices = useCollection('notices') || [];

  // Robust ID Extractor Helper
  const normalizeId = (value) => {
    if (!value) return '';
    if (typeof value === 'object') return String(value._id || value.id || value.userId || value.flatId || value.residentId || '');
    return String(value);
  };

  const getObjId = (obj) => normalizeId(obj?.id || obj?._id || obj?.userId || obj?.residentId || obj?.flatId || obj);
  const normalizeStatus = (value) => String(value ?? '').trim().toLowerCase().replace(/[_\s-]+/g, '');

  const currentUserId = normalizeId(user?.id || user?._id || user?.userId);

  const resident = residents.find((r) => {
    const residentIds = [
      normalizeId(r?.id || r?._id),
      normalizeId(r?.userId),
      normalizeId(r?.flatId),
      normalizeId(user?.flatId),
      currentUserId,
    ].filter(Boolean);

    return residentIds.includes(currentUserId) || residentIds.includes(String(user?.id || user?._id || ''));
  });

  const residentId = normalizeId(resident?.id || resident?._id || resident?.userId);
  const residentFlatId = normalizeId(resident?.flatId || user?.flatId);

  const flat = flats.find((f) => {
    const fId = normalizeId(f?.id || f?._id || f?.flatId);
    return fId === residentFlatId || String(f.flatNumber || f.number) === residentFlatId;
  });

  const matchesResidentContext = (record) => {
    if (!record) return false;

    const targetIds = [
      currentUserId,
      residentId,
      normalizeId(resident?.userId),
      residentFlatId,
      normalizeId(user?.id),
      normalizeId(user?._id),
      normalizeId(user?.userId),
    ].filter(Boolean);

    const ids = [
      normalizeId(record.userId),
      normalizeId(record.residentId),
      normalizeId(record.flatId),
      normalizeId(record.id),
      normalizeId(record._id),
      normalizeId(record?.resident?._id),
      normalizeId(record?.resident?.id),
      normalizeId(record?.resident?.userId),
    ].filter(Boolean);

    return ids.some((value) => targetIds.includes(value));
  };

  // Filter My Bills (Flexible ID Matching)
  const myBills = bills.filter((b) => {
    const billMatch =
      (residentFlatId && normalizeId(b.flatId) === residentFlatId) ||
      (residentId && (normalizeId(b.residentId) === residentId || normalizeId(b.userId) === residentId)) ||
      (currentUserId && (normalizeId(b.residentId) === currentUserId || normalizeId(b.userId) === currentUserId)) ||
      matchesResidentContext(b);

    return billMatch || (!normalizeId(b.residentId) && !normalizeId(b.userId) && !normalizeId(b.flatId));
  });

  const myUnpaidBills = myBills.filter(
    (b) => normalizeStatus(b.status) === 'unpaid' || normalizeStatus(b.status) === 'overdue' || normalizeStatus(b.paymentStatus) === 'unpaid' || normalizeStatus(b.paymentStatus) === 'overdue'
  );

  // Display list: unpaid first, otherwise general myBills
  const displayBills = myUnpaidBills.length > 0 ? myUnpaidBills : myBills;
  const totalDue = myUnpaidBills.reduce((acc, b) => acc + (Number(b.amount) || Number(b.amountDue) || 0), 0);

  // Filter My Complaints
  const myComplaints = complaints.filter((c) => {
    const complaintResidentId = c.residentId && typeof c.residentId === 'object' ? getObjId(c.residentId) : String(c.residentId || '');
    const complaintUserId = c.userId && typeof c.userId === 'object' ? getObjId(c.userId) : String(c.userId || '');
    const complaintFlatId = String(c.flatId || '');

    return (
      (residentId && (complaintResidentId === residentId || complaintUserId === residentId)) ||
      (currentUserId && (complaintResidentId === currentUserId || complaintUserId === currentUserId)) ||
      (residentFlatId && complaintFlatId === residentFlatId) ||
      (!complaintResidentId && !complaintUserId && !complaintFlatId)
    );
  });

  const openComplaints = myComplaints.filter((c) => {
    const status = normalizeStatus(c.status);
    return status !== 'resolved' && status !== 'closed' && status !== 'completed';
  });

  // Filter My Visitors (Sort and Get Last 3 Active Passes)
  const myVisitors = visitors.filter((v) => {
    const flatMatches = residentFlatId && normalizeId(v.flatId) === residentFlatId;
    const residentMatches = residentId && (normalizeId(v.residentId) === residentId || normalizeId(v.userId) === residentId);
    const userMatches = currentUserId && (normalizeId(v.residentId) === currentUserId || normalizeId(v.userId) === currentUserId);

    return flatMatches || residentMatches || userMatches || matchesResidentContext(v) || (!normalizeId(v.residentId) && !normalizeId(v.userId) && !normalizeId(v.flatId));
  });

  const activeVisitors = myVisitors.filter(
    (v) => normalizeStatus(v.status) === 'active' || normalizeStatus(v.status) === 'pending' || normalizeStatus(v.status) === 'approved'
  );

  // Show latest 3 active passes if available, otherwise latest 3 generated passes
  const displayVisitors = (activeVisitors.length > 0 ? activeVisitors : myVisitors)
    .slice()
    .reverse()
    .slice(0, 3);

  // Filter Amenity Bookings
  const myBookings = bookings.filter((b) => {
    const bResId = String(b.residentId || b.userId || '');
    return (currentUserId && bResId === currentUserId) || !bResId;
  });

  // Notices
  const activeNotices = notices.filter((n) => n.status === 'active' || !n.status);
  const pinnedNotice = activeNotices.find((n) => n.pinned) || activeNotices[0];

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Welcome Header */}
        <div className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3.5 py-1 text-xs font-semibold text-cyan-700">
                <Sparkles size={13} className="text-cyan-600" />
                {society?.name || 'Smart Resident Workspace'}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Welcome back, {user?.name || 'Resident'}! 👋
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-xl">
                Manage your resident services, check active guest passes, review pending bills, and track society updates seamlessly.
              </p>
            </div>

            {/* Residence Badge */}
            <div className="flex items-center gap-3 shrink-0 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20">
                <Building size={20} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Assigned Flat</p>
                <p className="text-sm font-bold text-slate-900">
                  {flat
                    ? `Flat ${flat.flatNumber || flat.number} (${flat.tower || flat.block || 'Tower'})`
                    : residentFlatId
                    ? `Flat ${residentFlatId}`
                    : 'No Flat Assigned'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Stats Grid Overview */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          
          {/* Total Pending Dues */}
          <div 
            onClick={() => navigate('/resident/bills')}
            className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-rose-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Pending Dues</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 transition-transform duration-300 group-hover:scale-110">
                <Receipt size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{formatPKR(totalDue)}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <span className={myUnpaidBills.length > 0 ? 'text-rose-600 font-bold' : 'text-emerald-600'}>
                {myUnpaidBills.length} unpaid bill{myUnpaidBills.length !== 1 ? 's' : ''}
              </span>
            </p>
          </div>

          {/* Active Guest Passes */}
          <div 
            onClick={() => navigate('/resident/visitors')}
            className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Active Guest Passes</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 border border-cyan-100 transition-transform duration-300 group-hover:scale-110">
                <QrCode size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{activeVisitors.length || myVisitors.length}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500 flex items-center gap-1">
              <span>{myVisitors.length} total generated</span>
            </p>
          </div>

          {/* Open Complaints */}
          <div 
            onClick={() => navigate('/resident/complaints')}
            className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Open Tickets</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 transition-transform duration-300 group-hover:scale-110">
                <Wrench size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{openComplaints.length}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              {Math.max(0, myComplaints.length - openComplaints.length)} resolved issues
            </p>
          </div>

          {/* Amenity Bookings */}
          <div 
            onClick={() => navigate('/resident/amenities')}
            className="group relative cursor-pointer overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Amenity Bookings</span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 transition-transform duration-300 group-hover:scale-110">
                <CalendarClock size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{myBookings.length}</p>
            <p className="mt-1 text-[11px] font-medium text-slate-500">
              Active reservations
            </p>
          </div>

        </div>

        {/* Pinned Notice Section */}
        {pinnedNotice && (
          <div className="relative overflow-hidden rounded-[1.5rem] border border-cyan-200 bg-gradient-to-r from-cyan-50/60 via-white to-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md shadow-cyan-600/20">
                  <Pin size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Pinned Announcement</span>
                    <span className="text-xs text-slate-400">• {formatDate(pinnedNotice.createdAt)}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{pinnedNotice.title}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{pinnedNotice.content}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/resident/notices')}
                className="shrink-0 border-slate-200 bg-white text-xs text-slate-700 hover:bg-slate-50 hover:border-cyan-300 rounded-xl"
              >
                View Notice
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            </div>
          </div>
        )}

        {/* Action Grid Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          
          {/* Dynamic Maintenance Bills */}
          <div className="flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Receipt size={18} className="text-cyan-600" />
                <h2 className="text-base font-bold text-slate-900">Maintenance Bills</h2>
              </div>
              <button
                onClick={() => navigate('/resident/bills')}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1"
              >
                View all <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-4 flex-1">
              {displayBills.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">All caught up!</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No maintenance bills found on your account.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayBills.slice(0, 3).map((bill, index) => {
                    const isUnpaid = String(bill.status).toLowerCase() === 'unpaid' || String(bill.status).toLowerCase() === 'overdue';
                    return (
                      <div
                        key={bill.id || bill._id || index}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-200"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">{bill.month || 'Monthly'} Maintenance Fee</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Clock size={11} className="text-slate-400" />
                            Due date: {formatDate(bill.dueDate)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-extrabold text-slate-900">{formatPKR(bill.amount)}</p>
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold mt-0.5 border ${
                            isUnpaid 
                              ? 'bg-rose-50 text-rose-600 border-rose-100' 
                              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                          }`}>
                            {bill.status || 'Paid'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Active Visitor Passes (Last 3) */}
          <div className="flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <QrCode size={18} className="text-cyan-600" />
                <h2 className="text-base font-bold text-slate-900">Active Passes (Last 3)</h2>
              </div>
              <Button
                size="sm"
                onClick={() => navigate('/resident/visitors')}
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs rounded-xl shadow-sm"
              >
                <Plus size={14} className="mr-1" /> New Pass
              </Button>
            </div>

            <div className="mt-4 flex-1">
              {displayVisitors.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <QrCode size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No Active Passes</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Generate a guest pass before your visitor arrives.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayVisitors.map((v, index) => (
                    <div
                      key={v.id || v._id || index}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-200"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-900">{v.visitorName || v.name || 'Guest Visitor'}</p>
                        <p className="text-[11px] text-slate-500">
                          Passcode: <span className="font-mono text-cyan-700 font-bold">{v.passCode || v.passcode || v.code || '—'}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block rounded-full bg-cyan-50 px-2.5 py-0.5 text-[10px] font-bold text-cyan-700 border border-cyan-100">
                          {v.type || v.purpose || v.visitorType || 'Guest'}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDate(v.validTo || v.validUntil || v.validFrom || v.createdAt || v.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Complaints */}
          <div className="flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Wrench size={18} className="text-amber-600" />
                <h2 className="text-base font-bold text-slate-900">Complaints & Tickets</h2>
              </div>
              <button
                onClick={() => navigate('/resident/complaints')}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1"
              >
                Manage <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-4 flex-1">
              {myComplaints.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No Complaints Recorded</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">All reported issues have been resolved or none exist.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myComplaints.slice(0, 3).map((c, index) => {
                    const isResolved = String(c.status).toLowerCase() === 'resolved';
                    return (
                      <div
                        key={c.id || c._id || index}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-200"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">{c.category || c.title || 'Maintenance'}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{c.description || 'No additional details.'}</p>
                        </div>
                        <span className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                          isResolved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {c.status || 'Pending'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Booked Amenities */}
          <div className="flex flex-col rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <CalendarClock size={18} className="text-blue-600" />
                <h2 className="text-base font-bold text-slate-900">Amenity Reservations</h2>
              </div>
              <button
                onClick={() => navigate('/resident/amenities')}
                className="text-xs font-semibold text-cyan-600 hover:text-cyan-700 transition-colors flex items-center gap-1"
              >
                Book Hall/Court <ArrowRight size={13} />
              </button>
            </div>

            <div className="mt-4 flex-1">
              {myBookings.length === 0 ? (
                <div className="py-8 text-center text-slate-500">
                  <Calendar size={36} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-800">No Active Bookings</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Reserve society halls or sports courts ahead of time.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myBookings.slice(0, 3).map((booking, index) => {
                    const amenityId = String(booking.amenityId || booking.amenity || '');
                    const amenity = amenities.find((a) => getObjId(a) === amenityId || a.name === amenityId);
                    return (
                      <div
                        key={booking.id || booking._id || index}
                        className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-50 hover:border-slate-200"
                      >
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900">{amenity?.name || booking.amenityName || amenityId || 'Amenity'}</p>
                          <p className="text-[11px] text-cyan-700 font-medium">{formatDate(booking.date)}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-block rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            {booking.status || 'Confirmed'}
                          </span>
                          <p className="text-[10px] text-slate-400 mt-1 font-mono">{booking.slot || '—'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
      <CommunityEvents />
    </div>
  );
}
