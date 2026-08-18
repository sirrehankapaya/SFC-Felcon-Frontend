import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { LogoWordmark } from '../components/Logo';

const sections = [
  {
    title: 'Public',
    routes: [
      ['Homepage', '/'],
      ['About', '/about'],
      ['Sign In', '/login'],
      ['Sitemap', '/sitemap'],
    ],
  },
  {
    title: 'Resident',
    routes: [
      ['Dashboard', '/resident/dashboard'],
      ['My Profile', '/resident/profile'],
      ['Maintenance Bills', '/resident/bills'],
      ['Visitor Passes', '/resident/visitors'],
      ['Complaints', '/resident/complaints'],
      ['Amenity Booking', '/resident/amenities'],
      ['Notices & Polls', '/resident/notices'],
      ['Emergency Directory', '/resident/emergency'],
    ],
  },
  {
    title: 'Security Guard',
    routes: [
      ['Dashboard', '/guard/dashboard'],
      ['Visitor Log Entry', '/guard/visitor-log'],
      ['Pass Verification', '/guard/verify'],
      ['Overstay Alerts', '/guard/overstay'],
    ],
  },
  {
    title: 'Administrator',
    routes: [
      ['Dashboard', '/admin/dashboard'],
      ['Residents & Flats', '/admin/residents'],
      ['Billing Engine', '/admin/billing'],
      ['Helpdesk Routing', '/admin/helpdesk'],
      ['Security Logs', '/admin/security-logs'],
      ['Notices & Alerts', '/admin/notices'],
    ],
  },
];

export default function Sitemap() {
  return (
    <div className="min-h-screen bg-ink-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 transition-colors hover:text-ink-700">
          <ArrowLeft size={15} /> Back to home
        </Link>

        <div className="mt-4">
          <LogoWordmark size={36} subText="Clifton Heights Society" />
        </div>

        <h1 className="mt-6 text-xl font-semibold text-ink-900">Sitemap</h1>
        <p className="mt-1 text-sm text-ink-500">Every page in the app, grouped by role.</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-lg border border-ink-200 bg-white p-4">
              <h2 className={`mb-3 text-sm font-semibold uppercase tracking-wide ${section.title === 'Public' ? 'text-ink-500' : 'text-brand-700'}`}>
                {section.title}
              </h2>
              <ul className="space-y-1.5">
                {section.routes.map(([label, path]) => (
                  <li key={path}>
                    <Link to={path} className="text-sm text-ink-600 hover:text-brand-700 hover:underline">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-xs text-ink-400">
          Public pages are open to everyone. Role-specific pages need a matching account.
        </p>
      </div>
    </div>
  );
}
