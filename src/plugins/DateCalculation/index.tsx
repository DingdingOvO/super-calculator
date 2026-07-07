'use client';

import { useState, useCallback } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

function DateCalc() {
  const [date1, setDate1] = useState('2026-01-01');
  const [date2, setDate2] = useState(new Date().toISOString().slice(0, 10));
  const [diffResult, setDiffResult] = useState('');

  const [dateOp, setDateOp] = useState('2026-01-01');
  const [addYears, setAddYears] = useState('0');
  const [addMonths, setAddMonths] = useState('0');
  const [addDays, setAddDays] = useState('0');
  const [addResult, setAddResult] = useState('');

  const calcDiff = useCallback(() => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      setDiffResult('无效日期');
      return;
    }
    const diffMs = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.floor(diffMs / 86400000);
    const y1 = d1.getFullYear(), m1 = d1.getMonth(), dd1 = d1.getDate();
    const y2 = d2.getFullYear(), m2 = d2.getMonth(), dd2 = d2.getDate();
    let years = Math.abs(y2 - y1);
    let months = Math.abs((y2 * 12 + m2) - (y1 * 12 + m1));
    if (dd2 < dd1) months--;
    if (months < 0) { years--; months += 12; }
    const extraDays = Math.abs(dd2 - dd1);
    setDiffResult(`${diffDays} 天（约 ${years} 年 ${months} 月 ${extraDays} 天）`);
  }, [date1, date2]);

  const calcAdd = useCallback(() => {
    const d = new Date(dateOp);
    if (isNaN(d.getTime())) { setAddResult('无效日期'); return; }
    const y = parseInt(addYears) || 0;
    const m = parseInt(addMonths) || 0;
    const dy = parseInt(addDays) || 0;
    d.setFullYear(d.getFullYear() + y);
    d.setMonth(d.getMonth() + m);
    d.setDate(d.getDate() + dy);
    setAddResult(d.toISOString().slice(0, 10));
  }, [dateOp, addYears, addMonths, addDays]);

  return (
    <div className="date-panel">
      {/* 日期差 */}
      <div className="date-section">
        <h4 className="date-section__title">日期差计算</h4>
        <label className="date-field">
          <span>起始日期</span>
          <input type="date" value={date1} onChange={e => setDate1(e.target.value)} />
        </label>
        <label className="date-field">
          <span>结束日期</span>
          <input type="date" value={date2} onChange={e => setDate2(e.target.value)} />
        </label>
        <button className="date-calc-btn" onClick={calcDiff} type="button">计算</button>
        {diffResult && <div className="date-result">{diffResult}</div>}
      </div>

      <div className="date-divider" />

      {/* 日期加减 */}
      <div className="date-section">
        <h4 className="date-section__title">日期加减</h4>
        <label className="date-field">
          <span>基准日期</span>
          <input type="date" value={dateOp} onChange={e => setDateOp(e.target.value)} />
        </label>
        <div className="date-add-fields">
          <input type="number" placeholder="年" value={addYears} onChange={e => setAddYears(e.target.value)} />
          <input type="number" placeholder="月" value={addMonths} onChange={e => setAddMonths(e.target.value)} />
          <input type="number" placeholder="日" value={addDays} onChange={e => setAddDays(e.target.value)} />
        </div>
        <button className="date-calc-btn" onClick={calcAdd} type="button">计算</button>
        {addResult && <div className="date-result">{addResult}</div>}
      </div>
    </div>
  );
}

export function createDateCalculationPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'date-calculation', name: '日期计算', icon: null, enabled: true },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <DateCalc />,
    }),
  };
}
