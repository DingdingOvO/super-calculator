'use client';

import { useState, useCallback, useEffect } from 'react';

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  mode: string;
  timestamp: number;
}

const STORAGE_KEY = 'calc-history';
const MAX_ENTRIES = 50;

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  // 从 localStorage 加载
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setEntries(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  // 持久化
  const persist = useCallback((list: HistoryEntry[]) => {
    setEntries(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch { /* ignore */ }
  }, []);

  // 添加记录
  const addEntry = useCallback((expression: string, result: string, mode: string) => {
    if (!expression && !result) return;
    const entry: HistoryEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      expression,
      result,
      mode,
      timestamp: Date.now(),
    };
    persist([entry, ...entries].slice(0, MAX_ENTRIES));
  }, [entries, persist]);

  // 删除单条
  const removeEntry = useCallback((id: string) => {
    persist(entries.filter(e => e.id !== id));
  }, [entries, persist]);

  // 清空所有
  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { entries, addEntry, removeEntry, clearAll };
}
