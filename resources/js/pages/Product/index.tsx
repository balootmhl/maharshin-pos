import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, Product, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';
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

// Helper to get total stock for a product
// const getTotalStock = (product: Product): number => {
//     if (!product.branch_stocks?.length) return 0;
//     return product.branch_stocks.reduce((sum, bs) => sum + (bs.quantity ?? 0), 0);
// };

// Stock level classification
// const getStockLevel = (product: Product): 'out' | 'low' | 'in' => {
//     const total = getTotalStock(product);
//     if (total === 0) return 'out';
//     if (product.low_stock_alert && total <= product.low_stock_alert) return 'low';
//     return 'in';
// };

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
        cell: ({ row }) => <div className="font-mono text-xs text-muted-foreground">{row.getValue('code')}</div>,
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
                className="text-link font-medium hover:underline"
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
        cell: ({ row }) => {
            const categoryName = row.original.category?.name;
            return categoryName ? (
                <Badge variant="outline" className="font-normal">{categoryName}</Badge>
            ) : (
                <span className="text-muted-foreground">-</span>
            );
        },
        filterFn: (row, _id, value: string[]) => {
            if (!value || value.length === 0) return true;
            return value.includes(row.original.category?.name || '');
        },
    },
    {
        accessorKey: 'cost_price',
        header: () => <div className="text-right">Cost</div>,
        cell: ({ row }) => <div className="text-right font-mono tabular-nums">{formatCurrency(Number(row.getValue('cost_price')))} Ks</div>,
    },
    {
        accessorKey: 'selling_price',
        header: () => <div className="text-right">Selling Price</div>,
        cell: ({ row }) => <div className="text-right font-mono tabular-nums font-medium">{formatCurrency(Number(row.getValue('selling_price')))} Ks</div>,
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
        filterFn: (row, _id, value: boolean[]) => {
            if (!value || value.length === 0 || value.length === 2) return true;
            return value.includes(row.getValue('is_active') as boolean);
        },
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

// Generate branch-specific columns (stock/group + cost/price in same cell)
const createBranchColumns = (branches: Branch[]): ColumnDef<Product>[] => {
    return branches.map((branch) => ({
        id: `branch_${branch.id}_stock`,
        header: () => (
            <div className="text-center">
                <div className="font-semibold">{branch.name}</div>
                <div className="text-muted-foreground text-xs">Stock / Group / Price</div>
            </div>
        ),
        cell: ({ row }) => {
            const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
            const quantity = branchStock?.quantity ?? 0;
            const groupName = branchStock?.group?.name;
            const isLowStock = row.original.low_stock_alert && quantity <= row.original.low_stock_alert;
            const isOutOfStock = quantity === 0;

            // Branch-specific prices
            const branchCost = branchStock?.cost_price;
            const branchSell = branchStock?.selling_price;
            const hasBranchPrice = branchCost !== null && branchCost !== undefined
                || branchSell !== null && branchSell !== undefined;

            return (
                <div className="text-center">
                    <div className={`inline-flex items-center gap-1 font-mono font-medium tabular-nums ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-orange-500' : 'text-green-600'}`}>
                        {quantity}
                        {isOutOfStock && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0">
                                Out
                            </Badge>
                        )}
                        {!isOutOfStock && isLowStock && (
                            <Badge variant="outline" className="text-[10px] px-1 py-0 border-orange-400 text-orange-500">
                                Low
                            </Badge>
                        )}
                        {groupName && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-muted-foreground cursor-help text-xs font-normal">/ {groupName}</span>
                                </TooltipTrigger>
                                <TooltipContent>{groupName}</TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                    {hasBranchPrice && (
                        <div className="text-muted-foreground mt-0.5 font-mono text-[10px] tabular-nums">
                            {branchCost != null && <span>Cost:{formatCurrency(Number(branchCost))}</span>}
                            {branchCost != null && branchSell != null && <span> / </span>}
                            {branchSell != null && <span className="font-medium">Selling:{formatCurrency(Number(branchSell))}</span>}
                        </div>
                    )}
                </div>
            );
        },
        filterFn: (row, _id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
            const quantity = branchStock?.quantity ?? 0;
            const isLowStock = row.original.low_stock_alert && quantity <= row.original.low_stock_alert;

            if (value.includes('out') && quantity === 0) return true;
            if (value.includes('low') && quantity > 0 && isLowStock) return true;
            if (value.includes('in') && quantity > 0 && !isLowStock) return true;
            return false;
        },
    }));
};

// Filter Panel
function ProductFilterPanel({ table, onClearFilters }: FilterPanelProps<Product>) {
    // Category filter
    const categoryColumn = table.getColumn('category_name');
    const categoryFilter = (categoryColumn?.getFilterValue() as string[]) || [];

    // Get unique categories from data
    const allCategories = useMemo(() => {
        const names = new Set<string>();
        table.getCoreRowModel().rows.forEach((row) => {
            const name = row.original.category?.name;
            if (name) names.add(name);
        });
        return Array.from(names).sort();
    }, [table]);

    const toggleCategory = (name: string) => {
        const current = [...categoryFilter];
        const index = current.indexOf(name);
        if (index === -1) {
            current.push(name);
        } else {
            current.splice(index, 1);
        }
        categoryColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    // Stock level filter
    const branchColumns = table.getAllColumns().filter((c) => c.id.startsWith('branch_'));
    const firstBranchColumn = branchColumns[0];
    const stockFilter = (firstBranchColumn?.getFilterValue() as string[]) || [];

    const toggleStock = (level: string) => {
        const current = [...stockFilter];
        const index = current.indexOf(level);
        if (index === -1) {
            current.push(level);
        } else {
            current.splice(index, 1);
        }
        firstBranchColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    // Status filter
    const statusColumn = table.getColumn('is_active');
    const statusFilter = (statusColumn?.getFilterValue() as boolean[]) || [];

    const toggleStatus = (isActive: boolean) => {
        const current = [...statusFilter];
        const index = current.indexOf(isActive);
        if (index === -1) {
            current.push(isActive);
        } else {
            current.splice(index, 1);
        }
        statusColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    const hasActiveFilters = categoryFilter.length > 0 || stockFilter.length > 0 || statusFilter.length > 0;

    return (
        <div className="space-y-4">
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            {/* Category Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Category</Label>
                <div className="space-y-2 max-h-[150px] overflow-y-auto">
                    {allCategories.map((name) => (
                        <div key={name} className="flex items-center space-x-2">
                            <Checkbox
                                id={`cat-${name}`}
                                checked={categoryFilter.includes(name)}
                                onCheckedChange={() => toggleCategory(name)}
                            />
                            <Label htmlFor={`cat-${name}`} className="cursor-pointer text-sm font-normal">
                                {name}
                            </Label>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            {/* Stock Level Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Stock Level</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="stock-in" checked={stockFilter.includes('in')} onCheckedChange={() => toggleStock('in')} />
                        <Label htmlFor="stock-in" className="cursor-pointer text-sm font-normal">
                            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />In Stock
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="stock-low" checked={stockFilter.includes('low')} onCheckedChange={() => toggleStock('low')} />
                        <Label htmlFor="stock-low" className="cursor-pointer text-sm font-normal">
                            <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-1.5" />Low Stock
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="stock-out" checked={stockFilter.includes('out')} onCheckedChange={() => toggleStock('out')} />
                        <Label htmlFor="stock-out" className="cursor-pointer text-sm font-normal">
                            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />Out of Stock
                        </Label>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Status Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-active" checked={statusFilter.includes(true)} onCheckedChange={() => toggleStatus(true)} />
                        <Label htmlFor="status-active" className="cursor-pointer text-sm font-normal">Active</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-inactive" checked={statusFilter.includes(false)} onCheckedChange={() => toggleStatus(false)} />
                        <Label htmlFor="status-inactive" className="cursor-pointer text-sm font-normal">Inactive</Label>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ProductIndex({ products, branches }: { products: Product[]; branches: Branch[] }) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;

    // Non-superadmin sees only their branch; superadmin sees all
    const visibleBranches = useMemo(() => {
        if (user.is_super_admin) return branches;
        return branches.filter((b) => b.id === user.branch_id);
    }, [branches, user]);

    const columns = useMemo(() => {
        const branchColumns = createBranchColumns(visibleBranches);
        return [...baseColumns, ...branchColumns, ...endColumns];
    }, [visibleBranches]);

    // Global search: searches both code and name
    const globalFilterFn = useMemo(() => {
        return (row: Product, query: string) => {
            const q = query.toLowerCase();
            return (
                row.code.toLowerCase().includes(q) ||
                row.name.toLowerCase().includes(q)
            );
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('products.create')} />
                </div>
                <DataTable
                    data={products}
                    columns={columns}
                    filterPanel={ProductFilterPanel}
                    searchPlaceholder="Search code or name..."
                    globalFilterFn={globalFilterFn}
                    initialPageSize={25}
                    compact
                />
            </div>
        </AppLayout>
    );
}
