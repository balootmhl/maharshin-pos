import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, Purchase } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, ArrowUpDown, RefreshCw, Trash2, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchases',
        href: route('purchases.index'),
    },
    {
        title: 'Trash',
        href: route('purchases.trash'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const columns: ColumnDef<Purchase>[] = [
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
        accessorKey: 'purchase_no',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Purchase No
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-mono font-medium">{row.getValue('purchase_no')}</div>,
        filterFn: (row, id, value) => {
            const purchaseNo = row.getValue(id) as string;
            return purchaseNo.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'purchase_date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('purchase_date')}</div>,
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
    },
    {
        id: 'supplier',
        accessorKey: 'supplier.name',
        header: 'Supplier',
        cell: ({ row }) => <div>{row.original.supplier?.name || '-'}</div>,
        filterFn: (row, id, value) => {
            const supplierName = row.original.supplier?.name?.toLowerCase() || '';
            return supplierName.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('total_amount'))} Ks</div>,
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
                            if (confirm('Are you sure you want to restore this purchase? Stock will be re-added.')) {
                                router.post(route('purchases.restore', { purchase: row.original.id }));
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
                            if (confirm('Are you sure you want to PERMANENTLY delete this purchase? This action cannot be undone.')) {
                                router.visit(route('purchases.force-delete', { purchase: row.original.id }), {
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

// Filter Panel Component
function PurchaseFilterPanel({ table, onClearFilters }: FilterPanelProps<Purchase>) {
    const supplierColumn = table.getColumn('supplier');
    const supplierFilter = (supplierColumn?.getFilterValue() as string) || '';

    const hasActiveFilters = !!supplierFilter;

    return (
        <div className="space-y-4">
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            <div className="space-y-3">
                <Label className="text-sm font-medium">Supplier</Label>
                <Input
                    placeholder="Filter by supplier name..."
                    value={supplierFilter}
                    onChange={(e) => supplierColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>
        </div>
    );
}

export default function PurchaseTrash({ purchases }: { purchases: PaginatedData<Purchase> | LaravelPaginator<Purchase> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Trash Bin - Purchases" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between items-center">
                    <h2 className="text-lg font-semibold">Deleted Purchases</h2>
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('purchases.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Purchases
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={purchases}
                    columns={columns}
                    filterPanel={PurchaseFilterPanel}
                    searchColumn="purchase_no"
                    searchPlaceholder="Search purchase no..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
