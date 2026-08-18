import { useEffect, useState } from 'react';
import {
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Eye,
  Clock,
  Check,
  Building,
  Download,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getResidentByUserId,
  findFlatById,
} from '../../services/residentService';
import {
  payBill,
  markOverdueBills,
} from '../../services/billingService';
import { useCollection } from '../../hooks/useCollection';
import StatCard from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';
import { formatPKR, formatDate } from '../../utils/format';

export default function Bills() {
  const { user } = useAuth();

  const residents = useCollection('residents');
  const flats = useCollection('flats');
  const allBills = useCollection('bills');

  const resident =
    residents.find((r) => r.userId === user?.id) || null;
  const flat =
    flats.find((f) => f.id === resident?.flatId || f._id === resident?.flatId) ||
    (resident?.flatId ? findFlatById(resident.flatId) : null);

  const [selectedBill, setSelectedBill] = useState(null);
  const [payingBillId, setPayingBillId] = useState(null);
  const [successToast, setSuccessToast] = useState('');
  const [paymentBill, setPaymentBill] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [paymentErrors, setPaymentErrors] = useState({});

  const residentFlatLabel = flat ? (flat.flatNumber || flat.number || flat.name || '—') : '—';

  function handleDownloadBillPdf(bill) {
    if (!bill || typeof window === 'undefined') return;

    const billNumber = bill.id || bill._id || 'bill';
    const periodLabel = formatPeriodMonth(bill.period || bill.month);
    const total = Number(bill.amountDue ?? ((bill.amount || 0) + (bill.penalty || 0)) ?? 0);
    const breakdown = bill.breakdown || {};

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Maintenance Bill - ${residentFlatLabel}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111827; margin: 28px; }
            .wrap { max-width: 720px; margin: 0 auto; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { margin: 0; font-size: 28px; }
            .meta { text-align: right; font-size: 12px; color: #4b5563; }
            .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 18px; margin-bottom: 18px; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
            .row:last-child { border-bottom: none; }
            .total { font-size: 22px; font-weight: 700; color: #0f172a; }
            .badge { display: inline-block; background: #e0f2fe; color: #075985; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; }
          </style>
        </head>
        <body>
          <div class="wrap">
            <div class="header">
              <div>
                <h1>Maintenance Bill</h1>
                <p>Flat ${residentFlatLabel}</p>
              </div>
              <div class="meta">
                <div>Bill # ${billNumber}</div>
                <div>${periodLabel}</div>
                <div>Due: ${formatDate(bill.dueDate)}</div>
              </div>
            </div>

            <div class="card">
              <div class="row">
                <span>Status</span>
                <span><span class="badge">${bill.paymentStatus || 'Pending'}</span></span>
              </div>
              <div class="row">
                <span>Billing Period</span>
                <span>${periodLabel}</span>
              </div>
              <div class="row">
                <span>Due Date</span>
                <span>${formatDate(bill.dueDate)}</span>
              </div>
              <div class="row">
                <span>Paid Date</span>
                <span>${bill.paidOn ? formatDate(bill.paidOn) : '—'}</span>
              </div>
            </div>

            <div class="card">
              <div class="row"><span>Water Supply & Tank Charges</span><span>${formatPKR(breakdown.water || 0)}</span></div>
              <div class="row"><span>Security & Gate Staff</span><span>${formatPKR(breakdown.security || 0)}</span></div>
              <div class="row"><span>Repairs & Common Area Maintenance</span><span>${formatPKR(breakdown.repairs || 0)}</span></div>
              <div class="row"><span>Other Utilities & Admin Fee</span><span>${formatPKR(breakdown.other || 0)}</span></div>
              <div class="row"><span><strong>Total Amount Due</strong></span><span class="total">${formatPKR(total)}</span></div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  }

  // Call markOverdueBills on mount to ensure statuses are updated
  useEffect(() => {
    markOverdueBills();
  }, []);

  // Filter bills for resident flat and sort by period descending
  const residentFlatId = String(resident?.flatId || user?.flatId || '');
  const residentBills = allBills
    .filter((b) => {
      const billFlatId = b.flatId && typeof b.flatId === 'object' ? (b.flatId._id || b.flatId.id) : b.flatId;
      return String(billFlatId || '') === residentFlatId;
    })
    .sort((a, b) => new Date(b.period || b.month || 0) - new Date(a.period || a.month || 0));

  // Summary calculations
  const totalPaid = residentBills
    .filter((b) => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + (b.amountDue || 0), 0);

  const totalOutstanding = residentBills
    .filter((b) => b.paymentStatus === 'Unpaid' || b.paymentStatus === 'Overdue')
    .reduce((sum, b) => sum + (b.amountDue || 0), 0);

  const overdueAmount = residentBills
    .filter((b) => b.paymentStatus === 'Overdue')
    .reduce((sum, b) => sum + (b.amountDue || 0), 0);

  function openPaymentModal(bill) {
    setPaymentBill(bill);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setPaymentErrors({});
  }

  function closePaymentModal() {
    setPaymentBill(null);
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setPaymentErrors({});
  }

  function validatePayment() {
    const errors = {};
    const rawCard = cardNumber.replace(/\s/g, '');
    if (!rawCard) errors.cardNumber = 'Card number is required';
    else if (!/^\d{16}$/.test(rawCard)) errors.cardNumber = 'Enter a valid 16-digit card number';

    if (!cardExpiry) errors.cardExpiry = 'Expiry date is required';
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) errors.cardExpiry = 'Use MM/YY format';

    if (!cardCvv) errors.cardCvv = 'CVV is required';
    else if (!/^\d{3,4}$/.test(cardCvv)) errors.cardCvv = 'Enter a valid CVV';

    if (!cardName.trim()) errors.cardName = 'Cardholder name is required';

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function processPayment() {
    if (!validatePayment() || !paymentBill) return;

    setPayingBillId(paymentBill.id || paymentBill._id);
    try {
      await payBill(paymentBill.id || paymentBill._id);
      setPayingBillId(null);
      closePaymentModal();
      setSuccessToast('Bill payment processed successfully!');
      setTimeout(() => setSuccessToast(''), 4000);

      if (selectedBill && (selectedBill.id === paymentBill.id || selectedBill._id === paymentBill._id)) {
        setSelectedBill((prev) =>
          prev
            ? {
                ...prev,
                paymentStatus: 'Paid',
                paidOn: new Date().toISOString(),
              }
            : null
        );
      }
      allBills.refetch && allBills.refetch();
    } catch (err) {
      setPayingBillId(null);
      console.error('Failed to pay bill:', err);
    }
  }

  function formatPeriodMonth(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance Bills"
        description={`View utility breakdown, track monthly payments, and settle dues for Flat ${residentFlatLabel}.`}
      />

      {successToast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total Paid"
          value={formatPKR(totalPaid)}
          icon={CheckCircle2}
          tone="brand"
          hint="Completed payments"
        />
        <StatCard
          label="Total Outstanding"
          value={formatPKR(totalOutstanding)}
          icon={Clock}
          tone={totalOutstanding > 0 ? 'warning' : 'neutral'}
          hint="Pending balance"
        />
        <StatCard
          label="Overdue Amount"
          value={formatPKR(overdueAmount)}
          icon={AlertCircle}
          tone={overdueAmount > 0 ? 'danger' : 'neutral'}
          hint={
            overdueAmount > 0
              ? 'Past due date - action required'
              : 'No overdue bills'
          }
        />
      </div>

      {/* Bills List / Table */}
      <Card>
        <CardHeader
          title="Billing History"
          subtitle={`Showing all issued bills for Flat ${residentFlatLabel}`}
        />
        <CardBody className="p-0">
          {residentBills.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Receipt}
                title="No bills found"
                description="There are no maintenance bills generated for your flat yet."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-ink-700">
                <thead className="border-b border-ink-100 bg-ink-50/70 text-xs font-semibold uppercase tracking-wider text-ink-500">
                  <tr>
                    <th className="px-5 py-3">Billing Period</th>
                    <th className="px-5 py-3">Amount Due</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Paid Date</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {residentBills.map((bill) => {
                    const isPaid = bill.paymentStatus === 'Paid';
                    const isPaying = payingBillId === bill.id;
                    const billKey = bill.id || bill._id || `${bill.period || bill.month}-${bill.dueDate}`;

                    return (
                      <tr
                        key={billKey}
                        className="transition hover:bg-ink-50/50"
                      >
                        <td className="px-5 py-4 font-medium text-ink-900">
                          {formatPeriodMonth(bill.period)}
                        </td>
                        <td className="px-5 py-4 font-semibold text-ink-900">
                          {formatPKR(bill.amountDue)}
                        </td>
                        <td className="px-5 py-4 text-ink-600">
                          {formatDate(bill.dueDate)}
                        </td>
                        <td className="px-5 py-4">
                          <Badge>{bill.paymentStatus}</Badge>
                        </td>
                        <td className="px-5 py-4 text-ink-500">
                          {bill.paidOn ? formatDate(bill.paidOn) : '—'}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setSelectedBill(bill)}
                            >
                              <Eye size={14} /> Breakdown
                            </Button>

                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleDownloadBillPdf(bill)}
                            >
                              <Download size={14} /> PDF
                            </Button>

                            {!isPaid && (
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={isPaying}
                                onClick={() => openPaymentModal(bill)}
                              >
                                {isPaying ? (
                                  'Processing…'
                                ) : (
                                  <>
                                    <CreditCard size={14} /> Pay Now
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
            </div>
          )}
        </CardBody>
      </Card>

      {/* Bill Breakdown Modal */}
      <Modal
        open={Boolean(selectedBill)}
        onClose={() => setSelectedBill(null)}
        title={`Bill Breakdown — ${
          selectedBill ? formatPeriodMonth(selectedBill.period) : ''
        }`}
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {selectedBill?.paymentStatus === 'Paid' && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <Check size={14} /> Paid on {formatDate(selectedBill.paidOn)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDownloadBillPdf(selectedBill)}
              >
                <Download size={14} /> Download PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedBill(null)}
              >
                Close
              </Button>
              {selectedBill && selectedBill.paymentStatus !== 'Paid' && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={payingBillId === selectedBill.id}
                  onClick={() => openPaymentModal(selectedBill)}
                >
                  {payingBillId === selectedBill.id ? (
                    'Processing…'
                  ) : (
                    <>
                      <CreditCard size={14} /> Pay Now (
                      {formatPKR(selectedBill.amountDue)})
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        }
      >
        {selectedBill && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-ink-50 p-3">
              <div>
                <p className="text-xs text-ink-500">Status</p>
                <div className="mt-0.5">
                  <Badge>{selectedBill.paymentStatus}</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500">Due Date</p>
                <p className="text-sm font-medium text-ink-900">
                  {formatDate(selectedBill.dueDate)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">
                Itemized Charges
              </p>
              <div className="divide-y divide-ink-100 rounded-lg border border-ink-200 bg-white">
                <div className="flex justify-between p-3 text-sm">
                  <span className="text-ink-600">Water Supply & Tank Charges</span>
                  <span className="font-medium text-ink-900">
                    {formatPKR(selectedBill.breakdown?.water)}
                  </span>
                </div>

                <div className="flex justify-between p-3 text-sm">
                  <span className="text-ink-600">Security & Gate Staff</span>
                  <span className="font-medium text-ink-900">
                    {formatPKR(selectedBill.breakdown?.security)}
                  </span>
                </div>

                <div className="flex justify-between p-3 text-sm">
                  <span className="text-ink-600">Repairs & Common Area Maintenance</span>
                  <span className="font-medium text-ink-900">
                    {formatPKR(selectedBill.breakdown?.repairs)}
                  </span>
                </div>

                <div className="flex justify-between p-3 text-sm">
                  <span className="text-ink-600">Other Utilities & Admin Fee</span>
                  <span className="font-medium text-ink-900">
                    {formatPKR(selectedBill.breakdown?.other)}
                  </span>
                </div>

                <div className="flex justify-between bg-ink-50 p-3.5 text-base font-semibold">
                  <span className="text-ink-900">Total Amount Due</span>
                  <span className="text-brand-700">
                    {formatPKR(selectedBill.amountDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Modal */}
      <Modal
        open={Boolean(paymentBill)}
        onClose={closePaymentModal}
        title={`Pay Bill — ${paymentBill ? formatPeriodMonth(paymentBill.period || paymentBill.month) : ''}`}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="secondary" size="sm" onClick={closePaymentModal}>Cancel</Button>
            <Button variant="primary" size="sm" disabled={payingBillId === (paymentBill?.id || paymentBill?._id)} onClick={processPayment}>
              {payingBillId === (paymentBill?.id || paymentBill?._id) ? 'Processing…' : 'Pay Now'}
            </Button>
          </div>
        }
      >
        {paymentBill && (
          <div className="space-y-4">
            <div className="rounded-lg bg-ink-50 p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-ink-500">Amount Due</p>
                <p className="text-lg font-bold text-ink-900">{formatPKR(paymentBill.amountDue)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ink-500">Due Date</p>
                <p className="text-sm font-medium text-ink-900">{formatDate(paymentBill.dueDate)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Card Details</p>
              
              <div>
                <label htmlFor="card-number" className="mb-1 block text-sm font-medium text-ink-700">Card Number</label>
                <input
                  id="card-number"
                  type="text"
                  inputMode="numeric"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ');
                    setCardNumber(formatted);
                  }}
                  placeholder="1234 5678 9012 3456"
                  className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 ${paymentErrors.cardNumber ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-ink-200 focus:border-brand-400 focus:ring-brand-100'}`}
                />
                {paymentErrors.cardNumber && <p className="mt-1 text-xs text-red-600">{paymentErrors.cardNumber}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="card-expiry" className="mb-1 block text-sm font-medium text-ink-700">Expiry Date</label>
                  <input
                    id="card-expiry"
                    type="text"
                    inputMode="numeric"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => {
                      let val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2);
                      setCardExpiry(val);
                    }}
                    placeholder="MM/YY"
                    className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 ${paymentErrors.cardExpiry ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-ink-200 focus:border-brand-400 focus:ring-brand-100'}`}
                  />
                  {paymentErrors.cardExpiry && <p className="mt-1 text-xs text-red-600">{paymentErrors.cardExpiry}</p>}
                </div>
                <div>
                  <label htmlFor="card-cvv" className="mb-1 block text-sm font-medium text-ink-700">CVV</label>
                  <input
                    id="card-cvv"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 ${paymentErrors.cardCvv ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-ink-200 focus:border-brand-400 focus:ring-brand-100'}`}
                  />
                  {paymentErrors.cardCvv && <p className="mt-1 text-xs text-red-600">{paymentErrors.cardCvv}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="card-name" className="mb-1 block text-sm font-medium text-ink-700">Cardholder Name</label>
                <input
                  id="card-name"
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="Name on card"
                  className={`mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 ${paymentErrors.cardName ? 'border-red-500 focus:border-red-500 focus:ring-red-100' : 'border-ink-200 focus:border-brand-400 focus:ring-brand-100'}`}
                />
                {paymentErrors.cardName && <p className="mt-1 text-xs text-red-600">{paymentErrors.cardName}</p>}
              </div>
            </div>

            <p className="text-[11px] text-ink-400 text-center">This is a simulated payment. No real transaction will be made.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
