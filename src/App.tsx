'use client';

import { useState, useCallback, useEffect, Component, type ReactNode } from 'react';
import { useWasmCalculator } from '@hooks/useCalculator';
import { useTheme } from '@hooks/useTheme';
import { useHistory } from '@hooks/useHistory';
import { Display } from '@components/Display';
import { getI18nPack } from '@i18n/index';
import type { Language } from '@i18n/types';
import { registerPlugin, getPlugin } from '@plugins/registry';
import { createStandardPlugin } from '@plugins/Standard/index';
import { createScientificPlugin } from '@plugins/Scientific/index';
import { createProgrammerPlugin } from '@plugins/Programmer/index';
import { createDateCalculationPlugin } from '@plugins/DateCalculation/index';
import { MenuIcon } from '@components/icons/Menu';
import { MoonIcon } from '@components/icons/Moon';
import { SunIcon } from '@components/icons/Sun';

// ============================================
// 错误边界
// ============================================
class ErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, _info: any) {
    console.error('[ErrorBoundary]', error, _info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="calc-loading calc-loading--error">
          <div className="calc-loading__inner">
            <div className="calc-loading__icon">⚠</div>
            <h3>渲染异常</h3>
            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>{this.state.error?.message}</p>
            <button className="calc-retry-btn" onClick={() => window.location.reload()} type="button">刷新页面</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function LoadingState({ message }: { message: string }) {
  return (
    <div className="calc-loading">
      <div className="calc-loading__inner">
        <div className="calc-loading__spinner" />
        <p>{message}</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="calc-loading calc-loading--error">
      <div className="calc-loading__inner">
        <div className="calc-loading__icon">⚠</div>
        <h3>加载失败</h3>
        <p>{message}</p>
        <button className="calc-retry-btn" onClick={() => window.location.reload()} type="button">重新加载</button>
      </div>
    </div>
  );
}

// ============================================
// 主应用
// ============================================
function CalculatorApp() {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState<Language>('zh-CN');
  const i18n = getI18nPack(lang);
  const [activeMode, setActiveMode] = useState('standard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const calc = useWasmCalculator();
  const history = useHistory();

  useEffect(() => {
    registerPlugin(createStandardPlugin({
      onDigit: calc.inputDigit,
      onOperator: calc.inputOperator,
      onEquals: calc.evaluate,
      onClear: calc.clear,
      onBackspace: calc.backspace,
      onNegate: calc.negate,
      onPercent: calc.percent,
    }));
    registerPlugin(createScientificPlugin({
      onClear: calc.clear,
      onBackspace: calc.backspace,
    }));
    registerPlugin(createProgrammerPlugin());
    registerPlugin(createDateCalculationPlugin());
  }, [calc.inputDigit, calc.inputOperator, calc.evaluate, calc.clear, calc.backspace, calc.negate, calc.percent]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') { calc.inputDigit(e.key); return; }
    switch (e.key) {
      case '.': case ',': calc.inputDigit('.'); break;
      case '+': calc.inputOperator('add'); break;
      case '-': calc.inputOperator('subtract'); break;
      case '*': calc.inputOperator('multiply'); break;
      case '/': e.preventDefault(); calc.inputOperator('divide'); break;
      case 'Enter': case '=': e.preventDefault(); calc.evaluate(); break;
      case 'Backspace': calc.backspace(); break;
      case 'Escape': case 'c': case 'C': calc.clear(); break;
      case '%': calc.percent(); break;
    }
  }, [calc]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (calc.loading) return <LoadingState message="正在加载计算引擎..." />;
  if (calc.error) return <ErrorState message={calc.error} />;

  const currentPlugin = getPlugin(activeMode);
  const rendered = currentPlugin?.render(i18n, theme);

  const modes = [
    { id: 'standard', label: i18n.modes.standard, disabled: false },
    { id: 'scientific', label: i18n.modes.scientific, disabled: false },
    { id: 'programmer', label: i18n.modes.programmer, disabled: false },
    { id: 'date-calculation', label: i18n.modes.dateCalculation, disabled: false },
  ];

  const activeModeLabel = modes.find(m => m.id === activeMode)?.label ?? '';

  return (
    <div className="calc-app">
      <div className={`calc-shell ${sidebarOpen ? 'calc-shell--sidebar-open' : ''}`}>
        {/* 侧边栏（窗口内滑出） */}
        <aside className={`calc-sidebar ${sidebarOpen ? 'calc-sidebar--open' : ''}`}>
          <div className="calc-sidebar__header">
            <span>{i18n.app.title}</span>
          </div>
          <nav className="calc-sidebar__nav">
            {modes.map(m => (
              <button
                key={m.id}
                className={`calc-sidebar__item ${m.id === activeMode ? 'calc-sidebar__item--active' : ''}`}
                disabled={m.disabled}
                onClick={() => { if (!m.disabled) { setActiveMode(m.id); setSidebarOpen(false); } }}
                type="button"
              >
              <span>{m.label}</span>
              <span className="calc-sidebar__badge">
                {m.disabled ? '即将推出' : ''}
              </span>
              </button>
            ))}
          </nav>
          <div className="calc-sidebar__divider" />
          <div className="calc-sidebar__lang">
            <span>语言 / Language</span>
            <select
              value={lang}
              onChange={e => setLang(e.target.value as Language)}
            >
              <option value="zh-CN">简体中文</option>
              <option value="zh-TW">繁體中文</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* 历史记录 */}
          <div className="calc-sidebar__divider" />
          <div className="calc-sidebar__history">
            <button className="calc-sidebar__history-toggle" onClick={() => setHistoryOpen(v => !v)} type="button">
              历史记录 ({history.entries.length})
            </button>
            {historyOpen && (
              <div className="calc-sidebar__history-list">
                {history.entries.length === 0 && <p className="calc-sidebar__history-empty">暂无记录</p>}
                {history.entries.map(e => (
                  <div key={e.id} className="calc-sidebar__history-item">
                    <div className="calc-sidebar__history-body" onClick={() => {/* TODO: redo */}}>
                      <span className="calc-sidebar__history-expr">{e.expression || '='}</span>
                      <span className="calc-sidebar__history-result">{e.result}</span>
                    </div>
                    <button className="calc-sidebar__history-del" onClick={() => history.removeEntry(e.id)} type="button">×</button>
                  </div>
                ))}
                {history.entries.length > 0 && (
                  <button className="calc-sidebar__history-clear" onClick={history.clearAll} type="button">清空全部</button>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* 主计算器面板 */}
        <div className="calc-main">
          <div className="calc-topbar">
            <button className="calc-hamburger" onClick={() => setSidebarOpen(v => !v)} type="button" aria-label="切换菜单">
              <MenuIcon width={18} height={18} />
            </button>
            <span className="calc-topbar__mode">{activeModeLabel}</span>
            <div className="calc-topbar__actions">
              <button className="calc-icon-btn" onClick={toggleTheme} type="button" aria-label="切换主题">
                {theme === 'light' ? <MoonIcon width={16} height={16} /> : <SunIcon width={16} height={16} />}
              </button>
            </div>
          </div>

          <Display expression={calc.expression} display={calc.display} hasError={calc.hasError} i18n={i18n} />

          {rendered?.buttons ?? <div style={{ color: 'var(--text-dim)', padding: 20 }}>加载中...</div>}
        </div>
      </div>
    </div>
  );
}

// ============================================
// 根组件
// ============================================
export function App() {
  return (
    <ErrorBoundary>
      <CalculatorApp />
    </ErrorBoundary>
  );
}
