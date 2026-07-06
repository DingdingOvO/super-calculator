import type { SVGProps } from 'react';

export const PercentIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="7" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="17" cy="17" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 16L16 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
