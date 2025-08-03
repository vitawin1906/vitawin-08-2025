import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface OptimizedQueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
}

/**
 * Оптимизированный хук для запросов с встроенным кэшированием
 */
export function useOptimizedQuery<T>(
  queryKey: string[],
  enabled: boolean = true,
  options: OptimizedQueryOptions = {}
) {
  const queryClient = useQueryClient();

  const defaultOptions = {
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 10 * 60 * 1000, // 10 минут
    refetchOnWindowFocus: false,
    retry: 1,
    ...options
  };

  const query = useQuery<T>({
    queryKey,
    enabled,
    ...defaultOptions
  });

  // Мемоизированная функция инвалидации
  const invalidateQuery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  // Мемоизированная функция установки данных
  const setQueryData = useCallback((data: T) => {
    queryClient.setQueryData(queryKey, data);
  }, [queryClient, queryKey]);

  // Мемоизированный результат
  const result = useMemo(() => ({
    ...query,
    invalidateQuery,
    setQueryData
  }), [query, invalidateQuery, setQueryData]);

  return result;
}