import { useEffect, useState } from 'react';
import { AlertTriangle, Flame, HeartPulse, Phone, ShieldAlert, Siren, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const types = [
  { id: 'medical', label: 'Medical', icon: HeartPulse, hint: 'Injury or urgent medical help' },
  { id: 'fire', label: 'Fire', icon: Flame, hint: 'Smoke, fire or electrical hazard' },
  { id: 'security', label: 'Security', icon: ShieldAlert, hint: 'Threat or security concern' },
];
const locations = ['My Flat / Unit', 'Main Gate', 'Clubhouse', 'Swimming Pool', 'Sports Court', 'Garden', 'Parking Area', 'Other Society Area'];

export default function EmergencySOS() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('security');
  const [location, setLocation] = useState('My Flat / Unit');
  const [activated, setActivated] = useState(false);
  const [time, setTime] = useState('');

  useEffect(() => { if (!open) { setActivated(false); setTime(''); } }, [open]);
  const activate = () => { setActivated(true); setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })); };
  const call = (number) => { window.location.href = `tel:${number}`; };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-rose-600 px-4 py-3 text-sm font-bold text-white shadow-xl shadow-rose-600/25 transition hover:bg-rose-700 focus:outline-none focus:ring-4 focus:ring-rose-200" aria-label="Open emergency SOS"><Siren size={19} /><span className="hidden sm:inline">Emergency SOS</span><span className="sm:hidden">SOS</span></button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-label="Emergency SOS">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white"><Siren size={20} /></span><div><h2 className="font-bold text-slate-900">Emergency SOS</h2><p className="text-xs text-slate-500">Quick emergency workflow for Clifton Heights Society</p></div></div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white hover:text-slate-700"><X size={18} /></button>
            </div>

            {!activated ? (
              <div className="space-y-5 p-5">
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">1. Choose emergency type</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {types.map((item) => { const Icon = item.icon; const selected = item.id === type; return <button key={item.id} type="button" onClick={() => setType(item.id)} className={`rounded-xl border p-3 text-left transition ${selected ? 'border-rose-400 bg-rose-50 ring-2 ring-rose-100' : 'border-slate-200 hover:bg-slate-50'}`}><Icon size={18} className={selected ? 'text-rose-600' : 'text-slate-500'} /><p className="mt-2 text-sm font-bold text-slate-900">{item.label}</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{item.hint}</p></button>; })}
                  </div>
                </div>
                <div><label htmlFor="sos-location" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">2. Current location</label><select id="sos-location" value={location} onChange={(e) => setLocation(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100">{locations.map((item) => <option key={item}>{item}</option>)}</select></div>
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><div className="flex gap-2"><AlertTriangle size={16} className="mt-0.5 shrink-0" /><span>Use SOS only for urgent situations. Contact the relevant emergency service for life-threatening emergencies.</span></div></div>
                <button type="button" onClick={activate} className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-rose-600/20 hover:bg-rose-700"><Siren size={18} /> Activate SOS</button>
              </div>
            ) : (
              <div className="p-5">
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center"><span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-600 text-white"><Siren size={27} /></span><h3 className="mt-3 text-lg font-extrabold text-rose-900">SOS Activated</h3><p className="mt-1 text-sm text-rose-800">{types.find((item) => item.id === type)?.label} emergency • {location}</p><p className="mt-2 text-xs text-rose-700">Requested by {user?.name || user?.role || 'logged-in user'} at {time}</p></div>
                <div className="mt-4 grid gap-2 sm:grid-cols-3"><button type="button" onClick={() => call('+9221111222333')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><Phone size={15} /> Gate Security</button><button type="button" onClick={() => call('115')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><HeartPulse size={15} /> Ambulance 115</button><button type="button" onClick={() => call('16')} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-xs font-bold text-slate-800 hover:bg-slate-50"><Flame size={15} /> Fire 16</button></div>
                <button type="button" onClick={() => setOpen(false)} className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">Close Emergency Panel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
