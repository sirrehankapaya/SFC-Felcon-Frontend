import { useState, useMemo } from 'react';
import { Users, Building, Plus, Search, Trash2, ShieldAlert, Phone, Mail, List } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Select, FormRow } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';

export default function Residents() {
  const residentsCollection = useCollection('residents');
  const flatsCollection = useCollection('flats');

  // Safe array extraction
  const residents = useMemo(() => Array.isArray(residentsCollection) ? residentsCollection : (residentsCollection?.data || []), [residentsCollection]);
  const flats = useMemo(() => Array.isArray(flatsCollection) ? flatsCollection : (flatsCollection?.data || []), [flatsCollection]);

  const [search, setSearch] = useState('');

  // Active View State ('list' or 'form')
  const [activeView, setActiveView] = useState('list');
  const [offboardTarget, setOffboardTarget] = useState(null);

  // Resident Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    flatId: '',
    tenant: false,
    username: '',
    password: '',
  });
  const [formError, setFormError] = useState('');

  const normalizeFlatId = (value) => {
    if (!value) return '';
    if (typeof value === 'object') {
      return String(value._id || value.id || value.flatId || '');
    }
    return String(value);
  };

  // Map flatId to flat object
  const flatsMap = useMemo(() => {
    const map = {};
    flats.forEach((f) => {
      const candidates = [f.id, f._id, f.flatId, f.flatNumber, f.number];
      candidates.filter(Boolean).forEach((candidate) => {
        map[String(candidate)] = f;
      });
    });
    return map;
  }, [flats]);

  // Combine resident data with flat info
  const enrichedResidents = useMemo(() => {
    return residents.map((r) => ({
      ...r,
      flat: flatsMap[normalizeFlatId(r.flatId)] || null,
    }));
  }, [residents, flatsMap]);

  // Available vacant/unassigned flats
  const availableFlats = useMemo(() => {
    const assignedFlatIds = new Set(
      residents
        .map((r) => normalizeFlatId(r.flatId))
        .filter(Boolean)
    );

    return flats.filter((f) => {
      const candidateIds = [f.id, f._id, f.flatId, f.flatNumber, f.number].filter(Boolean).map(String);
      return !candidateIds.some((id) => assignedFlatIds.has(id));
    });
  }, [flats, residents]);

  // Filter residents
  const filteredResidents = useMemo(() => {
    return enrichedResidents.filter(r => {
      const q = search.toLowerCase();
      const nameMatch = r.name?.toLowerCase().includes(q);
      const phoneMatch = r.phone?.includes(q);
      const emailMatch = r.email?.toLowerCase().includes(q);
      const flatNumMatch = r.flat?.number?.toLowerCase().includes(q) || r.flat?.flatNumber?.toLowerCase().includes(q);
      return nameMatch || phoneMatch || emailMatch || flatNumMatch;
    });
  }, [enrichedResidents, search]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddResidentSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.flatId) {
      setFormError('Please fill in Resident Name and Select an Available Flat.');
      return;
    }

    console.log('Registering Resident:', formData);
    
    // Reset form and view
    setFormData({
      name: '',
      phone: '',
      email: '',
      flatId: '',
      tenant: false,
      username: '',
      password: '',
    });
    setFormError('');
    setActiveView('list');
  };

  const handleConfirmOffboard = () => {
    if (!offboardTarget) return;
    console.log('Offboarding resident:', offboardTarget.id || offboardTarget._id);
    setOffboardTarget(null);
  };

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/70 p-4 sm:p-6 text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Resident Management" description="View onboarded residents, manage flat allocations, and onboard new members." />
        <Button
          onClick={() => {
            setActiveView(activeView === 'list' ? 'form' : 'list');
            setFormError('');
          }}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 px-4 py-2 transition-all active:scale-95 shrink-0"
        >
          {activeView === 'list' ? (
            <>
              <Plus size={18} />
              <span>Add Resident</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span>View Directory</span>
            </>
          )}
        </Button>
      </div>

      {/* VIEW DIRECTORY TABLE */}
      {activeView === 'list' && (
        <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                type="text"
                placeholder="Search by resident name, flat, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Total Residents: <span className="font-extrabold text-slate-900">{residents.length}</span>
            </div>
          </div>

          {filteredResidents.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No residents found"
              description="No registered residents match your search filters."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-900">
                <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-[10px] text-slate-600 font-bold">
                  <tr>
                    <th className="px-4 py-3">Resident Name</th>
                    <th className="px-4 py-3">Flat Unit</th>
                    <th className="px-4 py-3">Occupancy</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResidents.map((res) => {
                    const flatNum = res.flat?.flatNumber || res.flat?.number || 'Unassigned';
                    const block = res.flat?.tower || res.flat?.block || '';
                    const isTenant = res.isTenant || res.tenant;

                    return (
                      <tr key={res.id || res._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Users size={14} className="text-cyan-600 shrink-0" />
                          {res.name}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                            <Building size={12} className="text-slate-400" />
                            Flat {flatNum} {block ? `(${block})` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {isTenant ? (
                            <Badge tone="warning" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">Tenant</Badge>
                          ) : (
                            <Badge tone="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">Owner</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                          {res.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone size={12} className="text-slate-400" />
                              {res.phone}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">
                          {res.email ? (
                            <span className="flex items-center gap-1">
                              <Mail size={12} className="text-slate-400" />
                              {res.email}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                       <Button
  className="bg-rose-600 hover:bg-rose-700 text-white text-xs px-2.5 py-1 rounded-lg font-semibold shadow-xs transition-colors"
  size="sm"
  onClick={() => setOffboardTarget(res)}
>
  <Trash2 size={13} className="mr-1 inline" /> Offboard
</Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* SHOW FORM SECTION */}
      {activeView === 'form' && (
        <Card className="bg-white border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm max-w-3xl mx-auto">
          <div className="pb-4 mb-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Add New Resident</h3>
              <p className="text-xs text-slate-500 mt-0.5">Assign a resident to a flat and set up portal access credentials</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setActiveView('list');
                setFormError('');
              }}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl font-semibold"
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handleAddResidentSubmit} className="space-y-5">
            {formError && (
              <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-semibold text-rose-600">
                <ShieldAlert size={16} className="shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormRow label="Full Name">
                <Input
                  required
                  name="name"
                  placeholder="e.g. Ahmed Ali"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>

              <FormRow label="Assign Flat Unit">
                <Select
                  required
                  name="flatId"
                  value={formData.flatId}
                  onChange={handleFormChange}
                  className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                >
                  <option value="" className="bg-white text-slate-900">-- Select Available Flat --</option>
                  {availableFlats.map((f) => (
                    <option key={f.id || f._id} value={f.id || f._id} className="bg-white text-slate-900">
                      Flat {f.flatNumber || f.number} {f.tower || f.block ? `(${f.tower || f.block})` : ''}
                    </option>
                  ))}
                </Select>
              </FormRow>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormRow label="Phone Number">
                <Input
                  name="phone"
                  placeholder="0300-1234567"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>

              <FormRow label="Email Address">
                <Input
                  type="email"
                  name="email"
                  placeholder="ahmed@example.com"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="tenant"
                name="tenant"
                checked={formData.tenant}
                onChange={handleFormChange}
                className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
              />
              <label htmlFor="tenant" className="text-xs font-semibold text-slate-800 cursor-pointer">
                Resident is a Tenant (Renter)
              </label>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Portal Access Account</h4>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormRow label="Username">
                  <Input
                    name="username"
                    placeholder="e.g. ahmed_101"
                    value={formData.username}
                    onChange={handleFormChange}
                    className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                  />
                </FormRow>

                <FormRow label="Password">
                  <Input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleFormChange}
                    className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                  />
                </FormRow>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setActiveView('list');
                  setFormError('');
                }}
                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl px-4 py-2 font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl px-5 py-2 shadow-sm"
              >
                Register & Onboard
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Confirm Offboard Modal */}
      <Modal
        open={!!offboardTarget}
        onClose={() => setOffboardTarget(null)}
        title="Confirm Offboard Resident"
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
            <Button variant="secondary" className="w-full sm:w-auto text-xs rounded-xl" onClick={() => setOffboardTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" className="w-full sm:w-auto text-xs rounded-xl bg-rose-600 hover:bg-rose-700 text-white" onClick={handleConfirmOffboard}>
              Confirm Offboard
            </Button>
          </div>
        }
      >
        {offboardTarget && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3.5 text-amber-800 border border-amber-200">
              <ShieldAlert size={20} className="shrink-0 text-amber-600" />
              <p className="text-xs font-medium">
                Offboarding will permanently delete resident profile records and revoke portal access for this account.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-slate-700">
              Are you sure you want to offboard <strong className="text-slate-900">{offboardTarget.name}</strong> from Flat{' '}
              <strong className="text-slate-900">
                {offboardTarget.flat?.flatNumber || offboardTarget.flat?.number || 'assigned flat'}
              </strong>?
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}