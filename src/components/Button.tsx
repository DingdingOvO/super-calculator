'use client';

import { useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'number' | 'operator' | 'function' | 'equals';
  'aria-label'?: string;
}

export function CalcButton({
  children,
  onClick,
  className = '',
  variant = 'number',
  'aria-label': ariaLabel,
}: ButtonProps) {
  return (
    <button
      className={`calc-btn calc-btn--${variant} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      type="button"
    >
      {children}
    </button>
  );
}

interface ButtonGridProps {
  children: ReactNode;
}

export function ButtonGrid({ children }: ButtonGridProps) {
  return <div className="calc-button-grid">{children}</div>;
}
