import { useEffect, useState, useCallback, useMemo } from 'react';
import { apiClient } from '../services/apiClient';
import { getCollection, subscribe } from '../data/db';

const ENDPOINTS = {
  residents: '/api/user/all',
  staff: '/api/user/all',
  flats: '/api/flat/all',    // Added for plural matching in Residents.jsx
  flat: '/api/flat/all',
  bills: '/api/maintenance/all',
  visitors: '/api/visitor/all',
  complaints: '/api/complaint/all',
  bookings: '/api/amenity-booking/all',
  gateLogs: '/api/gate-log/all',
  notices: '/api/notice/all',
  polls: '/api/poll/all',
};

const AMENITY_STORAGE_KEY = 'smartsociety_amenities';

const STATIC_AMENITIES = [
  { id: 'clubhouse', name: 'Clubhouse', description: 'Main hall, seats up to 80 for functions and gatherings.', capacity: 80, openTime: '09:00', closeTime: '22:00' },
  { id: 'swimming_pool', name: 'Swimming Pool', description: 'Open lap pool, one hour slots.', capacity: 15, openTime: '06:00', closeTime: '20:00' },
  { id: 'tennis_court', name: 'Tennis Court', description: 'Single hard court, booked in 1 hour slots.', capacity: 4, openTime: '06:00', closeTime: '21:00' },
  { id: 'party_hall', name: 'Party Hall', description: 'Smaller hall for birthdays and family events.', capacity: 40, openTime: '10:00', closeTime: '23:00' },
  { id: 'gym', name: 'Gymnasium', description: 'Fully equipped gym.', capacity: 20, openTime: '06:00', closeTime: '22:00' },
  { id: 'garden', name: 'Garden', description: 'Community garden area.', capacity: 50, openTime: '06:00', closeTime: '22:00' },
];

function readAmenityList() {
  try {
    const saved = localStorage.getItem(AMENITY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to read saved amenities:', err);
  }

  localStorage.setItem(AMENITY_STORAGE_KEY, JSON.stringify(STATIC_AMENITIES));
  return STATIC_AMENITIES;
}

export function useCollection(name) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCollection = useCallback(async () => {
    if (name === 'amenities') {
      const amenities = readAmenityList();
      setRows(amenities);
      setLoading(false);
      return;
    }

    const endpoint = ENDPOINTS[name];
    if (!endpoint) {
      setRows([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await apiClient.get(endpoint);

      let arrayData = [];
      if (Array.isArray(data)) {
        arrayData = data;
      } else if (data && typeof data === 'object') {
        const key = Object.keys(data).find((k) => Array.isArray(data[k]));
        if (key) arrayData = data[key];
      }

      if (Array.isArray(arrayData) && arrayData.length === 0) {
        const fallback = getCollection(name);
        if (fallback && fallback.length) arrayData = fallback;
      }

      if (name === 'staff') {
        arrayData = arrayData.filter((user) => {
          const role = String(user?.role || '').toLowerCase();
          return role === 'staff' || role === 'maintenance';
        });
      }

      arrayData = arrayData.map((item) => {
        if (!item) return item;

        const normalized = { ...item };
        const objectId = item._id || item.id || item.userId || item.billId;
        if (objectId && !normalized.id) {
          normalized.id = String(objectId);
        }

        if (name === 'bills') {
          const flatId = item.flatId && typeof item.flatId === 'object' ? (item.flatId._id || item.flatId.id) : item.flatId;
          const status = String(item.paymentStatus || item.status || 'pending').toLowerCase();
          const nextStatus = status === 'paid' ? 'Paid' : status === 'overdue' ? 'Overdue' : 'Unpaid';

          normalized.id = normalized.id || String(item.billId || item._id || item.id || Math.random());
          normalized.flatId = flatId ? String(flatId) : item.flatId || null;
          normalized.period = item.period || item.month || null;
          normalized.month = item.month || item.period || null;
          normalized.amount = Number(item.amount ?? 0);
          normalized.amountDue = Number(item.amountDue ?? item.amount ?? 0);
          normalized.status = String(item.status || status || 'pending').toLowerCase();
          normalized.paymentStatus = nextStatus;
          normalized.dueDate = item.dueDate || item.date || null;
          normalized.paidOn = item.paidOn || item.paidAt || null;
          normalized.breakdown = {
            water: Number(item.breakdown?.water ?? item.water ?? 0),
            security: Number(item.breakdown?.security ?? item.security ?? 0),
            repairs: Number(item.breakdown?.repairs ?? item.repairs ?? 0),
            other: Number(item.breakdown?.other ?? item.other ?? 0),
          };
        }

        if (name === 'bookings') {
          const residentId = item.residentId && typeof item.residentId === 'object' ? (item.residentId._id || item.residentId.id) : item.residentId;
          const flatId = item.flatId && typeof item.flatId === 'object' ? (item.flatId._id || item.flatId.id) : item.flatId;

          normalized.id = normalized.id || String(item.bookingId || item._id || item.id || Math.random());
          normalized.residentId = residentId ? String(residentId) : item.residentId || null;
          normalized.flatId = flatId ? String(flatId) : item.flatId || null;
          normalized.amenityId = item.amenityId || item.amenity || null;
          normalized.date = item.date || item.createdAt || null;
          normalized.slot = item.slot || `${item.startTime || '00:00'} - ${item.endTime || '00:00'}`;
          normalized.status = String(item.status || 'pending').charAt(0).toUpperCase() + String(item.status || 'pending').slice(1);
        }

        if (name === 'visitors') {
          const flatId = item.flatId && typeof item.flatId === 'object' ? (item.flatId._id || item.flatId.id) : item.flatId;
          const generatedBy = item.generatedBy && typeof item.generatedBy === 'object' ? (item.generatedBy._id || item.generatedBy.id) : item.generatedBy;
          const status = String(item.status || 'pending');

          normalized.id = normalized.id || String(item._id || item.id || item.visitorId || Math.random());
          normalized.flatId = flatId ? String(flatId) : item.flatId || null;
          normalized.generatedBy = generatedBy ? String(generatedBy) : item.generatedBy || null;
          normalized.name = item.name || item.visitorName || 'Visitor';
          normalized.phone = item.phone || item.contact || '—';
          normalized.vehicleNumber = item.vehicleNumber || item.vehicleNo || '—';
          normalized.purpose = item.purpose || item.type || 'Guest';
          normalized.passCode = item.passCode || item.qrCode || item.code || '';
          normalized.validFrom = item.validFrom || item.entryTime || item.createdAt || null;
          normalized.validTo = item.validTo || item.exitTime || item.validUntil || null;
          normalized.status = status === 'approved' ? 'Active' : status === 'exited' ? 'Used' : status.charAt(0).toUpperCase() + status.slice(1);
          normalized.type = item.type || item.purpose || 'Guest';
        }

        if (name === 'residents') {
          const residentFlatId = item.flatId && typeof item.flatId === 'object'
            ? (item.flatId._id || item.flatId.id || item.flatId.flatId)
            : item.flatId;

          normalized.id = normalized.id || String(item.userId || item._id || item.id || Math.random());
          normalized.flatId = residentFlatId ? String(residentFlatId) : item.flatId || null;
          normalized.tenant = Boolean(item.tenant ?? item.isTenant ?? false);
          normalized.userId = item.userId || item.id || item._id || null;
        }

        if (name === 'staff') {
          normalized.id = normalized.id || String(item.userId || item._id || item.id || Math.random());
          normalized.name = item.name || item.fullName || 'Staff Member';
          normalized.specialty = item.specialty || item.role || 'General';
          normalized.phone = item.phone || item.contact || '';
          normalized.status = item.status || 'Active';
          normalized.shift = item.shift || 'Morning';
        }

        if (name === 'flats' || name === 'flat') {
          const flatNumber = item.flatNumber || item.number || item.flat_no || item.name || '—';
          const tower = item.tower || item.block || item.building || '—';

          normalized.id = normalized.id || String(item._id || item.id || item.flatId || Math.random());
          normalized.number = flatNumber;
          normalized.flatNumber = flatNumber;
          normalized.block = tower;
          normalized.tower = tower;
          normalized.floor = item.floor || item.level || '—';
          normalized.type = item.size || item.type || 'Standard';
          normalized.size = item.size || item.type || 'Standard';
          normalized.occupancyType = item.occupancyStatus || item.occupancyType || (item.ownerId ? 'Owner' : item.tenantId ? 'Tenant' : 'Vacant');
        }

        if (name === 'gateLogs') {
          const flatId = item.flatId && typeof item.flatId === 'object' ? (item.flatId._id || item.flatId.id) : item.flatId;
          const visitor = item.visitorId && typeof item.visitorId === 'object' ? item.visitorId : null;

          normalized.id = normalized.id || String(item.logId || item._id || item.id || Math.random());
          normalized.flatId = flatId || item.flatId || null;
          normalized.checkIn = item.checkIn || item.timestamp || item.createdAt || null;
          normalized.checkOut = item.checkOut || item.exitTime || null;
          normalized.name = item.name || visitor?.name || 'Visitor';
          normalized.phone = item.phone || visitor?.phone || '—';
          normalized.vehicleNumber = item.vehicleNumber || visitor?.vehicleNo || '—';
          normalized.type = item.type || item.purpose || 'Guest';
          normalized.overstay = Boolean(item.overstay || item.overstayAlert);
        }

        return normalized;
      });

      setRows(arrayData);
      setError(null);
    } catch (err) {
      console.log(`Failed to fetch collection ${name}:`, err);
      const fallback = getCollection(name);
      setRows(Array.isArray(fallback) ? fallback : []);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, [name]);

  useEffect(() => {
    fetchCollection();

    const unsubscribe = subscribe(() => {
      fetchCollection();
    });

    return () => unsubscribe();
  }, [fetchCollection]);

  const result = useMemo(() => {
    const list = Array.isArray(rows) ? [...rows] : [];
    list.refetch = fetchCollection;
    list.loading = loading;
    list.error = error;
    return list;
  }, [rows, loading, error, fetchCollection]);

  return result;
}