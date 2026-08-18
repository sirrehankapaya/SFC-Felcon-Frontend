import { useState, useMemo, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Plus, Copy, Check, Car, Phone, Clock, Ticket, Download } from 'lucide-react';

import Button from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Select, FormRow } from '../../components/ui/Field';
import EmptyState from '../../components/ui/EmptyState';
import PageHeader from '../../components/ui/PageHeader';

import { useAuth } from '../../context/AuthContext';
import { getResidentByUserId } from '../../services/residentService';
import { createVisitorPass, isPassExpired } from '../../services/visitorService';
import { useCollection } from '../../hooks/useCollection';
import { formatDateTime } from '../../utils/format';

function toLocalISOString(date) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function normalizeId(value) {
  if (!value) return '';
  if (typeof value === 'object') return String(value._id || value.id || value.userId || '');
  return String(value);
}

const PURPOSES = ['Guest', 'Delivery', 'Cab', 'Service Staff'];

export default function VisitorPasses() {
  const { user } = useAuth();
  const residents = useCollection('residents');
  const resident = (residents || []).find((r) => {
    const idMatch = String(r.userId || r.id || r._id || '') === String(user?.id || '');
    const emailMatch = String(r.email || '').toLowerCase() === String(user?.email || '').toLowerCase();
    return idMatch || emailMatch;
  }) || getResidentByUserId(user?.id);

  const residentFlatId = normalizeId(resident?.flatId || user?.flatId);
  const visitors = useCollection('visitors');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [error, setError] = useState('');
  const qrSvgRefs = useRef({});

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [purpose, setPurpose] = useState('Guest');
  const [validFrom, setValidFrom] = useState('');
  const [validTo, setValidTo] = useState('');

  const residentPasses = useMemo(() => {
    const list = Array.isArray(visitors) ? visitors : [];
    return list
      .filter((pass) => {
        const flatMatches = residentFlatId && normalizeId(pass.flatId) === residentFlatId;
        const userMatches = !residentFlatId && String(pass.generatedBy || pass.generatedById || pass.userId || '') === String(user?.id || user?._id || '');
        return flatMatches || userMatches;
      })
      .sort((a, b) => new Date(b.validFrom || b.entryTime || 0) - new Date(a.validFrom || a.entryTime || 0));
  }, [visitors, residentFlatId, user]);

  function handleOpenCreate() {
    const now = new Date();
    const later = new Date(now.getTime() + 8 * 3600 * 1000);
    setName('');
    setPhone('');
    setVehicleNumber('');
    setPurpose('Guest');
    setValidFrom(toLocalISOString(now));
    setValidTo(toLocalISOString(later));
    setError('');
    setIsCreateOpen(true);
  }

  async function handleCreateSubmit(e) {
    e.preventDefault();
    setError('');

    if (!residentFlatId) {
      setError('Flat information not found. Please contact administration.');
      return;
    }
    if (!name.trim()) {
      setError('Visitor name is required.');
      return;
    }
    if (!phone.trim()) {
      setError('Phone number is required.');
      return;
    }
    if (!validFrom || !validTo) {
      setError('Please select valid from and to dates.');
      return;
    }

    try {
      await createVisitorPass({
        flatId: residentFlatId,
        name: name.trim(),
        phone: phone.trim(),
        vehicleNumber: vehicleNumber.trim() || '—',
        purpose,
        validFrom,
        validTo,
      });
      setIsCreateOpen(false);
      setError('');
      if (visitors.refetch) visitors.refetch();
    } catch (err) {
      console.error('Failed to create visitor pass:', err);
      setError(err.message || 'Failed to create visitor pass. Please try again.');
    }
  }

  function handleCopyCode(code) {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  }

  function handleDownloadPassPdf(pass) {
    if (!pass || typeof window === 'undefined') return;

    const passCode = pass.passCode || 'GATE-PASS';
    const passKey = pass.id || pass._id || pass.passCode;
    const qrNode = qrSvgRefs.current[passKey];
    const qrMarkup = qrNode ? new XMLSerializer().serializeToString(qrNode) : '';
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    const qrHtml = qrMarkup
      ? `<div style="display:flex;justify-content:center;align-items:center;padding:12px 0;">${qrMarkup}</div>`
      : `<div style="display:flex;justify-content:center;align-items:center;padding:12px 0;"><img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(passCode)}" alt="Visitor QR Pass" style="width:180px;height:180px;border:1px solid #dbeafe;border-radius:12px;background:#fff;padding:8px;" /></div>`;

    const html = `
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Visitor Pass - ${pass.name || 'Guest'}</title>
          <style>
            body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 32px; }
            .card { max-width: 620px; margin: 0 auto; background: #fff; border: 1px solid #dbeafe; border-radius: 18px; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); padding: 24px; }
            h1 { margin: 0 0 12px; font-size: 28px; }
            .meta { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: #475569; margin-bottom: 18px; }
            .section { border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 14px; margin-top: 14px; }
            .title { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 8px; }
            .code { font-size: 26px; font-weight: 700; letter-spacing: 0.16em; text-align: center; padding: 12px; border-radius: 10px; background: #ecfeff; color: #0f172a; }
            .row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 8px 0; }
            .row:last-child { border-bottom: none; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Visitor Pass</h1>
            <div class="meta">
              <span>Guest: ${pass.name || 'Visitor'}</span>
              <span>Status: ${getEffectiveStatus(pass)}</span>
            </div>
            <div class="section">
              <div class="title">QR Code</div>
              ${qrHtml}
            </div>
            <div class="section">
              <div class="title">Pass Code</div>
              <div class="code">${passCode}</div>
            </div>
            <div class="section">
              <div class="row"><span>Phone</span><span>${pass.phone || '—'}</span></div>
              <div class="row"><span>Vehicle</span><span>${pass.vehicleNumber || '—'}</span></div>
              <div class="row"><span>Purpose</span><span>${pass.purpose || 'Guest'}</span></div>
              <div class="row"><span>Valid From</span><span>${formatDateTime(pass.validFrom || pass.entryTime)}</span></div>
              <div class="row"><span>Valid To</span><span>${formatDateTime(pass.validTo || pass.exitTime)}</span></div>
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

  function getEffectiveStatus(pass) {
    const raw = (pass.status || '').toString();
    if (raw === 'Used' || raw === 'used' || raw === 'exited') return 'Used';
    if (raw === 'Cancelled' || raw === 'cancelled' || raw === 'rejected') return 'Cancelled';
    if (raw === 'approved' || raw === 'Active' || raw === 'active') return 'Active';
    if (isPassExpired(pass)) return 'Expired';
    return raw || 'Active';
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <PageHeader
        title="Visitor Passes"
        description="Generate and manage gate passes for guests, deliveries, and services."
        action={
          <Button
            onClick={handleOpenCreate}
            className="bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"
          >
            <Plus size={18} />
            <span>Generate Pass</span>
          </Button>
        }
      />

      {isCreateOpen && (
        <Card>
          <CardBody>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-ink-900">Generate Visitor Pass</h3>
                <p className="text-sm text-ink-600">Create a new guest pass and keep it visible on this page.</p>
              </div>
              <Button variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </div>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <FormRow label="Visitor Name">
                <Input
                  type="text"
                  placeholder="e.g. Tariq Mehmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormRow>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormRow label="Phone Number">
                  <Input
                    type="tel"
                    placeholder="e.g. +92 300 1234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </FormRow>

                <FormRow label="Vehicle Number (Optional)">
                  <Input
                    type="text"
                    placeholder="e.g. ABC-1234"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                  />
                </FormRow>
              </div>

              <FormRow label="Purpose">
                <Select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                  {PURPOSES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </FormRow>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormRow label="Valid From">
                  <Input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                    required
                  />
                </FormRow>

                <FormRow label="Valid To">
                  <Input
                    type="datetime-local"
                    value={validTo}
                    onChange={(e) => setValidTo(e.target.value)}
                    required
                  />
                </FormRow>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>
                  Close
                </Button>
                <Button className={"bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 px-4 py-2.5 transition-all active:scale-95"} variant="primary" type="submit">
                  Create Pass
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      {residentPasses.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={Ticket}
              title="No visitor passes created"
              description="Generate a visitor pass to share a gate QR code or pass code with your guests."
              action={
                <Button variant="secondary" onClick={handleOpenCreate} className="mt-2">
                  <Plus size={16} />
                  Generate Pass
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {residentPasses.map((pass) => {
            const status = getEffectiveStatus(pass);
            const isActive = status === 'Active';

            return (
              <Card key={pass.id || pass._id} className={isActive ? 'border-brand-200' : 'opacity-60 bg-ink-50/50 border-ink-200'}>
                <CardBody className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-ink-900 text-base">{pass.name}</h3>
                      <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5">
                        <Phone size={12} />
                        {pass.phone}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge>{status}</Badge>
                      <span className="text-xs font-medium text-ink-600 bg-ink-100 px-2 py-0.5 rounded-md">
                        {pass.purpose}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-brand-100 bg-brand-50/60 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-brand-700 font-medium uppercase tracking-wider">Gate Code</p>
                        <p className="text-xl font-mono font-bold text-brand-900 tracking-wider mt-0.5">
                          {pass.passCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyCode(pass.passCode)}
                          className="inline-flex items-center gap-1 rounded-md border border-ink-200 bg-white px-2 py-1 text-xs font-medium text-ink-700 hover:bg-ink-100"
                          title="Copy Code"
                        >
                          {copiedCode ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                          {copiedCode ? 'Copied' : 'Copy'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPassPdf(pass)}
                          className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100"
                          title="Download PDF"
                        >
                          <Download size={14} />
                          PDF
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-center rounded-md bg-white p-2">
                      <QRCodeSVG
                        ref={(node) => {
                          const passKey = pass.id || pass._id || pass.passCode;
                          if (node) qrSvgRefs.current[passKey] = node;
                        }}
                        value={pass.passCode || ''}
                        size={72}
                        level="M"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-ink-600 border-t border-ink-100 pt-3">
                    {pass.vehicleNumber && pass.vehicleNumber !== '—' && (
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-ink-400 shrink-0" />
                        <span>Vehicle: <strong className="text-ink-800">{pass.vehicleNumber}</strong></span>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <Clock size={14} className="text-ink-400 shrink-0 mt-0.5" />
                      <div>
                        <div>Valid from: <span className="text-ink-800">{formatDateTime(pass.validFrom || pass.entryTime)}</span></div>
                        <div>Valid to: <span className="text-ink-800">{formatDateTime(pass.validTo || pass.exitTime)}</span></div>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
