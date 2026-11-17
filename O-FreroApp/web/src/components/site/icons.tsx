const base = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
    </svg>
  );
}

export function BagIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M6 7h12l1 13H5L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}

export function MenuIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function UserIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className} aria-hidden>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}
