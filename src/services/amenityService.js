import { apiClient } from './apiClient';

export async function listAmenities() {
  // Mock amenities are handled in useCollection.js directly
  return [];
}

export async function listBookings() {
  const data = await apiClient.get('/api/amenity-booking/all');
  return data.bookings || [];
}

export async function getBookingsForResident(residentId) {
  // If the backend has a /my endpoint, it will return the logged-in user's bookings.
  // But if we're an admin viewing another resident, we'd filter the list.
  const data = await apiClient.get('/api/amenity-booking/all');
  const allBookings = data.bookings || [];
  return allBookings
    .filter((b) => b.residentId === residentId || b.residentId?._id === residentId)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
}

export async function getBookingsForAmenityAndDate(amenityId, dateStr) {
  // Fetch availability or all bookings and filter
  const data = await apiClient.get('/api/amenity-booking/all');
  const bookings = data.bookings || [];
  const day = new Date(dateStr).toDateString();
  return bookings.filter(
    (b) => b.amenity === amenityId && new Date(b.date).toDateString() === day && b.status !== 'cancelled'
  );
}

export async function isSlotTaken(amenityId, dateStr, slot) {
  if (!amenityId || !dateStr || !slot) return true;

  const [start, end] = slot.split(' - ');
  const formatAmPm = (time) => {
    let [h, m] = time.split(':');
    let hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    hr = hr ? hr : 12;
    return `${hr < 10 ? '0' + hr : hr}:${m} ${ampm}`;
  };

  const startTime = formatAmPm(start);
  const endTime = formatAmPm(end);

  try {
    const res = await apiClient.post('/api/amenity-booking/availability', {
      amenity: amenityId,
      date: dateStr,
      startTime,
      endTime
    });
    return !res.available;
  } catch (err) {
    try {
      const allBookings = await listBookings();
      const sameDay = allBookings.filter((b) => {
        const bookingAmenity = b.amenity || b.amenityId;
        const bookingDate = new Date(b.date).toDateString();
        return bookingAmenity === amenityId && bookingDate === new Date(dateStr).toDateString() && b.status !== 'cancelled';
      });

      return sameDay.some((booking) => {
        const bookingStart = booking.startTime || booking.slot?.split(' - ')[0];
        const bookingEnd = booking.endTime || booking.slot?.split(' - ')[1];
        if (!bookingStart || !bookingEnd) return false;

        const startMinutes = Number(start.split(':')[0]) * 60 + Number(start.split(':')[1]);
        const endMinutes = Number(end.split(':')[0]) * 60 + Number(end.split(':')[1]);
        const bookingStartMinutes = Number(bookingStart.split(':')[0]) * 60 + Number(bookingStart.split(':')[1]);
        const bookingEndMinutes = Number(bookingEnd.split(':')[0]) * 60 + Number(bookingEnd.split(':')[1]);

        return startMinutes < bookingEndMinutes && endMinutes > bookingStartMinutes;
      });
    } catch (fallbackErr) {
      console.warn('Availability fallback failed:', fallbackErr);
      return false;
    }
  }
}

export async function createBooking({ amenityId, flatId, residentId, date, slot }) {
  const [start, end] = slot.split(' - ');
  const formatAmPm = (time) => {
    let [h, m] = time.split(':');
    let hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    hr = hr % 12;
    hr = hr ? hr : 12; 
    return `${hr < 10 ? '0' + hr : hr}:${m} ${ampm}`;
  };

  const startTime = formatAmPm(start);
  const endTime = formatAmPm(end);

  try {
    const data = await apiClient.post('/api/amenity-booking/create', {
      flatId,
      amenity: amenityId,
      date,
      startTime,
      endTime,
      purpose: 'General',
      guests: 0
    });
    return { ok: true, booking: data.booking };
  } catch (err) {
    return { ok: false, error: err.message || 'Failed to book slot' };
  }
}

export async function approveBooking(bookingId) {
  const data = await apiClient.put(`/api/amenity-booking/approve/${bookingId}`, {});
  return data;
}

export async function cancelBooking(bookingId) {
  const data = await apiClient.put(`/api/amenity-booking/cancel/${bookingId}`, {});
  return data;
}
