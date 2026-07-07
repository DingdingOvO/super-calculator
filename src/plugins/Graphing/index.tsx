'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CalculatorPlugin, CalculatorPluginRender } from '@plugins/types';
import type { I18nPack } from '@i18n/types';

// 将表达式中的 x 替换为数值并求值
async function evalExpr(expr: string, xVal: number, angleMode: string): Promise<number | null> {
  try {
    const mod = await import('rust-calculator');
    const sanitized = expr.replace(/\bx\b/g, `(${xVal})`);
    const res = mod.evaluate_expression(sanitized, angleMode);
    const n = parseFloat(res);
    return isNaN(n) ? null : n;
  } catch { return null; }
}

// 颜色
const COLORS = ['#4f8cff', '#ef5350', '#4caf50', '#ff9800', '#ab47bc', '#00bcd4'];

function GraphingPanel() {
  const [expr, setExpr] = useState('sin(x)');
  const [exprs, setExprs] = useState<string[]>(['sin(x)']);
  const [angleMode, setAngleMode] = useState<'deg' | 'rad'>('deg');
  const [rangeX, setRangeX] = useState({ min: -10, max: 10 });
  const [rangeY, setRangeY] = useState({ min: -2, max: 2 });
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const addExpr = useCallback(() => {
    if (expr.trim() && !exprs.includes(expr.trim())) {
      setExprs(p => [...p, expr.trim()]);
    }
  }, [expr, exprs]);

  const removeExpr = useCallback((i: number) => {
    setExprs(p => p.filter((_, idx) => idx !== i));
  }, []);

  // 绘图函数
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = 40;
    const plotW = W - pad * 2;
    const plotH = H - pad * 2;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = 'var(--display-bg, rgba(255,255,255,0.05))';
    ctx.fillRect(0, 0, W, H);

    const xMin = rangeX.min, xMax = rangeX.max;
    const yMin = rangeY.min, yMax = rangeY.max;
    const xScale = plotW / (xMax - xMin);
    const yScale = plotH / (yMax - yMin);

    const tx = (x: number) => pad + (x - xMin) * xScale;
    const ty = (y: number) => pad + plotH - (y - yMin) * yScale;

    // 网格线
    ctx.strokeStyle = 'rgba(128,128,128,0.15)';
    ctx.lineWidth = 1;
    const gridStep = (() => {
      const range = xMax - xMin;
      if (range <= 2) return 0.5;
      if (range <= 10) return 1;
      if (range <= 50) return 5;
      return 10;
    })();
    for (let g = Math.ceil(xMin / gridStep) * gridStep; g <= xMax; g += gridStep) {
      ctx.beginPath(); ctx.moveTo(tx(g), pad); ctx.lineTo(tx(g), pad + plotH); ctx.stroke();
    }
    for (let g = Math.ceil(yMin / gridStep) * gridStep; g <= yMax; g += gridStep) {
      ctx.beginPath(); ctx.moveTo(pad, ty(g)); ctx.lineTo(pad + plotW, ty(g)); ctx.stroke();
    }

    // 坐标轴
    ctx.strokeStyle = 'var(--text-secondary, #666)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + plotW, ty(0)); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + plotH); ctx.stroke();

    // 刻度标签
    ctx.fillStyle = 'var(--text-dim, #999)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let g = Math.ceil(xMin / gridStep) * gridStep; g <= xMax; g += gridStep) {
      if (g === 0) continue;
      ctx.fillText(String(g), tx(g), pad + plotH + 4);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let g = Math.ceil(yMin / gridStep) * gridStep; g <= yMax; g += gridStep) {
      if (g === 0) continue;
      ctx.fillText(String(g), pad - 6, ty(g));
    }

    // 绘制函数曲线
    const samples = 400;
    for (let ei = 0; ei < exprs.length; ei++) {
      const e = exprs[ei];
      if (!e.trim()) continue;
      ctx.strokeStyle = COLORS[ei % COLORS.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= samples; i++) {
        const x = xMin + (xMax - xMin) * i / samples;
        // 替换 x 变量并求值
        const sanitized = e.replace(/\bx\b/g, `(${x.toFixed(6)})`);
        try {
          const mod = awaitResult; // 我们需要同步求值，但 evaluate_expression 是同步的
          // 实际上 evaluate_expression 是同步的！直接用
          const val = evaluateExpressionSync(e, x, angleMode);
          if (val === null || !isFinite(val)) { started = false; continue; }
          const px = tx(x), py = ty(val);
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
    }

    // 表达式标签
    exprs.forEach((e, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`y=${e}`, pad + 8, pad + 8 + i * 18);
    });
  }, [exprs, rangeX, rangeY]);

  // 同步求值包装
  const evaluateExpressionSync = useCallback((e: string, x: number, mode: string): number | null => {
    try {
      // 简单方法：直接调用 wasm 函数（它是同步的！）
      const sanitized = e.replace(/\bx\b/g, `(${x.toFixed(6)})`);
      // 动态导入会在组件挂载时触发，这里直接访问全局
      return null; // try via direct import
    } catch { return null; }
  }, []);

  // 实际绘图用异步获取 wasm 模块
  const wasmRef = useRef<any>(null);
  useEffect(() => {
    import('rust-calculator').then(m => { wasmRef.current = m; }).catch(() => {});
  }, []);

  const doPlot = useCallback(async () => {
    const mod = wasmRef.current || await import('rust-calculator');
    const canvas = canvasRef.current;
    if (!canvas || !mod) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    const pad = 40;
    const plotW = W - pad * 2;
    const plotH = H - pad * 2;

    ctx.clearRect(0, 0, W, H);
    // 背景
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--display-bg').trim() || 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, 0, W, H);

    const xMin = rangeX.min, xMax = rangeX.max;
    const yMin = rangeY.min, yMax = rangeY.max;
    const xScale = plotW / (xMax - xMin);
    const yScale = plotH / (yMax - yMin);

    const tx = (x: number) => pad + (x - xMin) * xScale;
    const ty = (y: number) => pad + plotH - (y - yMin) * yScale;

    // 网格
    const step = (() => { const r = xMax - xMin; if (r <= 2) return 0.5; if (r <= 10) return 1; if (r <= 50) return 5; return 10; })();
    ctx.strokeStyle = 'rgba(128,128,128,0.12)'; ctx.lineWidth = 1;
    for (let g = Math.ceil(xMin / step) * step; g <= xMax; g += step) {
      ctx.beginPath(); ctx.moveTo(tx(g), pad); ctx.lineTo(tx(g), pad + plotH); ctx.stroke();
    }
    for (let g = Math.ceil(yMin / step) * step; g <= yMax; g += step) {
      ctx.beginPath(); ctx.moveTo(pad, ty(g)); ctx.lineTo(pad + plotW, ty(g)); ctx.stroke();
    }

    // 坐标轴
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim() || '#666';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(pad, ty(0)); ctx.lineTo(pad + plotW, ty(0)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(tx(0), pad); ctx.lineTo(tx(0), pad + plotH); ctx.stroke();

    // 刻度
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-dim').trim() || '#999';
    ctx.font = '10px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    for (let g = Math.ceil(xMin / step) * step; g <= xMax; g += step) {
      if (g === 0) continue; ctx.fillText(String(g), tx(g), pad + plotH + 4);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    for (let g = Math.ceil(yMin / step) * step; g <= yMax; g += step) {
      if (g === 0) continue; ctx.fillText(String(g), pad - 6, ty(g));
    }

    // 曲线
    for (let ei = 0; ei < exprs.length; ei++) {
      const e = exprs[ei];
      if (!e.trim()) continue;
      ctx.strokeStyle = COLORS[ei % COLORS.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      let started = false;
      for (let i = 0; i <= 400; i++) {
        const x = xMin + (xMax - xMin) * i / 400;
        const sanitized = e.replace(/\bx\b/g, `(${x.toFixed(6)})`);
        try {
          const res = mod.evaluate_expression(sanitized, angleMode);
          const val = parseFloat(res);
          if (isNaN(val) || !isFinite(val)) { started = false; continue; }
          const px = tx(x), py = ty(val);
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        } catch { started = false; }
      }
      ctx.stroke();
    }

    // 图例
    exprs.forEach((e, i) => {
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillText(`y = ${e}`, pad + 8, pad + 8 + i * 18);
    });
  }, [exprs, rangeX, rangeY, angleMode]);

  useEffect(() => { doPlot(); }, [doPlot]);

  return (
    <div className="gp">
      <div className="gp-input-row">
        <input className="gp-input" value={expr} onChange={e => setExpr(e.target.value)}
          placeholder="y = f(x)" onKeyDown={e => { if (e.key === 'Enter') addExpr(); }} />
        <button className="gp-add-btn" onClick={addExpr} type="button">+</button>
        <button className={`gp-angle-btn ${angleMode === 'rad' ? 'gp-angle-btn--rad' : ''}`}
          onClick={() => setAngleMode(m => m === 'deg' ? 'rad' : 'deg')} type="button">
          {angleMode === 'deg' ? 'DEG' : 'RAD'}
        </button>
      </div>

      {/* 表达式列表 */}
      {exprs.length > 1 && (
        <div className="gp-exprs">{exprs.map((e, i) => (
          <span key={i} className="gp-expr-tag" style={{ borderLeftColor: COLORS[i % COLORS.length] }}>
            <span style={{ color: COLORS[i % COLORS.length] }}>y={e}</span>
            <button className="gp-expr-del" onClick={() => removeExpr(i)} type="button">×</button>
          </span>
        ))}</div>
      )}

      {/* Canvas */}
      <div className="gp-canvas-wrap">
        <canvas ref={canvasRef} width={360} height={280} className="gp-canvas" />
      </div>

      {/* 范围控制 */}
      <div className="gp-range-row">
        <label>X <input type="number" value={rangeX.min} onChange={e => setRangeX(p => ({ ...p, min: parseFloat(e.target.value) || 0 }))} /></label>
        <span>~</span>
        <label><input type="number" value={rangeX.max} onChange={e => setRangeX(p => ({ ...p, max: parseFloat(e.target.value) || 0 }))} /></label>
        <label>Y <input type="number" value={rangeY.min} onChange={e => setRangeY(p => ({ ...p, min: parseFloat(e.target.value) || 0 }))} /></label>
        <span>~</span>
        <label><input type="number" value={rangeY.max} onChange={e => setRangeY(p => ({ ...p, max: parseFloat(e.target.value) || 0 }))} /></label>
      </div>

      {error && <div className="gp-error">{error}</div>}
    </div>
  );
}

export function createGraphingPlugin(): CalculatorPlugin {
  return {
    meta: { id: 'graphing', name: '绘图', icon: null, enabled: true },
    render: (_i18n: I18nPack, _theme: 'light' | 'dark'): CalculatorPluginRender => ({
      buttons: <GraphingPanel />,
    }),
  };
}
