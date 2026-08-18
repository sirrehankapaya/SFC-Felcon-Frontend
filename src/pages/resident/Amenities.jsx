import { useEffect, useMemo, useState } from 'react';
import { Calendar, Clock, Users, Building2, Waves, Trophy, PartyPopper, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCollection } from '../../hooks/useCollection';
import { formatDate } from '../../utils/format';
import { getResidentByUserId } from '../../services/residentService';
import { createBooking, cancelBooking, isSlotTaken } from '../../services/amenityService';

import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { Input, Label, FormRow } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import { toast } from '../../components/ui/Toast';

const amenityIcons = {
  Clubhouse: Building2,
  'Swimming Pool': Waves,
  'Tennis Court': Trophy,
  'Party Hall': PartyPopper,
};

function generateSlots(openTime, closeTime) {
  if (!openTime || !closeTime) return [];
  const [startHour] = openTime.split(':').map(Number);
  const [endHour] = closeTime.split(':').map(Number);
  const slots = [];
  for (let h = startHour; h < endHour; h++) {
    const from = `${String(h).padStart(2, '0')}:00`;
    const to = `${String(h + 1).padStart(2, '0')}:00`;
    slots.push(`${from} - ${to}`);
  }
  return slots;
}

export default function Amenities() {
  const { user } = useAuth();
  const amenities = useCollection('amenities') || [];
  const bookings = useCollection('bookings') || [];
  const [resident, setResident] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function loadResident() {
      if (!user?.id) {
        setResident(null);
        return;
      }

      const found = await getResidentByUserId(user.id);
      if (isMounted) setResident(found);
    }

    loadResident();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const residentId = resident?.id || user?.id;
  const flatId = resident?.flatId || user?.flatId;

  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotStatus, setSlotStatus] = useState({});
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const myBookings = bookings
    .filter((b) => b.residentId === residentId || (b.flatId && b.flatId === flatId))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  function handleOpenModal(amenity) {
    setSelectedAmenity(amenity);
    setBookingDate(todayStr);
    setSelectedSlot('');
    setError('');
  }

  function handleCloseModal() {
    setSelectedAmenity(null);
    setSelectedSlot('');
    setError('');
    setSuccessMessage('');
  }

  async function handleConfirmBooking() {
    if (!selectedAmenity || !bookingDate || !selectedSlot) {
      setError('Please select a date and a time slot');
      return;
    }

    if (!flatId || !residentId) {
      setError('Your resident flat is not linked yet. Please contact admin to assign your flat first.');
      return;
    }

    const result = await createBooking({
      amenityId: selectedAmenity.id,
      flatId,
      residentId,
      date: bookingDate,
      slot: selectedSlot,
    });

    if (!result.ok) {
      setError(result.error || 'Failed to create booking');
      return;
    }

    const success = `Booking confirmed for ${selectedAmenity.name} on ${formatDate(bookingDate)} at ${selectedSlot}.`;
    setSuccessMessage(success);
    toast('success', success);
    handleCloseModal();
    bookings.refetch && bookings.refetch();
  }

  async function handleCancelBooking(bookingId) {
    try {
      await cancelBooking(bookingId);
      bookings.refetch && bookings.refetch();
    } catch (err) {
      console.error(err);
    }
  }

  const availableSlots = useMemo(() => {
    if (!selectedAmenity) return [];
    return generateSlots(selectedAmenity.openTime, selectedAmenity.closeTime);
  }, [selectedAmenity]);

  useEffect(() => {
    if (!selectedAmenity || !bookingDate) {
      setSlotStatus({});
      return;
    }

    let cancelled = false;

    async function loadSlotStatus() {
      const nextStatus = {};

      for (const slot of availableSlots) {
        if (cancelled) return;
        nextStatus[slot] = await isSlotTaken(selectedAmenity.id, bookingDate, slot);
      }

      if (!cancelled) {
        setSlotStatus(nextStatus);
      }
    }

    loadSlotStatus();

    return () => {
      cancelled = true;
    };
  }, [selectedAmenity, bookingDate, availableSlots]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Amenity Bookings"
        description="Reserve society facilities including clubhouse, pool, tennis court, and party hall."
      />

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </div>
      )}

      {/* Amenity Grid */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-ink-900">Available Facilities</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {amenities.map((amenity) => {
            const IconComponent = amenityIcons[amenity.name] || Building2;
            return (
              <Card key={amenity.id} className="flex flex-col justify-between">
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                        <IconComponent size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink-900">{amenity.name}</h3>
                        <p className="text-xs text-ink-500">Max capacity: {amenity.capacity} people</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-ink-600 leading-relaxed">{amenity.description}</p>

                  <div className="flex flex-wrap items-center gap-4 border-t border-ink-100 pt-3 text-xs text-ink-500">
                    <span className="flex items-center gap-1.5">
                      <Clock size={14} className="text-ink-400" />
                      {amenity.openTime} - {amenity.closeTime}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-ink-400" />
                      Capacity {amenity.capacity}
                    </span>
                  </div>
                </CardBody>

                <div className="border-t border-ink-100 bg-ink-50/50 px-5 py-3 text-right">
                  <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} variant="primary" size="sm" onClick={() => handleOpenModal(amenity)}>
                    Book Slot
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Booking Modal */}
      <Modal
        open={Boolean(selectedAmenity)}
        onClose={handleCloseModal}
        title={`Book ${selectedAmenity?.name || 'Amenity'}`}
        footer={
          <>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} variant="primary" disabled={!selectedSlot} onClick={handleConfirmBooking}>
              Confirm Booking
            </Button>
          </>
        }
      >
       <div className="space-y-5">
  <FormRow label="Select Date">
    <Input
      type="date"
      min={todayStr}
      value={bookingDate}
      onChange={(e) => {
        setBookingDate(e.target.value);
        setSelectedSlot('');
        setError('');
      }}
      className="rounded-xl border-slate-200 text-xs focus:border-cyan-500 focus:ring-cyan-500"
    />
  </FormRow>

  <div>
    <Label className="text-slate-900 font-semibold text-xs">Select Time Slot</Label>
    <p className="mb-2.5 text-xs text-slate-400">
      Operating hours: {selectedAmenity?.openTime} - {selectedAmenity?.closeTime}
    </p>

    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
      {availableSlots.map((slot) => {
        const taken = Boolean(slotStatus[slot]);
        const isSelected = selectedSlot === slot;

        return (
          <button
            key={slot}
            type="button"
            disabled={taken}
            onClick={() => {
              setSelectedSlot(slot);
              setError('');
            }}
            className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
              taken
                ? 'border-slate-200 bg-slate-100/70 text-slate-400 cursor-not-allowed'
                : isSelected
                ? 'border-cyan-600 bg-cyan-600 text-white shadow-sm'
                : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50 hover:text-cyan-700'
            }`}
          >
            <span>{slot}</span>
            {taken && <span className="text-[10px] text-slate-400 font-normal">Booked</span>}
          </button>
        );
      })}
    </div>
  </div>

  {error && (
    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-600">
      <AlertCircle size={16} className="shrink-0 text-rose-500" />
      <span>{error}</span>
    </div>
  )}
</div>
      </Modal>

      {/* My Bookings Section */}
      <Card>
        <CardHeader
          title="My Bookings"
          subtitle="Your active facility reservations and booking history"
        />
        <CardBody>
          {myBookings.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No bookings found"
              description="You have not reserved any facility slots yet. Choose an amenity above to book."
            />
          ) : (
            <div className="divide-y divide-ink-100">
              {myBookings.map((booking) => {
                const amenity = amenities.find((a) => a.id === booking.amenityId);
                const isConfirmed = booking.status === 'Confirmed';

                return (
                  <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink-900">{amenity?.name || 'Amenity'}</span>
                        <Badge>{booking.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-ink-500">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {formatDate(booking.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {booking.slot}
                        </span>
                      </div>
                    </div>

                    {isConfirmed && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
