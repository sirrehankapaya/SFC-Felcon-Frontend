const STORAGE_KEY = 'smartsociety_notifications';

export function readNotifications() {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch (error) {
    return [];
  }
}

export function addNotification({ title, message, targetRole, type = 'info' }) {
  if (typeof window === 'undefined') return null;

  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: title || 'Notification',
    message: message || '',
    targetRole: targetRole || 'all',
    type,
    createdAt: new Date().toISOString(),
    read: false,
  };

  const items = readNotifications();
  const next = [entry, ...items].slice(0, 50);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event('smartsociety-notifications-updated'));
  return entry;
}

export function getNotificationsForRole(role) {
  if (!role) return [];

  return readNotifications()
    .filter((item) => item.targetRole === role || item.targetRole === 'all')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function markNotificationsRead(role) {
  if (typeof window === 'undefined') return [];

  const items = readNotifications().map((item) => {
    if ((item.targetRole === role || item.targetRole === 'all') && !item.read) {
      return { ...item, read: true };
    }
    return item;
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('smartsociety-notifications-updated'));
  return items;
}
