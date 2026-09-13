import type { ReactNode } from 'react';

const PATHS: Record<string, ReactNode> = {
  star: (
    <path d="M12 2l2.9 6.26 6.6.6-5 4.36 1.5 6.5L12 16.9 5.9 19.7l1.5-6.5-5-4.36 6.6-.6L12 2z" />
  ),
  book: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15zM4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5M8 7h8" />
  ),
  dumbbell: (
    <path d="M6.5 6.5L17.5 17.5M4 8l2-2 2 2M20 16l-2 2-2-2M8 12l-2 2-2-2M20 8l-2-2-2 2" />
  ),
  drop: (
    <path d="M12 2.7S5.5 9.5 5.5 14.2a6.5 6.5 0 0 0 13 0C18.5 9.5 12 2.7 12 2.7z" />
  ),
  heart: (
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06A5.5 5.5 0 0 0 3.16 12l1.06 1.06L12 20.78l7.78-7.72L20.84 12a5.5 5.5 0 0 0 0-7.39z" />
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  moon: (
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  ),
  apple: (
    <path d="M12 20.9c-1.7 1.5-3.7 1.9-5.6 1.6C4 18 3 14.4 3 10.9 3 6.9 5 4 8 4c1.4 0 2.6.6 3.4 1.6.3.4.8.4 1.1 0C13.3 4.6 14.6 4 16 4c3 0 5 2.9 5 6.9 0 3.6-1.1 7.1-3.5 11.7-1.8.2-3.7 0-5.5-1.7zM8.5 8.5c1.2-1.6 3.2-2.4 5.2-2.2" />
  ),
  run: (
    <path d="M13 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9.5 12.5L5 22M9.5 12.5l3-.5M9.5 12.5l-3.5-1.5M14 22l-2-5 2-3 2 1 3 3M12 12l2-3 4 1M8 7.5L12 5l3 2.5" />
  ),
  leaf: (
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10zM2 21c0-3 1.85-5.36 5.08-6" />
  ),
  pencil: (
    <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  ),
  monitor: (
    <>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  palette: (
    <path d="M12 2a10 10 0 1 0 0 20c1.2 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2H17a5 5 0 0 0 5-5c0-4.4-4.5-8.4-10-8.4zM7 12a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-4.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 3.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
  ),
  'no-smoking': (
    <path d="M18 12v3M22 12v6M2 12v6M2 18h20M18 12V9a3 3 0 0 0-3-3M6 12v3" />
  ),
  home: (
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10" />
  ),
  smile: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </>
  ),
  water: (
    <path d="M12 2.7S6 9 6 13.5a6 6 0 0 0 12 0C18 9 12 2.7 12 2.7z" />
  ),
  flower: (
    <path d="M12 3a3 3 0 0 1 3 3 3 3 0 0 1-3 3 3 3 0 0 1-3-3 3 3 0 0 1 3-3zM12 9v3M12 3V2M12 21v-3M12 15v3" />
  ),
  kids: (
    <path d="M4 7a3 3 0 0 1 3-3M20 7a3 3 0 0 0-3-3M4 7v4a3 3 0 0 0 6 0V7M20 7v4a3 3 0 0 1-6 0V7M4 12v4h16v-4M14 20a2 2 0 0 0-4 0M12 16v4" />
  ),
  music: (
    <path d="M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM21 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
  ),
  coin: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9 9.5c0 1 1.3 1.5 3 1.5s3-.5 3-1.5-1.3-1.5-3-1.5-3 .5-3 1.5z" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  tag: (
    <path d="M20.59 13.41L12 4.83A2 2 0 0 0 10.59 4H4a2 2 0 0 0-2 2v6.59a2 2 0 0 0 .59 1.41l8.59 8.59a2 2 0 0 0 2.82 0l6.5-6.5a2 2 0 0 0 .09-2.68zM7.5 9.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  ),
  flame: (
    <path d="M12 2.7s-1 1.3-1 3a4 4 0 0 0 .7 2.3C10.4 7 9.3 5.4 9.3 3.6 6.6 6 5 9.7 5 13a7 7 0 0 0 14 0c0-4-3-7-7-10.3z" />
  ),
  trophy: (
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 4H4v2a3 3 0 0 0 3 3M17 4h3v2a3 3 0 0 1-3 3" />
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  chart: (
    <path d="M3 3v18h18M8 17V9M13 17V5M18 17v-4" />
  ),
  user: (
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
  ),
  logout: (
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
  ),
  plus: (
    <path d="M12 5v14M5 12h14" />
  ),
  edit: (
    <path d="M17 3a2.83 2.83 0 0 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
  ),
  trash: (
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6" />
  ),
  archive: (
    <path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" />
  ),
  arrowLeft: (
    <path d="M19 12H5M12 19l-7-7 7-7" />
  ),
  arrowRight: (
    <path d="M5 12h14M12 5l7 7-7 7" />
  ),
  check: (
    <path d="M20 6L9 17l-5-5" />
  ),
  bell: (
    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
  ),
  mail: (
    <path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6" />
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </>
  ),
  sparkles: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 17l.8 2.2L22 20l-2.2.8L19 23l-.8-2.2L16 20l2.2-.8L19 17z" />
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  download: (
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  ),
  x: (
    <path d="M18 6L6 18M6 6l12 12" />
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  const content = PATHS[name] ?? PATHS.star;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}