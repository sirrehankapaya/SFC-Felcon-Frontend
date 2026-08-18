import {
  seedSociety, seedUsers, seedFlats, seedResidents, seedBills, seedVisitors,
  seedGateLogs, seedStaff, seedComplaints, seedAmenities, seedBookings,
  seedNotices, seedPolls, seedEmergencyContacts,
} from './seed';

const STORAGE_KEY = 'smartsociety_db_v1';

function freshDb() {
  return {
    society: seedSociety,
    users: seedUsers,
    flats: seedFlats,
    residents: seedResidents,
    bills: seedBills,
    visitors: seedVisitors,
    gateLogs: seedGateLogs,
    staff: seedStaff,
    complaints: seedComplaints,
    amenities: seedAmenities,
    bookings: seedBookings,
    notices: seedNotices,
    polls: seedPolls,
    emergencyContacts: seedEmergencyContacts,
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const db = freshDb();
      save(db);
      return db;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn('could not read local db, falling back to seed data', err);
    return freshDb();
  }
}

function save(db) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

// Very small pub/sub so components using different services still re-render
// when someone else mutates the same collection. Not fancy, but the app is
// small enough that a proper state library would be overkill.
const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function getCollection(name) {
  const db = load();
  return db[name] || [];
}

export function setCollection(name, rows) {
  const db = load();
  db[name] = rows;
  save(db);
  notify();
}

export function updateCollection(name, updater) {
  const db = load();
  db[name] = updater(db[name] || []);
  save(db);
  notify();
  return db[name];
}

export function resetDb() {
  save(freshDb());
  notify();
}

export function getSociety() {
  return load().society;
}
