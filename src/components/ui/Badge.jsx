import clsx from 'clsx';

const tones = {
  neutral: 'bg-ink-100 text-ink-600',
  brand: 'bg-brand-100 text-brand-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
};

const statusTone = {
  Paid: 'success',
  Confirmed: 'success',
  Resolved: 'success',
  Active: 'success',
  Unpaid: 'warning',
  Pending: 'warning',
  'In-Progress': 'brand',
  Overdue: 'danger',
  Used: 'neutral',
  Cancelled: 'neutral',
  Expired: 'neutral',
};

export default function Badge({ tone, children, className }) {
  const resolvedTone = tone || statusTone[children] || 'neutral';
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', tones[resolvedTone], className)}>
      {children}
    </span>
  );
}
