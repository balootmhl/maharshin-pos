import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Product } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';
import { useMemo } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: route('products.index'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

// Static columns that don't depend on branches
const baseColumns: ColumnDef<Product>[] = [
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
        header: 'Code',
        cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('code')}</div>,
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
                href={route('products.show', {
                    product: row.original.id,
                })}
            >
                {row.getValue('name')}
            </Link>
        ),
    },
    {
        accessorKey: 'category.name',
        header: 'Category',
        cell: ({ row }) => <div>{row.original.category?.name || '-'}</div>,
    },
    {
        accessorKey: 'cost_price',
        header: 'Cost',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('cost_price'))}</div>,
    },
    {
        accessorKey: 'selling_price',
        header: 'Price',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('selling_price'))}</div>,
    },
];

// Post-branch columns (status and actions)
const endColumns: ColumnDef<Product>[] = [
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>{row.getValue('is_active') ? 'Active' : 'Inactive'}</Badge>
        ),
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { product: row.original.id };
            return <DataTableActions routePrefix="products" routeParam={param} />;
        },
    },
];

// Generate branch-specific columns
const createBranchColumns = (branches: Branch[]): ColumnDef<Product>[] => {
    return branches.map((branch) => ({
        id: `branch_${branch.id}`,
        header: () => (
            <div className="text-center">
                <div className="font-semibold">{branch.name}</div>
                <div className="text-muted-foreground text-xs">Stock / Group</div>
            </div>
        ),
        cell: ({ row }) => {
            const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
            const quantity = branchStock?.quantity ?? 0;
            const groupName = branchStock?.group?.name;
            const isLowStock = row.original.low_stock_alert && quantity <= row.original.low_stock_alert;

            return (
                <div className="text-center">
                    <div className={`font-mono font-medium ${isLowStock ? 'text-red-600' : ''}`}>
                        {quantity}
                        {isLowStock && (
                            <Badge variant="destructive" className="ml-1 text-[10px]">
                                Low
                            </Badge>
                        )}
                    </div>
                    {groupName ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="text-muted-foreground max-w-[80px] cursor-help truncate text-xs">{groupName}</div>
                            </TooltipTrigger>
                            <TooltipContent>{groupName}</TooltipContent>
                        </Tooltip>
                    ) : (
                        <div className="text-muted-foreground text-xs">-</div>
                    )}
                </div>
            );
        },
    }));
};

export default function ProductIndex({ products, branches }: { products: Product[]; branches: Branch[] }) {
    // Memoize columns to avoid recalculation on every render
    const columns = useMemo(() => {
        const branchColumns = createBranchColumns(branches);
        return [...baseColumns, ...branchColumns, ...endColumns];
    }, [branches]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('products.create')} />
                </div>
                <DataTable data={products} columns={columns} />
            </div>
        </AppLayout>
    );
}
