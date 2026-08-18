import { useState, useMemo } from 'react';
import { AlertCircle, Search, UserCheck, CheckCircle2, Clock, Wrench, MessageSquare, History } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Textarea, Select, Label, FormRow } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime, formatDate } from '../../utils/format';
import { assignComplaint, updateComplaintStatus } from '../../services/complaintService';

function canonicalKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '');
}

function normalizeStatus(value) {
  const raw = canonicalKey(value);

  if (['pending', 'open', 'new'].includes(raw)) return 'Pending';
  if (raw.includes('inprogress') || raw.includes('progress')) return 'In-Progress';
  if (['resolved', 'closed', 'completed'].includes(raw)) return 'Resolved';
  if (['rejected', 'cancelled'].includes(raw)) return 'Rejected';

  return String(value || 'Pending');
}

function normalizeCategory(value) {
  const raw = canonicalKey(value);
  const map = {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    elevator: 'Elevator',
    cleaning: 'Cleaning',
    security: 'Security',
    pestcontrol: 'Pest Control',
    other: 'Other',
    general: 'Other',
  };

  return map[raw] || String(value || 'Other');
}

function getObjectId(value) {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || value.userId || value.residentId || '');
  return String(value);
}

export default function Helpdesk() {
  const complaints = useCollection('complaints');
  const staffList = useCollection('staff');
  const residents = useCollection('residents');
  const flats = useCollection('flats');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal State
  const [activeComplaint, setActiveComplaint] = useState(null);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [actionError, setActionError] = useState('');

  // Flat lookup
  const flatMap = useMemo(() => {
    return (flats || []).reduce((acc, f) => {
      const flatId = f.id || f._id;
      const flatNumber = f.flatNumber || f.number || '—';
      if (flatId) acc[String(flatId)] = flatNumber;
      return acc;
    }, {});
  }, [flats]);

  // Resident lookup
  const residentMap = useMemo(() => {
    return (residents || []).reduce((acc, r) => {
      const residentId = r.id || r._id || r.userId;
      if (residentId) acc[String(residentId)] = r;
      return acc;
    }, {});
  }, [residents]);

  // Staff lookup
  const staffMap = useMemo(() => {
    return (staffList || []).reduce((acc, s) => {
      const staffId = s.id || s._id || s.userId;
      if (staffId) acc[String(staffId)] = s;
      return acc;
    }, {});
  }, [staffList]);

  // Filtered complaints
  const filteredComplaints = useMemo(() => {
    return (complaints || [])
      .filter((c) => {
        const residentId = getObjectId(c.residentId || c.userId);
        const flatId = getObjectId(c.flatId);
        const resident = residentId ? residentMap[String(residentId)] : null;
        const resName = resident?.name || resident?.fullName || '';
        const flatNum = flatId ? (flatMap[String(flatId)] || '') : '';
        const categoryText = normalizeCategory(c.category);
        const descriptionText = String(c.description || c.message || '');
        const q = search.trim().toLowerCase();

        const matchesSearch =
          !q ||
          [resName, flatNum, categoryText, descriptionText]
            .some((value) => String(value).toLowerCase().includes(q));

        const matchesStatus = statusFilter === 'All' || normalizeStatus(c.status) === statusFilter;
        const matchesCategory = categoryFilter === 'All' || categoryText === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [complaints, residentMap, flatMap, search, statusFilter, categoryFilter]);

  // Get current state of selected complaint from reactive collection
  const currentComplaint = useMemo(() => {
    if (!activeComplaint) return null;
    return (complaints || []).find((c) => (c.id || c._id) === (activeComplaint.id || activeComplaint._id)) || activeComplaint;
  }, [complaints, activeComplaint]);

  function handleOpenModal(complaint) {
    setActiveComplaint(complaint);
    const assignedTo = complaint.assignedTo && typeof complaint.assignedTo === 'object'
      ? (complaint.assignedTo._id || complaint.assignedTo.id)
      : complaint.assignedTo;
    setSelectedStaffId(assignedTo || (staffList[0]?.id || staffList[0]?._id || ''));
    setResolutionNote('');
    setActionError('');
  }

  function handleAssignStaff() {
    if (!selectedStaffId) {
      setActionError('Please select a technician to assign');
      return;
    }
    const staffMember = staffMap[String(selectedStaffId)];
    if (!staffMember) return;

    assignComplaint(currentComplaint.id || currentComplaint._id, staffMember.id || staffMember._id, staffMember.name);
    setActionError('');
  }

  function handleResolveComplaint() {
    if (!resolutionNote.trim()) {
      setActionError('Please provide a resolution note before marking resolved');
      return;
    }
    updateComplaintStatus(currentComplaint.id || currentComplaint._id, 'Resolved', resolutionNote.trim());
    setActionError('');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Helpdesk & Ticket Routing"
        description="Review resident complaints, route requests to society maintenance staff, and track resolution timelines."
      />

      {/* Filter Bar */}
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-2.5 text-ink-400" />
            <Input
              placeholder="Search resident name, flat, issue description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="mb-0 text-xs">Status:</Label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-36"
              >
                <option value="All">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In-Progress">In-Progress</option>
                <option value="Resolved">Resolved</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Label className="mb-0 text-xs">Category:</Label>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-36"
              >
                <option value="All">All Categories</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Elevator">Elevator</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Security">Security</option>
                <option value="Pest Control">Pest Control</option>
                <option value="Other">Other</option>
              </Select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Complaints Table */}
      <Card>
        <div className="overflow-x-auto">
          {filteredComplaints.length === 0 ? (
            <EmptyState
              icon={AlertCircle}
              title="No complaints found"
              description="No complaints match your current filter settings."
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/50 text-xs font-semibold text-ink-500">
                <tr>
                  <th className="px-4 py-3">Resident</th>
                  <th className="px-4 py-3">Flat</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned Staff</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredComplaints.map((item) => {
                  const residentId = item.residentId && typeof item.residentId === 'object' ? (item.residentId._id || item.residentId.id) : item.residentId;
                  const resident = residentId ? residentMap[String(residentId)] : null;
                  const assignedStaffId = item.assignedTo && typeof item.assignedTo === 'object' ? (item.assignedTo._id || item.assignedTo.id) : item.assignedTo;
                  const assignedStaff = assignedStaffId ? staffMap[String(assignedStaffId)] : null;

                  return (
                    <tr
                      key={item.id || item._id}
                      className="cursor-pointer hover:bg-ink-50/50"
                      onClick={() => handleOpenModal(item)}
                    >
                      <td className="px-4 py-3 font-semibold text-ink-900">
                        {resident ? resident.name : 'Resident'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {(() => {
                          const flatId = item.flatId && typeof item.flatId === 'object' ? (item.flatId._id || item.flatId.id) : item.flatId;
                          return flatId ? (flatMap[String(flatId)] || '—') : '—';
                        })()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700">
                          {normalizeCategory(item.category)}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-ink-600">
                        <p className="line-clamp-1">{item.description}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge>{normalizeStatus(item.status)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-700">
                        {assignedStaff ? (
                          <div className="flex items-center gap-1">
                            <Wrench size={12} className="text-brand-600" />
                            <span>{assignedStaff.name}</span>
                          </div>
                        ) : (
                          <span className="text-ink-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(item);
                          }}
                        >
                          Details
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Complaint Detail & Workflow Modal */}
      <Modal
        open={!!currentComplaint}
        onClose={() => setActiveComplaint(null)}
        title={`Complaint Ticket — ${currentComplaint?.category || ''}`}
        width="max-w-2xl"
        footer={
          <Button variant="secondary" onClick={() => setActiveComplaint(null)}>
            Close
          </Button>
        }
      >
        {currentComplaint && (
          <div className="space-y-5 text-sm">
            {actionError && (
              <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                {actionError}
              </div>
            )}

            {/* Header info */}
            <div className="flex items-start justify-between rounded-lg bg-ink-50 p-4 border border-ink-100">
              <div>
                <p className="text-xs text-ink-500">Resident & Flat</p>
                <p className="font-semibold text-ink-900 text-base">
                  {(() => {
                    const residentId = currentComplaint.residentId && typeof currentComplaint.residentId === 'object'
                      ? (currentComplaint.residentId._id || currentComplaint.residentId.id)
                      : currentComplaint.residentId;
                    const flatId = currentComplaint.flatId && typeof currentComplaint.flatId === 'object'
                      ? (currentComplaint.flatId._id || currentComplaint.flatId.id)
                      : currentComplaint.flatId;
                    return `${residentMap[String(residentId)]?.name || 'Resident'} — Flat ${flatId ? (flatMap[String(flatId)] || '') : ''}`;
                  })()}
                </p>
                <p className="mt-0.5 text-xs text-ink-500">
                  Reported: {formatDateTime(currentComplaint.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <Badge className="text-sm px-3 py-1">{normalizeStatus(currentComplaint.status)}</Badge>
              </div>
            </div>

            {/* Full description */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-ink-500 uppercase tracking-wider">
                Issue Description
              </Label>
              <div className="rounded-md bg-white p-3 border border-ink-200 text-ink-800 text-sm leading-relaxed whitespace-pre-wrap">
                {currentComplaint.description}
              </div>
            </div>

            {/* Admin Action Workflow */}
            <div className="rounded-lg border border-brand-200 bg-brand-50/30 p-4 space-y-3">
              <div className="flex items-center gap-2 font-semibold text-brand-900 text-xs uppercase tracking-wider">
                <UserCheck size={16} className="text-brand-600" />
                Staff Routing & Status Workflow
              </div>

              {normalizeStatus(currentComplaint.status) === 'Pending' && (
                <div className="space-y-3">
                  <p className="text-xs text-ink-600">
                    This ticket is currently unassigned. Select a technician to begin work:
                  </p>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Select
                      value={selectedStaffId}
                      onChange={(e) => setSelectedStaffId(e.target.value)}
                      className="flex-1"
                    >
                      <option value="" disabled>Select staff member...</option>
                      {staffList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.specialty})
                        </option>
                      ))}
                    </Select>
                    <Button onClick={handleAssignStaff}>Assign Technician</Button>
                  </div>
                </div>
              )}

              {normalizeStatus(currentComplaint.status) === 'In-Progress' && (
                <div className="space-y-3">
                  <div className="text-xs text-ink-700">
                    Assigned Technician:{' '}
                    <strong className="text-ink-900">
                      {staffMap[currentComplaint.assignedTo]?.name || 'Assigned Staff'}
                    </strong>
                  </div>
                  <FormRow label="Resolution Notes / Remarks">
                    <Textarea
                      placeholder="e.g. Technician replaced leaking valve and tested pipe flow."
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      className="min-h-20"
                    />
                  </FormRow>
                  <Button onClick={handleResolveComplaint} className="bg-emerald-600 hover:bg-emerald-700">
                    <CheckCircle2 size={16} /> Mark as Resolved
                  </Button>
                </div>
              )}

              {normalizeStatus(currentComplaint.status) === 'Resolved' && (
                <div className="flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  This ticket has been resolved by management / staff.
                </div>
              )}
            </div>

            {/* Status History Timeline */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-ink-500 uppercase tracking-wider flex items-center gap-1.5">
                <History size={14} /> Status History Timeline
              </Label>
              <div className="divide-y divide-ink-100 rounded-md border border-ink-200 bg-white">
                {(currentComplaint.history || []).map((h, i) => (
                  <div key={i} className="flex items-start justify-between p-3 text-xs">
                    <div>
                      <p className="font-medium text-ink-900">{h.note}</p>
                      <p className="text-ink-400 mt-0.5">{formatDateTime(h.ts)}</p>
                    </div>
                    <Badge tone={h.status === 'Resolved' ? 'success' : 'neutral'}>
                      {h.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
