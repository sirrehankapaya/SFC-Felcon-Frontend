import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Plus, Search, X, XCircle } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { Input, Select } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import { useCollection } from '../../hooks/useCollection';
import { approveBooking, cancelBooking } from '../../services/amenityService';
import { formatDate } from '../../utils/format';

const AMENITY_STORAGE_KEY = 'smartsociety_amenities';

function readStoredAmenities() {
  try {
    const saved = localStorage.getItem(AMENITY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Could not load amenities from storage:', err);
  }

  const fallback = [
    { id: 'clubhouse', name: 'Clubhouse', description: 'Main hall, seats up to 80 for functions and gatherings.', capacity: 80, openTime: '09:00', closeTime: '22:00' },
    { id: 'swimming_pool', name: 'Swimming Pool', description: 'Open lap pool, one hour slots.', capacity: 15, openTime: '06:00', closeTime: '20:00' },
    { id: 'tennis_court', name: 'Tennis Court', description: 'Single hard court, booked in 1 hour slots.', capacity: 4, openTime: '06:00', closeTime: '21:00' },
    { id: 'party_hall', name: 'Party Hall', description: 'Smaller hall for birthdays and family events.', capacity: 40, openTime: '10:00', closeTime: '23:00' },
    { id: 'gym', name: 'Gymnasium', description: 'Fully equipped gym.', capacity: 20, openTime: '06:00', closeTime: '22:00' },
    { id: 'garden', name: 'Garden', description: 'Community garden area.', capacity: 50, openTime: '06:00', closeTime: '22:00' },
  ];
  localStorage.setItem(AMENITY_STORAGE_KEY, JSON.stringify(fallback));
  return fallback;
}

function normaliseStatus(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'pending') return 'Pending';
  if (raw === 'approved') return 'Approved';
  if (raw === 'cancelled') return 'Cancelled';
  if (raw === 'completed') return 'Completed';
  return String(value || 'Pending');
}

function normaliseAmenityName(value) {
  const raw = String(value || '').trim().toLowerCase();
  const map = {
    clubhouse: 'Clubhouse',
    swimming_pool: 'Swimming Pool',
    tennis_court: 'Tennis Court',
    party_hall: 'Party Hall',
    gym: 'Gym',
    garden: 'Garden',
    park: 'Park',
    parking: 'Parking',
  };
  return map[raw] || String(value || 'Amenity');
}

export default function Amenities() {
  const bookings = useCollection('bookings');
  const residents = useCollection('residents');
  const flats = useCollection('flats');
  const [amenities, setAmenities] = useState(() => readStoredAmenities());
  const [showAmenityModal, setShowAmenityModal] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    capacity: '20',
    openTime: '09:00',
    closeTime: '21:00',
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    const syncAmenities = () => setAmenities(readStoredAmenities());
    syncAmenities();
    window.addEventListener('smartsociety-amenities-updated', syncAmenities);
    return () => window.removeEventListener('smartsociety-amenities-updated', syncAmenities);
  }, []);

  const residentMap = useMemo(() => {
    return (residents || []).reduce((acc, r) => {
      const id = r.id || r._id || r.userId;
      if (id) acc[String(id)] = r;
      return acc;
    }, {});
  }, [residents]);

  const flatMap = useMemo(() => {
    return (flats || []).reduce((acc, f) => {
      const id = f.id || f._id;
      if (id) acc[String(id)] = f;
      return acc;
    }, {});
  }, [flats]);

  const filteredBookings = useMemo(() => {
    return (bookings || [])
      .filter((booking) => {
        const residentId = booking.residentId && typeof booking.residentId === 'object'
          ? (booking.residentId._id || booking.residentId.id)
          : booking.residentId;
        const flatId = booking.flatId && typeof booking.flatId === 'object'
          ? (booking.flatId._id || booking.flatId.id)
          : booking.flatId;

        const residentName = residentMap[String(residentId)]?.name || '';
        const flatNumber = flatId ? (flatMap[String(flatId)]?.flatNumber || flatMap[String(flatId)]?.number || '') : '';
        const q = search.trim().toLowerCase();

        const matchesSearch =
          !q ||
          residentName.toLowerCase().includes(q) ||
          flatNumber.toLowerCase().includes(q) ||
          normaliseAmenityName(booking.amenity).toLowerCase().includes(q) ||
          (booking.date ? formatDate(booking.date).toLowerCase().includes(q) : false);

        const matchesStatus =
          statusFilter === 'All' || normaliseStatus(booking.status) === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }, [bookings, flatMap, residentMap, search, statusFilter]);

  async function handleApprove(bookingId) {
    if (!bookingId) return;
    await approveBooking(bookingId);
    bookings.refetch && bookings.refetch();
  }

  async function handleCancel(bookingId) {
    if (!bookingId) return;
    await cancelBooking(bookingId);
    bookings.refetch && bookings.refetch();
  }

  function handleAmenitySubmit() {
    const trimmedName = form.name.trim();
    const trimmedDescription = form.description.trim();
    if (!trimmedName || !trimmedDescription) return;

    const nextAmenity = {
      id: trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
      name: trimmedName,
      description: trimmedDescription,
      capacity: Number(form.capacity) || 20,
      openTime: form.openTime,
      closeTime: form.closeTime,
    };

    const updated = [...amenities, nextAmenity];
    localStorage.setItem(AMENITY_STORAGE_KEY, JSON.stringify(updated));
    setAmenities(updated);
    window.dispatchEvent(new CustomEvent('smartsociety-amenities-updated'));
    setShowAmenityModal(false);
    setForm({ name: '', description: '', capacity: '20', openTime: '09:00', closeTime: '21:00' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Amenity Bookings"
        description="Review all facility reservations, approve pending requests, and manage society amenity usage."
        action={
          <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} onClick={() => setShowAmenityModal(true)}>
            <Plus size={16} className="mr-2" />
            Add Amenity
          </Button>
        }
      />

      <Modal
        open={showAmenityModal}
        onClose={() => setShowAmenityModal(false)}
        title="Add New Amenity"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowAmenityModal(false)}>Cancel</Button>
            <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} onClick={handleAmenitySubmit}>Save Amenity</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Amenity name</label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Swimming Pool" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-700">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe the amenity"
              className="min-h-24 w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none transition focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Capacity</label>
              <Input type="number" min="1" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
            </div>
            <div></div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Open time</label>
              <Input type="time" value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-700">Close time</label>
              <Input type="time" value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>

      <Card>
        <CardHeader
          title="Booking Overview"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-56">
                <Search size={16} className="absolute left-3 top-2.5 text-ink-400" />
                <Input
                  placeholder="Search resident/flat"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-36">
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Completed">Completed</option>
              </Select>
            </div>
          }
        />

        <CardBody className="p-0">
          {filteredBookings.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No amenity bookings found"
              description="No bookings match the current filter or there are no reservations yet."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-ink-100 bg-ink-50/50 text-xs font-semibold text-ink-500">
                  <tr>
                    <th className="px-4 py-3">Resident</th>
                    <th className="px-4 py-3">Flat</th>
                    <th className="px-4 py-3">Amenity</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Slot</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {filteredBookings.map((booking) => {
                    const residentId = booking.residentId && typeof booking.residentId === 'object'
                      ? (booking.residentId._id || booking.residentId.id)
                      : booking.residentId;
                    const flatId = booking.flatId && typeof booking.flatId === 'object'
                      ? (booking.flatId._id || booking.flatId.id)
                      : booking.flatId;
                    const resident = residentId ? residentMap[String(residentId)] : null;
                    const flat = flatId ? flatMap[String(flatId)] : null;
                    const status = normaliseStatus(booking.status);

                    return (
                      <tr key={booking.id || booking._id} className="hover:bg-ink-50/50">
                        <td className="px-4 py-3 font-semibold text-ink-900">{resident?.name || 'Resident'}</td>
                        <td className="px-4 py-3 text-ink-700">{flat ? (flat.flatNumber || flat.number) : '—'}</td>
                        <td className="px-4 py-3 text-ink-700">{normaliseAmenityName(booking.amenity)}</td>
                        <td className="px-4 py-3 text-ink-600">{booking.date ? formatDate(booking.date) : '—'}</td>
                        <td className="px-4 py-3 text-ink-600">{booking.startTime} - {booking.endTime}</td>
                        <td className="px-4 py-3">
                          <Badge tone={status === 'Approved' ? 'success' : status === 'Pending' ? 'warning' : status === 'Cancelled' ? 'danger' : 'neutral'}>
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {status === 'Pending' && (
                              <Button size="sm" onClick={() => handleApprove(booking.id || booking._id)}>
                                <CheckCircle2 size={14} className="mr-1" /> Approve
                              </Button>
                            )}
                            {(status === 'Pending' || status === 'Approved') && (
                              <Button variant="secondary" size="sm" onClick={() => handleCancel(booking.id || booking._id)}>
                                <XCircle size={14} className="mr-1" /> Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
