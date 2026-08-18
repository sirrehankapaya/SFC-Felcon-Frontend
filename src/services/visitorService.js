import { apiClient } from './apiClient';

function normalizeVisitorId(visitor) {
  if (!visitor) return null;
  const raw = visitor.id || visitor._id || visitor.userId || visitor.visitorId;
  return raw ? String(raw) : null;
}

export async function listVisitors() {
  const data = await apiClient.get('/api/visitor/all');
  return data.visitors || [];
}

export async function getVisitorsForFlat(flatId) {
  const data = await apiClient.get(`/api/visitor/flat/${flatId}`);
  return data.visitors || [];
}

export async function createVisitorPass({ flatId, name, phone, vehicleNumber, purpose, validFrom, validTo }) {
  const data = await apiClient.post('/api/visitor/create', {
    flatId,
    name,
    phone,
    vehicleNumber: vehicleNumber || '—',
    purpose,
    validFrom,
    validTo
  });
  return data.visitor;
}

export async function findByPassCode(code) {
  try {
    const data = await apiClient.post('/api/visitor/verify-qr', { qrCode: code.trim() });
    return data.visitor || null;
  } catch (err) {
    return null;
  }
}

export async function markPassUsed(visitorId) {
  const normalizedId = normalizeVisitorId({ id: visitorId });
  if (!normalizedId) {
    return { status: true, skipped: true, message: 'Visitor ID missing; pass verification continued without exit update.' };
  }

  try {
    const data = await apiClient.put(`/api/visitor/exit/${normalizedId}`, {});
    return data;
  } catch (err) {
    return {
      status: true,
      skipped: true,
      message: err?.message || 'Visitor exit update skipped.',
    };
  }
}

export function isPassExpired(pass) {
  return new Date(pass.validTo) < new Date();
}
