import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BranchStock, BreadcrumbItem, LaravelPaginator, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '#',
    },
    {
        title: 'Stock Levels',
        href: route('branch-stocks.index'),
    },
];

const columns: ColumnDef<BranchStock>[] = [
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
        id: 'product_code',
        accessorKey: 'product.code',
        header: 'Code',
        cell: ({ row }) => <div className="font-mono text-sm font-bold">{row.original.product?.code}</div>,
    },
    {
        id: 'product_name',
        accessorFn: (row) => row.product?.name ?? '',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Product
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="text-muted-foreground text-xs">{row.original.product?.name}</div>,
    },
    {
        id: 'branch_name',
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name}</div>,
    },
    {
        accessorKey: 'quantity',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Quantity
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const qty = row.getValue('quantity') as number;
            const lowAlert = row.original.product?.low_stock_alert || 0;
            const isLow = qty <= lowAlert;
            return (
                <div className={`text-right font-mono font-medium ${isLow ? 'text-red-600' : ''}`}>
                    {qty}
                    {isLow && (
                        <Badge variant="destructive" className="ml-2">
                            Low
                        </Badge>
                    )}
                </div>
            );
        },
        filterFn: (row, id, value: { lowStock?: boolean }) => {
            // We rely on backend filtering for scope 'low_stock', but if we did client side:
            if (!value.lowStock) return true;
            const qty = row.getValue(id) as number;
            const lowAlert = row.original.product?.low_stock_alert || 0;
            return qty <= lowAlert;
        },
    },
    {
        accessorKey: 'reserved_quantity',
        header: 'Reserved',
        cell: ({ row }) => <div className="text-right font-mono">{row.getValue('reserved_quantity')}</div>,
    },
];

// Filter Panel Component
function BranchStockFilterPanel({ table, onClearFilters }: FilterPanelProps<BranchStock>) {
    // Low Stock filter
    const lowStockColumn = table.getColumn('low_stock');
    const isLowStock = lowStockColumn?.getFilterValue() === '1';

    return (
        <div className="space-y-4">
            {/* Clear All Button */}
            {isLowStock && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            <div className="space-y-3">
                <Label className="text-sm font-medium">Stock Status</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="low-stock"
                        checked={isLowStock}
                        onCheckedChange={(checked) => {
                            // We set '1' for true, or undefined to clear
                            lowStockColumn?.setFilterValue(checked ? '1' : undefined);
                        }}
                    />
                    <Label htmlFor="low-stock" className="cursor-pointer text-sm font-normal">
                        Low Stock Only
                    </Label>
                </div>
            </div>
            <Separator />
        </div>
    );
}

export default function BranchStockIndex({ branchStocks }: { branchStocks: PaginatedData<BranchStock> | LaravelPaginator<BranchStock> }) {
    // Add hidden low_stock column for filtering purposes
    const tableColumns = [
        ...columns,
        {
            id: 'low_stock',
            enableHiding: true,
            header: 'Low Stock', // Won't show if we hide it via initial visibility
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Levels" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <DataTable
                    data={branchStocks}
                    columns={tableColumns}
                    filterPanel={BranchStockFilterPanel}
                    searchColumn="product_name"
                    searchPlaceholder="Filter by product name..."
                    initialColumnVisibility={{ low_stock: false }}
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
