import { useMemo, useState } from 'react';
import { Building2, Car, Dumbbell, DoorOpen, Map as MapIcon, MapPin, Search, Shield, Sparkles, Trees, Waves } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';

const places = [
  { id: 'gate', name: 'Main Gate & Security', category: 'Security', icon: Shield, x: 55, y: 366, w: 130, h: 60, tone: '#0f766e', detail: 'Primary society entrance with visitor verification and security desk.', hours: '24/7' },
  { id: 'admin', name: 'Admin Office', category: 'Management', icon: Building2, x: 215, y: 350, w: 120, h: 70, tone: '#0369a1', detail: 'Society administration, billing support and resident services.', hours: '9 AM – 6 PM' },
  { id: 'block-a', name: 'Residential Block A', category: 'Residential', icon: Building2, x: 105, y: 90, w: 145, h: 135, tone: '#475569', detail: 'Residential apartments, family units and resident parking access.', hours: 'Residents only' },
  { id: 'block-b', name: 'Residential Block B', category: 'Residential', icon: Building2, x: 295, y: 80, w: 145, h: 145, tone: '#475569', detail: 'Residential apartments with internal pedestrian access.', hours: 'Residents only' },
  { id: 'clubhouse', name: 'Clubhouse', category: 'Amenity', icon: Sparkles, x: 510, y: 80, w: 140, h: 90, tone: '#7c3aed', detail: 'Community hall for gatherings, cultural events and family activities.', hours: '9 AM – 10 PM' },
  { id: 'pool', name: 'Swimming Pool', category: 'Amenity', icon: Waves, x: 520, y: 205, w: 130, h: 85, tone: '#0284c7', detail: 'Resident swimming facility with controlled booking slots.', hours: '6 AM – 8 PM' },
  { id: 'court', name: 'Sports & Tennis Court', category: 'Amenity', icon: Dumbbell, x: 350, y: 275, w: 150, h: 105, tone: '#b45309', detail: 'Multi-purpose court for tennis, badminton and society tournaments.', hours: '6 AM – 9 PM' },
  { id: 'garden', name: 'Central Garden', category: 'Open Space', icon: Trees, x: 165, y: 250, w: 145, h: 70, tone: '#15803d', detail: 'Landscaped family lawn, walking path and community event area.', hours: '5 AM – 11 PM' },
  { id: 'parking', name: 'Visitor Parking', category: 'Parking', icon: Car, x: 520, y: 330, w: 135, h: 75, tone: '#64748b', detail: 'Short-stay visitor and service vehicle parking zone.', hours: '24/7' },
  { id: 'assembly', name: 'Emergency Assembly Point', category: 'Safety', icon: MapPin, x: 390, y: 410, w: 185, h: 55, tone: '#e11d48', detail: 'Designated safe gathering area during an evacuation or emergency.', hours: 'Emergency use' },
];
const categories = ['All', ...Array.from(new Set(places.map((p) => p.category)))];

export default function SocietyMap() {
  const [selectedId, setSelectedId] = useState('gate');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => places.filter((place) => (filter === 'All' || place.category === filter) && (place.name.toLowerCase().includes(search.toLowerCase()) || place.category.toLowerCase().includes(search.toLowerCase()))), [filter, search]);
  const selected = places.find((place) => place.id === selectedId) || places[0];
  const SelectedIcon = selected.icon;

  return (
    <div className="space-y-6">
      <PageHeader title="Interactive Society Map" description="Explore key residential blocks, amenities, security points and emergency locations inside Clifton Heights Society." />
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><MapIcon size={18} /></span><div><p className="text-sm font-bold text-slate-900">Clifton Heights Site Plan</p><p className="text-[11px] text-slate-400">Click any zone to view its details</p></div></div>
            <div className="relative w-full sm:w-64"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search map..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs outline-none focus:border-cyan-400 focus:bg-white" /></div>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-100 px-4 py-3">{categories.map((category) => <button key={category} type="button" onClick={() => setFilter(category)} className={`rounded-full px-3 py-1.5 text-[10px] font-bold transition ${filter === category ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{category}</button>)}</div>
          <div className="bg-slate-100/70 p-3 sm:p-5">
            <svg viewBox="0 0 720 500" className="h-auto w-full rounded-2xl border border-slate-200 bg-[#eef6f3]" role="img" aria-label="Interactive schematic map of Clifton Heights Society">
              <defs><pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#dbe7e3" strokeWidth="1" /></pattern></defs>
              <rect width="720" height="500" fill="url(#grid)" /><path d="M 0 445 H 720" stroke="#cbd5e1" strokeWidth="35" /><path d="M 360 0 V 500" stroke="#d7dee4" strokeWidth="28" /><path d="M 0 240 H 720" stroke="#d7dee4" strokeWidth="22" /><path d="M 85 445 C 120 390 135 350 150 310" stroke="#b6c6cc" strokeWidth="12" fill="none" strokeLinecap="round" /><text x="24" y="476" fill="#94a3b8" fontSize="12" fontWeight="700">MAIN ACCESS ROAD</text>
              {places.map((place) => { const visible = filtered.some((item) => item.id === place.id); const active = selectedId === place.id; return <g key={place.id} onClick={() => setSelectedId(place.id)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedId(place.id); }} tabIndex="0" role="button" aria-label={place.name} style={{ cursor: 'pointer', opacity: visible ? 1 : 0.18 }}><rect x={place.x} y={place.y} width={place.w} height={place.h} rx="14" fill={active ? place.tone : '#ffffff'} stroke={active ? place.tone : '#cbd5e1'} strokeWidth={active ? 4 : 2} /><circle cx={place.x + 22} cy={place.y + 22} r="9" fill={active ? '#ffffff' : place.tone} /><text x={place.x + 12} y={place.y + place.h / 2 + 4} fill={active ? '#ffffff' : '#0f172a'} fontSize="12" fontWeight="800">{place.name.length > 22 ? `${place.name.slice(0, 21)}…` : place.name}</text>{active && <rect x={place.x - 4} y={place.y - 4} width={place.w + 8} height={place.h + 8} rx="17" fill="none" stroke="#ffffff" strokeWidth="2" strokeDasharray="5 4" />}</g>; })}
            </svg>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white" style={{ backgroundColor: selected.tone }}><SelectedIcon size={20} /></span><div><p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">{selected.category}</p><h2 className="text-base font-extrabold text-slate-900">{selected.name}</h2></div></div><p className="mt-4 text-sm leading-6 text-slate-600">{selected.detail}</p><div className="mt-4 rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Access / Hours</p><p className="mt-1 text-sm font-semibold text-slate-800">{selected.hours}</p></div></div>
          <div className="rounded-2xl border border-cyan-100 bg-cyan-50 p-4"><div className="flex items-center gap-2 text-cyan-800"><DoorOpen size={16} /><p className="text-xs font-bold">Quick navigation</p></div><p className="mt-2 text-xs leading-5 text-cyan-900/70">Select a location on the map or use the filters to quickly find society facilities and safety points.</p></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><p className="mb-3 text-xs font-bold text-slate-900">Visible locations</p><div className="space-y-1.5">{filtered.map((place) => <button key={place.id} type="button" onClick={() => setSelectedId(place.id)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition ${selectedId === place.id ? 'bg-slate-900 font-bold text-white' : 'text-slate-600 hover:bg-slate-50'}`}><span>{place.name}</span><MapPin size={13} /></button>)}{filtered.length === 0 && <p className="py-4 text-center text-xs text-slate-400">No location matches your search.</p>}</div></div>
        </aside>
      </div>
    </div>
  );
}
