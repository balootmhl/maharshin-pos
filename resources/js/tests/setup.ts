import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';
import { route as routeFn } from 'ziggy-js';

// Mock Ziggy's route function globally
const mockRoute = ((name?: string): string | { current: () => boolean } => {
    if (!name) {
        return {
            current: () => true,
        };
    }
    return `http://localhost/${name}`;
}) as unknown as typeof routeFn;

(globalThis as unknown as { route: typeof routeFn }).route = mockRoute;
if (typeof window !== 'undefined') {
    (window as unknown as { route: typeof routeFn }).route = mockRoute;
}

// Mock Inertia's components and hooks
vi.mock('@inertiajs/react', () => {
    return {
        Link: ({ children, href, ...props }: React.ComponentPropsWithoutRef<'a'>) => {
            return React.createElement('a', { href, ...props }, children);
        },
        Head: ({ children }: { children?: React.ReactNode }) => {
            return React.createElement(React.Fragment, {}, children);
        },
        useForm: <TForm extends Record<string, unknown>>(initialValues: TForm) => {
            const [data, setDataState] = React.useState<TForm>(initialValues);
            const setData = React.useCallback((key: keyof TForm | ((prev: TForm) => TForm) | Partial<TForm>, value?: unknown) => {
                if (typeof key === 'object' && key !== null) {
                    setDataState((prev) => ({ ...prev, ...key }));
                } else if (typeof key === 'function') {
                    setDataState((prev) => (key as (prev: TForm) => TForm)(prev));
                } else {
                    setDataState((prev) => ({ ...prev, [key as keyof TForm]: value }) as TForm);
                }
            }, []);
            return React.useMemo(
                () => ({
                    data,
                    setData,
                    post: vi.fn(),
                    put: vi.fn(),
                    delete: vi.fn(),
                    processing: false,
                    errors: {} as Record<string, string>,
                    reset: vi.fn(),
                }),
                [data, setData],
            );
        },
        usePage: () => ({
            props: {
                auth: {
                    user: {
                        id: 1,
                        name: 'Test Manager',
                        is_super_admin: false,
                        branch_id: 1,
                    },
                },
                flash: {},
            },
        }),
    };
});

// Mock browser APIs that do not exist in JSDOM environment
if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: vi.fn(), // Deprecated
            removeListener: vi.fn(), // Deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
}
