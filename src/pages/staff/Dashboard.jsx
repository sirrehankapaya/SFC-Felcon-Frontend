import { Link } from 'react-router-dom';
import { Wrench, AlertCircle, ClipboardCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatCard from '../../components/ui/StatCard';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import EmptyState from '../../components/ui/EmptyState';
import { useCollection } from '../../hooks/useCollection';
import CommunityEvents from '../../components/CommunityEvents';

export default function StaffDashboard() {
  const complaints = useCollection('complaints') || [];
  const activeComplaints = complaints.filter((item) => {
    const status = String(item.status || '').toLowerCase();
    return status !== 'resolved' && status !== 'closed';
  });
  const urgentComplaints = complaints.filter((item) => String(item.priority || '').toLowerCase() === 'high');

  const recentTasks = [...complaints]
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff Dashboard"
        description="Track maintenance work orders, task priority, and service readiness."
        action={
          <Link to="/admin/helpdesk">
            <Button variant="primary" size="md">
              Open Helpdesk
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open Tasks" value={activeComplaints.length} icon={ClipboardCheck} tone="brand" hint="Active service tickets" />
        <StatCard label="Urgent Jobs" value={urgentComplaints.length} icon={AlertCircle} tone="danger" hint="High-priority issues" />
        <StatCard label="Resolved" value={complaints.filter((item) => ['resolved', 'closed'].includes(String(item.status || '').toLowerCase())).length} icon={Wrench} tone="success" hint="Completed work" />
        <StatCard label="Safety" value="On duty" icon={ShieldAlert} tone="neutral" hint="Shift status" />
      </div>

      <Card>
        <CardHeader
          title="Recent Service Queue"
          subtitle="Latest complaint requests assigned to staff"
          action={
            <Link to="/admin/helpdesk" className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800">
              View all <ArrowRight size={14} />
            </Link>
          }
        />
        <CardBody className="p-0">
          {recentTasks.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="No task updates yet"
              description="New complaints will appear here once they are assigned."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Ticket</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentTasks.map((task) => (
                    <tr key={task.id || task._id || task.ticketId || `${task.category}-${task.flatId}`} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3.5 font-medium text-slate-900">
                        {task.title || task.subject || task.category || 'Service Task'}
                      </td>
                      <td className="px-5 py-3.5">{task.category || 'General'}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={String(task.status || '').toLowerCase() === 'resolved' ? 'success' : 'neutral'}>
                          {task.status || 'Open'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={String(task.priority || '').toLowerCase() === 'high' ? 'danger' : 'warning'}>
                          {task.priority || 'Normal'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
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
