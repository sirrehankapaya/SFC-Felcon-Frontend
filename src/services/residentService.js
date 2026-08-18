import { apiClient } from './apiClient';
import { getCollection } from '../data/db';

function isMongoObjectId(value) {
  return typeof value === 'string' && /^[a-fA-F0-9]{24}$/.test(value.trim());
}

export function findFlatById(flatId) {
  const raw = String(flatId || '').trim();
  if (!raw) return null;

  const flats = getCollection('flats');
  return flats.find((flat) => {
    const candidates = [
      flat?.id,
      flat?._id,
      flat?.flatId,
      flat?.flatNumber,
      flat?.number,
      flat?.block,
    ];

    return candidates.some((candidate) => String(candidate ?? '').trim() === raw);
  }) || null;
}

function findLocalFlatById(flatId) {
  return findFlatById(flatId);
}

export async function listResidents() {
  const data = await apiClient.get('/api/user/all');
  const users = data.users || data.Users || [];
  return users.filter(u => u.role === 'resident');
}

export async function getResidentByUserId(userId) {
  if (!userId) return null;

  try {
    const data = await apiClient.get(`/api/user/single/${userId}`);
    if (data?.user) return data.user;
  } catch (err) {
    console.warn('Resident lookup by user id failed:', err);
  }

  try {
    const data = await apiClient.get('/api/user/all');
    const users = data.users || data.Users || [];
    return users.find((u) => String(u.id || u._id || u.userId) === String(userId)) || null;
  } catch (err) {
    console.warn('Resident fallback lookup failed:', err);
    return null;
  }
}

export async function getResidentById(residentId) {
  if (!residentId) return null;
  const data = await apiClient.get(`/api/user/single/${residentId}`);
  return data.user || null;
}

export async function listFlats() {
  const data = await apiClient.get('/api/flat/all');
  return data.flats || [];
}

export async function getFlat(flatId) {
  const raw = String(flatId || '').trim();
  if (!raw) return null;

  const localFlat = findLocalFlatById(raw);
  if (localFlat) return localFlat;

  if (!isMongoObjectId(raw)) return null;

  try {
    const data = await apiClient.get(`/api/flat/single/${raw}`);
    return data.flat || null;
  } catch (err) {
    return null;
  }
}

export async function listResidentsWithFlats() {
  const [residents, flats] = await Promise.all([listResidents(), listFlats()]);
  return residents.map((r) => ({ ...r, flat: flats.find((f) => f.id === r.flatId) || null }));
}

export async function updateResidentProfile(userId, patch) {
  const data = await apiClient.put(`/api/user/update/${userId}`, patch);
  return data;
}

export async function onboardResident({ name, phone, email, flatId, tenant, username, password }) {
  const data = await apiClient.post('/api/user/register', {
    name,
    phone,
    email,
    flatId,
    role: 'resident',
    username,
    password,
    tenant
  });
  return data.user?.id;
}

export async function offboardResident(userId) {
  const data = await apiClient.delete(`/api/user/delete/${userId}`);
  return data;
}
