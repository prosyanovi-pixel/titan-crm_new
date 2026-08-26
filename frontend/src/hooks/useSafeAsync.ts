import { useState, useCallback } from 'react';

interface UseSafeAsyncReturn<T, Args extends unknown[]> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: Args) => Promise<T | null>;
  reset: () => void;
}

function hasPayload(value: unknown): value is { payload: unknown } {
  return typeof value === 'object' && value !== null && 'payload' in value;
}

export function useSafeAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = false
): UseSafeAsyncReturn<T, Args> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...args: Args): Promise<T | null> => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await asyncFunction(...args);
        
        // Safety check for undefined/null responses
        if (response === undefined || response === null) {
          console.warn('Async function returned undefined/null:', asyncFunction.name);
          setData(null);
          return null;
        }
        
        // Safety check for payload property access
        if (hasPayload(response)) {
          const payload = response.payload;
          if (payload === undefined) {
            console.warn('Response has undefined payload:', response);
          }
        }
        
        setData(response);
        return response;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Safe async error:', error);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [asyncFunction]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

export default useSafeAsync;
