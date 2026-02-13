import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Customer, LaravelPaginator, PaginatedData } from '@/types';
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
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
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
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Phone
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
    },
    {
        accessorKey: 'current_balance',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Balance
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
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
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Credit Limit
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('credit_limit'))} Ks</div>,
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>{row.getValue('is_active') ? 'Active' : 'Inactive'}</Badge>
        ),
        filterFn: (row, id, value: string[]) => {
            // value is likely ["1"] or ["0"] from URL params/filters
            if (!value || value.length === 0) return true;
            const isActive = row.getValue(id);
            // Check if any filter value matches the active status (converted to string "1"/"0")
            return value.some((v) => (v === '1' && isActive) || (v === '0' && !isActive));
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
    // Status filter - mapped to URL param "filter[is_active]" which expects "1" or "0"
    const statusColumn = table.getColumn('is_active');
    // Using string array for status values ("1" for Active, "0" for Inactive)
    const statusFilter = (statusColumn?.getFilterValue() as string[]) || [];

    const toggleStatus = (statusValue: string) => {
        const current = [...statusFilter];
        const index = current.indexOf(statusValue);
        if (index === -1) {
            current.push(statusValue);
        } else {
            current.splice(index, 1);
        }
        statusColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    // Balance filter is confusing with server-side filtering unless we have a scope for it.
    // Assuming backend sorting on balance handles the "view" needs for now, or we rely on sort.
    // If strict filtering is needed, we'd add AllowedFilter::scope('has_balance') to backend.
    // For now, removing the client-side balance filter logic from panel to avoid confusion if backend doesn't support it yet,
    // OR just kept it disabled/visual. Let's keep it simple and focus on status.

    const hasActiveFilters = statusFilter.length > 0;

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
                        <Checkbox id="status-active" checked={statusFilter.includes('1')} onCheckedChange={() => toggleStatus('1')} />
                        <Label htmlFor="status-active" className="cursor-pointer text-sm font-normal">
                            Active
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-inactive" checked={statusFilter.includes('0')} onCheckedChange={() => toggleStatus('0')} />
                        <Label htmlFor="status-inactive" className="cursor-pointer text-sm font-normal">
                            Inactive
                        </Label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomerIndex({ customers }: { customers: PaginatedData<Customer> | LaravelPaginator<Customer> }) {
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
                    initialColumnVisibility={{ phone: true }}
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
