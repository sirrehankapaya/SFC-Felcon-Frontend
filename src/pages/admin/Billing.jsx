import { useState, useEffect, useMemo } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Clock, Search, Eye, CreditCard, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import StatCard from '../../components/ui/StatCard';
import { Input, Select, FormRow } from '../../components/ui/Field';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { useCollection } from '../../hooks/useCollection';
import { formatPKR, formatDate } from '../../utils/format';
import { markOverdueBills, generateMonthlyBill, payBill } from '../../services/billingService';

export default function Billing() {
  const bills = useCollection('bills');
  const flats = useCollection('flats');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBill, setSelectedBill] = useState(null);
  const [payingBillId, setPayingBillId] = useState(null);
  
  // Show/Hide state for Bill Generation Form
  const [showGenerator, setShowGenerator] = useState(false);

  function formatPeriod(monthStr) {
    if (!monthStr) return '—';
    const [year, month] = monthStr.split('-');
    if (!year || !month) return monthStr;
    const d = new Date(Number(year), Number(month) - 1);
    if (Number.isNaN(d.getTime())) return monthStr;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Bill Generation Form State
  const [selectedFlatId, setSelectedFlatId] = useState('');
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // "YYYY-MM"
  const [dueDate, setDueDate] = useState('');
  const [breakdown, setBreakdown] = useState({
    water: 1200,
    security: 3000,
    repairs: 1500,
    other: 2500,
  });
  const [penalty, setPenalty] = useState(0);
  const [formError, setFormError] = useState('');

  // Auto-mark overdue bills on page load
  useEffect(() => {
    markOverdueBills();
  }, []);

  const flatMap = useMemo(() => {
    return (flats || []).reduce((acc, f) => {
      const id = f.id || f._id;
      if (id) acc[id] = f;
      return acc;
    }, {});
  }, [flats]);

  const getFlatNumber = (flatIdOrObj) => {
    if (!flatIdOrObj) return '—';
    if (typeof flatIdOrObj === 'object') {
      return flatIdOrObj.flatNumber || flatIdOrObj.number || '—';
    }
    const flat = flatMap[flatIdOrObj];
    return flat ? (flat.flatNumber || flat.number) : '—';
  };

  // Compute reactive summary
  const summary = useMemo(() => {
    const totalDue = (bills || []).reduce((sum, b) => sum + (b.amount || 0) + (b.penalty || 0), 0);
    const collected = (bills || [])
      .filter((b) => b.status === 'paid')
      .reduce((sum, b) => sum + (b.amount || 0) + (b.penalty || 0), 0);
    const overdue = (bills || [])
      .filter((b) => b.status === 'overdue')
      .reduce((sum, b) => sum + (b.amount || 0) + (b.penalty || 0), 0);
    const pending = totalDue - collected - overdue;
    return { totalDue, collected, overdue, pending };
  }, [bills]);

  // Filter bills
  const filteredBills = useMemo(() => {
    return (bills || [])
      .filter((b) => {
        const flatNum = getFlatNumber(b.flatId);
        const matchesSearch = flatNum.toLowerCase().includes(search.trim().toLowerCase());
        
        let matchesStatus = statusFilter === 'All';
        if (statusFilter === 'Paid') matchesStatus = b.status === 'paid';
        if (statusFilter === 'Pending') matchesStatus = b.status === 'pending';
        if (statusFilter === 'Overdue') matchesStatus = b.status === 'overdue';

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => new Date(b.month) - new Date(a.month));
  }, [bills, flatMap, search, statusFilter]);

  function resetBillForm() {
    const firstFlat = (flats || [])[0];
    const today = new Date();
    const currentMonth = today.toISOString().slice(0, 7);
    const defaultDueDate = new Date(today.getTime()).toISOString().slice(0, 10);

    setSelectedFlatId(firstFlat ? (firstFlat.id || firstFlat._id) : '');
    setMonth(currentMonth);
    setDueDate(defaultDueDate);
    setBreakdown({ water: 1200, security: 3000, repairs: 1500, other: 2500 });
    setPenalty(0);
    setFormError('');
  }

  useEffect(() => {
    if (!Array.isArray(flats) || flats.length === 0) return;
    setSelectedFlatId((prev) => prev || (flats[0]?.id || flats[0]?._id || ''));
    setMonth((prev) => prev || new Date().toISOString().slice(0, 7));
    setDueDate((prev) => prev || new Date().toISOString().slice(0, 10));
    setFormError('');
  }, [flats]);

  async function handleGenerateSubmit(e) {
    if (e) e.preventDefault();
    if (!selectedFlatId) {
      setFormError('Please select a flat');
      return;
    }
    if (!month) {
      setFormError('Please select billing month');
      return;
    }
    if (!dueDate) {
      setFormError('Please select payment due date');
      return;
    }

    const water = Number(breakdown.water) || 0;
    const security = Number(breakdown.security) || 0;
    const repairs = Number(breakdown.repairs) || 0;
    const other = Number(breakdown.other) || 0;
    const penaltyAmt = Number(penalty) || 0;

    try {
      await generateMonthlyBill(selectedFlatId, {
        month,
        dueDate,
        amount: water + security + repairs + other,
        breakdown: { water, security, repairs, other },
        penalty: penaltyAmt,
      });
      setFormError('');
      resetBillForm();
      bills.refetch && bills.refetch();
      setShowGenerator(false);
    } catch (err) {
      setFormError(err.message || 'Failed to generate bill');
    }
  }

  async function handlePayBill(billId) {
    if (!billId) return;
    setPayingBillId(billId);
    try {
      await payBill(billId);
      setPayingBillId(null);
      if (selectedBill && (selectedBill.id === billId || selectedBill._id === billId)) {
        setSelectedBill((prev) => prev ? { ...prev, status: 'paid', paidAt: new Date().toISOString() } : null);
      }
      bills.refetch && bills.refetch();
    } catch (err) {
      setPayingBillId(null);
      console.error('Payment failed:', err);
    }
  }

  const computedTotalBilled = (Number(breakdown.water) || 0) +
    (Number(breakdown.security) || 0) +
    (Number(breakdown.repairs) || 0) +
    (Number(breakdown.other) || 0) +
    (Number(penalty) || 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Maintenance Engine"
        description="Generate society maintenance bills, monitor collection summaries, and view invoice history."
        action={
          <Button 
            onClick={() => setShowGenerator(!showGenerator)}
            className="bg-brand-600 hover:bg-brand-700 text-white transition-all flex items-center gap-2 font-medium px-4 py-2 rounded-lg shadow-sm"
          >
            {showGenerator ? (
              <>
                <ChevronUp size={16} /> View Billscd  
              </>
            ) : (
              <>
                <ChevronDown size={16} /> Generate Bill
              </>
            )}
          </Button>
        }
      />

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Collected"
          value={formatPKR(summary.collected)}
          icon={CheckCircle2}
          tone="brand"
          hint="Received payments"
        />
        <StatCard
          label="Outstanding (Pending)"
          value={formatPKR(summary.pending)}
          icon={Clock}
          tone="warning"
          hint="Awaiting payment before due date"
        />
        <StatCard
          label="Overdue Amount"
          value={formatPKR(summary.overdue)}
          icon={AlertTriangle}
          tone="danger"
          hint="Past payment due date"
        />
      </div>

      {/* Collapsible Bill Generator Form */}
      {showGenerator && (
        <Card className="border border-ink-200 bg-white rounded-xl overflow-hidden shadow-xs">
          <CardHeader
            title="Generate Monthly Bill"
            subtitle="Create a fresh maintenance invoice for a resident flat with itemized charges."
            className="border-b border-ink-100 bg-ink-50/50 px-6 py-4"
          />
          <div className="p-6">
            <form onSubmit={handleGenerateSubmit} className="space-y-6">
              {formError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="rounded-xl border border-ink-200 bg-ink-50/30 p-5">
                <div className="mb-4 flex items-center justify-between border-b border-ink-200/60 pb-3">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-600">Billing Details</h3>
                  <span className="rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-[11px] font-semibold text-brand-700">
                    Society Invoice
                  </span>
                </div>

                <div className="space-y-4">
                  <FormRow label="Select Flat" required>
                    <Select 
                      value={selectedFlatId} 
                      onChange={(e) => setSelectedFlatId(e.target.value)}
                      className="w-full bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                    >
                      <option value="" className="text-ink-400">Choose a flat</option>
                      {flats.map((f) => {
                        const fid = f.id || f._id;
                        return (
                          <option key={fid} value={fid} className="text-ink-900">
                            Flat {f.flatNumber || f.number} (Block {f.tower || f.block})
                          </option>
                        );
                      })}
                    </Select>
                  </FormRow>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormRow label="Billing Month" required>
                      <Input 
                        type="month" 
                        value={month} 
                        onChange={(e) => setMonth(e.target.value)} 
                        required 
                        className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                      />
                    </FormRow>

                    <FormRow label="Due Date" required>
                      <Input 
                        type="date" 
                        value={dueDate} 
                        onChange={(e) => setDueDate(e.target.value)} 
                        required 
                        className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                      />
                    </FormRow>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-ink-200 bg-ink-50/20 p-5">
                <div className="mb-4 border-b border-ink-200/60 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-600">Breakdown Amounts (PKR)</p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormRow label="Water Supply">
                    <Input 
                      type="number" 
                      value={breakdown.water} 
                      onChange={(e) => setBreakdown({ ...breakdown, water: e.target.value })} 
                      className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                    />
                  </FormRow>

                  <FormRow label="Security Guard">
                    <Input 
                      type="number" 
                      value={breakdown.security} 
                      onChange={(e) => setBreakdown({ ...breakdown, security: e.target.value })} 
                      className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                    />
                  </FormRow>

                  <FormRow label="Repairs & Maintenance">
                    <Input 
                      type="number" 
                      value={breakdown.repairs} 
                      onChange={(e) => setBreakdown({ ...breakdown, repairs: e.target.value })} 
                      className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                    />
                  </FormRow>

                  <FormRow label="Other / Misc Charges">
                    <Input 
                      type="number" 
                      value={breakdown.other} 
                      onChange={(e) => setBreakdown({ ...breakdown, other: e.target.value })} 
                      className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                    />
                  </FormRow>
                </div>

                <div className="mt-4 border-t border-ink-200/60 pt-4">
                  <FormRow label="Initial Penalty (if applicable)">
                    <Input 
                      type="number" 
                      value={penalty} 
                      onChange={(e) => setPenalty(e.target.value)} 
                      className="bg-white border-ink-300 text-ink-900 focus:border-brand-500 focus:ring-brand-500/20 rounded-lg text-sm"
                    />
                  </FormRow>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50/50 px-4 py-3">
                  <span className="text-sm font-semibold text-ink-800">Total Invoice Amount</span>
                  <span className="text-lg font-bold text-brand-700">{formatPKR(computedTotalBilled)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={resetBillForm}
                >
                  Reset
                </Button>
                <Button 
                  type="submit"
                  className="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-xs"
                >
                  Issue Bill
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Main Bills Table Card */}
      <Card className="border border-ink-200 bg-white rounded-xl overflow-hidden shadow-xs">
        <CardHeader
          title="All Flat Bills"
          subtitle="Showing all historical and current maintenance charges across blocks"
          className="border-b border-ink-100 bg-ink-50/50 px-6 py-4"
          action={
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-48 sm:w-56">
                <Search size={16} className="absolute left-3 top-2.5 text-ink-400" />
                <Input
                  placeholder="Filter by flat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-white border-ink-300 text-ink-900 placeholder-ink-400 text-sm focus:border-brand-500 focus:ring-brand-500/20 rounded-lg"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-32 bg-white border-ink-300 text-ink-900 text-sm focus:border-brand-500 focus:ring-brand-500/20 rounded-lg"
              >
                <option value="All">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Overdue">Overdue</option>
              </Select>
            </div>
          }
        />
        <div className="overflow-x-auto">
          {filteredBills.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No bills found"
              description="No bills match your criteria or no bills generated yet."
            />
          ) : (
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-ink-50/80 text-ink-600 border-b border-ink-200 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-5 py-3.5">Flat No</th>
                  <th className="px-5 py-3.5">Billing Period</th>
                  <th className="px-5 py-3.5">Amount Due</th>
                  <th className="px-5 py-3.5">Penalty</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Paid Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 bg-white text-ink-700">
                {filteredBills.map((bill) => {
                  const isPaid = bill.status === 'paid';
                  const billId = bill.id || bill._id;
                  const isPaying = payingBillId === billId;
                  const totalPayable = (bill.amount || 0) + (bill.penalty || 0);

                  return (
                    <tr
                      key={billId}
                      className="cursor-pointer hover:bg-ink-50/60 transition-colors"
                      onClick={() => setSelectedBill(bill)}
                    >
                      <td className="px-5 py-4 font-semibold text-ink-900">
                        {getFlatNumber(bill.flatId)}
                      </td>
                      <td className="px-5 py-4 text-ink-700 font-medium">
                        {formatPeriod(bill.month)}
                      </td>
                      <td className="px-5 py-4 font-semibold text-ink-900">
                        {formatPKR(totalPayable)}
                      </td>
                      <td className="px-5 py-4 text-xs font-semibold text-red-600">
                        {bill.penalty > 0 ? formatPKR(bill.penalty) : '—'}
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-500">
                        {formatDate(bill.dueDate)}
                      </td>
                      <td className="px-5 py-4">
                        <Badge tone={isPaid ? 'success' : bill.status === 'overdue' ? 'danger' : 'warning'}>
                          {isPaid ? 'Paid' : bill.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-ink-500">
                        {bill.paidAt ? formatDate(bill.paidAt) : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBill(bill)}
                            className="text-ink-600 hover:text-ink-900 hover:bg-ink-100 font-medium rounded-md"
                          >
                            <Eye size={14} className="mr-1.5" /> View
                          </Button>
                          {!isPaid && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={isPaying}
                              onClick={() => handlePayBill(billId)}
                              className="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-md shadow-xs"
                            >
                              {isPaying ? 'Processing…' : (
                                <>
                                  <CreditCard size={14} className="mr-1.5" /> Pay
                                </>
                              )}
                            </Button>
                          )}
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

      {/* Bill Item Details Breakdown Modal */}
      <Modal
        open={!!selectedBill}
        onClose={() => setSelectedBill(null)}
        title={`Bill Details — ${selectedBill ? getFlatNumber(selectedBill.flatId) : ''}`}
        footer={
          <div className="flex items-center justify-between w-full border-t border-ink-100 pt-3">
            <div>
              {selectedBill?.status === 'paid' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <CheckCircle2 size={14} /> Paid on {formatDate(selectedBill.paidAt)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedBill && selectedBill.status !== 'paid' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={payingBillId === (selectedBill.id || selectedBill._id)}
                  onClick={() => handlePayBill(selectedBill.id || selectedBill._id)}
                  className="bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg"
                >
                  {payingBillId === (selectedBill.id || selectedBill._id) ? 'Processing…' : (
                    <>
                      <CreditCard size={14} className="mr-1.5" /> Pay {formatPKR((selectedBill.amount || 0) + (selectedBill.penalty || 0))}
                    </>
                  )}
                </Button>
              )}
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setSelectedBill(null)}
              >
                Close
              </Button>
            </div>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-4 text-sm text-ink-700">
            <div className="flex items-center justify-between rounded-xl bg-ink-50/60 p-4 border border-ink-200">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Invoice Status</span>
                <div className="mt-1">
                  <Badge tone={selectedBill.status === 'paid' ? 'success' : selectedBill.status === 'overdue' ? 'danger' : 'warning'}>
                    {selectedBill.status === 'paid' ? 'Paid' : selectedBill.status === 'overdue' ? 'Overdue' : 'Pending'}
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">Total Billed</span>
                <p className="font-bold text-ink-900 text-lg">
                  {formatPKR((selectedBill.amount || 0) + (selectedBill.penalty || 0))}
                </p>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-ink-600">
              <p>Billing Period: <strong className="font-semibold text-ink-900">{formatPeriod(selectedBill.month)}</strong></p>
              <p>Payment Due Date: <strong className="font-semibold text-ink-900">{formatDate(selectedBill.dueDate)}</strong></p>
              {selectedBill.paidAt && (
                <p>Payment Received On: <strong className="font-semibold text-emerald-600">{formatDate(selectedBill.paidAt)}</strong></p>
              )}
              {selectedBill.receiptUrl && (
                <p className="pt-1">
                  <a 
                    href={selectedBill.receiptUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                  >
                    View Receipt Attachment <ExternalLink size={12} />
                  </a>
                </p>
              )}
            </div>

            <div className="rounded-xl border border-ink-200 overflow-hidden bg-white">
              <div className="bg-ink-50/80 px-4 py-2.5 font-semibold text-xs text-ink-600 uppercase tracking-wider border-b border-ink-200">
                Itemized Breakdown
              </div>
              <div className="divide-y divide-ink-100 text-ink-800">
                <div className="flex justify-between px-4 py-2.5">
                  <span>Water Supply</span>
                  <span className="font-medium text-ink-900">{formatPKR(selectedBill.breakdown?.water || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span>Security Maintenance</span>
                  <span className="font-medium text-ink-900">{formatPKR(selectedBill.breakdown?.security || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span>Repairs & Elevator</span>
                  <span className="font-medium text-ink-900">{formatPKR(selectedBill.breakdown?.repairs || 0)}</span>
                </div>
                <div className="flex justify-between px-4 py-2.5">
                  <span>Other / Misc Charges</span>
                  <span className="font-medium text-ink-900">{formatPKR(selectedBill.breakdown?.other || 0)}</span>
                </div>
                {selectedBill.penalty > 0 && (
                  <div className="flex justify-between px-4 py-2.5 bg-red-50 text-red-700 font-medium">
                    <span>Late Penalty Fee</span>
                    <span className="font-semibold">{formatPKR(selectedBill.penalty)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}