'use client';

import { useState, useCallback } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

function DateCalc() {
  const [diffStart, setDiffStart] = useState('2026-01-01');
  const [diffEnd, setDiffEnd] = useState(new Date().toISOString().slice(0, 10));
  const [diffOut, setDiffOut] = useState('');

  const [addBase, setAddBase] = useState(new Date().toISOString().slice(0, 10));
  const [addY, setAddY] = useState('0');
  const [addM, setAddM] = useState('0');
  const [addD, setAddD] = useState('0');
  const [addOut, setAddOut] = useState('');

  const doDiff = useCallback(() => {
    const d1 = new Date(diffStart);
    const d2 = new Date(diffEnd);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) { setDiffOut('无效日期'); return; }
    const ms = Math.abs(d2.getTime() - d1.getTime());
    const days = Math.floor(ms / 86400000);
    let y = Math.abs(d2.getFullYear() - d1.getFullYear());
    let m = Math.abs((d2.getFullYear() * 12 + d2.getMonth()) - (d1.getFullYear() * 12 + d1.getMonth()));
    if (d2.getDate() < d1.getDate()) {m--;}
    if (m < 0) { y--; m += 12; }
    setDiffOut(`${days} 天（${y} 年 ${m} 个月）`);
  }, [diffStart, diffEnd]);

  const doAdd = useCallback(() => {
    const d = new Date(addBase);
    if (isNaN(d.getTime())) { setAddOut('无效日期'); return; }
    d.setFullYear(d.getFullYear() + (parseInt(addY) || 0));
    d.setMonth(d.getMonth() + (parseInt(addM) || 0));
    d.setDate(d.getDate() + (parseInt(addD) || 0));
    setAddOut(d.toISOString().slice(0, 10));
  }, [addBase, addY, addM, addD]);

  return (
    <div className="date-panel">
      {/* ===== 日期差 ===== */}
      <div className="date-card">
        <div className="date-card__title">日期差</div>
        <div className="date-card__body">
          <label className="date-picker">
            <span>开始</span>
            <input type="date" value={diffStart} onChange={e => setDiffStart(e.target.value)} />
          </label>
          <label className="date-picker">
            <span>结束</span>
            <input type="date" value={diffEnd} onChange={e => setDiffEnd(e.target.value)} />
          </label>
          <div className="date-card__action">
            <button className="calc-btn calc-btn--equals date-go-btn" onClick={doDiff} type="button">计算</button>
          </div>
          {diffOut && <div className="date-card__result">{diffOut}</div>}
        </div>
      </div>

      {/* ===== 日期加减 ===== */}
      <div className="date-card">
        <div className="date-card__title">日期加减</div>
        <div className="date-card__body">
          <label className="date-picker">
            <span>基准</span>
            <input type="date" value={addBase} onChange={e => setAddBase(e.target.value)} />
          </label>
          <div className="date-num-row">
            <label><input type="number" value={addY} onChange={e => setAddY(e.target.value)} />年</label>
            <label><input type="number" value={addM} onChange={e => setAddM(e.target.value)} />月</label>
            <label><input type="number" value={addD} onChange={e => setAddD(e.target.value)} />日</label>
          </div>
          <div className="date-card__action">
            <button className="calc-btn calc-btn--equals date-go-btn" onClick={doAdd} type="button">计算</button>
          </div>
          {addOut && <div className="date-card__result">{addOut}</div>}
        </div>
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
