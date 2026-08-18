import { apiClient } from './apiClient';
import { addNotification } from '../utils/notifications';

export async function listBills() {
  const data = await apiClient.get('/api/maintenance/all');
  return data.bills || [];
}

export async function getBillsForFlat(flatId) {
  // Can combine current and history if necessary, or just fetch all and filter,
  // but let's assume we can fetch history which should include all for the flat.
  // Actually, the API seems to separate current and history. Let's fetch history.
  const data = await apiClient.get(`/api/maintenance/history/${flatId}`);
  return data.bills || [];
}

export async function payBill(billId) {
  const data = await apiClient.put(`/api/maintenance/pay/${billId}`, {});
  return data;
}

export async function markOverdueBills() {
  // Apply penalties endpoint matches this behavior
  const data = await apiClient.post('/api/maintenance/penalties', {});
  return data;
}

export async function generateMonthlyBill(flatId, breakdown) {
  const data = await apiClient.post('/api/maintenance/generate', { flatId, ...breakdown });

  if (data?.status !== false) {
    addNotification({
      title: 'Maintenance Bill Generated',
      message: `A new maintenance bill has been generated for ${breakdown?.month || 'this month'}. Please check your billing section.`,
      targetRole: 'resident',
      type: 'info',
    });
  }

  return data.bill;
}

export async function collectionSummary() {
  const data = await apiClient.get('/api/maintenance/collection-report');
  return data.summary || { totalDue: 0, collected: 0, overdue: 0, pending: 0 };
}
