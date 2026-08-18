import { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ShieldCheck, QrCode, CheckCircle2, XCircle, RotateCcw, Camera } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import PageHeader from '../../components/ui/PageHeader';
import EmptyState from '../../components/ui/EmptyState';
import { useCollection } from '../../hooks/useCollection';
import { verifyPassCode } from '../../services/gateService';
import { formatDateTime, formatDate } from '../../utils/format';

export default function PassVerification() {
  const gateLogs = useCollection('gateLogs') || [];
  const flats = useCollection('flats') || [];
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState('');
  const inputRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const resolveFlat = (flatId) => {
    if (!flatId) return null;
    const raw = String(flatId).trim();
    if (!raw) return null;

    return (
      flats.find((flat) => {
        const candidates = [flat?.id, flat?._id, flat?.flatId, flat?.flatNumber, flat?.number];
        return candidates.some((candidate) => String(candidate ?? '').trim() === raw);
      }) || null
    );
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {}).finally(() => {
        html5QrCodeRef.current = null;
      });
    }
    setScannerOpen(false);
    setScannerError('');
  };

  const startScanner = async () => {
    setScannerError('');
    setScannerOpen(true);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setScannerError('Camera access is not available in this browser. Please type the pass code manually instead.');
      setScannerOpen(false);
      return;
    }

    try {
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const container = document.getElementById('guard-pass-scanner');
      if (!container) {
        setScannerError('Scanner container is not ready yet. Please try again.');
        setScannerOpen(false);
        return;
      }

      const html5QrCode = new Html5Qrcode('guard-pass-scanner');
      html5QrCodeRef.current = html5QrCode;

      const cameras = await Html5Qrcode.getCameras().catch(() => []);
      const preferredCamera = cameras.find((camera) => camera.label?.toLowerCase().includes('back')) || cameras[0];
      const cameraId = preferredCamera?.id || { facingMode: 'environment' };

      await html5QrCode.start(
        cameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        async (decodedText) => {
          const value = decodedText.trim();
          if (!value) return;
          setCode(value);
          setResult(null);
          stopScanner();
          const res = await verifyPassCode(value);
          setResult(res);
          setCode('');
          setTimeout(() => inputRef.current?.focus(), 100);
        },
        () => {}
      );
    } catch (err) {
      setScannerError('Unable to access the camera. Please type the pass code manually instead.');
      setScannerOpen(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;

    const enteredCode = code.trim();
    setResult(null);
    const res = await verifyPassCode(enteredCode);
    setResult(res);
    setCode('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleReset = () => {
    setCode('');
    setResult(null);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const recentVerifications = [...gateLogs]
    .filter((log) => Boolean(log.visitorId))
    .sort((a, b) => new Date(b.checkIn) - new Date(a.checkIn))
    .slice(0, 5);

  return (
    <div className="space-y-6 min-h-screen bg-slate-50/70 p-4 sm:p-6 text-slate-900">
      <PageHeader
        title="Passcode Terminal & Verification"
        description="Verify resident-issued visitor passes and automatically log approved entry."
      />

      {/* TERMINAL VERIFICATION CARD */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader
          title={<span className="text-slate-900 font-bold">Terminal Gate Verification</span>}
          subtitle={<span className="text-slate-500 text-xs">Scan or manually enter the 6-digit visitor pass code</span>}
          className="border-b border-slate-100 pb-4"
        />
        <CardBody className="p-6 space-y-6">
          <form onSubmit={handleVerify} className="max-w-xl mx-auto space-y-5">
            <div className="text-center space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
                Visitor Gate Pass Code
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={10}
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. 482913"
                  className="w-full text-center font-mono text-3xl font-extrabold tracking-widest px-4 py-4 rounded-2xl border-2 border-cyan-200 bg-cyan-50/30 text-cyan-950 placeholder:text-slate-300 focus:border-cyan-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-cyan-100 transition-all uppercase"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button
                type="submit"
                disabled={!code.trim()}
                className="flex-1 py-3 bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <ShieldCheck size={20} />
                <span>Verify Passcode</span>
              </Button>
              <Button
                type="button"
                onClick={startScanner}
                className="py-3 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Camera size={18} />
                <span>Scan QR</span>
              </Button>
              {result && (
                <Button
                  type="button"
                  onClick={handleReset}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200 text-sm font-semibold rounded-xl px-4 py-3 flex items-center gap-2 transition-all"
                >
                  <RotateCcw size={18} />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </form>

          {scannerOpen && (
            <div className="max-w-xl mx-auto space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Camera Scanner</p>
                <Button type="button" variant="ghost" onClick={stopScanner}>Close</Button>
              </div>

              {scannerError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {scannerError}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-black">
                  <div id="guard-pass-scanner" className="h-72 w-full" />
                </div>
              )}
            </div>
          )}

          {/* VERIFICATION RESULT DISPLAY */}
          {result && (
            <div className="max-w-2xl mx-auto pt-2">
              {result.ok ? (
                <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50/90 p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3 text-emerald-900 pb-3 border-b border-emerald-200/80">
                    <CheckCircle2 size={32} className="text-emerald-600 shrink-0" />
                    <div>
                      <h3 className="text-base font-extrabold text-emerald-950">PASS VERIFIED - ENTRY GRANTED</h3>
                      <p className="text-xs text-emerald-700 font-medium">Gate entry log has been created automatically.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <p className="text-emerald-700 font-medium">Visitor Name</p>
                      <p className="font-bold text-emerald-950 text-sm">{result.pass.name}</p>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-medium">Phone</p>
                      <p className="font-bold text-emerald-950">{result.pass.phone || '—'}</p>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-medium">Vehicle</p>
                      <p className="font-bold text-emerald-950 font-mono">{result.pass.vehicleNumber || '—'}</p>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-medium">Visiting Flat</p>
                      <p className="font-bold text-emerald-950">
                        {resolveFlat(result.pass.flatId)?.number || result.pass.flatId}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-medium">Purpose / Type</p>
                      <p className="font-bold text-emerald-950">{result.pass.purpose}</p>
                    </div>
                    <div>
                      <p className="text-emerald-700 font-medium">Valid Dates</p>
                      <p className="font-bold text-emerald-950">
                        {formatDate(result.pass.validFrom)} - {formatDate(result.pass.validTo)}
                      </p>
                    </div>
                  </div>

                  {result.entry && (
                    <div className="mt-2 rounded-xl bg-emerald-100/80 p-3 text-xs text-emerald-900 flex items-center justify-between border border-emerald-200">
                      <span className="font-medium">Checked-in timestamp:</span>
                      <span className="font-bold">{formatDateTime(result.entry.checkIn)}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <Button
                      type="button"
                      onClick={handleReset}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl px-4 py-2.5"
                    >
                      New Verification
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-rose-500 bg-rose-50/90 p-6 shadow-sm space-y-3">
                  <div className="flex items-center gap-3 text-rose-900">
                    <XCircle size={32} className="text-rose-600 shrink-0" />
                    <div>
                      <h3 className="text-base font-extrabold text-rose-950">VERIFICATION FAILED</h3>
                      <p className="text-xs font-semibold text-rose-800">{result.reason}</p>
                    </div>
                  </div>

                  {result.pass && (
                    <div className="mt-3 rounded-xl border border-rose-200 bg-white/90 p-3.5 text-xs text-slate-700 space-y-1">
                      <p className="font-bold text-slate-900">Associated Pass Information:</p>
                      <p>Visitor: <span className="font-semibold">{result.pass.name}</span> ({result.pass.phone})</p>
                      <p>Flat: <span className="font-semibold">{resolveFlat(result.pass.flatId)?.number || result.pass.flatId}</span></p>
                      <p>Status: <span className="font-semibold text-rose-700">{result.pass.status}</span></p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {/* RECENT VERIFICATIONS TABLE CARD */}
      <Card className="bg-white border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader
          title={<span className="text-slate-900 font-bold">Recent Pass Verifications</span>}
          subtitle={<span className="text-slate-500 text-xs">Last 5 visitors admitted using a passcode</span>}
          className="border-b border-slate-100 pb-4"
        />
        <CardBody className="p-0">
          {recentVerifications.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={QrCode}
                title="No recent verifications"
                description="Passcodes verified at this terminal will appear here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-900">
                <thead className="border-b border-slate-200 bg-slate-50 uppercase tracking-wider text-[10px] text-slate-600 font-bold">
                  <tr>
                    <th className="px-5 py-3.5">Visitor</th>
                    <th className="px-5 py-3.5">Flat</th>
                    <th className="px-5 py-3.5">Purpose</th>
                    <th className="px-5 py-3.5">Check-In Time</th>
                    <th className="px-5 py-3.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentVerifications.map((log) => {
                    const flat = resolveFlat(log.flatId);
                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          <div>{log.name}</div>
                          {log.phone && <div className="text-[11px] text-slate-500 font-normal">{log.phone}</div>}
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
                        <td className="px-5 py-3.5 text-right">
                          {log.checkOut ? (
                            <Badge className="bg-slate-100 text-slate-600 border-slate-200">Checked Out</Badge>
                          ) : (
                            <Badge className="bg-emerald-50 text-emerald-800 border-emerald-200 font-bold">Inside</Badge>
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