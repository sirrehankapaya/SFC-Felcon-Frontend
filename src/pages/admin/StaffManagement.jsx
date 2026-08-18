import { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Phone, UserCheck, Clock, Users, List, AlertCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Select, FormRow } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import { apiClient } from '../../services/apiClient';
import { listStaff, addStaff, updateStaff, deleteStaff } from '../../services/staffService';

const STAFF_ROLES = ['Plumbing', 'Plumber', 'Electrical', 'General / Elevator', 'Cleaning', 'Cleaning Staff', 'Security', 'Gardening', 'Other'];
const SHIFTS = ['Morning', 'Evening', 'Night'];
const STATUSES = ['Active', 'On Leave', 'Off-duty'];
const SYSTEM_ROLE_MAP = {
  staff: 'staff',
  maintenance: 'staff',
  security: 'security',
  guard: 'security',
};

function normalizeStaffRole(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return 'Other';

  const key = raw.toLowerCase().replace(/[^a-z]+/g, '');
  const map = {
    plumbing: 'Plumbing',
    plumber: 'Plumbing',
    electrical: 'Electrical',
    generalelevator: 'General / Elevator',
    cleaning: 'Cleaning',
    cleaningstaff: 'Cleaning',
    janitor: 'Cleaning',
    security: 'Security',
    gardening: 'Gardening',
    other: 'Other',
  };

  return map[key] || raw;
}

export default function StaffManagement() {
  const [staffList, setStaffList] = useState(() => listStaff());
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Hide / Show View State ('list' or 'form')
  const [activeView, setActiveView] = useState('list');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    specialty: 'General / Elevator',
    phone: '',
    status: 'Active',
    shift: 'Morning',
  });
  const [formError, setFormError] = useState('');

  function refresh() {
    setStaffList(listStaff());
  }

  function handleOpenAddForm() {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      specialty: 'General / Elevator',
      phone: '',
      status: 'Active',
      shift: 'Morning',
    });
    setFormError('');
    setEditTarget(null);
    setActiveView('form');
  }

  function handleOpenEditForm(staff) {
    const roleValue = String(staff.role || 'staff').toLowerCase();

    setFormData({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      role: roleValue === 'security' ? 'guard' : roleValue,
      specialty: normalizeStaffRole(staff.specialty || 'General / Elevator'),
      phone: staff.phone || '',
      status: staff.status || 'Active',
      shift: staff.shift || 'Morning',
    });
    setFormError('');
    setEditTarget(staff);
    setActiveView('form');
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!formData.name.trim()) return setFormError('Staff name is required');
    if (!formData.specialty) return setFormError('Specialty / Role is required');

    const normalizedRole = normalizeStaffRole(formData.specialty);
    const backendRole = SYSTEM_ROLE_MAP[formData.role] || 'staff';

    try {
      if (!editTarget) {
        if (!formData.email.trim() || !formData.password) {
          return setFormError('Email and password are required for staff login.');
        }

        const newUser = await apiClient.post('/api/user/register', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: backendRole,
          phone: formData.phone.trim() || null,
          flatId: null,
        });

        if (!newUser || newUser.status === false) {
          throw new Error(newUser?.message || 'Failed to create staff login account');
        }
      }

      if (editTarget) {
        updateStaff(editTarget.id, {
          name: formData.name.trim(),
          role: backendRole,
          specialty: normalizedRole,
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim(),
          status: formData.status,
          shift: formData.shift,
        });
      } else {
        addStaff({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: backendRole,
          specialty: normalizedRole,
          phone: formData.phone.trim(),
          status: formData.status,
          shift: formData.shift,
        });
      }
      setActiveView('list');
      setEditTarget(null);
      refresh();
    } catch (err) {
      setFormError(err.message || 'Failed to save staff member');
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      deleteStaff(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      console.error('Delete error:', err);
    }
  }

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    return staffList.filter((s) => {
      const specialty = normalizeStaffRole(s.specialty);
      const matchesSearch =
        !q ||
        (s.name || '').toLowerCase().includes(q) ||
        specialty.toLowerCase().includes(q) ||
        (s.phone || '').toLowerCase().includes(q);
      const matchesRole = roleFilter === 'All' || specialty === roleFilter || normalizeStaffRole(roleFilter) === specialty;
      return matchesSearch && matchesRole;
    });
  }, [staffList, search, roleFilter]);

  const summary = useMemo(() => {
    const total = staffList.length;
    const active = staffList.filter((s) => s.status === 'Active').length;
    const onLeave = staffList.filter((s) => s.status === 'On Leave').length;
    const offDuty = staffList.filter((s) => s.status === 'Off-duty').length;
    return { total, active, onLeave, offDuty };
  }, [staffList]);

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/70 p-4 sm:p-6 text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Staff Management"
          description="Manage society staff, assign roles, track attendance, and monitor duty status."
        />
        <Button
          onClick={() => {
            if (activeView === 'list') {
              handleOpenAddForm();
            } else {
              setActiveView('list');
            }
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 px-4 py-2 transition-all active:scale-95 shrink-0"
        >
          {activeView === 'list' ? (
            <>
              <Plus size={18} />
              <span>Add Staff</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span>View Staff List</span>
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Staff"
          value={summary.total}
          icon={Users}
          tone="brand"
          hint="Registered personnel"
        />
        <StatCard
          label="Active"
          value={summary.active}
          icon={UserCheck}
          tone="success"
          hint="Currently on duty"
        />
        <StatCard
          label="On Leave"
          value={summary.onLeave}
          icon={Clock}
          tone="warning"
          hint="Approved leave"
        />
        <StatCard
          label="Off-duty"
          value={summary.offDuty}
          icon={Users}
          tone="neutral"
          hint="Off the roster"
        />
      </div>

      {/* VIEW DIRECTORY TABLE */}
      {activeView === 'list' && (
        <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
          {/* Controls */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-44 bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
              >
                <option value="All">All Roles</option>
                {STAFF_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </div>

            <div className="relative w-full sm:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search name, specialty, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredStaff.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No staff found"
                description={search || roleFilter !== 'All' ? 'No staff match your filters.' : 'Get started by adding your first staff member.'}
              />
            ) : (
              <table className="w-full text-left text-xs text-slate-900">
                <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-[10px] text-slate-600 font-bold">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Specialty / Role</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Shift</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((s) => {
                    const sid = s.id || s._id;
                    return (
                      <tr key={sid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{s.name}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-800">{s.specialty || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                          {s.phone ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Phone size={12} className="text-slate-400" />
                              {s.phone}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge tone={s.status === 'Active' ? 'success' : s.status === 'On Leave' ? 'warning' : 'neutral'} className="font-bold">
                            {s.status || 'Off-duty'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                          {s.shift ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <Clock size={12} className="text-slate-400" />
                              {s.shift}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-cyan-700 hover:bg-cyan-50 text-xs font-semibold px-3 py-1 rounded-lg"
                              onClick={() => handleOpenEditForm(s)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs px-2.5 py-1 rounded-lg font-semibold"
                              onClick={() => setDeleteTarget(s)}
                            >
                              <Trash2 size={13} className="mr-1 inline" /> Remove
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </Card>
      )}

      {/* SHOW FORM SECTION */}
      {activeView === 'form' && (
        <Card className="bg-white border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm max-w-3xl mx-auto">
          <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">{editTarget ? 'Edit Staff Member' : 'Add New Staff'}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Fill in personal and duty details for society staff personnel</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setActiveView('list')}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl font-semibold"
            >
              Cancel
            </Button>
          </div>

          <form id="staff-form" onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-600">
                <AlertCircle size={16} className="shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Personal Details</p>
              <FormRow label="Full Name" required>
                <Input
                  placeholder="e.g. Haris Ahmed"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormRow label="System Role">
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                  >
                    <option value="staff">Staff</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="guard">Guard</option>
                    <option value="security">Security</option>
                  </Select>
                </FormRow>
                <FormRow label="Phone Number">
                  <Input
                    placeholder="+92 300 1234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                  />
                </FormRow>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormRow label="Email" required>
                  <Input
                    type="email"
                    placeholder="staff@smartsociety.pk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                  />
                </FormRow>
                <FormRow label="Password" required>
                  <Input
                    type="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                  />
                </FormRow>
              </div>

              <FormRow label="Specialty / Role" required>
                <Select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
              </FormRow>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4">
              <p className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Duty Details</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormRow label="Current Status">
                  <Select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </Select>
                </FormRow>
                <FormRow label="Assigned Shift">
                  <Select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                  >
                    {SHIFTS.map((sh) => (
                      <option key={sh} value={sh}>{sh}</option>
                    ))}
                  </Select>
                </FormRow>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setActiveView('list')}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl px-4 py-2 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl px-5 py-2 shadow-sm"
              >
                {editTarget ? 'Save Changes' : 'Add Staff'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Remove Staff Member"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
            <Button variant="secondary" className="w-full sm:w-auto text-xs rounded-xl" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="w-full sm:w-auto text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirmDelete}>
              Confirm Remove
            </Button>
          </div>
        }
      >
        {deleteTarget && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-3 text-rose-800 border border-rose-200">
              <Trash2 size={20} className="shrink-0 text-rose-600" />
              <p className="text-xs font-medium">
                This action will remove the staff profile from the management roster. This cannot be undone.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-700">
              Are you sure you want to remove <strong className="text-slate-900">{deleteTarget.name}</strong> (Specialty: <strong className="text-slate-900">{deleteTarget.specialty}</strong>)?
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}