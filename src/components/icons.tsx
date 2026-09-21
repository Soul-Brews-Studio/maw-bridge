// Drawn at a single 1.5px stroke on a 24px grid, so they sit at one weight
// beside the board's lettering instead of arriving from three icon sets.

const base = {
  width: 16, height: 16, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.5,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

export const IconLink = (props: { className?: string }) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M9 15 15 9" />
    <path d="M11 6.5 12.6 5a4.3 4.3 0 0 1 6.1 6.1l-1.6 1.6" />
    <path d="M13 17.5 11.4 19a4.3 4.3 0 0 1-6.1-6.1l1.6-1.6" />
  </svg>
);

export const IconBolt = (props: { className?: string }) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M13 3 5.5 13.2h5L11 21l7.5-10.2h-5z" />
  </svg>
);

export const IconSend = (props: { className?: string }) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M20.5 3.5 10.8 13.2" />
    <path d="M20.5 3.5 14.3 20.5l-3.5-7.3-7.3-3.5z" />
  </svg>
);

export const IconKey = (props: { className?: string }) => (
  <svg {...base} {...props} aria-hidden="true">
    <circle cx="8" cy="12" r="3.5" />
    <path d="M11.5 12H21" />
    <path d="M17.5 12v3" />
    <path d="M20.5 12v2" />
  </svg>
);

export const IconClose = (props: { className?: string }) => (
  <svg {...base} {...props} aria-hidden="true">
    <path d="M6 6 18 18" />
    <path d="M18 6 6 18" />
  </svg>
);
