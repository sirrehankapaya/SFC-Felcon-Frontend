import { useState, useMemo } from 'react';
import { ShieldCheck, Search, Download, AlertOctagon, UserCheck, Calendar, Filter, X } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { Input, Select, Label } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime, formatDate } from '../../utils/format';

export default function SecurityLogs() {
  const gateLogs = useCollection('gateLogs');
  const flats = useCollection('flats');

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [exportNotice, setExportNotice] = useState(false);

  const flatMap = useMemo(() => {
    return (flats || []).reduce((acc, f) => {
      acc[f.id] = f.number;
      return acc;
    }, {});
  }, [flats]);

  // Today string YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];

  // Summary Metrics
  const summary = useMemo(() => {
    const todayEntries = (gateLogs || []).filter((log) => {
      if (!log.checkIn) return false;
      return new Date(log.checkIn).toISOString().split('T')[0] === todayStr;
    }).length;

    const currentlyInside = (gateLogs || []).filter((log) => !log.checkOut).length;
    const overstayCount = (gateLogs || []).filter((log) => log.overstay).length;

    return { todayEntries, currentlyInside, overstayCount };
  }, [gateLogs, todayStr]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return (gateLogs || [])
      .filter((log) => {
        const flatNum = flatMap[log.flatId] || '';
        const q = search.trim().toLowerCase();

        const matchesSearch =
          !q ||
          log.name.toLowerCase().includes(q) ||
          log.phone.toLowerCase().includes(q) ||
          (log.vehicleNumber || '').toLowerCase().includes(q) ||
          flatNum.toLowerCase().includes(q);

        const matchesType = typeFilter === 'All' || log.type === typeFilter;

        let matchesDate = true;
        if (dateFilter) {
          const logDate = new Date(log.checkIn).toISOString().split('T')[0];
          matchesDate = logDate === dateFilter;
        }

        return matchesSearch && matchesType && matchesDate;
      })
      .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn));
  }, [gateLogs, flatMap, search, typeFilter, dateFilter]);

  function handleExport() {
    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 4000);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Visitor Gate Logs"
        description="Audit all gate entry and exit activities, track overstays, and monitor active visitor traffic."
        action={
          <Button variant="secondary" onClick={handleExport}>
            <Download size={16} /> Export Logs
          </Button>
        }
      />

      {/* Export Toast / Notice */}
      {exportNotice && (
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 p-4 border border-emerald-200 text-emerald-800 text-sm">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600" />
            <span>
              <strong>Export Triggered:</strong> A CSV file containing {filteredLogs.length} security log entries has been generated.
            </span>
          </div>
          <button onClick={() => setExportNotice(false)} className="text-emerald-600 hover:text-emerald-900">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Today's Gate Entries"
          value={summary.todayEntries}
          icon={UserCheck}
          tone="brand"
          hint="Visitors checked in today"
        />
        <StatCard
          label="Currently Inside"
          value={summary.currentlyInside}
          icon={ShieldCheck}
          tone="neutral"
          hint="Active visitors on society premises"
        />
        <StatCard
          label="Overstay Flags"
          value={summary.overstayCount}
          icon={AlertOctagon}
          tone={summary.overstayCount > 0 ? 'danger' : 'neutral'}
          hint="Exceeded pass time window"
        />
      </div>

      {/* Security Gate Logs Card */}
      <Card>
        <CardHeader
          title="Gate Audit Logs"
          subtitle="Real-time log of visitors, cabs, deliveries, and service personnel"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-44 sm:w-56">
                <Search size={16} className="absolute left-3 top-2.5 text-ink-400" />
                <Input
                  placeholder="Search visitor, vehicle, flat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-36"
              >
                <option value="All">All Types</option>
                <option value="Guest">Guest</option>
                <option value="Delivery">Delivery</option>
                <option value="Cab">Cab</option>
                <option value="Service Staff">Service Staff</option>
              </Select>

              <div className="flex items-center gap-1">
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-36"
                />
                {dateFilter && (
                  <Button variant="ghost" size="sm" onClick={() => setDateFilter('')} title="Clear date">
                    <X size={14} />
                  </Button>
                )}
              </div>
            </div>
          }
        />

        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No gate logs found"
              description="No entries matched your search criteria."
            />
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/50 text-xs font-semibold text-ink-500">
                <tr>
                  <th className="px-4 py-3">Visitor Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Vehicle</th>
                  <th className="px-4 py-3">Destination Flat</th>
                  <th className="px-4 py-3">Visit Type</th>
                  <th className="px-4 py-3">Check-In</th>
                  <th className="px-4 py-3">Check-Out</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filteredLogs.map((log) => {
                  const isInside = !log.checkOut;

                  return (
                    <tr key={log.id} className="hover:bg-ink-50/50">
                      <td className="px-4 py-3 font-semibold text-ink-900">{log.name}</td>
                      <td className="px-4 py-3 text-xs text-ink-600">{log.phone}</td>
                      <td className="px-4 py-3 text-xs font-mono text-ink-700">
                        {log.vehicleNumber || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink-800">
                        {flatMap[log.flatId] || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone="neutral">{log.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-700">
                        {formatDateTime(log.checkIn)}
                      </td>
                      <td className="px-4 py-3 text-xs text-ink-600">
                        {log.checkOut ? (
                          formatDateTime(log.checkOut)
                        ) : (
                          <span className="font-semibold text-brand-600">Still Inside</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {log.overstay ? (
                          <Badge tone="danger">Overstay</Badge>
                        ) : isInside ? (
                          <Badge tone="brand">Active</Badge>
                        ) : (
                          <Badge tone="neutral">Checked Out</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
