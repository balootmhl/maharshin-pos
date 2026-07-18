import { describe, expect, it } from 'vitest';

// The currency formatting utility used across the system
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

describe('Currency Formatting Utility Unit Tests', () => {
    it('should format whole numbers with commas as thousands separators', () => {
        expect(formatCurrency(1000)).toBe('1,000');
        expect(formatCurrency(1000000)).toBe('1,000,000');
        expect(formatCurrency(500)).toBe('500');
    });

    it('should round decimal numbers to the nearest whole integer', () => {
        expect(formatCurrency(1000.4)).toBe('1,000');
        expect(formatCurrency(1000.6)).toBe('1,001');
        expect(formatCurrency(999.99)).toBe('1,000');
    });

    it('should handle zero and negative values correctly', () => {
        expect(formatCurrency(0)).toBe('0');
        expect(formatCurrency(-1250)).toBe('-1,250');
        expect(formatCurrency(-0.1)).toBe('-0'); // standard js number format behavior
    });
});
