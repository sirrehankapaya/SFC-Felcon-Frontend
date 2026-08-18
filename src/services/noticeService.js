import { apiClient } from './apiClient';

export async function listNotices() {
  const data = await apiClient.get('/api/notice/all');
  return (data.notices || []).sort((a, b) => {
    if ((a.pinned || false) !== (b.pinned || false)) return a.pinned ? -1 : 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

export async function createNotice({ title, body, category, pinned }) {
  const data = await apiClient.post('/api/notice/create', {
    title,
    body,
    content: body,
    category: category || 'General',
    type: category || 'normal',
    pinned: !!pinned,
    isActive: true,
    priority: pinned ? 'high' : 'medium',
  });
  return data.notice || null;
}

export async function deleteNotice(noticeId) {
  const id = noticeId?._id || noticeId?.id || noticeId;
  if (!id) return null;
  const data = await apiClient.delete(`/api/notice/delete/${id}`);
  return data;
}

export async function listPolls() {
  const data = await apiClient.get('/api/poll/all');
  return data.polls || [];
}

export async function createPoll({ question, options, closesInDays }) {
  const closesAtDate = new Date();
  closesAtDate.setDate(closesAtDate.getDate() + Number(closesInDays || 7));

  const data = await apiClient.post('/api/poll/create', {
    question,
    options,
    expiresAt: closesAtDate.toISOString(),
    category: 'general',
  });
  return data.poll || null;
}

export async function voteInPoll(pollId, optionId, userId) {
  const optionIdx = parseInt(optionId.replace('o_', ''), 10) - 1;
  const data = await apiClient.post(`/api/poll/${pollId}/vote`, {
    optionIdx,
  });
  return data.poll || null;
}
