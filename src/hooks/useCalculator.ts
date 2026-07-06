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
        const mod = await import('rust-calculator');
        if (cancelled) return;
        calcRef.current = new mod.WasmCalculator();
        setWasm(mod);
        setDisplay(calcRef.current.get_display());
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.error('WASM 加载失败:', e);
        setError('计算引擎加载失败');
        setLoading(false);
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

  // 所有操作都通过 startTransition 包装，不阻塞 UI
  const inputDigit = useCallback((digit: string) => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.input_digit(digit);
      syncState();
    });
  }, [syncState]);

  const inputOperator = useCallback((op: string) => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.input_operator(op);
      syncState();
    });
  }, [syncState]);

  const evaluate = useCallback(() => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.evaluate();
      syncState();
    });
  }, [syncState]);

  const clear = useCallback(() => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.clear();
      syncState();
    });
  }, [syncState]);

  const backspace = useCallback(() => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.backspace();
      syncState();
    });
  }, [syncState]);

  const negate = useCallback(() => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.negate();
      syncState();
    });
  }, [syncState]);

  const percent = useCallback(() => {
    if (!calcRef.current) return;
    startTransition(() => {
      calcRef.current.percent();
      syncState();
    });
  }, [syncState]);

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
    backspace,
    negate,
    percent,
    calc: calcRef.current,
  };
}
