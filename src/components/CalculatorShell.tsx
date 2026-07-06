'use client';

import type { I18nPack } from '@i18n/types';
import { SunIcon } from './icons/Sun';
import { MoonIcon } from './icons/Moon';
import { CalculatorIcon } from './icons/Calculator';

interface CalculatorShellProps {
  title: string;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  modeTabs: Array<{
    id: string;
    label: string;
    active: boolean;
    disabled: boolean;
    onClick: () => void;
  }>;
  i18n: I18nPack;
  display: React.ReactNode;
  buttons: React.ReactNode;
}

export function CalculatorShell({
  title,
  theme,
  onToggleTheme,
  modeTabs,
  display,
  buttons,
}: CalculatorShellProps) {
  return (
    <div className="calc-shell">
      {/* 标题栏 */}
      <div className="calc-header">
        <div className="calc-title">
          <CalculatorIcon width={16} height={16} aria-hidden="true" />
          <span>{title}</span>
        </div>
        <button
          className="calc-theme-toggle"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          type="button"
        >
          {theme === 'light' ? <MoonIcon width={16} height={16} /> : <SunIcon width={16} height={16} />}
        </button>
      </div>

      {/* 模式切换标签页 */}
      <div className="calc-mode-tabs" role="tablist">
        {modeTabs.map(tab => (
          <button
            key={tab.id}
            className={`calc-mode-tab ${tab.active ? 'calc-mode-tab--active' : ''}`}
            onClick={tab.onClick}
            disabled={tab.disabled}
            role="tab"
            aria-selected={tab.active}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 显示屏 */}
      {display}

      {/* 按钮区 */}
      {buttons}
    </div>
  );
}
