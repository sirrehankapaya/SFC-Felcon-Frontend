import { apiClient } from './apiClient';

function normalizeCategory(value) {
  if (!value) return 'other';
  const map = {
    plumbing: 'plumbing',
    electrical: 'electrical',
    elevator: 'elevator',
    cleaning: 'cleaning',
    security: 'security',
    pest_control: 'pest_control',
    other: 'other',
  };
  const key = String(value).trim().toLowerCase().replace(/\s+/g, '_');
  return map[key] || 'other';
}

function normalizeStatus(value) {
  if (!value) return 'pending';
  const key = String(value).trim().toLowerCase();
  if (key === 'in-progress' || key === 'in_progress') return 'in-progress';
  if (key === 'resolved') return 'resolved';
  if (key === 'pending') return 'pending';
  if (key === 'rejected') return 'rejected';
  return 'pending';
}

export async function listComplaints() {
  const data = await apiClient.get('/api/complaint/all');
  return Array.isArray(data?.complaints) ? data.complaints : [];
}

export async function getComplaintsForResident(residentId) {
  if (!residentId) return [];
  const data = await apiClient.get('/api/complaint/my');
  const complaints = Array.isArray(data?.complaints) ? data.complaints : [];
  return complaints.filter((c) => String(c.residentId?._id || c.residentId) === String(residentId));
}

export async function createComplaint({ flatId, category, description, photo }) {
  const payload = {
    flatId,
    category: normalizeCategory(category),
    description: description?.trim(),
    priority: 'medium',
    photo: photo || null,
  };

  const data = await apiClient.post('/api/complaint/create', payload);
  return data.complaint || null;
}

export async function assignComplaint(complaintId, staffId, staffName) {
  const data = await apiClient.put(`/api/complaint/assign/${complaintId}`, { assignedTo: staffId });
  return data.complaint || null;
}

export async function updateComplaintStatus(complaintId, status, note) {
  const data = await apiClient.put(`/api/complaint/status/${complaintId}`, {
    status: normalizeStatus(status),
    resolutionNotes: note || '',
  });
  return data.complaint || null;
}
