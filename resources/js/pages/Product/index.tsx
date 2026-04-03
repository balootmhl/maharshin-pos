import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, LaravelPaginator, PaginatedData, Product, SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, Download, X } from 'lucide-react';
import { useCallback, useMemo } from 'react';

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
        cell: ({ row }) => <div className="text-medium font-mono font-bold">{row.getValue('code')}</div>,
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
                className="text-muted-foreground font-small hover:underline"
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
        id: 'category.name', // Explicit ID for server-side filtering
        header: 'Category',
        cell: ({ row }) => {
            const categoryName = row.original.category?.name;
            return categoryName ? (
                <Badge variant="outline" className="font-normal">{categoryName}</Badge>
            ) : (
                <span className="text-muted-foreground">-</span>
            );
        },
    },
    // Base prices removed, as we now rely on BranchStock prices
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
    // {
    //     accessorKey: 'created_at',
    //     header: 'Created At',
    //     enableHiding: true,
    //     cell: ({ row }) => <div className="text-xs text-muted-foreground">{new Date(row.getValue('created_at')).toLocaleDateString()}</div>,
    // },
];

// Generate branch-specific columns (Stock, Group, Cost, Selling Price)
const createBranchColumns = (branches: Branch[]): ColumnDef<Product>[] => {
    return branches.map((branch) => ({
        id: `branch_${branch.id}`,
        header: () => <div className="text-center font-bold">{branch.name}</div>,
        columns: [
            {
                id: `branch_${branch.id}_stock`,
                header: () => <div className="text-center text-xs text-muted-foreground font-normal">Stock</div>,
                cell: ({ row }) => {
                    const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
                    const quantity = branchStock?.quantity ?? 0;
                    const isLowStock = row.original.low_stock_alert && quantity <= row.original.low_stock_alert;
                    const isOutOfStock = quantity === 0;

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
                            </div>
                        </div>
                    );
                },
            },
            {
                id: `branch_${branch.id}_group`,
                header: () => <div className="text-center text-xs text-muted-foreground font-normal">Group</div>,
                cell: ({ row }) => {
                    const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
                    const groupName = branchStock?.group?.name;
                    return (
                        <div className="text-center text-muted-foreground text-sm">
                            {groupName || '-'}
                        </div>
                    );
                },
            },
            {
                id: `branch_${branch.id}_cost`,
                header: () => <div className="text-right text-xs text-muted-foreground font-normal">Cost Price</div>,
                cell: ({ row }) => {
                    const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
                    const cost = branchStock?.cost_price;
                    return (
                        <div className="text-right font-mono tabular-nums text-muted-foreground">
                            {cost != null ? `${formatCurrency(Number(cost))} Ks` : '-'}
                        </div>
                    );
                },
            },
            {
                id: `branch_${branch.id}_selling`,
                header: () => <div className="text-right text-xs text-muted-foreground font-normal">Selling Price</div>,
                cell: ({ row }) => {
                    const branchStock = row.original.branch_stocks?.find((bs) => bs.branch_id === branch.id);
                    const selling = branchStock?.selling_price;
                    return (
                        <div className="text-right font-mono tabular-nums font-medium text-foreground">
                            {selling != null ? `${formatCurrency(Number(selling))} Ks` : '-'}
                        </div>
                    );
                },
            }
        ]
    }));
};

interface ProductIndexProps {
    products: PaginatedData<Product> | LaravelPaginator<Product>;
    branches: Branch[];
    categories: string[];
}

export default function ProductIndex({ products, branches, categories }: ProductIndexProps) {
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

    // Global search: searches both code and name. 
    // We keep this purely to satisfy DataTable 'search' mode trigger, even if server-side handles logic.
    const globalFilterFn = useMemo(() => {
        return () => true; 
    }, []);

    const FilterPanel = useCallback((props: FilterPanelProps<Product>) => {
        const { table, onClearFilters } = props;
        
        // Category filter
        const categoryColumn = table.getColumn('category.name');
        const categoryFilter = (categoryColumn?.getFilterValue() as string[]) || [];

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

        // Status filter
        const statusColumn = table.getColumn('is_active');
        const statusFilterRaw = statusColumn?.getFilterValue();
        const statusFilter = Array.isArray(statusFilterRaw) ? statusFilterRaw : [];

        const toggleStatus = (val: string) => {
            const current = [...(statusFilter as string[])];
            const index = current.indexOf(val);
            if (index === -1) {
                current.push(val);
            } else {
                current.splice(index, 1);
            }
            statusColumn?.setFilterValue(current.length > 0 ? current : undefined);
        };

        const hasActiveFilters = categoryFilter.length > 0 || statusFilter.length > 0;

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
                        {categories.map((name) => (
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

                {/* Status Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Status</Label>
                    <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="status-active" checked={statusFilter.includes('1')} onCheckedChange={() => toggleStatus('1')} />
                            <Label htmlFor="status-active" className="cursor-pointer text-sm font-normal">Active</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox id="status-inactive" checked={statusFilter.includes('0')} onCheckedChange={() => toggleStatus('0')} />
                            <Label htmlFor="status-inactive" className="cursor-pointer text-sm font-normal">Inactive</Label>
                        </div>
                    </div>
                </div>
            </div>
        );
    }, [categories]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Products" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <div className="flex gap-2">
                        <CreateBtn route={route('products.create')} />
                        <Button variant="outline" asChild>
                            <a href={`${route('products.export')}${window.location.search}`}>
                                <Download className="mr-2 h-4 w-4" />
                                Export
                            </a>
                        </Button>
                    </div>
                </div>
                <DataTable
                    data={products}
                    columns={columns}
                    filterPanel={FilterPanel}
                    searchPlaceholder="Search code or name..."
                    globalFilterFn={globalFilterFn}
                    initialPageSize={25}
                    compact
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
