'use client';

import { useState, useCallback } from 'react';

interface UseRemainingDocsReturn {
  remainingDocs: number | null;
  setRemainingDocs: (count: number) => void;
  decrementRemainingDocs: () => void;
  refreshRemainingDocs: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useRemainingDocs(totalAllowed: number = 50): UseRemainingDocsReturn {
  const [remainingDocs, setRemainingDocsState] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setRemainingDocs = useCallback((count: number) => {
    setRemainingDocsState(Math.max(0, count));
  }, []);

  const decrementRemainingDocs = useCallback(() => {
    setRemainingDocsState(prev => prev !== null ? Math.max(0, prev - 1) : null);
  }, []);

  const refreshRemainingDocs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/usage');
      const data = await response.json();
      
      if (data.success && data.usage) {
        const currentUsage = data.usage.total || 0;
        const remaining = totalAllowed - currentUsage;
        setRemainingDocs(remaining);
      } else {
        throw new Error(data.error?.message || '이용현황 조회 실패');
      }
    } catch (err) {
      console.error('이용현황 조회 에러:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setLoading(false);
    }
  }, [totalAllowed, setRemainingDocs]);

  return {
    remainingDocs,
    setRemainingDocs,
    decrementRemainingDocs,
    refreshRemainingDocs,
    loading,
    error
  };
}