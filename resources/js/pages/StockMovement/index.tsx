import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, StockMovement } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '#',
    },
    {
        title: 'Stock Movements',
        href: route('stock-movements.index'),
    },
];

const getMovementTypeVariant = (type: string) => {
    switch (type) {
        case 'purchase':
            return 'default';
        case 'sale':
            return 'secondary';
        case 'return':
            return 'outline';
        case 'adjustment':
            return 'destructive';
        case 'transfer':
            return 'outline';
        default:
            return 'secondary';
    }
};

const columns: ColumnDef<StockMovement>[] = [
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
        accessorKey: 'created_at',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="text-sm">{row.getValue('created_at')}</div>,
        filterFn: (row, id, value: { start?: string; end?: string }) => {
            const dateStr = row.getValue(id) as string;
            if (!value.start && !value.end) return true;
            const date = new Date(dateStr);
            if (value.start && date < new Date(value.start)) return false;
            if (value.end && date > new Date(value.end)) return false;
            return true;
        },
    },
    {
        accessorKey: 'product.name',
        header: 'Product',
        cell: ({ row }) => (
            <div>
                <div className="font-mono font-medium">{row.original.product?.code}</div>
                <div className="text-muted-foreground text-xs">{row.original.product?.name}</div>
            </div>
        ),
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name}</div>,
    },
    {
        accessorKey: 'movement_type',
        header: 'Type',
        cell: ({ row }) => (
            <Badge variant={getMovementTypeVariant(row.getValue('movement_type'))}>
                {(row.getValue('movement_type') as string).charAt(0).toUpperCase() + (row.getValue('movement_type') as string).slice(1)}
            </Badge>
        ),
        filterFn: (row, id, value) => {
            return value === row.getValue(id);
        },
    },
    {
        accessorKey: 'quantity',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Qty Change
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const qty = row.getValue('quantity') as number;
            return (
                <div className={`text-right font-mono font-medium ${qty >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {qty >= 0 ? '+' : ''}
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
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <div className="text-muted-foreground max-w-xs truncate text-sm">{row.getValue('notes') || '-'}</div>,
    },
];

// Filter Panel Component
function StockMovementFilterPanel({ table, onClearFilters }: FilterPanelProps<StockMovement>) {
    const dateColumn = table.getColumn('created_at');
    const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

    const typeColumn = table.getColumn('movement_type');
    const typeFilter = (typeColumn?.getFilterValue() as string) || 'all';

    const hasActiveFilters = dateFilter.start || dateFilter.end || (typeFilter && typeFilter !== 'all');

    return (
        <div className="space-y-4">
            {/* Clear All Button */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

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

            {/* Movement Type Filter */}
            <div className="space-y-2">
                <Label className="text-sm font-medium">Movement Type</Label>
                <Select value={typeFilter} onValueChange={(value) => typeColumn?.setFilterValue(value === 'all' ? undefined : value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="sale">Sale</SelectItem>
                        <SelectItem value="purchase">Purchase</SelectItem>
                        <SelectItem value="adjustment">Adjustment</SelectItem>
                        <SelectItem value="transfer">Transfer</SelectItem>
                        <SelectItem value="return">Return</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />
        </div>
    );
}

export default function StockMovementIndex({ stockMovements }: { stockMovements: PaginatedData<StockMovement> | LaravelPaginator<StockMovement> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Movements" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <DataTable
                    data={stockMovements}
                    columns={columns}
                    filterPanel={StockMovementFilterPanel}
                    searchColumn="product.name"
                    searchPlaceholder="Filter by product..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
