'use client';

import { useState, useCallback, useEffect, Component, type ReactNode } from 'react';
import { useWasmCalculator } from '@hooks/useCalculator';
import { useTheme } from '@hooks/useTheme';
import { CalculatorShell } from '@components/CalculatorShell';
import { Display } from '@components/Display';
import { getI18nPack } from '@i18n/index';
import type { Language } from '@i18n/types';
import { registerPlugin, getPlugin } from '@plugins/registry';
import { createStandardPlugin } from '@plugins/Standard/index';
import { createScientificPlaceholder } from '@plugins/Scientific/index';
import { createProgrammerPlaceholder } from '@plugins/Programmer/index';
import { createDateCalculationPlaceholder } from '@plugins/DateCalculation/index';

// ============================================
// 错误边界 - 捕获渲染异常
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
  componentDidCatch(error: Error, info: any) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: '#1a1a2e', color: '#ef5350', fontFamily: 'sans-serif', padding: 20
        }}>
          <h2>渲染异常</h2>
          <p style={{ marginTop: 8, color: '#aaa', fontSize: '0.85rem' }}>{this.state.error?.message}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 20, padding: '10px 24px', border: '1px solid rgba(239,83,80,0.3)',
              borderRadius: 8, background: 'transparent', color: '#ef5350', cursor: 'pointer'
            }}
          >刷新页面</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================
// 加载状态
// ============================================
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

// ============================================
// 错误状态
// ============================================
function ErrorState({ message }: { message: string }) {
  return (
    <div className="calc-loading calc-loading--error">
      <div className="calc-loading__inner">
        <div className="calc-loading__icon">⚠</div>
        <h3>加载失败</h3>
        <p>{message}</p>
        <button
          className="calc-retry-btn"
          onClick={() => window.location.reload()}
          type="button"
        >
          重新加载
        </button>
      </div>
    </div>
  );
}

// ============================================
// 主应用组件
// ============================================
function CalculatorApp() {
  const { theme, toggleTheme } = useTheme();
  const [lang, setLang] = useState<Language>('zh-CN');
  const i18n = getI18nPack(lang);
  const [activeMode, setActiveMode] = useState('standard');

  const calc = useWasmCalculator();

  // 注册所有插件
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
    registerPlugin(createScientificPlaceholder());
    registerPlugin(createProgrammerPlaceholder());
    registerPlugin(createDateCalculationPlaceholder());
  }, [calc.inputDigit, calc.inputOperator, calc.evaluate, calc.clear, calc.backspace, calc.negate, calc.percent]);

  // 键盘映射
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key >= '0' && e.key <= '9') {
      calc.inputDigit(e.key);
      return;
    }
    switch (e.key) {
      case '.':
      case ',':
        calc.inputDigit('.');
        break;
      case '+':
        calc.inputOperator('add');
        break;
      case '-':
        calc.inputOperator('subtract');
        break;
      case '*':
        calc.inputOperator('multiply');
        break;
      case '/':
        e.preventDefault();
        calc.inputOperator('divide');
        break;
      case 'Enter':
      case '=':
        e.preventDefault();
        calc.evaluate();
        break;
      case 'Backspace':
        calc.backspace();
        break;
      case 'Escape':
      case 'c':
      case 'C':
        calc.clear();
        break;
      case '%':
        calc.percent();
        break;
    }
  }, [calc]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // 切换语言
  const cycleLang = useCallback(() => {
    setLang(prev => {
      const langs: Language[] = ['zh-CN', 'zh-TW', 'en'];
      const idx = langs.indexOf(prev);
      return langs[(idx + 1) % langs.length]!;
    });
  }, []);

  // 加载中
  if (calc.loading) {
    return <LoadingState message="正在加载计算引擎..." />;
  }

  // 加载出错
  if (calc.error) {
    return <ErrorState message={calc.error} />;
  }

  // 从插件系统获取当前模式渲染
  const currentPlugin = getPlugin(activeMode);
  const rendered = currentPlugin?.render(i18n, theme);

  const modeTabs = [
    { id: 'standard', label: i18n.modes.standard, active: activeMode === 'standard', disabled: false, onClick: () => setActiveMode('standard') },
    { id: 'scientific', label: i18n.modes.scientific, active: activeMode === 'scientific', disabled: true, onClick: () => {} },
    { id: 'programmer', label: i18n.modes.programmer, active: activeMode === 'programmer', disabled: true, onClick: () => {} },
    { id: 'date-calculation', label: i18n.modes.dateCalculation, active: activeMode === 'date-calculation', disabled: true, onClick: () => {} },
  ];

  return (
    <div className="calc-app">
      <button className="calc-lang-toggle" onClick={cycleLang} type="button">
        {lang === 'zh-CN' ? '简体' : lang === 'zh-TW' ? '繁体' : 'EN'}
      </button>

      <CalculatorShell
        title={i18n.app.title}
        theme={theme}
        onToggleTheme={toggleTheme}
        modeTabs={modeTabs}
        i18n={i18n}
        display={
          <Display
            expression={calc.expression}
            display={calc.display}
            hasError={calc.hasError}
            i18n={i18n}
          />
        }
        buttons={rendered?.buttons ?? <div>Loading...</div>}
      />
    </div>
  );
}

// ============================================
// 根组件（包裹错误边界）
// ============================================
export function App() {
  return (
    <ErrorBoundary>
      <CalculatorApp />
    </ErrorBoundary>
  );
}
