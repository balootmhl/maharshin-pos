import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, StockAdjustment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Plus, X } from 'lucide-react';

type Reasons = Record<string, string>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '#',
    },
    {
        title: 'Stock Adjustments',
        href: route('stock-adjustments.index'),
    },
];

// Helper to access static reasons from the component
let staticReasons: Reasons = {};

// Filter Panel Component
function StockAdjustmentFilterPanel({ table, onClearFilters }: FilterPanelProps<StockAdjustment>) {
    // Type filter
    const typeColumn = table.getColumn('adjustment_type');
    const typeFilter = (typeColumn?.getFilterValue() as string) || 'all';

    // Reason filter
    const reasonColumn = table.getColumn('reason');
    const reasonFilter = (reasonColumn?.getFilterValue() as string) || 'all';

    // Product filter
    const productColumn = table.getColumn('product.name');
    const productFilter = (productColumn?.getFilterValue() as string) || '';

    // Branch filter
    const branchColumn = table.getColumn('branch.name');
    const branchFilter = (branchColumn?.getFilterValue() as string) || '';

    // Date range filter
    const dateColumn = table.getColumn('adjustment_date');
    const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

    const hasActiveFilters =
        typeFilter !== 'all' ||
        reasonFilter !== 'all' ||
        productFilter ||
        branchFilter ||
        dateFilter.start ||
        dateFilter.end;

    return (
        <div className="space-y-4">
            {/* Clear All Button */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            {/* Type Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Adjustment Type</Label>
                <Select value={typeFilter} onValueChange={(value) => typeColumn?.setFilterValue(value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="add">Add (+)</SelectItem>
                        <SelectItem value="subtract">Subtract (-)</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Reason Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Reason</Label>
                <Select value={reasonFilter} onValueChange={(value) => reasonColumn?.setFilterValue(value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Reasons" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Reasons</SelectItem>
                        {Object.entries(staticReasons).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {/* Product Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Product</Label>
                <Input
                    placeholder="Filter by product name/code..."
                    value={productFilter}
                    onChange={(e) => productColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>

            <Separator />

            {/* Branch Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Branch</Label>
                <Input
                    placeholder="Filter by branch name..."
                    value={branchFilter}
                    onChange={(e) => branchColumn?.setFilterValue(e.target.value || undefined)}
                />
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
        </div>
    );
}

export default function StockAdjustmentIndex({
    stockAdjustments,
    reasons,
}: {
    stockAdjustments: PaginatedData<StockAdjustment> | LaravelPaginator<StockAdjustment>;
    reasons: Reasons;
}) {
    // Update static reasons for the filter panel
    staticReasons = reasons;

    const columns: ColumnDef<StockAdjustment>[] = [
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
            accessorKey: 'adjustment_no',
            header: ({ column }) => {
                return (
                    <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                        Adjustment No
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => <div className="font-mono text-sm">{row.getValue('adjustment_no')}</div>,
            filterFn: (row, id, value) => {
                const adjNo = row.getValue(id) as string;
                return adjNo.toLowerCase().includes(value.toLowerCase());
            },
        },
        {
            accessorKey: 'adjustment_date',
            header: 'Date',
            cell: ({ row }) => <div className="text-sm">{row.getValue('adjustment_date')}</div>,
            filterFn: (row, id, value: { start?: string; end?: string }) => {
                const dateStr = row.getValue(id) as string;
                const normalizedDate = dateStr.replace(/\//g, '-');
                if (!value.start && !value.end) return true;
                if (value.start && normalizedDate < value.start) return false;
                if (value.end && normalizedDate > value.end) return false;
                return true;
            },
        },
        {
            accessorKey: 'product.name',
            header: 'Product',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium font-mono">{row.original.product?.code}</div>
                    <div className="text-muted-foreground text-xs">{row.original.product?.name}</div>
                </div>
            ),
            filterFn: (row, id, value) => {
                const productName = row.original.product?.name?.toLowerCase() || '';
                const productCode = row.original.product?.code?.toLowerCase() || '';
                const filterValue = value.toLowerCase();
                return productName.includes(filterValue) || productCode.includes(filterValue);
            },
        },
        {
            accessorKey: 'branch.name',
            header: 'Branch',
            cell: ({ row }) => <div>{row.original.branch?.name}</div>,
            filterFn: (row, id, value) => {
                const branchName = row.original.branch?.name?.toLowerCase() || '';
                return branchName.includes(value.toLowerCase());
            },
        },
        {
            accessorKey: 'adjustment_type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue('adjustment_type') as string;
                return <Badge variant={type === 'add' ? 'default' : 'destructive'}>{type === 'add' ? '+ Add' : '- Subtract'}</Badge>;
            },
            filterFn: (row, id, value) => {
                return value === row.getValue(id);
            },
        },
        {
            accessorKey: 'quantity',
            header: 'Qty',
            cell: ({ row }) => {
                const type = row.original.adjustment_type;
                const qty = row.getValue('quantity') as number;
                return (
                    <div className={`text-right font-mono font-medium ${type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                        {type === 'add' ? '+' : '-'}
                        {qty}
                    </div>
                );
            },
        },
        {
            accessorKey: 'quantity_after',
            header: 'Balance',
            cell: ({ row }) => <div className="text-right font-mono">{row.getValue('quantity_after')}</div>,
        },
        {
            accessorKey: 'reason',
            header: 'Reason',
            cell: ({ row }) => <div className="text-sm">{reasons[row.getValue('reason') as string] || row.getValue('reason')}</div>,
            filterFn: (row, id, value) => {
                return value === row.getValue(id);
            },
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <Button variant="ghost" size="sm" asChild>
                    <Link href={route('stock-adjustments.show', { stock_adjustment: row.original.id })}>
                        <Eye className="h-4 w-4" />
                    </Link>
                </Button>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Adjustments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <div className="flex-1" /> {/* Spacer to push button to right if search is not needed here or used inside DataTable */}
                    <Button asChild>
                        <Link href={route('stock-adjustments.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Adjustment
                        </Link>
                    </Button>
                </div>
                <DataTable
                    data={stockAdjustments}
                    columns={columns}
                    filterPanel={StockAdjustmentFilterPanel}
                    searchColumn="adjustment_no"
                    searchPlaceholder="Search adjustment no..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
