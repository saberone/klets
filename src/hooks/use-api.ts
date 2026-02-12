import { useState, useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store/index.js';

interface UseApiResult<T> {
	data: T | null;
	loading: boolean;
	error: string | null;
	refetch: () => void;
}

export function useApi<T>(
	fetcher: () => Promise<T>,
	cacheKey?: string,
	ttlMs = 5 * 60 * 1000,
): UseApiResult<T> {
	const getCached = useStore((s) => s.getCached);
	const setCache = useStore((s) => s.setCache);

	const [data, setData] = useState<T | null>(
		cacheKey ? getCached<T>(cacheKey) : null,
	);
	const [loading, setLoading] = useState(data === null);
	const [error, setError] = useState<string | null>(null);
	const prevKeyRef = useRef(cacheKey);

	const fetchData = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await fetcher();
			setData(result);
			if (cacheKey) {
				setCache(cacheKey, result, ttlMs);
			}
		} catch (err) {
			const message =
				err instanceof Error ? err.message : 'Onbekende fout';
			setError(message);
		} finally {
			setLoading(false);
		}
	}, [fetcher, cacheKey, ttlMs, setCache]);

	useEffect(() => {
		// On first mount or when cache key changes, fetch data
		if (prevKeyRef.current !== cacheKey) {
			prevKeyRef.current = cacheKey;
			const cached = cacheKey ? getCached<T>(cacheKey) : null;
			if (cached) {
				setData(cached);
				setLoading(false);
				return;
			}
			fetchData();
		} else if (data === null) {
			fetchData();
		}
	}, [cacheKey]);

	return { data, loading, error, refetch: fetchData };
}
