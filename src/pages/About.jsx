import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowLeft, Target, Layers, Zap, Users, ShieldCheck,
  Receipt, QrCode, Wrench, CalendarClock, Megaphone, Phone,
} from 'lucide-react';
import { getSociety } from '../data/db';
import { LogoWordmark, Logo } from '../components/Logo';

function Nav() {
  return (
    <nav className="sticky top-0 z-50 border-b border-ink-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="transition-opacity hover:opacity-80">
          <LogoWordmark size={32} subText="Clifton Heights" />
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="hidden text-sm text-ink-600 transition-colors hover:text-ink-900 sm:block">Home</Link>
          <a href="/#features" className="hidden text-sm text-ink-600 transition-colors hover:text-ink-900 sm:block">Features</a>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
          >
            Sign in
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  );
}

const modules = [
  { icon: Receipt, name: 'Billing Engine', desc: 'Monthly maintenance bills with itemized breakdowns (water, security, repairs, other). Residents pay online. Admin generates bills for all flats in one action.' },
  { icon: QrCode, name: 'QR Gate Passes', desc: 'Residents generate a unique 6-digit code + QR per visitor. Guards verify at the gate terminal. Passes auto-expire after the valid window. Overstay detection built in.' },
  { icon: Wrench, name: 'Complaints & Helpdesk', desc: 'Residents raise complaints by category (plumbing, electrical, elevator, etc). Admin assigns to staff, adds notes, and tracks resolution status through a timeline.' },
  { icon: CalendarClock, name: 'Amenity Booking', desc: 'Book the clubhouse, pool, tennis court, or party hall. Real-time slot grid prevents double-booking. Cancel anytime.' },
  { icon: Megaphone, name: 'Notices & Polls', desc: 'Admin posts society-wide notices (can pin important ones). Residents vote on decisions with live percentage bars.' },
  { icon: ShieldCheck, name: 'Gate Security', desc: 'Guards log walk-in visitors, verify QR passes, check out guests, and flag overstays — all from a tablet at the main gate.' },
];

const principles = [
  { icon: Target, title: 'Purpose-built, not generic', desc: 'Every screen was designed after talking to actual residents, guards, and society secretaries. No bloat, no features nobody uses.' },
  { icon: Layers, title: 'Role-based from day one', desc: 'Residents, guards, and admins each see only what they need. No permission confusion, no accidental access to other people\'s data.' },
  { icon: Zap, title: 'Fast and offline-friendly', desc: 'The front end works with mock data out of the box. Swap in the real API when the backend is ready — no UI changes needed.' },
];

export default function About() {
  const society = getSociety();

  return (
    <div className="min-h-screen bg-ink-50">
      <Nav />

      {/* Hero */}
      <section className="border-b border-ink-200 bg-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-900">
            <ArrowLeft size={15} /> Back to home
          </Link>
          <div className="mt-6 flex items-center gap-4">
            <Logo size={48} />
            <div>
              <h1 className="text-3xl font-bold text-ink-900">About SmartSociety</h1>
              <p className="mt-1 text-ink-500">A management system built specifically for {society?.name || 'Clifton Heights'}.</p>
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-600">
            SmartSociety replaces the paper registers, WhatsApp groups, and Excel sheets that most
            housing societies in Karachi still run on. It brings billing, visitor management,
            complaints, amenity bookings, and security into one app — with different views for
            residents, guards, and the management office.
          </p>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold text-ink-900">Why we built this</h2>
        <div className="mt-6 space-y-4 text-ink-600">
          <p>
            Most housing societies in Pakistan still manage things the old way — a paper visitor
            register at the gate, maintenance bills sent via WhatsApp, complaints tracked in a
            notebook at the secretary's house, and amenity bookings handled through phone calls.
          </p>
          <p>
            It works, barely, but it means lost records, delayed responses, and zero visibility for
            residents. Nobody knows who is supposed to be fixing the elevator or when the pool is
            booked. The guard does not know if a visitor is actually expected.
          </p>
          <p>
            SmartSociety digitizes all of it. The guard has a tablet at the gate. The resident has
            an app on their phone. The admin has a dashboard with real numbers.
          </p>
        </div>
      </section>

      {/* Principles */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-ink-900">How we approached it</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {principles.map((p) => (
              <div key={p.title} className="rounded-xl border border-ink-200 bg-ink-50 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                  <p.icon size={20} />
                </div>
                <h3 className="mt-4 font-semibold text-ink-900">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="text-2xl font-bold text-ink-900">The six modules</h2>
        <p className="mt-2 text-ink-500">Everything SmartSociety handles, from billing to gate security.</p>
        <div className="mt-8 space-y-4">
          {modules.map((m, i) => (
            <div key={m.name} className="flex gap-5 rounded-xl border border-ink-200 bg-white p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <m.icon size={24} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-ink-300">{String(i + 1).padStart(2, '0')}</span>
                  <h3 className="font-semibold text-ink-900">{m.name}</h3>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tech */}
      <section className="bg-ink-800 py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-white">Under the hood</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-400">Frontend</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">
                React 19 with Vite, Tailwind CSS v4, React Router. The UI uses a custom design system
                with a teal/slate palette. QR codes generated with qrcode.react. Charts with recharts.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-400">Backend (planned)</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-300">
                Express + MongoDB. The frontend currently runs on mock data (localStorage) so the UI
                team can work independently. API contract is documented in docs/API_CONTRACT.md.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 p-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
            <Phone size={22} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-ink-900">Emergency contacts built in</h3>
            <p className="mt-1 text-sm text-ink-500">
              Fire, police, ambulance, and society emergency numbers — accessible from the resident
              dashboard without leaving the app.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-700 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold text-white">Want to see it in action?</h2>
          <p className="mt-2 text-brand-100">Sign in with a demo account and click around.</p>
          <Link
            to="/login"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-700 shadow-lg transition-all hover:bg-brand-50"
          >
            Sign in
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-200 bg-white py-10">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <LogoWordmark size={32} subText={society?.address || 'Block 7, Clifton, Karachi'} />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-ink-500">
              <Link to="/" className="transition-colors hover:text-ink-900">Home</Link>
              <Link to="/login" className="transition-colors hover:text-ink-900">Sign in</Link>
              <Link to="/sitemap" className="transition-colors hover:text-ink-900">Sitemap</Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-ink-400">
            © 2026 SmartSociety · {society?.name || 'Clifton Heights Society'}
          </p>
        </div>
      </footer>
    </div>
  );
}
