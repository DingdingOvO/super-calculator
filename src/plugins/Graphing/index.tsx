'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

const COLORS = ['#4f8cff', '#ef5350', '#4caf50', '#ff9800', '#ab47bc'];

function GraphingPanel() {
  const [exprInput, setExprInput] = useState('');
  const [exprs, setExprs] = useState<string[]>([]);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wasmRef = useRef<any>(null);
  const [view, setView] = useState({ xMin: -10, xMax: 10, yMin: -4, yMax: 4 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [evalX, setEvalX] = useState('');

  useEffect(() => { import('rust-calculator').then(m => { wasmRef.current = m; }).catch(() => {}); }, []);

  const addExpr = useCallback(() => {
    const t = exprInput.trim();
    if (t && !exprs.includes(t)) { setExprs(p => [...p, t]); setExprInput(''); }
  }, [exprInput, exprs]);

  const evalF = useCallback((e: string, x: number): number | null => {
    try {
      const mod = wasmRef.current;
      if (!mod) return null;
      const sanitized = e.replace(/\bx\b/g, `(${x.toFixed(6)})`);
      const res = mod.evaluate_expression(sanitized, angleMode);
      const val = parseFloat(res);
      return isNaN(val) ? null : val;
    } catch { return null; }
  }, [angleMode]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    const { xMin, xMax, yMin, yMax } = view;
    const mod = wasmRef.current;
    const pad = 40;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'var(--display-bg, rgba(0,0,0,0.02))';
    ctx.fillRect(0, 0, W, H);

    // 坐标系映射
    const toX = (x: number) => pad + (x - xMin) / (xMax - xMin) * (W - pad * 2);
    const toY = (y: number) => pad + (yMax - y) / (yMax - yMin) * (H - pad * 2);

    // 自适应网格步长
    const gridStep = (() => {
      const r = xMax - xMin;
      if (r <= 1) return 0.2; if (r <= 2) return 0.5; if (r <= 5) return 1;
      if (r <= 20) return 2; if (r <= 50) return 5; if (r <= 100) return 10; if (r <= 500) return 50; return 100;
    })();

    // 网格
    ctx.strokeStyle = 'rgba(128,128,128,0.08)'; ctx.lineWidth = 1;
    for (let g = Math.ceil(xMin / gridStep) * gridStep; g <= xMax; g += gridStep) {
      const px = toX(g); ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
    }
    for (let g = Math.ceil(yMin / gridStep) * gridStep; g <= yMax; g += gridStep) {
      const py = toY(g); ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke();
    }

    // 坐标轴
    ctx.strokeStyle = 'var(--text-secondary, #666)'; ctx.lineWidth = 1.5;
    if (yMin <= 0 && yMax >= 0) { const py = toY(0); ctx.beginPath(); ctx.moveTo(pad, py); ctx.lineTo(W - pad, py); ctx.stroke(); }
    if (xMin <= 0 && xMax >= 0) { const px = toX(0); ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke(); }

    // 刻度标签
    ctx.fillStyle = 'var(--text-dim, #999)'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let g = Math.ceil(xMin / gridStep) * gridStep; g <= xMax; g += gridStep) {
      if (Math.abs(g) < 1e-10) continue;
      ctx.fillText(formatNum(g), toX(g), H - pad + 5);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let g = Math.ceil(yMin / gridStep) * gridStep; g <= yMax; g += gridStep) {
      if (Math.abs(g) < 1e-10) continue;
      ctx.fillText(formatNum(g), pad - 6, toY(g));
    }

    // 原点标签
    if (xMin <= 0 && xMax >= 0 && yMin <= 0 && yMax >= 0) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'top'; ctx.fillText('O', toX(0) - 4, toY(0) + 4);
    }

    // 绘制函数
    if (!mod) { ctx.fillStyle = '#888'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('加载中...', W / 2, H / 2); return; }

    for (let ei = 0; ei < exprs.length; ei++) {
      const e = exprs[ei]; if (!e.trim()) continue;
      ctx.strokeStyle = COLORS[ei % COLORS.length];
      ctx.lineWidth = 2;
      let started = false;
      ctx.beginPath();
      const samples = Math.min(600, (W - pad * 2) * 2);
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (xMax - xMin) * i / samples;
        try {
          const sanitized = e.replace(/\bx\b/g, `(${x.toFixed(6)})`);
          const res = mod.evaluate_expression(sanitized, angleMode);
          const val = parseFloat(res);
          if (isNaN(val) || !isFinite(val) || val < yMin - 2 || val > yMax + 2) { started = false; continue; }
          const px = toX(x), py = toY(val);
          if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
    }

    // 悬停追踪线
    if (hoverX !== null && xMin <= hoverX && hoverX <= xMax) {
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(128,128,128,0.3)'; ctx.lineWidth = 1;
      const px = toX(hoverX);
      ctx.beginPath(); ctx.moveTo(px, pad); ctx.lineTo(px, H - pad); ctx.stroke();
      ctx.setLineDash([]);

      // 值提示
      exprs.forEach((e, i) => {
        const v = evalF(e, hoverX);
        if (v === null || !isFinite(v)) return;
        const py = toY(v);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
      });

      // 弹窗
      const canvasX = ((px - pad) / (W - pad * 2)) * (xMax - xMin) + xMin;
      let ttY = 50;
      ctx.font = '11px sans-serif';
      exprs.forEach((e, i) => {
        const v = evalF(e, canvasX);
        if (v === null) return;
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(px + 12, ttY - 2, 150, 18);
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.textAlign = 'left'; ctx.textBaseline = 'top';
        ctx.fillText(`${e} = ${v.toFixed(4)}`, px + 16, ttY);
        ttY += 20;
      });
    }
  }, [view, exprs, angleMode, hoverX, evalF]);

  useEffect(() => { draw(); }, [draw]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const canvas = canvasRef.current!;
    const sx = (view.xMax - view.xMin) / canvas.width;
    const sy = (view.yMax - view.yMin) / canvas.height;
    dragRef.current = { x: mx * sx + view.xMin, y: (canvas.height - my) * sy + view.yMin, vx: view.xMin, vy: view.yMin };
  }, [view]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const sx = (view.xMax - view.xMin) / canvas.width;
    const sy = (view.yMax - view.yMin) / canvas.height;
    const xVal = mx * sx + view.xMin;
    setHoverX(xVal);

    if (dragging) {
      const dx = (mx * sx + view.xMin) - dragRef.current.x;
      const dy = ((canvas.height - my) * sy + view.yMin) - dragRef.current.y;
      setView(v => ({ xMin: v.xMin - dx, xMax: v.xMax - dx, yMin: v.yMin - dy, yMax: v.yMax - dy }));
    }
  }, [dragging, view]);

  const onMouseUp = useCallback(() => { setDragging(false); }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 1.2 : 0.8;
    setView(v => {
      const cx = (v.xMin + v.xMax) / 2, cy = (v.yMin + v.yMax) / 2;
      return { xMin: cx - (cx - v.xMin) * factor, xMax: cx + (v.xMax - cx) * factor, yMin: cy - (cy - v.yMin) * factor, yMax: cy + (v.yMax - cy) * factor };
    });
  }, []);

  return (
    <div className="gp">
      {/* 输入行 */}
      <div className="gp-bar">
        <span className="gp-fx">fx</span>
        <input className="gp-input" value={exprInput} onChange={e => setExprInput(e.target.value)}
          placeholder="输入函数，如 sin(x)" onKeyDown={e => { if (e.key === 'Enter') addExpr(); }} />
        <button className="gp-add" onClick={addExpr} type="button">+ 添加</button>
      </div>

      {/* 表达式标签 */}
      {exprs.length > 0 && (
        <div className="gp-tags">
          {exprs.map((e, i) => (
            <span key={i} className="gp-tag">
              <span className="gp-dot" style={{ background: COLORS[i % COLORS.length] }} />
              <span>y={e}</span>
              <button className="gp-del" onClick={() => setExprs(p => p.filter((_, j) => j !== i))} type="button">×</button>
            </span>
          ))}
        </div>
      )}

      {/* 画布 */}
      <div className="gp-canvas-wrap">
        <canvas ref={canvasRef} width={380} height={260}
          className="gp-canvas"
          onMouseDown={onMouseDown} onMouseMove={onMouseMove}
          onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          onWheel={onWheel} />
      </div>

      {/* 底栏 */}
      <div className="gp-footer">
        <div className="gp-footer-group">
          <button className="gp-btn" onClick={() => setView({ xMin: -10, xMax: 10, yMin: -4, yMax: 4 })} type="button">重置</button>
          <button className="gp-btn" onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')} type="button">
            {angleMode === 'deg' ? 'DEG' : 'RAD'}
          </button>
          <button className="gp-btn gp-btn-sci" onClick={() => setExprInput(prev => prev + 'sin(')} type="button">sin</button>
          <button className="gp-btn gp-btn-sci" onClick={() => setExprInput(prev => prev + 'cos(')} type="button">cos</button>
          <button className="gp-btn gp-btn-sci" onClick={() => setExprInput(prev => prev + 'tan(')} type="button">tan</button>
          <button className="gp-btn gp-btn-sci" onClick={() => setExprInput(prev => prev + 'sqrt(')} type="button">√</button>
          <button className="gp-btn gp-btn-sci" onClick={() => setExprInput(prev => prev + '^')} type="button">xⁿ</button>
        </div>
        <div className="gp-range-info">
          X: [{view.xMin.toFixed(1)}, {view.xMax.toFixed(1)}]  Y: [{view.yMin.toFixed(1)}, {view.yMax.toFixed(1)}]
        </div>
      </div>

      {/* 求值 */}
      <div className="gp-eval">
        <span className="gp-eval-label">f(x) 求值</span>
        <span>x = </span>
        <input className="gp-eval-input" placeholder="数值" value={evalX}
          onChange={e => setEvalX(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') setEvalX(e.target.value); }}
        />
        {evalX && !isNaN(parseFloat(evalX)) && exprs.map((e, i) => {
          const v = evalF(e, parseFloat(evalX));
          return v !== null ? (
            <span key={i} className="gp-eval-v" style={{ color: COLORS[i % COLORS.length] }}>
              {e} = {v.toFixed(4)}
            </span>
          ) : null;
        })}
      </div>
    </div>
  );
}

function formatNum(n: number): string {
  if (Math.abs(n) >= 10000 || (Math.abs(n) < 0.01 && n !== 0)) return n.toExponential(1);
  return parseFloat(n.toFixed(4)).toString();
}

export function createGraphingPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'graphing', name: '绘图', icon: null, enabled: true },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <GraphingPanel />,
    }),
  };
}
