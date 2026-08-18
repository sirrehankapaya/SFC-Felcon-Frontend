import { useState } from 'react';
import { AlertTriangle, ShieldAlert, LogOut, CheckCircle2, Clock, Filter, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useCollection } from '../../hooks/useCollection';
import { checkOutVisitor, flagOverstay } from '../../services/gateService';
import { getFlat } from '../../services/residentService';
import { formatDateTime } from '../../utils/format';

function formatDuration(checkInStr, checkOutStr) {
  if (!checkInStr) return '—';
  const start = new Date(checkInStr).getTime();
  const end = checkOutStr ? new Date(checkOutStr).getTime() : Date.now();
  const diffMins = Math.floor(Math.max(0, end - start) / (1000 * 60));
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default function Overstay() {
  const gateLogs = useCollection('gateLogs') || [];
  const flats = useCollection('flats') || [];
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);

  const activeOverstays = gateLogs.filter((log) => log.overstay && !log.checkOut);
  const allOverstays = gateLogs.filter((log) => log.overstay);

  const displayedLogs = (filterActiveOnly ? activeOverstays : allOverstays)
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overstay Management"
        description="Track visitors exceeding standard duration and manage security flags."
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-xs text-amber-900">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-amber-100 p-2 text-amber-700 shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-950">
              {activeOverstays.length} visitor{activeOverstays.length === 1 ? '' : 's'} currently flagged for overstay
            </h2>
            <p className="text-xs text-amber-800 mt-0.5">
              Follow up with residents or dispatch gate guards to verify remaining visitors.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-white/80 p-1 rounded-lg border border-amber-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilterActiveOnly(true)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filterActiveOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-100'
            }`}
          >
            Active Only ({activeOverstays.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterActiveOnly(false)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              !filterActiveOnly
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-amber-800 hover:bg-amber-100'
            }`}
          >
            All Flagged ({allOverstays.length})
          </button>
        </div>
      </div>

      <Card>
        <CardHeader
          title={filterActiveOnly ? 'Active Overstaying Visitors' : 'All Flagged Overstay Records'}
          subtitle="List of gate logs with overstay flag enabled"
        />
        <CardBody className="p-0">
          {displayedLogs.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={filterActiveOnly ? 'No active overstay alerts' : 'No flagged records'}
              description={
                filterActiveOnly
                  ? 'All visitors flagged for overstay have either checked out or had their flag cleared.'
                  : 'No visitors have been flagged for overstay.'
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink-700">
                <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-5 py-3">Visitor</th>
                    <th className="px-5 py-3">Phone</th>
                    <th className="px-5 py-3">Visiting Flat</th>
                    <th className="px-5 py-3">Check-In Time</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {displayedLogs.map((log) => {
                    const flat = flats.find((item) => {
                      const candidateId = item.id || item._id;
                      return String(candidateId || '') === String(log.flatId || '');
                    }) || null;
                    const isInside = !log.checkOut;
                    const duration = formatDuration(log.checkIn, log.checkOut);

                    return (
                      <tr key={log.id} className="hover:bg-ink-50/50">
                        <td className="px-5 py-3.5 font-medium text-ink-900">
                          <div>{log.name}</div>
                          <div className="text-xs text-ink-500 font-normal">{log.type}</div>
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">
                          {log.phone || '—'}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-ink-900">
                          {flat ? flat.number : log.flatId || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">
                          {formatDateTime(log.checkIn)}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-red-600">
                          <div className="flex items-center gap-1">
                            <Clock size={14} className="text-red-500" />
                            {duration}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          {isInside ? (
                            <Badge tone="danger">Still Inside</Badge>
                          ) : (
                            <Badge tone="neutral">Checked Out</Badge>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isInside ? (
                            <div className="flex justify-end items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => flagOverstay(log.id, false)}
                                className="text-ink-600 hover:text-ink-900"
                              >
                                <XCircle size={14} />
                                Clear Flag
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => checkOutVisitor(log.id)}
                              >
                                <LogOut size={14} />
                                Check Out
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-ink-400 italic">No action required</span>
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
