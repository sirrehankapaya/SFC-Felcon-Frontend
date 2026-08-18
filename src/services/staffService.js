import { getCollection, updateCollection } from '../data/db';
import { makeId } from '../utils/id';

export function listStaff() {
  return getCollection('staff');
}

export function getStaffById(id) {
  return listStaff().find((s) => s.id === id) || null;
}

export function addStaff(staff) {
  const newStaff = {
    id: makeId('s'),
    ...staff,
  };
  updateCollection('staff', (rows) => [newStaff, ...rows]);
  return newStaff;
}

export function updateStaff(id, updates) {
  updateCollection('staff', (rows) =>
    rows.map((s) => (s.id === id ? { ...s, ...updates } : s))
  );
  return getStaffById(id);
}

export function deleteStaff(id) {
  updateCollection('staff', (rows) => rows.filter((s) => s.id !== id));
}

export function getEmergencyContacts() {
  return getCollection('emergencyContacts');
}
