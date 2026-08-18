import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  Phone,
  PlayCircle,
  QrCode,
  Quote,
  Receipt,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
  Building2,
  Lock,
} from 'lucide-react';
import { getSociety } from '../data/db';
import { Logo, LogoWordmark } from '../components/Logo';

// Carousel Background Images (Parks, Gatherings, Festivals)
const carouselImages = [
  {
    url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?auto=format&fit=crop&q=80&w=1920',
    alt: 'Green Society Parks & Gardens',
  },
  {
    url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1920',
    alt: 'Community Gatherings & Events',
  },
  {
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=1920',
    alt: 'Society Festivals & Celebrations',
  },
  {
    url: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=1920',
    alt: 'Resident Social Activities',
  },
];

const galleryItems = [
  {
    src: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?auto=format&fit=crop&q=80&w=800',
    title: 'Main Gate & Security Command',
    text: 'Real-time entry verification, automated QR access, and guard dispatch logs.',
  },
  {
    src: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800',
    title: 'Modern Resident Living',
    text: 'Frictionless digital bill payments, amenity reservations, and instant feedback.',
  },
  {
    src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800',
    title: 'Admin Control Room',
    text: 'Centralized analytics, tracking maintenance queues, and automated announcements.',
  },
];

const featureGroups = [
  {
    eyebrow: 'Residents Portal',
    title: 'Seamless Digital Living Experience',
    desc: 'Skip physical visits and endless messaging groups. Manage daily community tasks directly from your phone.',
    items: [
      {
        icon: Receipt,
        title: 'Instant Maintenance Bills',
        desc: 'Clear line-item breakdowns, automatic due alerts, digital receipts, and payment history logs.',
      },
      {
        icon: QrCode,
        title: 'Smart QR Passes',
        desc: 'Generate temporary or recurring guest passes in seconds and share directly via WhatsApp.',
      },
      {
        icon: CalendarClock,
        title: 'Amenity Bookings',
        desc: 'Check availability and reserve clubhouse halls, sports courts, or gyms without manual logs.',
      },
    ],
  },
  {
    eyebrow: 'Guard Security',
    title: 'High-Precision Gate Operations',
    desc: 'Empower security teams with streamlined tools for rapid code scans and visitor logging.',
    items: [
      {
        icon: ShieldCheck,
        title: 'QR & Code Scanner',
        desc: 'Instant gate clearance, visitor flag alerts, and overstay tracking on mobile or tablets.',
      },
      {
        icon: Wrench,
        title: 'Maintenance Dispatch',
        desc: 'Log resident issues, assign field technicians, and update status on completion.',
      },
      {
        icon: Megaphone,
        title: 'Emergency Alerts & Polls',
        desc: 'Broadcast society notices, emergency alerts, and conduct digital voting seamlessly.',
      },
    ],
  },
];

const roleTabs = [
  {
    key: 'resident',
    label: 'Resident',
    icon: Users,
    summary:
      'A dedicated self-service hub designed for fast access to bill payments, guest passes, and complaint resolution.',
    points: [
      'One-tap visitor pass creation with auto-generated QR code',
      'Live maintenance bill breakdown and instant downloadable receipts',
      'Real-time status updates on submitted complaints and repairs',
    ],
    metrics: [
      { label: 'Pending Dues', value: 'PKR 8.5k' },
      { label: 'Active Guest Passes', value: '02 Active' },
      { label: 'Open Tickets', value: '01 Solved' },
    ],
  },
  {
    key: 'guard',
    label: 'Security Guard',
    icon: ShieldCheck,
    summary:
      'High-contrast, large-button mobile interface crafted specifically for quick entry gates and high-traffic hours.',
    points: [
      'Large QR/Numeric passcode verification screen',
      'Live counter of visitors currently inside the society premises',
      'One-tap emergency call triggers to main admin office',
    ],
    metrics: [
      { label: 'Visitors Inside', value: '14 Active' },
      { label: 'Today Entries', value: '42 Scans' },
      { label: 'Flagged Alerts', value: '00 Clear' },
    ],
  },
  {
    key: 'admin',
    label: 'Administrator',
    icon: Receipt,
    summary:
      'Complete operational visibility with financial reporting, automated notices, and resident request tracking.',
    points: [
      'Financial dashboard tracking paid vs pending monthly maintenance',
      'Categorized complaint routing and service speed analytics',
      'Society-wide announcement manager with push notifications',
    ],
    metrics: [
      { label: 'Dues Collected', value: '91.4%' },
      { label: 'Active Issues', value: '04 Tickets' },
      { label: 'Monthly Traffic', value: '1.2k Logs' },
    ],
  },
];

const testimonials = [
  {
    name: 'Ahmed Raza',
    role: 'Resident · Block A-101',
    text: 'Guest entry used to take 10 minutes at the main gate. Now I send a QR pass beforehand and they enter smoothly without any calls.',
  },
  {
    name: 'Fatima Malik',
    role: 'Resident · Block B-204',
    text: 'Paying maintenance fees and downloading receipts used to be tedious. Having everything logged in one place is fantastic.',
  },
  {
    name: 'Sarah Khalid',
    role: 'Admin Operations',
    text: 'Managing complaints and bill collection across 200+ flats was difficult. SmartSociety brought total clarity to our office.',
  },
];

function useCountUp(target, durationMs = 1400, start = false) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf = 0;
    const started = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - started) / durationMs, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, start, target]);

  return val;
}

function useInView() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

function Nav() {
  const society = getSociety();

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
        <Link to="/" className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-90">
          <LogoWordmark size={32} subText={society?.name || 'SmartSociety'} />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {['overview', 'features', 'experience', 'gallery'].map((sec) => (
            <a
              key={sec}
              href={`#${sec}`}
              className="text-sm font-medium capitalize text-slate-300 transition-colors duration-200 hover:text-cyan-400"
            >
              {sec}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
         
          <Link
            to="/login"
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all duration-300 hover:shadow-cyan-500/40 hover:-translate-y-0.5"
          >
            Sign in
            <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </nav>
  );
}

function Hero() {
  const society = getSociety();
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % carouselImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentIdx((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const nextSlide = () => {
    setCurrentIdx((prev) => (prev + 1) % carouselImages.length);
  };

  return (
    <section className="relative min-h-[85vh] w-full overflow-hidden bg-slate-950 text-white flex items-center py-16 lg:py-24">
      {carouselImages.map((img, index) => (
        <div
          key={img.url}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIdx ? 'opacity-100 z-0' : 'opacity-0 -z-10'
          }`}
        >
          <img
            src={img.url}
            alt={img.alt}
            className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${
              index === currentIdx ? 'scale-105' : 'scale-100'
            }`}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/60" />
        </div>
      ))}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-semibold text-cyan-300 shadow-sm backdrop-blur-md">
            <Sparkles size={14} className="animate-pulse text-cyan-400" />
            Modern Residential Governance Platform
          </div>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-[3.8rem]">
            A better digital front door
            <span className="mt-1 block bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
              for {society?.name || 'Clifton Heights Society'}.
            </span>
          </h1>

          <p className="mt-6 text-base leading-7 text-slate-300 sm:text-lg">
            Transforming society operations into an effortless digital journey. Instant gate check-ins, transparent digital billing, and streamlined management for everyone.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1 hover:shadow-cyan-500/40"
            >
              Explore & Sign in
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <a
              href="#gallery"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/30 hover:bg-white/20"
            >
              <PlayCircle size={16} className="text-cyan-400" />
              Watch Showcase
            </a>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              { label: 'Resident Portal', value: 'Bills, QR Passes, Complaints' },
              { label: 'Guard Workflow', value: 'Instant Gate Verification' },
              { label: 'Admin Desk', value: 'Financials & Announcements' },
            ].map((item) => (
              <div
                key={item.label}
                className="group rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/90"
              >
                <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-400">{item.label}</p>
                <p className="mt-1.5 text-xs font-medium text-slate-300">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
        <button
          onClick={prevSlide}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-900/80 text-white backdrop-blur-md transition-all hover:bg-cyan-500 hover:text-slate-950"
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex gap-1.5">
          {carouselImages.map((_, i) => (
            <span
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIdx ? 'w-6 bg-cyan-400' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
        <button
          onClick={nextSlide}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-900/80 text-white backdrop-blur-md transition-all hover:bg-cyan-500 hover:text-slate-950"
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </section>
  );
}

function StatsBar() {
  const { ref, inView } = useInView();
  const residents = useCountUp(120, 1200, inView);
  const services = useCountUp(6, 1200, inView);
  const roles = useCountUp(3, 1200, inView);
  const paperless = useCountUp(90, 1200, inView);

  const items = useMemo(
    () => [
      { value: `${residents}+`, label: 'Active Residences Managed' },
      { value: `${services}`, label: 'Core Operations Modules' },
      { value: `${roles}`, label: 'Custom Role Interfaces' },
      { value: `${paperless}%`, label: 'Manual Paperwork Reduced' },
    ],
    [paperless, residents, roles, services]
  );

  return (
    <section id="overview" ref={ref} className="border-y border-slate-200 bg-slate-50 py-10">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5"
          >
            <p className="text-3xl font-extrabold text-slate-900 transition-colors duration-300 group-hover:text-cyan-600">
              {item.value}
            </p>
            <p className="mt-1 text-sm font-medium text-slate-600">{item.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function SocietyOverview() {
  const society = getSociety();

  return (
    <section className="bg-white py-20">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">About Smart Governance</span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Engineered for real community workflows, not generic templates
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            SmartSociety bridges the gap between residents, security personnel, and administrative teams—ensuring smooth daily routines, total payment transparency, and tight gate control.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: society?.name || 'Smart Community',
                desc: 'A unified platform for gate clearance, notices, and financial accounting.',
              },
              {
                title: society?.address || 'Clifton, Karachi',
                desc: 'Localized workflows suited for residential societies and commercial complexes.',
              },
              {
                title: 'Transparent Operations',
                desc: 'Real-time billing status, clear issue logs, and instant digital gate passes.',
              },
              {
                title: 'High Security',
                desc: 'Encrypted passcode verification and entry logs for guard gate checks.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 transition-all duration-300 hover:border-slate-300 hover:bg-white hover:shadow-md"
              >
                <p className="text-base font-semibold text-slate-900">{item.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2.5rem] border border-slate-900/10 bg-slate-950 p-4 shadow-2xl shadow-slate-900/20">
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="overflow-hidden rounded-[1.75rem] border border-white/10">
              <img
                src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&q=80&w=800"
                alt="Modern Residential Building"
                className="h-full min-h-[320px] w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="flex flex-col justify-between gap-3">
              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Core Commitment</p>
                <p className="mt-2 text-base font-semibold text-white">
                  One platform for billing, visitors, maintenance, and voting.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-cyan-500/20 bg-cyan-500/10 p-5 backdrop-blur-md">
                <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-300">Modern Living</p>
                <p className="mt-2 text-xs leading-5 text-slate-200">
                  Elevates resident satisfaction while saving management staff dozens of administrative hours.
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 backdrop-blur-md">
                <div className="flex items-center gap-2 text-white">
                  <Phone size={16} className="text-cyan-400" />
                  <p className="text-sm font-semibold">Mobile First Experience</p>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  Optimized for fast mobile entry by guards and residents on the go.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeatureGroups() {
  return (
    <section id="features" className="bg-slate-900 py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Platform Modules</span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            Tailored capabilities for every role in the society
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Intuitively organized modules designed to remove friction from daily community operations.
          </p>
        </div>

        <div className="mt-12 space-y-8">
          {featureGroups.map((group) => (
            <div
              key={group.title}
              className="grid gap-8 rounded-[2.5rem] border border-white/10 bg-slate-950/60 p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/20 lg:grid-cols-[0.8fr_1.2fr]"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">{group.eyebrow}</span>
                <h3 className="mt-3 text-2xl font-bold text-white">{group.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{group.desc}</p>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {group.items.map((item) => (
                  <div
                    key={item.title}
                    className="group rounded-2xl border border-white/10 bg-slate-900 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:bg-slate-850"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110">
                      <item.icon size={20} />
                    </div>
                    <h4 className="mt-4 text-base font-semibold text-white">{item.title}</h4>
                    <p className="mt-1.5 text-xs leading-5 text-slate-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoleExperience() {
  const [active, setActive] = useState(0);
  const tab = roleTabs[active];

  return (
    <section id="experience" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">Role-Based Dashboards</span>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              One platform, three tailored experiences
            </h2>
            <p className="mt-3 text-base text-slate-600">
              Each user group sees only what matters to them—creating a fast, uncluttered user interface.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            {roleTabs.map((role, index) => (
              <button
                key={role.key}
                onClick={() => setActive(index)}
                className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  active === index
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <role.icon size={16} />
                {role.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex flex-col justify-between rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-md">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20">
                  <tab.icon size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-600">Selected View</p>
                  <h3 className="text-xl font-bold text-slate-900">{tab.label} Portal</h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">{tab.summary}</p>

              <div className="mt-6 space-y-3">
                {tab.points.map((point) => (
                  <div key={point} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-cyan-600" />
                    <p className="text-xs font-medium text-slate-700">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            <Link
              to="/login"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-cyan-600"
            >
              Sign in as {tab.label}
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[2.5rem] border border-slate-900/10 bg-slate-950 p-6 shadow-2xl shadow-slate-900/20">
            <div className="flex items-center gap-2 border-b border-white/10 pb-4">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <div className="ml-3 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-slate-400">
                smartsociety.app/{tab.key}/dashboard
              </div>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-[200px_1fr]">
              <div className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2">
                  <Logo size={14} />
                  <div className="h-2 w-20 rounded-full bg-white/20" />
                </div>

                <div className="mt-5 space-y-2">
                  {['Dashboard', 'Visitors', 'Bills', 'Complaints', 'Settings'].map((item, idx) => (
                    <div
                      key={item}
                      className={`rounded-xl px-3 py-2 text-xs font-medium ${
                        idx === 0 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  {tab.metrics.map((metric) => (
                    <div key={metric.label} className="rounded-2xl border border-white/10 bg-slate-900 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{metric.label}</p>
                      <p className="mt-2 text-xl font-bold text-white">{metric.value}</p>
                    </div>
                  ))}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{tab.label} Main Action Center</p>
                    <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-[10px] font-bold text-cyan-700">
                      Live Operations
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {tab.points.map((point, idx) => (
                      <div key={point} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">Step 0{idx + 1}</p>
                        <p className="mt-1 text-xs font-medium text-slate-700">{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisitorFlow() {
  const steps = [
    {
      title: 'Resident Creates Pass',
      text: 'Resident fills visitor details in seconds and generates a digital gate pass.',
    },
    {
      title: 'Share QR or Passcode',
      text: 'Passcode or QR is shared directly with the visitor via WhatsApp or SMS.',
    },
    {
      title: 'Guard Scans at Gate',
      text: 'Security guard verifies entry instantly using a tablet or mobile screen.',
    },
    {
      title: 'Entry Logged & Saved',
      text: 'Time-stamped log is recorded with automatic arrival alert to the resident.',
    },
  ];

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">Frictionless Security</span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            From digital pass generation to gate check-in
          </h2>
          <p className="mt-3 text-base text-slate-600">
            A 4-step secure workflow that keeps your community safe while saving time at the main gate.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="group relative rounded-[2rem] border border-slate-200 bg-slate-50/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:bg-white hover:shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 transition-transform duration-300 group-hover:scale-110">
                  {index === 0 && <Users size={22} />}
                  {index === 1 && <QrCode size={22} />}
                  {index === 2 && <ShieldCheck size={22} />}
                  {index === 3 && <CheckCircle2 size={22} />}
                </div>
                <span className="text-3xl font-extrabold text-slate-200 transition-colors duration-300 group-hover:text-cyan-500/30">
                  0{index + 1}
                </span>
              </div>
              <h3 className="mt-6 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function MediaGallery() {
  return (
    <section id="gallery" className="bg-slate-950 py-20 text-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Media Showcase</span>
            <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">
              Visual proof of community excellence
            </h2>
            <p className="mt-3 text-base text-slate-400">
              High quality infrastructure meets intelligent software governance.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-slate-300 backdrop-blur-md">
            <Camera size={15} className="text-cyan-400" />
            Society Gallery Highlights
          </div>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="group overflow-hidden rounded-[2.5rem] border border-white/15 bg-slate-900/80 transition-all duration-300 hover:border-cyan-500/40">
            <div className="overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800"
                alt="Society Overview"
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-6">
              <p className="text-base font-bold text-white">Smart Infrastructure</p>
              <p className="mt-1.5 text-xs leading-5 text-slate-400">
                24/7 monitored gate access, integrated visitor verification, and surveillance.
              </p>
            </div>
          </div>

          {galleryItems.slice(0, 2).map((item) => (
            <div
              key={item.title}
              className="group overflow-hidden rounded-[2.5rem] border border-white/15 bg-slate-900/80 transition-all duration-300 hover:border-cyan-500/40"
            >
              <div className="overflow-hidden">
                <img
                  src={item.src}
                  alt={item.title}
                  className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="p-6">
                <p className="text-base font-bold text-white">{item.title}</p>
                <p className="mt-1.5 text-xs leading-5 text-slate-400">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-cyan-600">Community Feedback</span>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">Trusted by residents and admin staff</h2>
          <p className="mt-3 text-base text-slate-600">
            Here is how SmartSociety is improving daily life in residential communities.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <div
              key={item.name}
              className="group flex flex-col justify-between rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-xl"
            >
              <div>
                <Quote size={28} className="text-cyan-500" />
                <p className="mt-4 text-xs leading-6 text-slate-600">"{item.text}"</p>
              </div>

              <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-xs font-bold text-white shadow-md shadow-cyan-500/20">
                  {item.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{item.name}</p>
                  <p className="text-[11px] text-slate-500">{item.role}</p>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Star key={idx} size={12} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  const society = getSociety();

  return (
    <section className="bg-slate-950 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-gradient-to-r from-cyan-600 to-blue-700 p-8 shadow-2xl shadow-cyan-500/20 lg:p-12">
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-200">Get Started Today</span>
              <h2 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
                Ready to transform {society?.name || 'your society'}?
              </h2>
              <p className="mt-3 max-w-2xl text-xs leading-6 text-cyan-100">
                Experience smooth entry management, integrated billing, and complete control over community operations.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition-all duration-300 hover:bg-slate-100 hover:scale-105"
              >
                Sign In Now
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const society = getSociety();

  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 lg:flex-row lg:items-center lg:justify-between">
        <LogoWordmark size={32} subText={society?.address || 'Clifton, Karachi'} />

        <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-600">
          <a href="#overview" className="transition-colors hover:text-cyan-600">
            Overview
          </a>
          <a href="#features" className="transition-colors hover:text-cyan-600">
            Modules
          </a>
          <a href="#experience" className="transition-colors hover:text-cyan-600">
            Experience
          </a>
          <a href="#gallery" className="transition-colors hover:text-cyan-600">
            Media
          </a>
          <Link to="/login" className="transition-colors hover:text-cyan-600">
            Sign in
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-6 max-w-7xl border-t border-slate-100 px-6 pt-6 text-center text-xs text-slate-400">
        © 2026 SmartSociety · {society?.name || 'Clifton Heights Society'}. All rights reserved.
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-cyan-500 selection:text-white">
      <Nav />
      <Hero />
      <StatsBar />
      <SocietyOverview />
      <FeatureGroups />
      <RoleExperience />
      <VisitorFlow />
      <MediaGallery />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  );
}