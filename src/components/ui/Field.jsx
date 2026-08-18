import clsx from 'clsx';

export function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-ink-700">
      {children}
    </label>
  );
}

const fieldClass =
  'w-full rounded-md border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function Input({ className, ...props }) {
  return <input className={clsx(fieldClass, className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={clsx(fieldClass, 'min-h-24 resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={clsx(fieldClass, className)} {...props}>
      {children}
    </select>
  );
}

export function FormRow({ label, children, hint, error }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
