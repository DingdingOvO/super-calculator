'use client';

import { useState, useCallback } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

// ─── 工具函数 ───────────────────────────────────────────────

function toDate(s: string) { const d = new Date(s); return isNaN(d.getTime()) ? null : d; }
function fmt(d: Date) { return d.toISOString().slice(0, 10); }
function today() { return fmt(new Date()); }
function isWorkday(d: Date) { const w = d.getDay(); return w > 0 && w < 6; }

const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '元旦', '02-14': '情人节', '03-08': '妇女节', '03-12': '植树节',
  '05-01': '劳动节', '06-01': '儿童节', '07-01': '建党节', '08-01': '建军节',
  '09-10': '教师节', '10-01': '国庆节', '12-25': '圣诞节',
};
const LUNAR_HOLIDAYS: [number, number, string][] = [
  [1, 1, '春节'], [1, 15, '元宵节'], [5, 5, '端午节'], [7, 7, '七夕节'],
  [8, 15, '中秋节'], [9, 9, '重阳节'], [12, 30, '除夕'],
];
const SOLAR_TERMS: [number, number, string][] = [
  [1, 6, '小寒'], [1, 20, '大寒'], [2, 4, '立春'], [2, 19, '雨水'],
  [3, 6, '惊蛰'], [3, 21, '春分'], [4, 5, '清明'], [4, 20, '谷雨'],
  [5, 6, '立夏'], [5, 21, '小满'], [6, 6, '芒种'], [6, 21, '夏至'],
  [7, 7, '小暑'], [7, 23, '大暑'], [8, 7, '立秋'], [8, 23, '处暑'],
  [9, 8, '白露'], [9, 23, '秋分'], [10, 8, '寒露'], [10, 23, '霜降'],
  [11, 7, '立冬'], [11, 22, '小雪'], [12, 7, '大雪'], [12, 22, '冬至'],
];

function getHoliday(m: number, d: number): string | null {
  const key = `${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  if (FIXED_HOLIDAYS[key]) return FIXED_HOLIDAYS[key];
  for (const [lm, ld, name] of LUNAR_HOLIDAYS) { if (lm === m + 1 && ld === d) return `(约)${name}`; }
  for (const [sm, sd, name] of SOLAR_TERMS) { if (sm === m + 1 && sd === d) return name; }
  return null;
}

function countWorkdays(d1: Date, d2: Date): number {
  let c = 0; const d = new Date(Math.min(d1.getTime(), d2.getTime()));
  const end = Math.max(d1.getTime(), d2.getTime());
  while (d.getTime() <= end) { if (isWorkday(d)) c++; d.setDate(d.getDate() + 1); }
  return c;
}

// ─── 迷你日历 ───────────────────────────────────────────────

function MiniCalendar({ year, month, selected, dow, onSelect }: {
  year: number; month: number; selected?: string; dow: string[]; onSelect?: (y: number, m: number, d: number) => void;
}) {
  const first = new Date(year, month, 1).getDay();
  const days = new Date(year, month + 1, 0).getDate();
  const rows: React.ReactNode[] = [];
  let cells: React.ReactNode[] = [];
  for (let i = 0; i < first; i++) cells.push(<td key={`e${i}`} className="mc-e" />);
  for (let d = 1; d <= days; d++) {
    const ds = fmt(new Date(year, month, d));
    const h = getHoliday(month, d);
    const isSel = selected === ds;
    cells.push(
      <td key={d}
        className={`mc-d ${h ? 'mc-d--h' : ''} ${isSel ? 'mc-d--sel' : ''}`}
        title={h || ''}
        onClick={() => onSelect?.(year, month, d)}
      >{d}</td>,
    );
    if ((first + d) % 7 === 0 || d === days) { rows.push(<tr key={d}>{cells}</tr>); cells = []; }
  }
  return (
    <table className="mc"><thead><tr>{dow.map(d => <th key={d} className="mc-h">{d}</th>)}</tr></thead><tbody>{rows}</tbody></table>
  );
}

// ─── 主组件 ─────────────────────────────────────────────────

type Mode = 'add' | 'diff' | 'range' | 'ts';

function DateCalc({ i18n }: { i18n: I18nPack }) {
  const [mode, setMode] = useState<Mode>('add');

  const [baseDate, setBaseDate] = useState(today);
  const [addY, setAddY] = useState('0'); const [addM, setAddM] = useState('0'); const [addD, setAddD] = useState('0');
  const [addResult, setAddResult] = useState('');

  const [diffA, setDiffA] = useState(today); const [diffB, setDiffB] = useState(today);
  const [diffResult, setDiffResult] = useState<Record<string, any> | null>(null);

  const [rangeA, setRangeA] = useState(today); const [rangeB, setRangeB] = useState(today);
  const [rangeList, setRangeList] = useState<string[]>([]);

  const [tsInput, setTsInput] = useState(''); const [tsOut, setTsOut] = useState('');

  // 日历联动：根据当前 mode 决定显示的日期和回调
  const [calendarTarget, setCalendarTarget] = useState<'base' | 'diffA' | 'diffB' | 'rangeA' | 'rangeB'>('base');

  const getCalendarDate = useCallback(() => {
    switch (calendarTarget) {
      case 'diffA': return diffA;
      case 'diffB': return diffB;
      case 'rangeA': return rangeA;
      case 'rangeB': return rangeB;
      default: return baseDate;
    }
  }, [calendarTarget, baseDate, diffA, diffB, rangeA, rangeB]);

  const onCalendarSelect = useCallback((y: number, m: number, d: number) => {
    const ds = fmt(new Date(y, m, d));
    switch (calendarTarget) {
      case 'diffA': setDiffA(ds); break;
      case 'diffB': setDiffB(ds); break;
      case 'rangeA': setRangeA(ds); break;
      case 'rangeB': setRangeB(ds); break;
      default: setBaseDate(ds); break;
    }
  }, [calendarTarget]);

  const doAdd = useCallback(() => {
    const d = toDate(baseDate); if (!d) { setAddResult('无效日期'); return; }
    const y = parseInt(addY) || 0, m = parseInt(addM) || 0, dy = parseInt(addD) || 0;
    d.setFullYear(d.getFullYear() + y); d.setMonth(d.getMonth() + m); d.setDate(d.getDate() + dy);
    setAddResult(fmt(d));
  }, [baseDate, addY, addM, addD]);

  const doDiff = useCallback(() => {
    const a = toDate(diffA), b = toDate(diffB);
    if (!a || !b) { setDiffResult(null); return; }
    const ms = Math.abs(b.getTime() - a.getTime());
    const totalDays = Math.floor(ms / 86400000);
    const totalWeeks = (totalDays / 7).toFixed(1);
    let y = Math.abs(b.getFullYear() - a.getFullYear());
    let m = Math.abs((b.getFullYear() * 12 + b.getMonth()) - (a.getFullYear() * 12 + a.getMonth()));
    if (b.getDate() < a.getDate()) m--;
    if (m < 0) { y--; m += 12; }
    setDiffResult({ totalDays, totalWeeks, yearDiff: y, monthDiff: m, workdays: countWorkdays(a, b) });
  }, [diffA, diffB]);

  const doRange = useCallback(() => {
    const a = toDate(rangeA), b = toDate(rangeB);
    if (!a || !b) { setRangeList([]); return; }
    const list: string[] = []; const d = new Date(Math.min(a.getTime(), b.getTime()));
    const end = Math.max(a.getTime(), b.getTime());
    while (d.getTime() <= end) {
      const h = getHoliday(d.getMonth(), d.getDate());
      list.push(fmt(d) + ' ' + i18n.dateCalc.dow[d.getDay()] + (h ? ' 🎌' + h : ''));
      d.setDate(d.getDate() + 1);
    }
    setRangeList(list);
  }, [rangeA, rangeB, i18n]);

  const doTs = useCallback(() => {
    const v = tsInput.trim();
    if (/^\d+$/.test(v)) { const d = new Date(parseInt(v) * 1000); setTsOut(isNaN(d.getTime()) ? i18n.dateCalc.invalid : fmt(d)); }
    else { const d = toDate(v); setTsOut(d ? String(Math.floor(d.getTime() / 1000)) : i18n.dateCalc.invalid); }
  }, [tsInput, i18n]);

  const calDate = toDate(getCalendarDate());
  const calY = calDate ? calDate.getFullYear() : new Date().getFullYear();
  const calM = calDate ? calDate.getMonth() : new Date().getMonth();

  return (
    <div className="dc">
      <div className="dc-tabs">
        {([['add', i18n.dateCalc.tabAdd], ['diff', i18n.dateCalc.tabDiff], ['range', i18n.dateCalc.tabRange], ['ts', i18n.dateCalc.tabTs]] as [Mode, string][]).map(([k, label]) => (
          <button key={k} className={`dc-tab ${mode === k ? 'dc-tab--on' : ''}`} onClick={() => setMode(k)} type="button">{label}</button>
        ))}
      </div>

      {mode === 'add' && (
        <div className="dc-c">
          <label className="dc-fl"><span>{i18n.dateCalc.tabAdd}</span>
            <input type="date" value={baseDate} onChange={e => setBaseDate(e.target.value)} onFocus={() => setCalendarTarget('base')} />
            <button className="dc-td" onClick={() => setBaseDate(today())} type="button">{i18n.dateCalc.today}</button>
          </label>
          <div className="dc-nm">
            <label><input type="number" value={addY} onChange={e => setAddY(e.target.value)} />{i18n.dateCalc.year}</label>
            <label><input type="number" value={addM} onChange={e => setAddM(e.target.value)} />{i18n.dateCalc.month}</label>
            <label><input type="number" value={addD} onChange={e => setAddD(e.target.value)} />{i18n.dateCalc.day}</label>
          </div>
          <button className="dc-go" onClick={doAdd} type="button">{i18n.dateCalc.tabAdd}</button>
          {addResult && <div className="dc-rs">{addResult}</div>}
        </div>
      )}

      {mode === 'diff' && (
        <div className="dc-c">
          <label className="dc-fl"><span>{i18n.dateCalc.start}</span><input type="date" value={diffA} onChange={e => setDiffA(e.target.value)} onFocus={() => setCalendarTarget('diffA')} /></label>
          <label className="dc-fl"><span>{i18n.dateCalc.end}</span><input type="date" value={diffB} onChange={e => setDiffB(e.target.value)} onFocus={() => setCalendarTarget('diffB')} /></label>
          <button className="dc-go" onClick={doDiff} type="button">{i18n.dateCalc.tabDiff}</button>
          {diffResult && (
            <div className="dc-rb">
              <div className="dc-rl"><span>{i18n.dateCalc.totalDays}</span><b>{diffResult.totalDays}</b></div>
              <div className="dc-rl"><span>{i18n.dateCalc.totalWeeks}</span><b>{diffResult.totalWeeks}</b></div>
              <div className="dc-rl"><span>{i18n.dateCalc.totalMonths}</span><b>{diffResult.monthDiff}</b></div>
              <div className="dc-rl"><span>{i18n.dateCalc.totalYears}</span><b>{diffResult.yearDiff}</b></div>
              <div className="dc-rl"><span>{i18n.dateCalc.workdays}</span><b>{diffResult.workdays}</b></div>
            </div>
          )}
        </div>
      )}

      {mode === 'range' && (
        <div className="dc-c">
          <label className="dc-fl"><span>{i18n.dateCalc.from}</span><input type="date" value={rangeA} onChange={e => setRangeA(e.target.value)} onFocus={() => setCalendarTarget('rangeA')} /></label>
          <label className="dc-fl"><span>{i18n.dateCalc.to}</span><input type="date" value={rangeB} onChange={e => setRangeB(e.target.value)} onFocus={() => setCalendarTarget('rangeB')} /></label>
          <button className="dc-go" onClick={doRange} type="button">{i18n.dateCalc.tabRange}</button>
          {rangeList.length > 0 && (
            <><div className="dc-cnt">{i18n.dateCalc.count.replace('{n}', String(rangeList.length))}</div><div className="dc-sc">{rangeList.map((r, i) => <div key={i} className="dc-ri">{r}</div>)}</div></>
          )}
        </div>
      )}

      {mode === 'ts' && (
        <div className="dc-c">
          <input className="dc-wi" placeholder={i18n.dateCalc.placeholder} value={tsInput} onChange={e => setTsInput(e.target.value)} />
          <button className="dc-go" onClick={doTs} type="button">{i18n.dateCalc.convert}</button>
          {tsOut && <div className="dc-rs">{tsOut}</div>}
        </div>
      )}

      {/* 日历 → 点击填入对应输入框 */}
      <div className="dc-c">
        <MiniCalendar year={calY} month={calM} selected={getCalendarDate()} dow={i18n.dateCalc.dow} onSelect={onCalendarSelect} />
      </div>
    </div>
  );
}

export function createDateCalculationPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'date-calculation', name: '日期计算', icon: null, enabled: true },
    render: (i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <DateCalc i18n={i18n} />,
    }),
  };
}
