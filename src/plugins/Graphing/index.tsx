'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

const COLORS = ['#4f8cff', '#ef5350', '#4caf50', '#ff9800', '#ab47bc', '#00bcd4'];
const LINE_STYLES = ['solid', 'dashed', 'dotted'];

interface ExprEntry {
  id: number;
  expr: string;
  color: string;
  lineStyle: number;
  params: Record<string, number>;
}

let nextId = 1;

// 检测表达式中的参数（除 x 以外的字母）
function detectParams(expr: string): string[] {
  const vars = expr.match(/\b[a-z]\b/g) || [];
  return [...new Set(vars.filter(v => v !== 'x' && v !== 'e' && v !== 'i'))];
}

function GraphingPanel() {
  const [exprInput, setExprInput] = useState('');
  const [exprs, setExprs] = useState<ExprEntry[]>([]);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wasmRef = useRef<any>(null);
  const [view, setView] = useState({ xMin: -10, xMax: 10, yMin: -4, yMax: 4 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0 });
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [analyzeId, setAnalyzeId] = useState<number | null>(null);
  const [analyzeResult, setAnalyzeResult] = useState<any>(null);

  useEffect(() => { import('rust-calculator').then(m => { wasmRef.current = m; }).catch(() => {}); }, []);

  const evalF = useCallback((expr: string, x: number, params: Record<string, number> = {}): number | null => {
    try {
      const mod = wasmRef.current;
      if (!mod) return null;
      let sanitized = expr.replace(/\bx\b/g, `(${x.toFixed(6)})`);
      for (const [k, v] of Object.entries(params)) {
        sanitized = sanitized.replace(new RegExp(`\\b${k}\\b`, 'g'), `(${v})`);
      }
      const res = mod.evaluate_expression(sanitized, angleMode);
      const val = parseFloat(res);
      return isNaN(val) ? null : val;
    } catch { return null; }
  }, [angleMode]);

  const addExpr = useCallback(() => {
    const t = exprInput.trim();
    if (!t) return;
    if (exprs.some(e => e.expr === t)) return;
    const params = detectParams(t);
    const paramValues: Record<string, number> = {};
    params.forEach(p => { paramValues[p] = 1; });
    setExprs(p => [...p, { id: nextId++, expr: t, color: COLORS[p % COLORS.length], lineStyle: 0, params: paramValues }]);
    setExprInput('');
  }, [exprInput, exprs]);

  // 分析函数
  const doAnalyze = useCallback(async (entry: ExprEntry) => {
    setAnalyzeId(entry.id);
    const mod = wasmRef.current;
    if (!mod) return;
    const { expr, params } = entry;
    const xs = [], ys: (number | null)[] = [];
    const xMin = -20, xMax = 20;
    for (let i = 0; i <= 800; i++) {
      const x = xMin + (xMax - xMin) * i / 800;
      xs.push(x);
      ys.push(evalF(expr, x, params));
    }

    // 定义域：有效的 x 范围
    let domainStart = xMin, domainEnd = xMax;
    const validYs = ys.filter(y => y !== null && isFinite(y)) as number[];
    if (validYs.length === 0) { setAnalyzeResult({ error: '无法计算' }); return; }

    // 值域
    const yMin = Math.min(...validYs);
    const yMax = Math.max(...validYs);

    // x 截距（与 x 轴交点）
    const roots: number[] = [];
    for (let i = 1; i < ys.length; i++) {
      if (ys[i - 1] === null || ys[i] === null) continue;
      if (ys[i - 1]! * ys[i]! <= 0) {
        roots.push(xs[i]);
      }
    }

    // y 截距 (x=0)
    const yIntercept = evalF(expr, 0, params);

    // 极值（粗略）
    let maxVal = -Infinity, maxX = 0, minVal = Infinity, minX = 0;
    for (let i = 0; i < ys.length; i++) {
      if (ys[i] === null) continue;
      if (ys[i]! > maxVal) { maxVal = ys[i]!; maxX = xs[i]; }
      if (ys[i]! < minVal) { minVal = ys[i]!; minX = xs[i]; }
    }

    // 奇偶性
    let parity = '非奇非偶';
    const testPoints = [1, 2, 3, 4, 5];
    let isEven = true, isOdd = true;
    for (const t of testPoints) {
      const fp = evalF(expr, t, params);
      const fn = evalF(expr, -t, params);
      if (fp === null || fn === null) continue;
      if (Math.abs(fp - fn) > 0.01) isEven = false;
      if (Math.abs(fp + fn) > 0.01) isOdd = false;
    }
    if (isEven) parity = '偶函数';
    else if (isOdd) parity = '奇函数';

    setAnalyzeResult({
      domain: `x ∈ ℝ`, valueRange: `[${yMin.toFixed(3)}, ${yMax.toFixed(3)}]`,
      xIntercepts: roots.length > 0 ? roots.slice(0, 10).map(r => r.toFixed(3)).join(', ') : '无',
      yIntercept: yIntercept !== null ? yIntercept.toFixed(3) : '无',
      max: `(${maxX.toFixed(2)}, ${maxVal.toFixed(3)})`,
      min: `(${minX.toFixed(2)}, ${minVal.toFixed(3)})`,
      parity,
    });
  }, [evalF]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const { xMin, xMax, yMin, yMax } = view;
    const pad = 36;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'var(--display-bg, rgba(0,0,0,0.02))';
    ctx.fillRect(0, 0, W, H);

    const toX = (x: number) => pad + (x - xMin) / (xMax - xMin) * (W - pad * 2);
    const toY = (y: number) => pad + (yMax - y) / (yMax - yMin) * (H - pad * 2);

    const gridStep = (() => {
      const r = xMax - xMin;
      if (r <= 1) return 0.2; if (r <= 2) return 0.5; if (r <= 5) return 1;
      if (r <= 20) return 2; if (r <= 50) return 5; if (r <= 100) return 10; return 20;
    })();

    // 网格
    ctx.strokeStyle = 'rgba(128,128,128,0.07)'; ctx.lineWidth = 0.5;
    for (let g = Math.ceil(xMin / gridStep) * gridStep; g <= xMax; g += gridStep) {
      const px = toX(g); ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
    }
    for (let g = Math.ceil(yMin / gridStep) * gridStep; g <= yMax; g += gridStep) {
      const py = toY(g); ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke();
    }

    // 坐标轴
    ctx.strokeStyle = 'var(--text-secondary, #888)'; ctx.lineWidth = 1.2;
    if (yMin <= 0 && yMax >= 0) { const py = toY(0); ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke(); }
    if (xMin <= 0 && xMax >= 0) { const px = toX(0); ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke(); }

    // 刻度
    ctx.fillStyle = 'var(--text-dim, #999)'; ctx.font = '9px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let g = Math.ceil(xMin / gridStep) * gridStep; g <= xMax; g += gridStep) {
      if (Math.abs(g) < 1e-10) continue;
      ctx.fillText(formatNum(g), toX(g), H - pad + 4);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let g = Math.ceil(yMin / gridStep) * gridStep; g <= yMax; g += gridStep) {
      if (Math.abs(g) < 1e-10) continue;
      ctx.fillText(formatNum(g), pad - 4, toY(g));
    }

    // 曲线
    const mod = wasmRef.current;
    if (!mod) { ctx.fillStyle = '#888'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('加载中...', W / 2, H / 2); return; }

    const samples = Math.min(500, (W - pad * 2) * 2);
    for (const entry of exprs) {
      ctx.strokeStyle = entry.color;
      ctx.lineWidth = 2;
      if (entry.lineStyle === 1) ctx.setLineDash([6, 4]);
      else if (entry.lineStyle === 2) ctx.setLineDash([2, 4]);
      else ctx.setLineDash([]);

      let started = false;
      ctx.beginPath();
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (xMax - xMin) * i / samples;
        try {
          let sanitized = entry.expr.replace(/\bx\b/g, `(${x.toFixed(6)})`);
          for (const [k, v] of Object.entries(entry.params)) {
            sanitized = sanitized.replace(new RegExp(`\\b${k}\\b`, 'g'), `(${v})`);
          }
          const res = mod.evaluate_expression(sanitized, angleMode);
          const val = parseFloat(res);
          if (isNaN(val) || !isFinite(val) || val < yMin - 2 || val > yMax + 2) { started = false; continue; }
          const px = toX(x), py = toY(val);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 悬停
    if (hoverX !== null && xMin <= hoverX && hoverX <= xMax) {
      ctx.setLineDash([3, 3]); ctx.strokeStyle = 'rgba(128,128,128,0.25)'; ctx.lineWidth = 1;
      const px = toX(hoverX);
      ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
      ctx.setLineDash([]);

      const canvasX = ((px - pad) / (W - pad * 2)) * (xMax - xMin) + xMin;
      let ty = H - 20 - exprs.length * 16;
      for (const entry of exprs) {
        const v = evalF(entry.expr, canvasX, entry.params);
        if (v === null) continue;
        ctx.fillStyle = entry.color;
        ctx.beginPath();
        const py = toY(v);
        if (py > pad && py < H - pad) { ctx.arc(px, py, 3.5, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(px + 10, ty, 160, 15);
        ctx.fillStyle = entry.color;
        ctx.font = '10px sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`${entry.expr} = ${v.toFixed(4)}`, px + 14, ty + 1);
        ty += 17;
      }
    }
  }, [view, exprs, angleMode, hoverX, evalF]);

  useEffect(() => { draw(); }, [draw]);

  // 鼠标交互
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    dragRef.current = { x: e.clientX, y: e.clientY };
  }, []);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const sx = (view.xMax - view.xMin) / canvas.width;
    const xVal = mx * sx + view.xMin;
    setHoverX(xVal);
    if (dragging) {
      const dx = (e.clientX - dragRef.current.x) * sx;
      const dy = (e.clientY - dragRef.current.y) * sx * (canvas.height / canvas.width);
      setView(v => ({ xMin: v.xMin - dx, xMax: v.xMax - dx, yMin: v.yMin + dy, yMax: v.yMax + dy }));
      dragRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [dragging, view]);
  const onMouseUp = useCallback(() => { setDragging(false); }, []);
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    setView(v => {
      const cx = (v.xMin + v.xMax) / 2, cy = (v.yMin + v.yMax) / 2;
      return {
        xMin: cx - (cx - v.xMin) * factor, xMax: cx + (v.xMax - cx) * factor,
        yMin: cy - (cy - v.yMin) * factor, yMax: cy + (v.yMax - cy) * factor,
      };
    });
  }, []);

  const updateParam = useCallback((entryId: number, param: string, val: number) => {
    setExprs(p => p.map(e => e.id === entryId ? { ...e, params: { ...e.params, [param]: val } } : e));
  }, []);

  return (
    <div className="gp">
      {/* 输入 */}
      <div className="gp-bar">
        <span className="gp-fx">fx</span>
        <input className="gp-inp" value={exprInput} onChange={e => setExprInput(e.target.value)}
          placeholder="输入 y = f(x)，如 x^2+2x-3" onKeyDown={e => { if (e.key === 'Enter') addExpr(); }} />
        <button className="gp-add" onClick={addExpr} type="button">绘图</button>
      </div>

      {/* 函数列表 */}
      {exprs.length > 0 && (
        <div className="gp-list">
          {exprs.map(entry => {
            const pNames = Object.keys(entry.params);
            return (
              <div key={entry.id} className="gp-item">
                <span className="gp-dot" style={{ background: entry.color }} />
                <span className="gp-expr">y = {entry.expr}</span>
                <div className="gp-acts">
                  <button className="gp-act" onClick={() => doAnalyze(entry)} title="分析" type="button">📊</button>
                  <button className="gp-act" onClick={() => setExprs(p => p.map(e => e.id === entry.id ? { ...e, lineStyle: (e.lineStyle + 1) % 3 } : e))} title="切换线型" type="button">〰</button>
                  <button className="gp-act" onClick={() => setExprs(p => p.filter(e => e.id !== entry.id))} title="删除" type="button">✕</button>
                </div>
                {/* 参数滑块 */}
                {pNames.length > 0 && (
                  <div className="gp-sliders">
                    {pNames.map(pn => (
                      <label key={pn} className="gp-sl">
                        <span>{pn} = {entry.params[pn]?.toFixed(1)}</span>
                        <input type="range" min={-10} max={10} step={0.1}
                          value={entry.params[pn] || 0}
                          onChange={e => updateParam(entry.id, pn, parseFloat(e.target.value))} />
                      </label>
                    ))}
                  </div>
                )}
                {/* 分析面板 */}
                {analyzeId === entry.id && analyzeResult && (
                  <div className="gp-analyze">
                    <div className="gp-an-title">分析结果</div>
                    {analyzeResult.error ? <div className="gp-an-row">{analyzeResult.error}</div> : (
                      <>
                        <div className="gp-an-row"><span>值域</span><b>{analyzeResult.valueRange}</b></div>
                        <div className="gp-an-row"><span>x 截距</span><b>{analyzeResult.xIntercepts}</b></div>
                        <div className="gp-an-row"><span>y 截距</span><b>{analyzeResult.yIntercept}</b></div>
                        <div className="gp-an-row"><span>极大值</span><b>{analyzeResult.max}</b></div>
                        <div className="gp-an-row"><span>极小值</span><b>{analyzeResult.min}</b></div>
                        <div className="gp-an-row"><span>奇偶性</span><b>{analyzeResult.parity}</b></div>
                      </>
                    )}
                    <button className="gp-an-close" onClick={() => { setAnalyzeId(null); setAnalyzeResult(null); }} type="button">关闭</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 画布 */}
      <div className="gp-cw">
        <canvas ref={canvasRef} width={380} height={240}
          className="gp-cv" onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp} onWheel={onWheel} />
        {/* 画布上的缩放钮 */}
        <div className="gp-zoom">
          <button className="gp-zoom-btn" onClick={() => setView(v => { const f = 0.8; const cx = (v.xMin+v.xMax)/2, cy = (v.yMin+v.yMax)/2; return {xMin:cx-(cx-v.xMin)*f, xMax:cx+(v.xMax-cx)*f, yMin:cy-(cy-v.yMin)*f, yMax:cy+(v.yMax-cy)*f}; })} type="button">+</button>
          <button className="gp-zoom-btn" onClick={() => setView(v => { const f = 1.25; const cx = (v.xMin+v.xMax)/2, cy = (v.yMin+v.yMax)/2; return {xMin:cx-(cx-v.xMin)*f, xMax:cx+(v.xMax-cx)*f, yMin:cy-(cy-v.yMin)*f, yMax:cy+(v.yMax-cy)*f}; })} type="button">−</button>
        </div>
      </div>

      {/* 快捷函数 + 底栏 */}
      <div className="gp-btm">
        <div className="gp-funcs">
          <button onClick={() => setExprInput(p => p + 'sin(')} type="button">sin</button>
          <button onClick={() => setExprInput(p => p + 'cos(')} type="button">cos</button>
          <button onClick={() => setExprInput(p => p + 'tan(')} type="button">tan</button>
          <button onClick={() => setExprInput(p => p + 'log(')} type="button">log</button>
          <button onClick={() => setExprInput(p => p + 'ln(')} type="button">ln</button>
          <button onClick={() => setExprInput(p => p + 'e^(')} type="button">eˣ</button>
          <button onClick={() => setExprInput(p => p + 'sqrt(')} type="button">√</button>
          <button onClick={() => setExprInput(p => p + '^')} type="button">xⁿ</button>
          <button onClick={() => setExprInput(p => p + 'abs(')} type="button">|x|</button>
        </div>
        <div className="gp-foot">
          <button className="gp-foot-btn" onClick={() => setView({ xMin: -10, xMax: 10, yMin: -4, yMax: 4 })} type="button">重置</button>
          <button className="gp-foot-btn" onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')} type="button">{angleMode === 'deg' ? 'DEG' : 'RAD'}</button>
          <span className="gp-range">X:[{view.xMin.toFixed(1)},{view.xMax.toFixed(1)}] Y:[{view.yMin.toFixed(1)},{view.yMax.toFixed(1)}]</span>
        </div>
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 10000 || (Math.abs(n) < 0.01 && n !== 0)) return n.toExponential(1);
  return parseFloat(n.toFixed(3)).toString();
}

export function createGraphingPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'graphing', name: '绘图', icon: null, enabled: true },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <GraphingPanel />,
    }),
  };
}
