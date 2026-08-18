import { useState, useMemo } from 'react';
import { Megaphone, Pin, Plus, Trash2, BarChart2, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Textarea, Select, Label, FormRow } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';
import { formatDate } from '../../utils/format';
import { createNotice, deleteNotice, createPoll } from '../../services/noticeService';
import { updateCollection } from '../../data/db';
import { makeId } from '../../utils/id';
import { addNotification } from '../../utils/notifications';

export default function Notices() {
  const notices = useCollection('notices');
  const polls = useCollection('polls');

  // Modal States
  const [postNoticeModalOpen, setPostNoticeModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [createPollModalOpen, setCreatePollModalOpen] = useState(false);

  // Post Notice Form
  const [noticeForm, setNoticeForm] = useState({
    title: '',
    category: 'General',
    body: '',
    pinned: false,
  });
  const [noticeError, setNoticeError] = useState('');

  // Create Poll Form
  const [pollForm, setPollForm] = useState({
    question: '',
    options: ['', ''],
    closesInDays: 7,
  });
  const [pollError, setPollError] = useState('');

  function handleOpenNoticeModal() {
    setNoticeForm({ title: '', category: 'General', body: '', pinned: false });
    setNoticeError('');
    setPostNoticeModalOpen(true);
  }

  async function handleNoticeSubmit(e) {
    e.preventDefault();
    if (!noticeForm.title.trim()) return setNoticeError('Title is required');
    if (!noticeForm.body.trim()) return setNoticeError('Notice body content is required');

    try {
      await createNotice({
        title: noticeForm.title.trim(),
        category: noticeForm.category,
        body: noticeForm.body.trim(),
        pinned: noticeForm.pinned,
      });
      addNotification({
        title: 'New society notice',
        message: `${noticeForm.title.trim()} has been published for residents.`,
        targetRole: 'resident',
        type: 'info',
      });
      notices.refetch && notices.refetch();
      setPostNoticeModalOpen(false);
      setNoticeForm({ title: '', category: 'General', body: '', pinned: false });
    } catch (err) {
      setNoticeError(err.message || 'Failed to publish the notice.');
    }
  }

  async function handleConfirmDeleteNotice() {
    if (!deleteTarget) return;
    try {
      await deleteNotice(deleteTarget._id || deleteTarget.id);
      notices.refetch && notices.refetch();
    } catch (err) {
      console.error('Failed to delete notice:', err);
    }
    setDeleteTarget(null);
  }

  function handleOpenPollModal() {
    setPollForm({ question: '', options: ['', ''], closesInDays: 7 });
    setPollError('');
    setCreatePollModalOpen(true);
  }

  function handleAddPollOption() {
    if (pollForm.options.length >= 5) return;
    setPollForm({ ...pollForm, options: [...pollForm.options, ''] });
  }

  function handlePollOptionChange(index, val) {
    const next = [...pollForm.options];
    next[index] = val;
    setPollForm({ ...pollForm, options: next });
  }

  function handlePollSubmit(e) {
    e.preventDefault();
    if (!pollForm.question.trim()) return setPollError('Poll question is required');
    const validOptions = pollForm.options.map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return setPollError('At least 2 options are required');

    createPoll({
      question: pollForm.question.trim(),
      options: validOptions,
      closesInDays: pollForm.closesInDays || 7,
    }).then(() => {
      polls.refetch && polls.refetch();
      setCreatePollModalOpen(false);
    }).catch((err) => {
      setPollError(err.message || 'Failed to create poll.');
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Noticeboard & Resident Polls"
        description="Broadcast official society announcements, pinned notices, and community opinion polls."
        action={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleOpenPollModal}>
              <BarChart2 size={16} /> Create Poll
            </Button>
            <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} onClick={handleOpenNoticeModal}>
              <Plus size={16} /> Post Notice
            </Button>
          </div>
        }
      />

      {/* Notices Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
            <Megaphone size={20} className="text-brand-600" />
            Active Announcements ({notices.length})
          </h2>
        </div>

        {notices.length === 0 ? (
          <Card>
            <EmptyState
              icon={Megaphone}
              title="No announcements published"
              description="Click 'Post Notice' above to publish the first society notice."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {notices.map((notice) => (
              <Card key={notice.id} className={notice.pinned ? 'border-brand-300 ring-1 ring-brand-200' : ''}>
                <CardHeader
                  title={
                    <div className="flex items-center gap-2">
                      {notice.pinned && (
                        <Pin size={16} className="text-brand-600 fill-brand-100 shrink-0" />
                      )}
                      <span className="font-semibold text-ink-900">{notice.title}</span>
                    </div>
                  }
                  subtitle={formatDate(notice.createdAt)}
                  action={
                    <div className="flex items-center gap-2">
                      <Badge
                        tone={
                          notice.category === 'Urgent'
                            ? 'danger'
                            : notice.category === 'Maintenance'
                            ? 'warning'
                            : notice.category === 'Event'
                            ? 'brand'
                            : 'neutral'
                        }
                      >
                        {notice.category}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => setDeleteTarget(notice)}
                        title="Delete notice"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  }
                />
                <CardBody>
                  <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{notice.body}</p>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Polls Section */}
      <div className="space-y-4 pt-4 border-t border-ink-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink-900 flex items-center gap-2">
            <BarChart2 size={20} className="text-brand-600" />
            Resident Community Polls ({polls.length})
          </h2>
        </div>

        {polls.length === 0 ? (
          <Card>
            <EmptyState
              icon={BarChart2}
              title="No active polls"
              description="Create a poll to gather feedback and votes from residents."
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {polls.map((poll) => {
              const totalVotes = poll.options.reduce((sum, o) => sum + (o.votes || 0), 0);

              return (
                <Card key={poll.id}>
                  <CardHeader
                    title={poll.question}
                    subtitle={`Total Votes: ${totalVotes} • Closes: ${formatDate(poll.closesAt)}`}
                  />
                  <CardBody className="space-y-3">
                    {poll.options.map((opt) => {
                      const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;

                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium text-ink-800">
                            <span>{opt.text}</span>
                            <span className="text-ink-500">
                              {opt.votes} votes ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
                            <div
                              className="h-full bg-brand-500 transition-all duration-300"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Notice Modal */}
      <Modal
        open={postNoticeModalOpen}
        onClose={() => setPostNoticeModalOpen(false)}
        title="Publish Society Notice"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPostNoticeModalOpen(false)}>
              Cancel
            </Button>
            <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} onClick={handleNoticeSubmit}>Publish Notice</Button>
          </>
        }
      >
        <form onSubmit={handleNoticeSubmit} className="space-y-4">
          {noticeError && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {noticeError}
            </div>
          )}

          <FormRow label="Notice Title">
            <Input
              placeholder="e.g. Scheduled Water Tank Cleaning - Block A"
              value={noticeForm.title}
              onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
            />
          </FormRow>

          <FormRow label="Category">
            <Select
              value={noticeForm.category}
              onChange={(e) => setNoticeForm({ ...noticeForm, category: e.target.value })}
            >
              <option value="General">General</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Event">Event</option>
              <option value="Urgent">Urgent</option>
            </Select>
          </FormRow>

          <FormRow label="Notice Body">
            <Textarea
              placeholder="Provide detailed information for residents..."
              value={noticeForm.body}
              onChange={(e) => setNoticeForm({ ...noticeForm, body: e.target.value })}
              className="min-h-28"
            />
          </FormRow>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinned-check"
              checked={noticeForm.pinned}
              onChange={(e) => setNoticeForm({ ...noticeForm, pinned: e.target.checked })}
              className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
            />
            <Label htmlFor="pinned-check">Pin this notice to the top of noticeboard</Label>
          </div>
        </form>
      </Modal>

      {/* Delete Notice Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Announcement"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmDeleteNotice}>
              Delete Notice
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <p className="text-sm text-ink-700">
            Are you sure you want to delete the notice <strong className="text-ink-900">"{deleteTarget.title}"</strong>?
            This operation cannot be undone.
          </p>
        )}
      </Modal>

      {/* Create Poll Modal */}
      <Modal
        open={createPollModalOpen}
        onClose={() => setCreatePollModalOpen(false)}
        title="Create Resident Poll"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreatePollModalOpen(false)}>
              Cancel
            </Button>
            <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} onClick={handlePollSubmit}>Launch Poll</Button>
          </>
        }
      >
        <form onSubmit={handlePollSubmit} className="space-y-4">
          {pollError && (
            <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
              {pollError}
            </div>
          )}

          <FormRow label="Poll Question">
            <Input
              placeholder="e.g. Should we install solar panels on the clubhouse roof?"
              value={pollForm.question}
              onChange={(e) => setPollForm({ ...pollForm, question: e.target.value })}
            />
          </FormRow>

          <div className="space-y-3">
            <Label>Options</Label>
            {pollForm.options.map((opt, idx) => (
              <Input
                key={idx}
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => handlePollOptionChange(idx, e.target.value)}
              />
            ))}
            {pollForm.options.length < 5 && (
              <Button type="button" variant="ghost" size="sm" onClick={handleAddPollOption}>
                + Add Option
              </Button>
            )}
          </div>

          <FormRow label="Voting Duration (Days)">
            <Select
              value={pollForm.closesInDays}
              onChange={(e) => setPollForm({ ...pollForm, closesInDays: e.target.value })}
            >
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </Select>
          </FormRow>
        </form>
      </Modal>
    </div>
  );
}
