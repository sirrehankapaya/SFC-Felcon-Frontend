import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Users, DollarSign, AlertCircle, Ticket, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';
import { formatPKR, formatDate, formatDateTime } from '../../utils/format';
import CommunityEvents from '../../components/CommunityEvents';

function normalizeComplaintCategory(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (!raw) return 'Other';

  const map = {
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    elevator: 'Elevator',
    cleaning: 'Cleaning',
    security: 'Security',
    pest_control: 'Other',
    pestcontrol: 'Other',
    other: 'Other',
  };

  const key = raw.replace(/[_\s-]+/g, '');
  return map[key] || 'Other';
}

function isComplaintOpen(value) {
  const status = String(value ?? '').trim().toLowerCase();
  return !['resolved', 'closed'].includes(status) && status !== 'completed';
}

export default function Dashboard() {
  const residents = useCollection('residents') || [];
  const bills = useCollection('bills') || [];
  const complaints = useCollection('complaints') || [];
  const visitors = useCollection('visitors') || [];
  const gateLogs = useCollection('gateLogs') || [];
  const flats = useCollection('flats') || [];

  const flatMap = useMemo(() => {
    return (flats || []).reduce((acc, f) => {
      acc[f.id] = f.number;
      return acc;
    }, {});
  }, [flats]);

  const summary = useMemo(() => {
    const totalDue = (bills || []).reduce((sum, b) => sum + (b.amountDue || 0), 0);
    const collected = (bills || [])
      .filter((b) => b.paymentStatus === 'Paid')
      .reduce((sum, b) => sum + (b.amountDue || 0), 0);
    const overdue = (bills || [])
      .filter((b) => b.paymentStatus === 'Overdue')
      .reduce((sum, b) => sum + (b.amountDue || 0), 0);
    const pending = totalDue - collected - overdue;
    return { totalDue, collected, overdue, pending };
  }, [bills]);

  const openComplaintsCount = useMemo(() => {
    return (complaints || []).filter((c) => isComplaintOpen(c.status)).length;
  }, [complaints]);

  const activeVisitorsCount = useMemo(() => {
    return (visitors || []).filter((v) => v.status === 'Active').length;
  }, [visitors]);

  const collectionPieData = useMemo(() => {
    return [
      { name: 'Collected', value: summary.collected, color: '#0891b2' }, // Cyan 600
      { name: 'Pending', value: summary.pending, color: '#d97706' },   // Amber 600
      { name: 'Overdue', value: summary.overdue, color: '#e11d48' },   // Rose 600
    ];
  }, [summary]);

  const complaintCategoryData = useMemo(() => {
    const categories = ['Plumbing', 'Electrical', 'Elevator', 'Cleaning', 'Security', 'Other'];
    return categories.map((cat) => {
      const count = (complaints || []).filter((c) => normalizeComplaintCategory(c.category) === cat).length;
      return { category: cat, count };
    });
  }, [complaints]);

  const recentComplaints = useMemo(() => {
    return [...(complaints || [])]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
  }, [complaints]);

  const recentGateLogs = useMemo(() => {
    return [...(gateLogs || [])]
      .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
      .slice(0, 5);
  }, [gateLogs]);

  return (
    <div className="space-y-6 min-h-screen bg-slate-100 p-4 sm:p-6 text-slate-800">
      <PageHeader
        title={<span className="text-slate-900 font-bold">Admin Overview</span>}
        description={<span className="text-slate-500 text-sm">Real-time society management metrics, collections, complaints, and security activity.</span>}
      />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Residents"
          value={residents.length}
          icon={Users}
          tone="brand"
          hint={`${flats.length} total flats`}
          className="bg-white border-slate-200 text-slate-800"
        />
        <StatCard
          label="Monthly Collection"
          value={formatPKR(summary.collected)}
          icon={DollarSign}
          tone="brand"
          hint={`Of ${formatPKR(summary.totalDue)} billed`}
          className="bg-white border-slate-200 text-slate-800"
        />
        <StatCard
          label="Open Complaints"
          value={openComplaintsCount}
          icon={AlertCircle}
          tone={openComplaintsCount > 0 ? 'warning' : 'neutral'}
          hint="Requires technician action"
          className="bg-white border-slate-200 text-slate-800"
        />
        <StatCard
          label="Active Visitor Passes"
          value={activeVisitorsCount}
          icon={Ticket}
          tone="neutral"
          hint="Currently valid visitor passes"
          className="bg-white border-slate-200 text-slate-800"
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Collection Overview Chart */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader
            title={<span className="text-slate-900 font-bold">Collection Overview</span>}
            subtitle={<span className="text-slate-500 text-xs">Breakdown of paid, pending, and overdue amounts</span>}
            action={
              <Button as={Link} to="/admin/billing" variant="ghost" size="sm" className="text-cyan-700 hover:text-cyan-800 hover:bg-slate-50">
                Billing <ArrowRight size={14} className="ml-1" />
              </Button>
            }
            className="border-b border-slate-100 pb-3"
          />
          <CardBody className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={collectionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {collectionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [formatPKR(val), 'Amount']}
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                    }}
                    itemStyle={{ color: '#0891b2' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-6 text-xs font-medium">
              {collectionPieData.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-500">{item.name}:</span>
                  <span className="font-bold text-slate-900">{formatPKR(item.value)}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Complaints Breakdown Chart */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader
            title={<span className="text-slate-900 font-bold">Complaints by Category</span>}
            subtitle={<span className="text-slate-500 text-xs">Distribution of reported maintenance & service issues</span>}
            action={
              <Button as={Link} to="/admin/helpdesk" variant="ghost" size="sm" className="text-cyan-700 hover:text-cyan-800 hover:bg-slate-50">
                Helpdesk <ArrowRight size={14} className="ml-1" />
              </Button>
            }
            className="border-b border-slate-100 pb-3"
          />
          <CardBody className="p-5">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintCategoryData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      borderColor: '#e2e8f0',
                      borderRadius: '12px',
                      color: '#0f172a',
                    }}
                  />
                  <Bar dataKey="count" name="Complaints" fill="#0891b2" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Latest Complaints */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader
            title={<span className="text-slate-900 font-bold">Recent Complaints</span>}
            subtitle={<span className="text-slate-500 text-xs">Latest helpdesk tickets submitted by residents</span>}
            action={
              <Button as={Link} to="/admin/helpdesk" variant="ghost" size="sm" className="text-cyan-700 hover:text-cyan-800 hover:bg-slate-50">
                View All
              </Button>
            }
            className="border-b border-slate-100 pb-3"
          />
          <CardBody className="divide-y divide-slate-100 p-0">
            {recentComplaints.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No complaints reported yet.</div>
            ) : (
              recentComplaints.map((item) => (
                <div key={item.id} className="flex items-start justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-xs">
                        {flatMap[item.flatId] || 'Flat'}
                      </span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-medium text-cyan-700">{item.category}</span>
                    </div>
                    <p className="line-clamp-1 text-xs text-slate-600">{item.description}</p>
                    <p className="text-[10px] text-slate-400">{formatDate(item.createdAt)}</p>
                  </div>
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px] font-bold">
                    {item.status}
                  </Badge>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        {/* Latest Gate Logs */}
        <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader
            title={<span className="text-slate-900 font-bold">Recent Gate Logs</span>}
            subtitle={<span className="text-slate-500 text-xs">Latest visitor & staff check-ins at main gate</span>}
            action={
              <Button as={Link} to="/admin/security-logs" variant="ghost" size="sm" className="text-cyan-700 hover:text-cyan-800 hover:bg-slate-50">
                View All
              </Button>
            }
            className="border-b border-slate-100 pb-3"
          />
          <CardBody className="divide-y divide-slate-100 p-0">
            {recentGateLogs.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">No gate logs recorded today.</div>
            ) : (
              recentGateLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between p-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-800 text-xs">{log.name}</span>
                      <Badge className="bg-slate-100 text-slate-600 border-slate-200 text-[9px] uppercase font-bold">
                        {log.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Visiting Flat: <span className="font-medium text-slate-800">{flatMap[log.flatId] || '—'}</span>
                      {log.vehicleNumber !== '—' && ` • Vehicle: ${log.vehicleNumber}`}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatDateTime(log.checkIn)}</p>
                  </div>
                  <div className="text-right space-y-1">
                    {log.overstay && (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                        Overstay
                      </Badge>
                    )}
                    <div>
                      <span className="text-xs font-semibold text-slate-500">
                        {log.checkOut ? `Out: ${formatDateTime(log.checkOut).split(', ')[1] || formatDateTime(log.checkOut)}` : <span className="text-emerald-600 font-bold">Inside</span>}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
      <CommunityEvents />
    </div>
  );
}
