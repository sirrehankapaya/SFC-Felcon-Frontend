import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Music, Trophy, Users, Leaf } from 'lucide-react';

const templates = [
  { offset: 1, title: 'Society Sports Night', time: '6:30 PM', location: 'Sports Court', type: 'Sports', icon: Trophy, detail: 'Badminton, table tennis and family relay matches.' },
  { offset: 3, title: 'Community Singing Evening', time: '7:30 PM', location: 'Clubhouse Hall', type: 'Culture', icon: Music, detail: 'Open-mic singing evening for residents and families.' },
  { offset: 5, title: 'Kids Mini Olympics', time: '5:00 PM', location: 'Central Garden', type: 'Family', icon: Users, detail: 'Short races, fun games and medals for children.' },
  { offset: 8, title: 'Clean & Green Drive', time: '8:30 AM', location: 'Main Garden', type: 'Community', icon: Leaf, detail: 'Resident volunteer drive followed by refreshments.' },
  { offset: 11, title: 'Tennis Doubles Tournament', time: '6:00 PM', location: 'Tennis Court', type: 'Sports', icon: Trophy, detail: 'Friendly doubles tournament with resident teams.' },
  { offset: 14, title: 'Family Movie Night', time: '8:00 PM', location: 'Clubhouse Lawn', type: 'Community', icon: Users, detail: 'Outdoor family movie screening and snacks.' },
];

function addDays(base, days) {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function monthCells(year, month) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export default function CommunityEvents() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    return d;
  }, []);

  const events = useMemo(
    () => templates.map((item, index) => ({ ...item, id: `event-${index}`, date: addDays(today, item.offset) })),
    [today]
  );

  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(() => events[0]?.date || today);
  const cells = useMemo(() => monthCells(cursor.getFullYear(), cursor.getMonth()), [cursor]);
  const selectedEvents = events.filter((event) => sameDay(event.date, selectedDate));

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700"><CalendarDays size={19} /></span>
          <div>
            <h2 className="font-bold text-slate-900">Society Events Calendar</h2>
            <p className="text-xs text-slate-500">Upcoming sports, culture and community activities</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Previous month"><ChevronLeft size={16} /></button>
          <span className="min-w-32 text-center text-sm font-semibold text-slate-800">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <button type="button" onClick={() => setCursor((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50" aria-label="Next month"><ChevronRight size={16} /></button>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
        <div className="border-b border-slate-100 p-4 lg:border-b-0 lg:border-r">
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div key={day} className="py-1">{day}</div>)}
          </div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((date) => {
              const inMonth = date.getMonth() === cursor.getMonth();
              const hasEvent = events.some((event) => sameDay(event.date, date));
              const selected = sameDay(date, selectedDate);
              const isToday = sameDay(date, today);
              return (
                <button key={date.toISOString()} type="button" onClick={() => setSelectedDate(date)} className={`relative flex aspect-square min-h-9 flex-col items-center justify-center rounded-lg text-xs transition ${selected ? 'bg-cyan-600 font-bold text-white shadow-sm' : inMonth ? 'text-slate-700 hover:bg-cyan-50' : 'text-slate-300 hover:bg-slate-50'}`}>
                  <span>{date.getDate()}</span>
                  {hasEvent && <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${selected ? 'bg-white' : 'bg-amber-500'}`} />}
                  {isToday && !selected && <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-cyan-500" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">Selected Day</p>
              <p className="text-sm font-semibold text-slate-900">{selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">{selectedEvents.length || 'No'} event{selectedEvents.length === 1 ? '' : 's'}</span>
          </div>

          {selectedEvents.length ? selectedEvents.map((event) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="rounded-xl border border-cyan-100 bg-cyan-50/50 p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-cyan-700 shadow-sm"><Icon size={17} /></span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2"><h3 className="text-sm font-bold text-slate-900">{event.title}</h3><span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-cyan-700">{event.type}</span></div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{event.detail}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-[11px] font-medium text-slate-500"><span className="inline-flex items-center gap-1"><Clock3 size={12} />{event.time}</span><span className="inline-flex items-center gap-1"><MapPin size={12} />{event.location}</span></div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-center"><CalendarDays size={22} className="text-slate-300" /><p className="mt-2 text-sm font-semibold text-slate-700">No event scheduled</p><p className="text-xs text-slate-400">Choose a highlighted date to view an event.</p></div>
          )}

          <div className="mt-4 border-t border-slate-100 pt-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Next up</p>
            <div className="space-y-1">
              {events.slice(0, 3).map((event) => (
                <button key={event.id} type="button" onClick={() => { setSelectedDate(event.date); setCursor(new Date(event.date.getFullYear(), event.date.getMonth(), 1)); }} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-slate-50">
                  <div><p className="text-xs font-semibold text-slate-800">{event.title}</p><p className="text-[10px] text-slate-400">{event.location} • {event.time}</p></div>
                  <span className="text-[10px] font-bold text-cyan-700">{event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
