import { LucideIcon } from 'lucide-react';

export interface Auth {
    user: User;
    is_impersonating: boolean;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    subItems?: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
}

export type Option = {
    value: string;
    label: string;
};

export interface SharedData {
    name: string;
    quote: { message: string; author: string };
    auth: Auth;
    flash: {
        success: string | null;
        error: string | null;
        warning: string | null;
        info: string | null;
    };
    [key: string]: unknown;
}

export interface Todo {
    id: number;
    name: string;
    content: string;
    status: string;
    creator_id: number;
    completed_at?: string;
    created_at: string;
    updated_at: string;
    deleted_at?: string;
    creator: User;
}

export interface User {
    id: number;
    name: string;
    email: string;
    avatar?: string;
    email_verified_at: string | null;
    branch_id?: number;
    branch?: Branch;
    created_at: string;
    updated_at: string;
    is_super_admin: boolean;
    main_role: string;
    can_do: string[];
    [key: string]: unknown;
}

// ============================================
// Entity Types - Shared across all pages
// ============================================

export interface Branch {
    id: number;
    name: string;
    code?: string;
    address?: string;
    phone?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Category {
    id: number;
    name: string;
    description?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Customer {
    id: number;
    name: string;
    code: string;
    phone?: string;
    email?: string;
    address?: string;
    credit_limit: number;
    current_balance: number;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Supplier {
    id: number;
    name: string;
    code: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface Group {
    id: number;
    name: string;
    code?: string;
    branch_id: number;
    branch?: Branch;
    description?: string;
    is_active?: boolean;
}

export interface BranchStock {
    id: number;
    product_id: number;
    branch_id: number;
    group_id?: number;
    group?: Group;
    quantity: number;
    cost_price?: string | null;
    selling_price?: string | null;
    product?: Product;
    branch?: Branch;
}

export interface Product {
    id: number;
    code: string;
    barcode?: string;
    name: string;
    description?: string;
    category_id: number;
    category?: Category;
    unit: string;
    cost_price: string;
    selling_price: string;
    tax_rate: string;
    low_stock_alert: number;
    is_active: boolean;
    stock?: number; // kept for backward compatibility if needed, but preferred to use branch_stocks
    branch_stocks?: BranchStock[];
    created_at?: string;
    updated_at?: string;
}

export interface SaleItem {
    id: number;
    sale_id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_price: number;
    discount_amount?: number;
    tax_rate?: number;
    tax_amount: number;
    subtotal: number;
}

export interface Sale {
    id: number;
    invoice_no: string;
    branch_id: number;
    branch?: Branch;
    customer_id?: number;
    customer?: Customer;
    sale_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    payment_method?: string;
    paid_amount: number;
    credit_amount: number;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    sale_items?: SaleItem[];
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}

export interface PurchaseItem {
    id: number;
    purchase_id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_cost: number;
    tax_rate?: number;
    tax_amount: number;
    subtotal: number;
}

export interface Purchase {
    id: number;
    purchase_no: string;
    branch_id: number;
    branch?: Branch;
    supplier_id?: number;
    supplier?: Supplier;
    purchase_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    payment_method?: string;
    paid_amount: number;
    credit_amount: number;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    purchase_items?: PurchaseItem[];
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
}

export interface StockMovement {
    id: number;
    branch_id: number;
    branch?: Branch;
    product_id: number;
    product?: Product;
    movement_type: 'sale' | 'purchase' | 'adjustment' | 'transfer' | 'return';
    quantity: number;
    quantity_before?: number;
    quantity_after?: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
}

export interface StockAdjustment {
    id: number;
    adjustment_no: string;
    branch_id: number;
    branch?: Branch;
    product_id: number;
    product?: Product;
    adjustment_date: string;
    adjustment_type: 'add' | 'subtract';
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reason: string;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
    updated_at?: string;
}

export interface CustomerPayment {
    id: number;
    payment_no: string;
    branch_id: number;
    branch?: Branch;
    customer_id: number;
    customer?: Customer;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_no?: string;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
    updated_at?: string;
}

export interface CustomerCreditLedger {
    id: number;
    customer_id: number;
    customer?: Customer;
    branch_id: number;
    branch?: Branch;
    transaction_date: string;
    transaction_type: 'credit' | 'debit' | 'payment';
    reference_type?: string;
    reference_id?: number;
    reference_no?: string;
    debit: number;
    credit: number;
    balance: number;
    description?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
}

export interface SaleReturn {
    id: number;
    return_no: string;
    branch_id: number;
    branch?: Branch;
    sale_id: number;
    sale?: Sale;
    customer_id?: number;
    customer?: Customer;
    return_date: string;
    total_amount: number;
    refund_amount: number;
    refund_method?: string;
    reason?: string;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    sale_return_items?: SaleReturnItem[];
    created_at?: string;
    updated_at?: string;
}

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface Meta {
    current_page: number;
    from: number;
    last_page: number;
    links: PaginationLink[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

export interface PaginatedData<T> {
    data: T[];
    links?: {
        first: string;
        last: string;
        prev: string | null;
        next: string | null;
    };
    meta?: Meta;
}

export type LaravelPaginator<T> = Meta & {
    data: T[];
    first_page_url: string;
    last_page_url: string;
    next_page_url: string | null;
    prev_page_url: string | null;
};

export interface SaleReturnItem {
    id: number;
    sale_return_id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

export interface Role {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
    updated_at: string;
}
