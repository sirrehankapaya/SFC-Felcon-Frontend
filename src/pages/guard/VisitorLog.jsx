import { useMemo, useState } from 'react';
import { UserPlus, LogOut, AlertTriangle, CheckCircle2, Search, Car } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Select, FormRow } from '../../components/ui/Field';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useCollection } from '../../hooks/useCollection';
import { logWalkIn, checkOutVisitor, flagOverstay } from '../../services/gateService';
import { getFlat } from '../../services/residentService';
import { formatDateTime } from '../../utils/format';

const VISITOR_TYPES = ['Guest', 'Delivery', 'Cab', 'Service Staff'];

export default function VisitorLog() {
  const gateLogs = useCollection('gateLogs') || [];
  const residents = useCollection('residents') || [];
  const flats = useCollection('flats') || [];

  const residentsWithFlats = useMemo(() => {
    return residents.map((resident) => {
      const flat = flats.find((item) => {
        const candidateId = item.id || item._id;
        return String(candidateId) === String(resident.flatId || '');
      }) || null;

      return {
        ...resident,
        flat,
        flatId: resident.flatId || '',
      };
    });
  }, [residents, flats]);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [flatId, setFlatId] = useState('');
  const [type, setType] = useState('Guest');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [searchFilter, setSearchFilter] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter visitor name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Please enter phone number.');
      return;
    }
    if (!flatId) {
      setErrorMsg('Please select a flat.');
      return;
    }

    logWalkIn({
      name: name.trim(),
      phone: phone.trim(),
      vehicleNumber: vehicleNumber.trim() || '—',
      flatId,
      type,
    });

    setName('');
    setPhone('');
    setVehicleNumber('');
    setFlatId('');
    setType('Guest');
    setSuccessMsg('Walk-in visitor logged successfully!');

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const sortedLogs = [...gateLogs].sort(
    (a, b) => new Date(b.checkIn) - new Date(a.checkIn)
  );

  const filteredLogs = sortedLogs.filter((log) => {
    if (!searchFilter.trim()) return true;
    const query = searchFilter.toLowerCase();
    const flat = getFlat(log.flatId);
    const flatNum = flat ? flat.number.toLowerCase() : '';
    return (
      log.name.toLowerCase().includes(query) ||
      log.phone.toLowerCase().includes(query) ||
      log.vehicleNumber.toLowerCase().includes(query) ||
      log.type.toLowerCase().includes(query) ||
      flatNum.includes(query)
    );
  });

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/70 p-4 sm:p-6 text-slate-900">
      <PageHeader
        title="Visitor Log Entry"
        description="Log walk-in guests, deliveries, and service providers at the gate."
      />

      {/* WALK-IN FORM CARD */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader
          title={<span className="text-slate-900 font-bold">Log Walk-In Visitor</span>}
          subtitle={<span className="text-slate-500 text-xs">Record new entry details manually for guests without a pass</span>}
          className="border-b border-slate-100 pb-4"
        />
        <CardBody className="p-6">
          {successMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-800 border border-rose-200">
              <AlertTriangle size={16} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <FormRow label="Visitor Name *">
                <Input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>

              <FormRow label="Phone Number *">
                <Input
                  type="tel"
                  placeholder="+92 300 0000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>

              <FormRow label="Vehicle Number">
                <Input
                  type="text"
                  placeholder="e.g. KHI-1234 (optional)"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                />
              </FormRow>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormRow label="Visiting Flat *">
                <Select
                  value={flatId}
                  onChange={(e) => setFlatId(e.target.value)}
                  className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                >
                  <option value="" className="bg-white text-slate-900">-- Select Flat --</option>
                  {residentsWithFlats.map((r) => (
                    <option key={r.id} value={r.flatId} className="bg-white text-slate-900">
                      {r.flat ? `${r.flat.number} (${r.name})` : r.flatId}
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow label="Visitor Type">
                <Select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full bg-white border-slate-200 text-slate-900 focus:border-cyan-600 text-xs rounded-xl"
                >
                  {VISITOR_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-white text-slate-900">
                      {t}
                    </option>
                  ))}
                </Select>
              </FormRow>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5 px-5 py-2.5 transition-all active:scale-95"
              >
                <UserPlus size={16} />
                <span>Log Entry</span>
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* GATE LOGS TABLE CARD */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader
          title={<span className="text-slate-900 font-bold">Gate Logs</span>}
          subtitle={<span className="text-slate-500 text-xs">Showing all recorded entries ({filteredLogs.length})</span>}
          className="border-b border-slate-100 pb-4"
          action={
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search visitor, vehicle, flat..."
                className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 text-xs rounded-xl"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          }
        />
        <CardBody className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Car}
                title="No visitor logs match filter"
                description="Try adjusting your search or add a new walk-in entry."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-900">
                <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-[10px] text-slate-600 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Visitor Name</th>
                    <th className="px-5 py-3.5">Phone</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Flat</th>
                    <th className="px-5 py-3.5">Type</th>
                    <th className="px-5 py-3.5">Check-In</th>
                    <th className="px-5 py-3.5">Check-Out</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const flat = flats.find((item) => {
                      const candidateId = item.id || item._id;
                      return String(candidateId || '') === String(log.flatId || '');
                    }) || null;
                    const isInside = !log.checkOut;

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {log.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-800 font-medium">
                          {log.phone || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-700">
                          {log.vehicleNumber || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800">
                          {flat ? flat.number : log.flatId || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-bold">
                            {log.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-medium">
                          {formatDateTime(log.checkIn)}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-medium">
                          {log.checkOut ? (
                            formatDateTime(log.checkOut)
                          ) : (
                            <span className="inline-flex items-center text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-lg">
                              Inside
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isInside ? (
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant={log.overstay ? 'danger' : 'secondary'}
                                size="sm"
                                onClick={() => flagOverstay(log.id, !log.overstay)}
                                title={log.overstay ? 'Remove overstay flag' : 'Flag for overstay'}
                                className={
                                  log.overstay
                                    ? 'bg-rose-600 hover:bg-rose-700 text-white border-transparent text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1'
                                    : 'bg-white border-slate-200 text-amber-700 hover:bg-amber-50 border text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1'
                                }
                              >
                                <AlertTriangle size={13} />
                                <span>{log.overstay ? 'Overstayed' : 'Flag Overstay'}</span>
                              </Button>

                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => checkOutVisitor(log.id)}
                                className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200 text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1"
                              >
                                <LogOut size={13} />
                                <span>Check Out</span>
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 font-medium italic">Checked Out</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}