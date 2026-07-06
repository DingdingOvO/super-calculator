'use client';

import { useState, useCallback, useEffect } from 'react';
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

export function App() {
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
      {/* 语言切换 */}
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
