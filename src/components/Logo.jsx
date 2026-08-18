// Custom logo mark — a stylized building block with a gate/keyhole cutout.
// Not using lucide's Building icon anywhere on the public site anymore.

export function Logo({ size = 36, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Rounded building block */}
      <rect x="6" y="4" width="36" height="40" rx="6" fill="#1c5751" />
      {/* Windows pattern */}
      <rect x="12" y="10" width="7" height="7" rx="1.5" fill="#47a396" />
      <rect x="22" y="10" width="7" height="7" rx="1.5" fill="#47a396" />
      <rect x="32" y="10" width="4" height="7" rx="1.5" fill="#47a396" />
      <rect x="12" y="21" width="7" height="7" rx="1.5" fill="#47a396" />
      <rect x="22" y="21" width="7" height="7" rx="1.5" fill="#47a396" />
      <rect x="32" y="21" width="4" height="7" rx="1.5" fill="#47a396" />
      {/* Gate / keyhole at the bottom center */}
      <path
        d="M20 32 h8 v6 a4 4 0 0 1 -8 0 z"
        fill="#1c5751"
        stroke="#eef7f6"
        strokeWidth="1.5"
      />
      <circle cx="24" cy="36" r="1.8" fill="#eef7f6" />
    </svg>
  );
}

// Wordmark version — logo + text
export function LogoWordmark({ size = 36, textClass = 'text-base font-semibold text-ink-900', subText = null, subTextClass = 'text-[11px] text-ink-500' }) {
  return (
    <div className="flex items-center gap-2.5">
      <Logo size={size} />
      <div className="leading-tight">
        <p className={textClass}>SmartSociety</p>
        {subText && <p className={subTextClass}>{subText}</p>}
      </div>
    </div>
  );
}
