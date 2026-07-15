import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock Ziggy's route function globally
const mockRoute = (name?: string, params?: any) => {
    if (!name) {
        return {
            current: () => true,
        } as any;
    }
    return `http://localhost/${name}`;
};
(global as any).route = mockRoute;
if (typeof window !== 'undefined') {
    (window as any).route = mockRoute;
}

// Mock Inertia's components and hooks
vi.mock('@inertiajs/react', () => {
    return {
        Link: ({ children, href, ...props }: any) => {
            return React.createElement('a', { href, ...props }, children);
        },
        Head: ({ children }: any) => {
            return React.createElement(React.Fragment, {}, children);
        },
        useForm: (initialValues: any) => {
            const [data, setDataState] = React.useState(initialValues);
            const setData = React.useCallback((key: any, value?: any) => {
                if (typeof key === 'object') {
                    setDataState((prev: any) => ({ ...prev, ...key }));
                } else if (typeof key === 'function') {
                    setDataState((prev: any) => key(prev));
                } else {
                    setDataState((prev: any) => ({ ...prev, [key]: value }));
                }
            }, []);
            return React.useMemo(() => ({
                data,
                setData,
                post: vi.fn(),
                put: vi.fn(),
                delete: vi.fn(),
                processing: false,
                errors: {},
                reset: vi.fn(),
            }), [data, setData]);
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
        value: vi.fn().mockImplementation(query => ({
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
