import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaleCreate from '../../pages/Sale/create';

// Mock Ziggy route helper and Inertia usePage/useForm (done in setup.ts, but custom mocks can be added here)
vi.mock('@/hooks/use-product-search', () => {
    return {
        useProductSearch: () => ({
            products: [
                {
                    id: 1,
                    code: 'PRD-001',
                    name: 'Test Coffee Product',
                    barcode: '12345678',
                    cost_price: '1000',
                    selling_price: '1500',
                    stock: 50,
                    branch_stocks: [
                        { branch_id: 1, quantity: 50, cost_price: '1000', selling_price: '1500' }
                    ]
                }
            ],
            search: vi.fn(),
            lookupBarcode: vi.fn(),
        }),
    };
});

describe('SaleCreate Integration Tests (POS Interface)', () => {
    const defaultProps = {
        branches: [
            { id: 1, name: 'Zabyuungpyaye Branch 1', is_active: true }
        ],
        customers: [
            { id: 1, code: 'CUST-001', name: 'Mg Mg', phone: '09123456789' }
        ],
        invoiceNo: 'INV-2026-0001'
    };

    it('should render the POS header, inputs, and empty cart message', () => {
        render(<SaleCreate {...defaultProps} />);

        // Verify title & main items exist
        expect(screen.getByPlaceholderText(/Search products/)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Scan barcode/)).toBeInTheDocument();

        // Verify Details labels exist
        expect(screen.getByText('Branch')).toBeInTheDocument();
        expect(screen.getByText('Customer')).toBeInTheDocument();
        expect(screen.getByText('Price Type')).toBeInTheDocument();

        // Verify empty cart message is displayed
        expect(screen.getByText('Cart is empty. Add products to start.')).toBeInTheDocument();

        // Verify summary calculations starting at 0
        expect(screen.getAllByText(/0 Ks/).length).toBeGreaterThan(0);
    });

    it('should handle Option 1: Add Notes / Remove Notes collapsible states correctly', async () => {
        render(<SaleCreate {...defaultProps} />);

        // Initially notes textarea should NOT be visible
        expect(screen.queryByPlaceholderText('Add sale notes...')).not.toBeInTheDocument();
        expect(screen.getByText('+ Add Notes')).toBeInTheDocument();

        // Click "+ Add Notes"
        fireEvent.click(screen.getByText('+ Add Notes'));

        // Textarea should now be visible
        const textarea = screen.getByPlaceholderText('Add sale notes...');
        expect(textarea).toBeInTheDocument();

        // Type inside notes textarea
        await userEvent.type(textarea, 'Deliver to home address');
        expect(textarea).toHaveValue('Deliver to home address');

        // Click "Remove Notes"
        fireEvent.click(screen.getByText('Remove Notes'));

        // Textarea should be hidden again
        expect(screen.queryByPlaceholderText('Add sale notes...')).not.toBeInTheDocument();
    });

    it('should default Price Type to Selling Price and render correctly', () => {
        render(<SaleCreate {...defaultProps} />);
        expect(screen.getAllByText('Selling Price').length).toBeGreaterThan(0);
    });
});
