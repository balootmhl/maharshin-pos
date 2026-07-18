import { Product } from '@/types';
import { useCallback, useEffect, useRef, useState } from 'react';

type UseProductSearchOptions = {
    branchId: string;
    context: 'sale' | 'purchase';
    debounceMs?: number;
    limit?: number;
};

type UseProductSearchReturn = {
    products: Product[];
    isLoading: boolean;
    search: (query: string) => void;
    searchByCategory: (categoryId: number | null) => void;
    lookupBarcode: (code: string) => Promise<Product | null>;
    clearResults: () => void;
};

export function useProductSearch({ branchId, context, debounceMs = 300, limit = 30 }: UseProductSearchOptions): UseProductSearchReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const abortController = useRef<AbortController | null>(null);
    const currentCategoryId = useRef<number | null>(null);

    // Cancel any in-flight request
    const cancelPending = useCallback(() => {
        if (abortController.current) {
            abortController.current.abort();
            abortController.current = null;
        }
    }, []);

    // Core fetch function
    const fetchProducts = useCallback(
        async (params: Record<string, string | number>) => {
            cancelPending();
            setIsLoading(true);

            const controller = new AbortController();
            abortController.current = controller;

            const searchParams = new URLSearchParams();
            searchParams.set('branch_id', branchId);
            searchParams.set('for', context);
            searchParams.set('limit', String(limit));
            for (const [key, value] of Object.entries(params)) {
                searchParams.set(key, String(value));
            }

            try {
                const response = await fetch(`/api/products/search?${searchParams.toString()}`, {
                    signal: controller.signal,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) throw new Error(`HTTP ${response.status}`);

                const data = await response.json();
                setProducts(data.products);
            } catch (err: unknown) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    // Request was cancelled, ignore
                    return;
                }
                console.error('Product search failed:', err);
                setProducts([]);
            } finally {
                if (abortController.current === controller) {
                    setIsLoading(false);
                }
            }
        },
        [branchId, context, limit, cancelPending],
    );

    // Debounced text search
    const search = useCallback(
        (query: string) => {
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }

            if (!query.trim()) {
                // If empty query and category is selected, show category products
                if (currentCategoryId.current !== null) {
                    fetchProducts({ category_id: currentCategoryId.current });
                } else {
                    cancelPending();
                    setProducts([]);
                    setIsLoading(false);
                }
                return;
            }

            setIsLoading(true);
            debounceTimer.current = setTimeout(() => {
                const params: Record<string, string | number> = { q: query };
                if (currentCategoryId.current !== null) {
                    params.category_id = currentCategoryId.current;
                }
                fetchProducts(params);
            }, debounceMs);
        },
        [debounceMs, fetchProducts, cancelPending],
    );

    // Category filter — load products for the selected category
    const searchByCategory = useCallback(
        (categoryId: number | null) => {
            currentCategoryId.current = categoryId;
            if (categoryId === null) {
                // "All" was clicked — clear results (user must search)
                cancelPending();
                setProducts([]);
                setIsLoading(false);
                return;
            }
            fetchProducts({ category_id: categoryId });
        },
        [fetchProducts, cancelPending],
    );

    // Exact barcode/code lookup (no debounce)
    const lookupBarcode = useCallback(
        async (code: string): Promise<Product | null> => {
            const searchParams = new URLSearchParams({
                code,
                branch_id: branchId,
            });

            try {
                const response = await fetch(`/api/products/barcode-lookup?${searchParams.toString()}`, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) return null;

                const data = await response.json();
                return data.product;
            } catch {
                return null;
            }
        },
        [branchId],
    );

    const clearResults = useCallback(() => {
        cancelPending();
        setProducts([]);
        setIsLoading(false);
        currentCategoryId.current = null;
    }, [cancelPending]);

    // Clear results when branch changes
    useEffect(() => {
        clearResults();
    }, [branchId, clearResults]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cancelPending();
            if (debounceTimer.current) {
                clearTimeout(debounceTimer.current);
            }
        };
    }, [cancelPending]);

    return {
        products,
        isLoading,
        search,
        searchByCategory,
        lookupBarcode,
        clearResults,
    };
}
