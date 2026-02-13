import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, LaravelPaginator, PaginatedData, SaleReturn } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sale Returns',
        href: route('sale-returns.index'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const columns: ColumnDef<SaleReturn>[] = [
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
        accessorKey: 'return_no',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Return No
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <Link
                className="text-link font-mono font-medium"
                href={route('sale-returns.show', {
                    sale_return: row.original.id,
                })}
            >
                {row.getValue('return_no')}
            </Link>
        ),
        filterFn: (row, id, value) => {
            const no = row.getValue(id) as string;
            return no.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'sale.invoice_no',
        header: 'Original Invoice',
        cell: ({ row }) => <div className="font-mono">{row.original.sale?.invoice_no || '-'}</div>,
        filterFn: (row, id, value) => {
            const no = row.original.sale?.invoice_no?.toLowerCase() || '';
            return no.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
        enableSorting: false, // Sorted via branch_id if needed, or disabled
        filterFn: (row, id, value) => {
            const no = row.original.branch?.name?.toLowerCase() || '';
            return no.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'return_date',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>{row.getValue('return_date')}</div>,
    },
    {
        accessorKey: 'total_amount',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('total_amount'))} Ks</div>,
    },
    {
        accessorKey: 'refund_amount',
        header: 'Refunded',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('refund_amount'))} Ks</div>,
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { sale_return: row.original.id };
            return <DataTableActions routePrefix="sale-returns" routeParam={param} />;
        },
    },
];

export default function SaleReturnIndex({
    saleReturns,
    branches,
}: {
    saleReturns: PaginatedData<SaleReturn> | LaravelPaginator<SaleReturn>;
    branches: Branch[];
}) {
    const SaleReturnFilterPanel = ({ table, onClearFilters }: FilterPanelProps<SaleReturn>) => {
        // Return No filter
        const returnNoColumn = table.getColumn('return_no');
        const returnNoFilter = (returnNoColumn?.getFilterValue() as string) || '';

        // Invoice No filter
        const invoiceNoColumn = table.getColumn('sale.invoice_no');
        const invoiceNoFilter = (invoiceNoColumn?.getFilterValue() as string) || '';

        // Branch filter - using branch_id exact match
        const branchIdColumn = table.getColumn('branch_id');
        const branchIdFilter = (branchIdColumn?.getFilterValue() as string) || 'all';

        // Date range filter
        const dateColumn = table.getColumn('return_date');
        const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

        const hasActiveFilters = !!returnNoFilter || !!invoiceNoFilter || (branchIdFilter && branchIdFilter !== 'all') || dateFilter.start || dateFilter.end;

        return (
            <div className="space-y-4">
                 {/* Clear All Button */}
                 {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                        <X className="mr-2 h-4 w-4" />
                        Clear all filters
                    </Button>
                )}

                {/* Return No Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Return No</Label>
                    <Input
                        placeholder="Filter by return no..."
                        value={returnNoFilter}
                        onChange={(e) => returnNoColumn?.setFilterValue(e.target.value || undefined)}
                    />
                </div>

                <Separator />

                {/* Invoice No Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Original Invoice</Label>
                    <Input
                        placeholder="Filter by invoice..."
                        value={invoiceNoFilter}
                        onChange={(e) => invoiceNoColumn?.setFilterValue(e.target.value || undefined)}
                    />
                </div>

                <Separator />

                {/* Branch Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Branch</Label>
                    <Select
                        value={branchIdFilter}
                        onValueChange={(value) => branchIdColumn?.setFilterValue(value === 'all' ? undefined : value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Branch" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Branches</SelectItem>
                            {branches.map((b) => (
                                <SelectItem key={b.id} value={String(b.id)}>
                                    {b.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                 {/* Date Range Filter */}
                 <div className="space-y-3">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="date"
                                value={dateFilter.start || ''}
                                onChange={(e) =>
                                    dateColumn?.setFilterValue((old: { start?: string; end?: string } | undefined) => ({
                                        ...old,
                                        start: e.target.value || undefined,
                                    }))
                                }
                                aria-label="Start Date"
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                type="date"
                                value={dateFilter.end || ''}
                                onChange={(e) =>
                                    dateColumn?.setFilterValue((old: { start?: string; end?: string } | undefined) => ({
                                        ...old,
                                        end: e.target.value || undefined,
                                    }))
                                }
                                aria-label="End Date"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sale Returns" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('sale-returns.create')} />
                </div>
                <DataTable
                    data={saleReturns}
                    columns={[...columns, { accessorKey: 'branch_id', enableHiding: true, meta: { hidden: true }, header: () => null, cell: () => null }]}
                    filterPanel={SaleReturnFilterPanel}
                    searchColumn="return_no"
                    searchPlaceholder="Search return no..."
                    scrollable
                    initialColumnVisibility={{ branch_id: false }}
                />
            </div>
        </AppLayout>
    );
}
