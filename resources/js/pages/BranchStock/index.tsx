import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

type Branch = { id: number; name: string };
type Product = { id: number; name: string; code: string; low_stock_alert: number };

type BranchStock = {
    id: number;
    branch_id: number;
    branch?: Branch;
    product_id: number;
    product?: Product;
    quantity: number;
    reserved_quantity: number;
};

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
        accessorKey: 'product.code',
        header: 'Code',
        cell: ({ row }) => <div className="font-mono text-xs">{row.original.product?.code}</div>,
    },
    {
        accessorKey: 'product.name',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Product
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-medium">{row.original.product?.name}</div>,
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name}</div>,
    },
    {
        accessorKey: 'quantity',
        header: 'Quantity',
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
    },
    {
        accessorKey: 'reserved_quantity',
        header: 'Reserved',
        cell: ({ row }) => <div className="text-right font-mono">{row.getValue('reserved_quantity')}</div>,
    },
];

export default function BranchStockIndex({ branchStocks }: { branchStocks: BranchStock[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Levels" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <DataTable data={branchStocks} columns={columns} />
            </div>
        </AppLayout>
    );
}
