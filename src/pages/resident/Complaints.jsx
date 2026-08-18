import { useState, useMemo } from 'react';
import { Plus, Wrench, Calendar, UserCheck, Paperclip } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Textarea, Select, FormRow } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';

import { useAuth } from '../../context/AuthContext';
import { getResidentByUserId } from '../../services/residentService';
import { createComplaint } from '../../services/complaintService';
import { listStaff } from '../../services/staffService';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/format';
import { toast } from '../../components/ui/Toast';
import { addNotification } from '../../utils/notifications';

const CATEGORIES = ['Plumbing', 'Electrical', 'Elevator', 'Cleaning', 'Security', 'Other'];

function displayCategory(value) {
  const raw = String(value || '').trim().toLowerCase();
  const map = {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    elevator: 'Elevator',
    cleaning: 'Cleaning',
    security: 'Security',
    pest_control: 'Pest Control',
    other: 'Other',
  };
  return map[raw] || (value || 'Other');
}

export default function Complaints() {
  const { user } = useAuth();
  const residents = useCollection('residents');
  const fallbackResident = user && user.role === 'resident'
    ? { id: user.id || user._id, userId: user.id || user._id, flatId: user.flatId, name: user.name, email: user.email }
    : null;
  const resident = residents.find((r) => r.userId === user?.id || r.id === user?.id || r._id === user?._id)
    || fallbackResident
    || (user?.id ? getResidentByUserId(user.id) : null);
  const residentId = resident?.id || resident?._id || resident?.userId || user?.id || user?._id;
  const flatId = resident?.flatId || user?.flatId;

  const complaints = useCollection('complaints');
  const staffList = listStaff();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [category, setCategory] = useState('Plumbing');
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState('');

  const residentComplaints = useMemo(() => {
    if (!residentId) return [];
    return complaints
      .filter((c) => {
        const complaintResidentId = c.residentId && typeof c.residentId === 'object'
          ? (c.residentId._id || c.residentId.id)
          : c.residentId;
        return String(complaintResidentId || '') === String(residentId);
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [complaints, residentId]);

  function handleOpenCreate() {
    setCategory('Plumbing');
    setDescription('');
    setPhotoName('');
    setError('');
    setSuccessMessage('');
    setIsCreateOpen(true);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoName(file.name);
    } else {
      setPhotoName('');
    }
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setError('');

    if (!residentId) {
      setError('Resident record not found. Please contact administration.');
      return;
    }
    if (!flatId) {
      setError('Flat information not found. Please contact administration.');
      return;
    }
    if (!description.trim()) {
      setError('Please provide a description for the complaint.');
      return;
    }

    try {
      await createComplaint({
        residentId,
        flatId,
        category,
        description: description.trim(),
        photo: photoName || null,
      });
      setIsCreateOpen(false);
      setError('');
      setSuccessMessage('Complaint submitted successfully. Admin has been notified.');
      toast('success', 'Complaint submitted successfully. Admin has been notified.');
      addNotification({
        title: 'New complaint received',
        message: `${user?.name || 'A resident'} submitted a ${category.toLowerCase()} complaint.`,
        targetRole: 'admin',
        type: 'warning',
      });
      complaints.refetch && complaints.refetch();
    } catch (err) {
      console.error('Failed to create complaint:', err);
      setError(err.message || 'Failed to submit complaint. Please try again.');
    }
  }

  function getTechnicianInfo(staffId) {
    if (!staffId) return null;

    if (typeof staffId === 'object') {
      const staffName = staffId.name || 'Staff Member';
      const specialty = staffId.specialty || staffId.role || 'General';
      return `${staffName} (${specialty})`;
    }

    const staffMember = staffList.find((s) => {
      const candidateId = s.id || s._id || s.userId;
      return String(candidateId) === String(staffId);
    });

    if (!staffMember) return staffId;
    return `${staffMember.name} (${staffMember.specialty || staffMember.role || 'General'})`;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Complaints & Maintenance"
        description="Raise tickets for maintenance issues and track their resolution status."
        action={
          <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} onClick={handleOpenCreate} >
            <Plus size={18} />
            New Complaint
          </Button>
        }
      />

      {successMessage && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {residentComplaints.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Wrench}
              title="No complaints submitted"
              description="Have a maintenance issue in your flat or society? Submit a complaint ticket for staff assistance."
              action={
                <Button variant="secondary" onClick={handleOpenCreate} className="mt-2">
                  <Plus size={16} />
                  New Complaint
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residentComplaints.map((complaint) => {
            const assignedTech = getTechnicianInfo(complaint.assignedTo);

            return (
              <Card
                key={complaint.id}
                onClick={() => setSelectedComplaint(complaint)}
                className="cursor-pointer transition-all hover:shadow-md hover:border-brand-200"
              >
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="neutral">{displayCategory(complaint.category)}</Badge>
                    <Badge>{String(complaint.status || 'Pending').replace(/-/g, ' ')}</Badge>
                  </div>

                  <p className="text-sm text-ink-800 font-medium line-clamp-3 leading-relaxed">
                    {complaint.description}
                  </p>

                  <div className="space-y-1.5 text-xs text-ink-500 border-t border-ink-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-ink-400" />
                        {formatDateTime(complaint.createdAt)}
                      </span>
                      {complaint.photo && (
                        <span className="flex items-center gap-1 text-brand-600 font-medium" title={complaint.photo}>
                          <Paperclip size={12} />
                          Photo
                        </span>
                      )}
                    </div>

                    {assignedTech && (
                      <div className="flex items-center gap-1.5 text-ink-700 font-medium pt-1">
                        <UserCheck size={13} className="text-brand-600" />
                        <span>Assigned: {assignedTech}</span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Complaint Modal */}
      <Modal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Raise New Complaint"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} variant="primary" onClick={handleCreateSubmit}>
              Submit Ticket
            </Button>
          </>
        }
      >
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <FormRow label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Description">
            <Textarea
              placeholder="Provide a detailed description of the issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
            />
          </FormRow>

          <FormRow label="Attach Photo (Optional)">
            <Input type="file" accept="image/*" onChange={handlePhotoChange} />
            {photoName && <p className="text-xs text-brand-700 mt-1">Attached: {photoName}</p>}
          </FormRow>
        </form>
      </Modal>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <Modal
          open={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title="Complaint Details"
          footer={
            <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-ink-100 pb-3">
              <div className="flex items-center gap-2">
                <Badge tone="neutral">{displayCategory(selectedComplaint.category)}</Badge>
                <Badge>{String(selectedComplaint.status || 'Pending').replace(/-/g, ' ')}</Badge>
              </div>
              <span className="text-xs text-ink-500">{formatDateTime(selectedComplaint.createdAt)}</span>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Description</h4>
              <p className="text-sm text-ink-900 bg-ink-50 p-3 rounded-lg border border-ink-100 whitespace-pre-wrap leading-relaxed">
                {selectedComplaint.description}
              </p>
            </div>

            {selectedComplaint.photo && (
              <div>
                <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Attached Photo</h4>
                <div className="flex items-center gap-2 p-2.5 bg-ink-50 rounded-lg border border-ink-100 text-sm text-ink-700">
                  <Paperclip size={16} className="text-brand-600" />
                  <span>{selectedComplaint.photo}</span>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-1">Assigned Technician</h4>
              <div className="p-3 bg-ink-50 rounded-lg border border-ink-100 text-sm text-ink-800 flex items-center gap-2">
                <UserCheck size={16} className="text-brand-600" />
                <span>
                  {getTechnicianInfo(selectedComplaint.assignedTo) || 'Not yet assigned'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-3">Status Progression</h4>
              {selectedComplaint.history && selectedComplaint.history.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-ink-200">
                  {selectedComplaint.history.map((item, idx) => (
                    <div key={idx} className="relative flex items-start justify-between gap-4 text-xs">
                      <div className="absolute -left-6 top-0.5 w-2.5 h-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
                      <div>
                        <p className="font-semibold text-ink-800">{item.note}</p>
                        <p className="text-ink-400 text-[11px] mt-0.5">{formatDateTime(item.ts)}</p>
                      </div>
                      <Badge className="shrink-0">{item.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-ink-500 italic">No history available.</p>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
