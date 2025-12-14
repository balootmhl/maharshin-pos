import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, StockAdjustment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Eye, Plus } from 'lucide-react';

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

export default function StockAdjustmentIndex({ stockAdjustments, reasons }: { stockAdjustments: StockAdjustment[]; reasons: Reasons }) {
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
        },
        {
            accessorKey: 'adjustment_date',
            header: 'Date',
            cell: ({ row }) => <div className="text-sm">{row.getValue('adjustment_date')}</div>,
        },
        {
            accessorKey: 'product.name',
            header: 'Product',
            cell: ({ row }) => (
                <div>
                    <div className="font-medium">{row.original.product?.name}</div>
                    <div className="text-muted-foreground font-mono text-xs">{row.original.product?.code}</div>
                </div>
            ),
        },
        {
            accessorKey: 'branch.name',
            header: 'Branch',
            cell: ({ row }) => <div>{row.original.branch?.name}</div>,
        },
        {
            accessorKey: 'adjustment_type',
            header: 'Type',
            cell: ({ row }) => {
                const type = row.getValue('adjustment_type') as string;
                return <Badge variant={type === 'add' ? 'default' : 'destructive'}>{type === 'add' ? '+ Add' : '- Subtract'}</Badge>;
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
                <div className="flex justify-end">
                    <Button asChild>
                        <Link href={route('stock-adjustments.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            New Adjustment
                        </Link>
                    </Button>
                </div>
                <DataTable data={stockAdjustments} columns={columns} />
            </div>
        </AppLayout>
    );
}
