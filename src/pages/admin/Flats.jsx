import { useMemo, useState } from 'react';
import { Building, Search, Plus, List } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Select, FormRow } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';
import { apiClient } from '../../services/apiClient';

export default function Flats() {
  const residentsCollection = useCollection('residents');
  const flatsCollection = useCollection('flats');

  const residents = useMemo(
    () => (Array.isArray(residentsCollection) ? residentsCollection : residentsCollection?.data || []),
    [residentsCollection]
  );

  const flats = useMemo(
    () => (Array.isArray(flatsCollection) ? flatsCollection : flatsCollection?.data || []),
    [flatsCollection]
  );

  const assignedFlatIds = useMemo(() => {
    return new Set(
      residents
        .map((r) => {
          if (!r.flatId) return null;
          if (typeof r.flatId === 'object') return r.flatId._id || r.flatId.id || null;
          return String(r.flatId);
        })
        .filter(Boolean)
    );
  }, [residents]);

  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('list'); // 'list' or 'form'
  const [flatFormData, setFlatFormData] = useState({
    flatNumber: '',
    tower: '',
    floor: '',
    size: '2 BHK',
    occupancyStatus: 'vacant',
  });

  const filteredFlats = useMemo(() => {
    const q = search.trim().toLowerCase();
    return flats.filter((f) => {
      const flatNumber = String(f.flatNumber || f.number || '').toLowerCase();
      const block = String(f.tower || f.block || '').toLowerCase();
      return !q || flatNumber.includes(q) || block.includes(q);
    });
  }, [flats, search]);

  const handleCreateFlatSubmit = async (e) => {
    e.preventDefault();

    try {
      const payload = {
        flatNumber: flatFormData.flatNumber.trim(),
        tower: flatFormData.tower.trim(),
        floor: flatFormData.floor,
        size: flatFormData.size,
        occupancyStatus: flatFormData.occupancyStatus,
      };

      if (!payload.flatNumber || !payload.tower) {
        return;
      }

      await apiClient.post('/api/flat/create', payload);

      if (flatsCollection.refetch) {
        await flatsCollection.refetch();
      }

      setActiveView('list');
      setFlatFormData({
        flatNumber: '',
        tower: '',
        floor: '',
        size: '2 BHK',
        occupancyStatus: 'vacant',
      });
    } catch (err) {
      console.error('Failed to create flat:', err);
    }
  };

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/70 p-4 sm:p-6 text-slate-900">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader title="Flats Directory" description="Manage all apartment units, view occupancy, and add new flats." />
        <Button
          onClick={() => setActiveView(activeView === 'list' ? 'form' : 'list')}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 px-4 py-2 transition-all active:scale-95 shrink-0"
        >
          {activeView === 'list' ? (
            <>
              <Plus size={18} />
              <span>Add Flat</span>
            </>
          ) : (
            <>
              <List size={18} />
              <span>View Flats</span>
            </>
          )}
        </Button>
      </div>

      {/* VIEW FLATS TABLE */}
      {activeView === 'list' && (
        <Card className="bg-white border-slate-200 p-6 rounded-2xl shadow-sm">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input
                type="text"
                placeholder="Search by flat number or block..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
              />
            </div>
            <div className="text-xs text-slate-600 font-medium">
              Total Units: <span className="font-extrabold text-slate-900">{flats.length}</span>
            </div>
          </div>

          {filteredFlats.length === 0 ? (
            <EmptyState
              icon={Building}
              title="No flats found"
              description="No apartment units match your search query."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-900">
                <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-[10px] text-slate-600 font-bold">
                  <tr>
                    <th className="px-4 py-3">Flat No.</th>
                    <th className="px-4 py-3">Block/Tower</th>
                    <th className="px-4 py-3">Floor</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Occupant Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFlats.map((flat) => {
                    const isOccupied = assignedFlatIds.has(flat.id);
                    return (
                      <tr key={flat.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Building size={14} className="text-cyan-600 shrink-0" />
                          {flat.number}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">{flat.block || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">{flat.floor ?? '—'}</td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium">{flat.type || 'Standard'}</td>
                        <td className="px-4 py-3.5">
                          {isOccupied ? (
                            <Badge tone="success" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">Occupied</Badge>
                          ) : (
                            <Badge tone="neutral" className="bg-slate-100 text-slate-600 border-slate-200 font-bold">Vacant</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="capitalize font-semibold text-slate-900">
                            {flat.occupancyType || (isOccupied ? 'Occupied' : 'Vacant')}
                          </span>
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
              <h3 className="text-base font-bold text-slate-900">Add New Flat</h3>
              <p className="text-xs text-slate-500 mt-0.5">Register a new residential unit into the society directory</p>
            </div>
            <Button
              variant="secondary"
              onClick={() => setActiveView('list')}
              className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-xs rounded-xl font-semibold"
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handleCreateFlatSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormRow label="Flat Number">
                <Input
                  required
                  placeholder="e.g. 101, A-402"
                  value={flatFormData.flatNumber}
                  onChange={(e) => setFlatFormData({ ...flatFormData, flatNumber: e.target.value })}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>

              <FormRow label="Block / Tower">
                <Input
                  required
                  placeholder="e.g. Block A, Tower 1"
                  value={flatFormData.tower}
                  onChange={(e) => setFlatFormData({ ...flatFormData, tower: e.target.value })}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormRow label="Floor Number">
                <Input
                  type="number"
                  required
                  placeholder="e.g. 1, 4, 12"
                  value={flatFormData.floor}
                  onChange={(e) => setFlatFormData({ ...flatFormData, floor: e.target.value })}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>

              <FormRow label="Flat Size / Layout">
                <Select
                  value={flatFormData.size}
                  onChange={(e) => setFlatFormData({ ...flatFormData, size: e.target.value })}
                  className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                >
                  <option value="1 BHK" className="bg-white text-slate-900">1 BHK</option>
                  <option value="2 BHK" className="bg-white text-slate-900">2 BHK</option>
                  <option value="3 BHK" className="bg-white text-slate-900">3 BHK</option>
                  <option value="4 BHK" className="bg-white text-slate-900">4 BHK</option>
                  <option value="Penthouse" className="bg-white text-slate-900">Penthouse</option>
                </Select>
              </FormRow>
            </div>

            <FormRow label="Initial Occupancy Status">
              <Select
                value={flatFormData.occupancyStatus}
                onChange={(e) => setFlatFormData({ ...flatFormData, occupancyStatus: e.target.value })}
                className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
              >
                <option value="vacant" className="bg-white text-slate-900">Vacant</option>
                <option value="owner" className="bg-white text-slate-900">Owner Occupied</option>
                <option value="tenant" className="bg-white text-slate-900">Rented to Tenant</option>
              </Select>
            </FormRow>

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
                Save Flat Record
              </Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}