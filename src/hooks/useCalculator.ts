'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

// 立即启动 WASM 加载（模块层面），不等 React 挂载
const wasmPromise = import(/* webpackPreload: true */ 'rust-calculator');

type WasmModule = typeof import('rust-calculator');
let wasmModule: WasmModule | null = null;
let wasmError: string | null = null;

wasmPromise.then(m => { wasmModule = m; }).catch(e => {
  wasmError = e?.message || String(e);
});

/**
 * WASM 计算器 Hook
 * WASM 在模块加载时即开始下载，React 挂载后只需接管即可
 */
export function useWasmCalculator() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calcRef = useRef<any>(null);
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // WASM 可能已经在模块层下载完成
        const mod = wasmModule || await wasmPromise;
        if (cancelled) {return;}
        calcRef.current = new mod.WasmCalculator();
        setDisplay(calcRef.current.get_display());
        setLoading(false);
      } catch (e: any) {
        if (cancelled) {return;}
        const msg = wasmError || e?.message || '计算引擎加载失败';
        console.error('WASM 加载失败:', msg);
        setError(msg);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const syncState = useCallback(() => {
    if (!calcRef.current) {return;}
    setDisplay(calcRef.current.get_display());
    setExpression(calcRef.current.get_expression());
    setHasError(calcRef.current.has_error());
  }, []);

  // 直接执行，无 useTransition 开销
  const exec = useCallback((fn: () => void) => {
    if (!calcRef.current) {return;}
    fn();
    syncState();
  }, [syncState]);

  const inputDigit = useCallback((d: string) => exec(() => calcRef.current.input_digit(d)), [exec]);
  const inputOperator = useCallback((op: string) => exec(() => calcRef.current.input_operator(op)), [exec]);
  const evaluate = useCallback(() => exec(() => calcRef.current.evaluate()), [exec]);
  const clear = useCallback(() => exec(() => calcRef.current.clear()), [exec]);
  const clearEntry = useCallback(() => exec(() => calcRef.current.clear_entry()), [exec]);
  const backspace = useCallback(() => exec(() => calcRef.current.backspace()), [exec]);
  const negate = useCallback(() => exec(() => calcRef.current.negate()), [exec]);
  const percent = useCallback(() => exec(() => calcRef.current.percent()), [exec]);

  return {
    display, expression, hasError, loading, error,
    inputDigit, inputOperator, evaluate, clear, clearEntry,
    backspace, negate, percent,
  };
}
