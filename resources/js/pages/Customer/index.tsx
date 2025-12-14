import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Customer } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: route('customers.index'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const columns: ColumnDef<Customer>[] = [
    {
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && 'indeterminate')}
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: 'code',
        header: 'Code',
        cell: ({ row }) => <div className="font-mono">{row.getValue('code')}</div>,
        filterFn: (row, id, value) => {
            const code = row.getValue(id) as string;
            return code.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <Link
                className="text-link font-medium"
                href={route('customers.show', {
                    customer: row.original.id,
                })}
            >
                {row.getValue('name')}
            </Link>
        ),
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
    },
    {
        accessorKey: 'current_balance',
        header: 'Balance',
        cell: ({ row }) => {
            const balance = row.getValue('current_balance') as number;
            return <div className={`text-right font-mono ${balance > 0 ? 'text-red-600' : ''}`}>{formatCurrency(balance)} Ks</div>;
        },
        filterFn: (row, id, value: { hasBalance?: boolean }) => {
            if (!value.hasBalance) return true;
            const balance = row.getValue(id) as number;
            return balance > 0;
        },
    },
    {
        accessorKey: 'credit_limit',
        header: 'Credit Limit',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('credit_limit'))} Ks</div>,
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>{row.getValue('is_active') ? 'Active' : 'Inactive'}</Badge>
        ),
        filterFn: (row, id, value: boolean[]) => {
            if (!value || value.length === 0 || value.length === 2) return true;
            return value.includes(row.getValue(id) as boolean);
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { customer: row.original.id };
            return <DataTableActions routePrefix="customers" routeParam={param} />;
        },
    },
];

// Filter Panel Component
function CustomerFilterPanel({ table, onClearFilters }: FilterPanelProps<Customer>) {
    // Status filter
    const statusColumn = table.getColumn('is_active');
    const statusFilter = (statusColumn?.getFilterValue() as boolean[]) || [];

    const toggleStatus = (isActive: boolean) => {
        const current = [...statusFilter];
        const index = current.indexOf(isActive);
        if (index === -1) {
            current.push(isActive);
        } else {
            current.splice(index, 1);
        }
        statusColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    // Balance filter
    const balanceColumn = table.getColumn('current_balance');
    const balanceFilter = (balanceColumn?.getFilterValue() as { hasBalance?: boolean }) || {};

    const hasActiveFilters = statusFilter.length > 0 || balanceFilter.hasBalance;

    return (
        <div className="space-y-4">
            {/* Clear All Button */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            {/* Status Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-active" checked={statusFilter.includes(true)} onCheckedChange={() => toggleStatus(true)} />
                        <Label htmlFor="status-active" className="cursor-pointer text-sm font-normal">
                            Active
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-inactive" checked={statusFilter.includes(false)} onCheckedChange={() => toggleStatus(false)} />
                        <Label htmlFor="status-inactive" className="cursor-pointer text-sm font-normal">
                            Inactive
                        </Label>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Balance Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Balance</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="has-balance"
                        checked={balanceFilter.hasBalance || false}
                        onCheckedChange={(checked) => balanceColumn?.setFilterValue(checked ? { hasBalance: true } : undefined)}
                    />
                    <Label htmlFor="has-balance" className="cursor-pointer text-sm font-normal">
                        Has outstanding balance
                    </Label>
                </div>
            </div>
        </div>
    );
}

export default function CustomerIndex({ customers }: { customers: Customer[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customers" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('customers.create')} />
                </div>
                <DataTable
                    data={customers}
                    columns={columns}
                    filterPanel={CustomerFilterPanel}
                    searchColumn="name"
                    searchPlaceholder="Search customer..."
                />
            </div>
        </AppLayout>
    );
}
