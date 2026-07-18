import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, Sale } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, ArrowUpDown, RefreshCw, Trash2, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: route('sales.index'),
    },
    {
        title: 'Trash',
        href: route('sales.trash'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const columns: ColumnDef<Sale>[] = [
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
        accessorKey: 'invoice_no',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Invoice
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('invoice_no')}</div>,
        filterFn: (row, id, value) => {
            const invoiceNo = row.getValue(id) as string;
            return invoiceNo.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'sale_date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('sale_date')}</div>,
        filterFn: (row, id, value: { start?: string; end?: string }) => {
            const dateStr = row.getValue(id) as string;
            // Normalize date format: convert 2025/11/18 to 2025-11-18 for comparison
            const normalizedDate = dateStr.replace(/\//g, '-');
            if (!value.start && !value.end) return true;
            if (value.start && normalizedDate < value.start) return false;
            if (value.end && normalizedDate > value.end) return false;
            return true;
        },
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
    },
    {
        id: 'customer',
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }) => <div>{row.original.customer?.name || 'Walk-in'}</div>,
        filterFn: (row, id, value) => {
            const customerName = row.original.customer?.name?.toLowerCase() || 'walk-in';
            return customerName.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('total_amount'))} Ks</div>,
        filterFn: (row, id, value: { min?: number; max?: number }) => {
            const amount = row.getValue(id) as number;
            if (value.min !== undefined && amount < value.min) return false;
            if (value.max !== undefined && amount > value.max) return false;
            return true;
        },
    },
    {
        accessorKey: 'deleted_at',
        header: 'Deleted At',
        cell: ({ row }) => <div className="text-muted-foreground text-xs">{new Date(row.original.deleted_at!).toLocaleString()}</div>,
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            return (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Restore"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => {
                            if (confirm('Are you sure you want to restore this sale? Stock will be re-deducted.')) {
                                router.post(route('sales.restore', { sale: row.original.id }));
                            }
                        }}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Permanently Delete"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => {
                            if (confirm('Are you sure you want to PERMANENTLY delete this sale? This action cannot be undone.')) {
                                router.visit(route('sales.force-delete', { sale: row.original.id }), {
                                    method: 'delete',
                                });
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            );
        },
    },
];

// Filter Panel Component (Reusing similar logic)
function SalesFilterPanel({ table, onClearFilters }: FilterPanelProps<Sale>) {
    // Customer filter
    const customerColumn = table.getColumn('customer');
    const customerFilter = (customerColumn?.getFilterValue() as string) || '';

    // Date range filter
    const dateColumn = table.getColumn('sale_date');
    const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

    const hasActiveFilters = customerFilter || dateFilter.start || dateFilter.end;

    return (
        <div className="space-y-4">
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            <div className="space-y-3">
                <Label className="text-sm font-medium">Customer</Label>
                <Input
                    placeholder="Filter by customer name..."
                    value={customerFilter}
                    onChange={(e) => customerColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>

            <Separator />

            <div className="space-y-3">
                <Label className="text-sm font-medium">Date Range</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">From</Label>
                        <Input
                            type="date"
                            value={dateFilter.start || ''}
                            onChange={(e) => dateColumn?.setFilterValue({ ...dateFilter, start: e.target.value || undefined })}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">To</Label>
                        <Input
                            type="date"
                            value={dateFilter.end || ''}
                            onChange={(e) => dateColumn?.setFilterValue({ ...dateFilter, end: e.target.value || undefined })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SaleTrash({ sales }: { sales: PaginatedData<Sale> | LaravelPaginator<Sale> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trash Bin - Sales" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row items-center justify-between">
                    <h2 className="text-lg font-semibold">Deleted Sales</h2>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('sales.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sales
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={sales}
                    columns={columns}
                    filterPanel={SalesFilterPanel}
                    searchColumn="invoice_no"
                    searchPlaceholder="Search invoice..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
