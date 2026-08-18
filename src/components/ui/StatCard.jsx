import clsx from 'clsx';

export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint }) {
  const toneClass = {
    brand: 'bg-brand-50 text-brand-600',
    warning: 'bg-amber-50 text-amber-600',
    danger: 'bg-red-50 text-red-600',
    neutral: 'bg-ink-100 text-ink-600',
  }[tone];

  return (
    <div className="rounded-lg border border-ink-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{label}</p>
        {Icon && (
          <span className={clsx('flex h-8 w-8 items-center justify-center rounded-md', toneClass)}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
