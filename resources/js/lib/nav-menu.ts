import { NavGroup, NavItem } from '@/types';
import { Banknote, BarChart3, Building2, LayoutGrid, Package, Settings2, ShoppingCart, Truck, Users, Users2, Warehouse } from 'lucide-react';

export const navMain: NavGroup[] = [
    {
        title: 'Dashboard',
        url: route('dashboard'),
        icon: LayoutGrid,
    },
    {
        title: 'POS',
        url: route('sales.create'),
        icon: ShoppingCart,
    },
    {
        title: 'Sales',
        url: '#',
        icon: Banknote,
        subItems: [
            {
                title: 'All Sales',
                url: route('sales.index'),
            },
            {
                title: 'Sale Returns',
                url: route('sale-returns.index'),
            },
        ],
    },
    {
        title: 'Purchases',
        url: '#',
        icon: Truck,
        subItems: [
            {
                title: 'All Purchases',
                url: route('purchases.index'),
            },
            {
                title: 'New Purchase',
                url: route('purchases.create'),
            },
        ],
    },
    {
        title: 'Inventory',
        url: '#',
        icon: Package,
        subItems: [
            {
                title: 'Products',
                url: route('products.index'),
            },
            {
                title: 'Categories',
                url: route('categories.index'),
            },
            {
                title: 'Stock Levels',
                url: route('branch-stocks.index'),
            },
            {
                title: 'Stock Movements',
                url: route('stock-movements.index'),
            },
        ],
    },
    {
        title: 'Customers',
        url: '#',
        icon: Users2,
        subItems: [
            {
                title: 'All Customers',
                url: route('customers.index'),
            },
            {
                title: 'Payments',
                url: route('customer-payments.index'),
            },
            {
                title: 'Credit Ledger',
                url: route('customer-credit-ledgers.index'),
            },
        ],
    },
    {
        title: 'Suppliers',
        url: route('suppliers.index'),
        icon: Warehouse,
    },
    {
        title: 'Reports',
        url: '#',
        icon: BarChart3,
        subItems: [
            {
                title: 'Sales Report',
                url: route('reports.sales'),
            },
            {
                title: 'Low Stock Report',
                url: route('reports.low-stock'),
            },
        ],
    },
    {
        title: 'Branches',
        url: route('branches.index'),
        icon: Building2,
    },
    {
        title: 'Users',
        url: route('users.index'),
        icon: Users,
    },
    {
        title: 'Settings',
        url: '#',
        icon: Settings2,
        subItems: [
            {
                title: 'General Settings',
                url: route('settings.index'),
            },
            {
                title: 'Roles & Permissions',
                url: route('roles.index'),
            },
        ],
    },
];

export const navFooter: NavItem[] = [];
