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
type Product = { id: number; name: string; code: string };
type User = { id: number; name: string };

type StockMovement = {
    id: number;
    branch_id: number;
    branch?: Branch;
    product_id: number;
    product?: Product;
    movement_type: string;
    quantity: number;
    quantity_before: number;
    quantity_after: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
};

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
        accessorKey: 'movement_type',
        header: 'Type',
        cell: ({ row }) => (
            <Badge variant={getMovementTypeVariant(row.getValue('movement_type'))}>
                {(row.getValue('movement_type') as string).charAt(0).toUpperCase() + (row.getValue('movement_type') as string).slice(1)}
            </Badge>
        ),
    },
    {
        accessorKey: 'quantity',
        header: 'Qty Change',
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

export default function StockMovementIndex({ stockMovements }: { stockMovements: StockMovement[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock Movements" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <DataTable data={stockMovements} columns={columns} />
            </div>
        </AppLayout>
    );
}
