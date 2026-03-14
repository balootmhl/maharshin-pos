import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useDirectPrint } from '@/hooks/use-direct-print';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, Purchase } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Edit, Printer, Trash2, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchases',
        href: route('purchases.index'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getPaymentStatusVariant = (status: string) => {
    switch (status) {
        case 'paid':
            return 'default';
        case 'partial':
            return 'outline';
        case 'unpaid':
            return 'destructive';
        default:
            return 'secondary';
    }
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
        cell: ({ row }) => (
            <Link
                className="text-link font-mono font-medium"
                href={route('purchases.show', {
                    purchase: row.original.id,
                })}
            >
                {row.getValue('purchase_no')}
            </Link>
        ),
        filterFn: (row, id, value) => {
            const purchaseNo = row.getValue(id) as string;
            return purchaseNo.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'purchase_date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('purchase_date')}</div>,
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
        filterFn: (row, id, value: { min?: number; max?: number }) => {
            const amount = row.getValue(id) as number;
            if (value.min !== undefined && amount < value.min) return false;
            if (value.max !== undefined && amount > value.max) return false;
            return true;
        },
    },
    {
        accessorKey: 'payment_status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={getPaymentStatusVariant(row.getValue('payment_status'))}>
                {(row.getValue('payment_status') as string).charAt(0).toUpperCase() + (row.getValue('payment_status') as string).slice(1)}
            </Badge>
        ),
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            return value.includes(row.getValue(id) as string);
        },
    },
    // Hidden column for product filtering (searches name and code)
    {
        id: 'products',
        accessorFn: (row) =>
            row.purchase_items?.map((item) => `${item.product?.name?.toLowerCase()} ${item.product?.code?.toLowerCase()}`).join(' ') || '',
        enableHiding: true,
        filterFn: (row, id, value) => {
            const productData = row.getValue(id) as string;
            return productData.includes(value.toLowerCase());
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => <ActionsCell row={row} />,
    },
];

// Filter Panel Component
function PurchaseFilterPanel({ table, onClearFilters }: FilterPanelProps<Purchase>) {
    // Status filter
    const statusColumn = table.getColumn('payment_status');
    const statusFilter = (statusColumn?.getFilterValue() as string[]) || [];

    const toggleStatus = (status: string) => {
        const current = [...statusFilter];
        const index = current.indexOf(status);
        if (index === -1) {
            current.push(status);
        } else {
            current.splice(index, 1);
        }
        statusColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    // Supplier filter
    const supplierColumn = table.getColumn('supplier');
    const supplierFilter = (supplierColumn?.getFilterValue() as string) || '';

    // Product filter
    const productColumn = table.getColumn('products');
    const productFilter = (productColumn?.getFilterValue() as string) || '';

    // Date range filter
    const dateColumn = table.getColumn('purchase_date');
    const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

    // Amount range filter
    const amountColumn = table.getColumn('total_amount');
    const amountFilter = (amountColumn?.getFilterValue() as { min?: number; max?: number }) || {};

    const hasActiveFilters =
        statusFilter.length > 0 || supplierFilter || productFilter || dateFilter.start || dateFilter.end || amountFilter.min || amountFilter.max;

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
                <Label className="text-sm font-medium">Payment Status</Label>
                <div className="space-y-2">
                    {['paid', 'partial', 'unpaid'].map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                            <Checkbox id={`status-${status}`} checked={statusFilter.includes(status)} onCheckedChange={() => toggleStatus(status)} />
                            <Label htmlFor={`status-${status}`} className="cursor-pointer text-sm font-normal capitalize">
                                {status}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Supplier Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Supplier</Label>
                <Input
                    placeholder="Filter by supplier name..."
                    value={supplierFilter}
                    onChange={(e) => supplierColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>

            <Separator />

            {/* Product Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Product</Label>
                <Input
                    placeholder="Filter by name or code..."
                    value={productFilter}
                    onChange={(e) => productColumn?.setFilterValue(e.target.value || undefined)}
                />
                <p className="text-muted-foreground text-xs">Search by product name or code</p>
            </div>

            <Separator />

            {/* Date Range Filter */}
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

            <Separator />

            {/* Amount Range Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Min</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={amountFilter.min || ''}
                            onChange={(e) =>
                                amountColumn?.setFilterValue({ ...amountFilter, min: e.target.value ? Number(e.target.value) : undefined })
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Max</Label>
                        <Input
                            type="number"
                            placeholder="999999"
                            value={amountFilter.max || ''}
                            onChange={(e) =>
                                amountColumn?.setFilterValue({ ...amountFilter, max: e.target.value ? Number(e.target.value) : undefined })
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}



const ActionsCell = ({ row }: { row: { original: Purchase } }) => {
    const { printUrl } = useDirectPrint();
    const { props } = usePage();
    const editTimeLimitEnabled = props.edit_time_limit_enabled ?? true;
    const editTimeLimitDays = props.edit_time_limit_days as number ?? 3;

    // Check if purchase edit time has passed
    const canEdit = row.original.created_at ? (
        !editTimeLimitEnabled || new Date(row.original.created_at) > new Date(Date.now() - editTimeLimitDays * 24 * 60 * 60 * 1000)
    ) : false;

    return (
        <div className="flex items-center gap-1">
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Printer className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Print Invoice</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => printUrl(route('purchases.print', { purchase: row.original.id, format: 'a4' }))}>
                        Print A4
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => printUrl(route('purchases.print', { purchase: row.original.id, format: 'a5' }))}>
                        Print A5
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => printUrl(route('purchases.print', { purchase: row.original.id, format: 'thermal' }))}>
                        Print Thermal
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {canEdit && (
                <>
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('purchases.edit', { purchase: row.original.id })}>
                            <Edit className="h-4 w-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => {
                            if (confirm('Are you sure you want to delete this purchase? This action cannot be undone.')) {
                                router.visit(route('purchases.destroy', { purchase: row.original.id }), {
                                    method: 'delete',
                                });
                            }
                        }}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </>
            )}
        </div>
    );
};

export default function PurchaseIndex({ purchases }: { purchases: PaginatedData<Purchase> | LaravelPaginator<Purchase> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Purchases" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between gap-2">
                    <CreateBtn route={route('purchases.create')} />
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('purchases.trash')}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Trash Bin
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={purchases}
                    columns={columns}
                    filterPanel={PurchaseFilterPanel}
                    searchColumn="purchase_no"
                    searchPlaceholder="Search purchase..."
                    initialColumnVisibility={{ products: false }}
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
