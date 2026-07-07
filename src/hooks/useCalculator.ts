'use client';

import { useState, useCallback, useTransition, useEffect, useRef } from 'react';

type WasmModule = typeof import('rust-calculator');

/**
 * 封装 WASM 计算器的 Hook
 * 使用 React 19 useTransition 确保计算不阻塞 UI
 */
export function useWasmCalculator() {
  const [wasm, setWasm] = useState<WasmModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const calcRef = useRef<any>(null);
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isPending, startTransition] = useTransition();

  // 加载 WASM 模块
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // 尝试加载 WASM
        const mod = await import('rust-calculator');
        if (cancelled) return;
        calcRef.current = new mod.WasmCalculator();
        setWasm(mod);
        setDisplay(calcRef.current.get_display());
        setLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        console.error('WASM 加载失败:', e);
        const msg = e?.message || String(e) || '计算引擎加载失败';
        setError(msg);
        setLoading(false);
        // 显示错误信息
        if (typeof window !== 'undefined') {
          const el = document.getElementById('html-loader');
          if (el) {
            el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px;text-align:center"><div style="font-size:2rem;color:#ef5350">⚠</div><h3 style="margin:0;font-size:1.1rem;color:#ef5350;font-weight:500">加载失败</h3><p style="margin:0;font-size:0.85rem;color:#888;max-width:300px">${msg}</p></div>`;
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // 同步 UI 状态
  const syncState = useCallback(() => {
    if (!calcRef.current) return;
    setDisplay(calcRef.current.get_display());
    setExpression(calcRef.current.get_expression());
    setHasError(calcRef.current.has_error());
  }, []);

  const guard = useCallback((fn: () => void) => {
    if (!calcRef.current || !calcRef.current.get_display) return;
    startTransition(fn);
  }, [startTransition]);

  // 所有操作通过 guard 包装
  const inputDigit = useCallback((digit: string) => {
    guard(() => {
      calcRef.current.input_digit(digit);
      syncState();
    });
  }, [guard, syncState]);

  const inputOperator = useCallback((op: string) => {
    guard(() => {
      calcRef.current.input_operator(op);
      syncState();
    });
  }, [guard, syncState]);

  const evaluate = useCallback(() => {
    guard(() => {
      calcRef.current.evaluate();
      syncState();
    });
  }, [guard, syncState]);

  const clear = useCallback(() => {
    guard(() => {
      calcRef.current.clear();
      syncState();
    });
  }, [guard, syncState]);

  const clearEntry = useCallback(() => {
    guard(() => {
      calcRef.current.clear_entry();
      syncState();
    });
  }, [guard, syncState]);

  const backspace = useCallback(() => {
    guard(() => {
      calcRef.current.backspace();
      syncState();
    });
  }, [guard, syncState]);

  const negate = useCallback(() => {
    guard(() => {
      calcRef.current.negate();
      syncState();
    });
  }, [guard, syncState]);

  const percent = useCallback(() => {
    guard(() => {
      calcRef.current.percent();
      syncState();
    });
  }, [guard, syncState]);

  return {
    display,
    expression,
    hasError,
    loading,
    error,
    isPending,
    inputDigit,
    inputOperator,
    evaluate,
    clear,
    clearEntry,
    backspace,
    negate,
    percent,
    calc: calcRef.current,
  };
}
