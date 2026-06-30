import { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...props,
});

export const IconHome = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9.5" />
  </svg>
);

export const IconHistory = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 6h16M4 12h16M4 18h10" />
  </svg>
);

export const IconChart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 19V5" />
    <path d="m4 15 4-4 3 3 6-7" />
    <path d="M20 20H4" />
  </svg>
);

export const IconCoach = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v2" />
    <rect x="5" y="7" width="14" height="11" rx="3" />
    <path d="M9 12h.01M15 12h.01" />
    <path d="M3 12v3M21 12v3" />
  </svg>
);

export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconDumbbell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m6.5 6.5 11 11" />
    <path d="M21 21l-1-1M3 3l1 1" />
    <path d="m18 22 4-4M2 6l4-4" />
    <path d="m7.5 10.5 2-2M14.5 13.5l-2 2" />
  </svg>
);

export const IconRun = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="14" cy="5" r="2" />
    <path d="m11 18-1-4 3-2 1 3 3 2" />
    <path d="m6 20 2-5 2-3" />
    <path d="M12 9 9 7 6 8" />
  </svg>
);

export const IconScale = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <path d="M8 14a4 4 0 0 1 8 0" />
    <path d="M12 14l2.5-2.5" />
  </svg>
);

export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const IconSparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="m6.5 6.5 2 2M15.5 15.5l2 2M17.5 6.5l-2 2M8.5 15.5l-2 2" />
  </svg>
);

export const IconFlame = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.5.5-2.5 1-3 .3 1 1 1.5 1.5 1.5C11 8 11 5 12 3Z" />
  </svg>
);

export const IconBandage = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" />
    <path d="M12 10v4M10 12h4" />
  </svg>
);

export const IconDots = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);
