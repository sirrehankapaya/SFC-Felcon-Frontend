import { Link } from 'react-router-dom';
import { Users, UserCheck, AlertTriangle, QrCode, ArrowRight, Clock, ShieldAlert } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useCollection } from '../../hooks/useCollection';
import { getFlat } from '../../services/residentService';
import { formatDateTime } from '../../utils/format';
import CommunityEvents from '../../components/CommunityEvents';

function isToday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function Dashboard() {
  const gateLogs = useCollection('gateLogs') || [];

  const visitorsToday = gateLogs.filter((log) => isToday(log.checkIn)).length;
  const currentlyInside = gateLogs.filter((log) => log.checkIn && !log.checkOut);
  const activeOverstays = gateLogs.filter((log) => log.overstay && !log.checkOut);
  const totalPassesScanned = gateLogs.filter((log) => Boolean(log.visitorId)).length;

  const recentLogs = [...gateLogs]
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gate Control Dashboard"
        description="Monitor society entry points, current visitors, and active security alerts."
        action={
          <div className="flex gap-2">
            <Link to="/guard/verify">
              <Button className="text-cyan-700 hover:text-cyan-800 hover:bg-slate-50" variant="secondary" size="md">
                <QrCode size={16} />
                Verify Pass
              </Button>
            </Link>
            <Link to="/guard/verify">
              <Button className="bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg px-4 py-2 shadow-xs transition-all border-none" size="md">
                <QrCode size={16} />
                Scan QR
              </Button>
            </Link>
            <Link to="/guard/visitor-log">
              <Button className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg px-4 py-2 shadow-xs transition-all border-none" size="md">
                Log Walk-In
              </Button>
            </Link>
          </div>
        }
      />

      {activeOverstays.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-red-100 p-1.5 text-red-600">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="font-semibold text-red-900">
                {activeOverstays.length} Active Overstay Alert{activeOverstays.length > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-red-700">
                Visitors exceeding duration: {activeOverstays.map((v) => v.name).join(', ')}
              </p>
            </div>
          </div>
          <Link to="/guard/overstay" className="shrink-0">
            <Button variant="danger" size="sm">
              Manage Overstays
            </Button>
          </Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Visitors Today"
          value={visitorsToday}
          icon={Users}
          tone="brand"
          hint="Checked in since midnight"
        />
        <StatCard
          label="Currently Inside"
          value={currentlyInside.length}
          icon={UserCheck}
          tone="brand"
          hint="Active inside premises"
        />
        <StatCard
          label="Overstay Alerts"
          value={activeOverstays.length}
          icon={AlertTriangle}
          tone={activeOverstays.length > 0 ? 'danger' : 'neutral'}
          hint="Flagged for long stays"
        />
        <StatCard
          label="Passes Scanned"
          value={totalPassesScanned}
          icon={QrCode}
          tone="brand"
          hint="Scanned via visitor pass"
        />
      </div>

      <Card>
        <CardHeader
          title="Recent Gate Activity"
          subtitle="Latest entries and departures recorded at the main gate"
          action={
            <Link to="/guard/visitor-log" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:text-brand-700">
              View All Logs <ArrowRight size={14} />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recentLogs.length === 0 ? (
            <EmptyState
              icon={Clock}
              title="No gate logs found"
              description="New visitor entries and pass scans will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink-700">
                <thead className="border-b border-ink-100 bg-ink-50 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-5 py-3">Visitor</th>
                    <th className="px-5 py-3">Flat</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Check-In</th>
                    <th className="px-5 py-3">Check-Out</th>
                    <th className="px-5 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {recentLogs.map((log) => {
                    const flat = getFlat(log.flatId);
                    return (
                      <tr key={log.id} className="hover:bg-ink-50/50">
                        <td className="px-5 py-3.5 font-medium text-ink-900">
                          <div>{log.name}</div>
                          {log.phone && <div className="text-xs text-ink-500 font-normal">{log.phone}</div>}
                        </td>
                        <td className="px-5 py-3.5">
                          {flat ? flat.number : log.flatId || '—'}
                        </td>
                        <td className="px-5 py-3.5">
                          <Badge>{log.type}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">
                          {formatDateTime(log.checkIn)}
                        </td>
                        <td className="px-5 py-3.5 text-ink-600">
                          {log.checkOut ? (
                            formatDateTime(log.checkOut)
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                              Inside
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {log.overstay && !log.checkOut ? (
                            <Badge tone="danger">Overstay</Badge>
                          ) : log.checkOut ? (
                            <Badge tone="neutral">Completed</Badge>
                          ) : (
                            <Badge tone="success">Active</Badge>
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
      <CommunityEvents />
    </div>
  );
}
