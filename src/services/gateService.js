import { getCollection, updateCollection } from '../data/db';
import { makeId } from '../utils/id';
import { findByPassCode, markPassUsed, isPassExpired } from './visitorService';

export function listGateLogs() {
  return getCollection('gateLogs').sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
}

export function logWalkIn({ name, phone, vehicleNumber, flatId, type }) {
  const entry = {
    id: makeId('g'),
    visitorId: null,
    name,
    phone,
    vehicleNumber: vehicleNumber || '—',
    flatId,
    type: type || 'Guest',
    checkIn: new Date().toISOString(),
    checkOut: null,
    overstay: false,
  };
  updateCollection('gateLogs', (logs) => [entry, ...logs]);
  return entry;
}

export function checkOutVisitor(gateLogId) {
  updateCollection('gateLogs', (logs) =>
    logs.map((g) => (g.id === gateLogId ? { ...g, checkOut: new Date().toISOString() } : g))
  );
}

// Returns { ok, reason, pass } - verification result for a code typed/scanned at the gate
export async function verifyPassCode(code) {
  const pass = await findByPassCode(code);
  if (!pass) {
    return { ok: false, reason: 'No pass found with that code' };
  }

  const normalizedStatus = String(pass.status || '').toLowerCase();
  if (normalizedStatus === 'used' || normalizedStatus === 'exited' || normalizedStatus === 'rejected') {
    return { ok: false, reason: 'This pass has already been used', pass };
  }

  if (isPassExpired(pass)) {
    return { ok: false, reason: 'This pass has expired', pass };
  }

  const normalizedPass = {
    ...pass,
    id: pass.id || pass._id || pass.visitorId || null,
    name: pass.name || pass.visitorName || 'Visitor',
    phone: pass.phone || pass.contact || '—',
    vehicleNumber: pass.vehicleNumber || pass.vehicleNo || '—',
    flatId: pass.flatId || (pass.flat && (pass.flat._id || pass.flat.id)) || null,
    purpose: pass.purpose || pass.type || 'Guest',
    validFrom: pass.validFrom || pass.entryTime || null,
    validTo: pass.validTo || pass.exitTime || null,
    status: pass.status || 'Active',
  };

  const visitorId = normalizedPass.id;
  if (visitorId) {
    markPassUsed(visitorId);
  }

  const entry = {
    id: makeId('g'),
    visitorId: visitorId,
    name: normalizedPass.name,
    phone: normalizedPass.phone,
    vehicleNumber: normalizedPass.vehicleNumber,
    flatId: normalizedPass.flatId,
    type: normalizedPass.purpose,
    checkIn: new Date().toISOString(),
    checkOut: null,
    overstay: false,
  };
  updateCollection('gateLogs', (logs) => [entry, ...logs]);

  return { ok: true, pass: normalizedPass, entry };
}

export function flagOverstay(gateLogId, overstay = true) {
  updateCollection('gateLogs', (logs) =>
    logs.map((g) => (g.id === gateLogId ? { ...g, overstay } : g))
  );
}

export function overstayAlerts() {
  return getCollection('gateLogs').filter((g) => g.overstay && !g.checkOut);
}
