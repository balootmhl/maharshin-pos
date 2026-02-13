import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, CustomerPayment, LaravelPaginator, PaginatedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customer Payments',
        href: route('customer-payments.index'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const columns: ColumnDef<CustomerPayment>[] = [
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
        accessorKey: 'payment_no',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Payment No
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <Link
                className="text-link font-mono font-medium"
                href={route('customer-payments.show', {
                    customer_payment: row.original.id,
                })}
            >
                {row.getValue('payment_no')}
            </Link>
        ),
        filterFn: (row, id, value) => {
            const paymentNo = row.getValue(id) as string;
            return paymentNo.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'payment_date',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div>{row.getValue('payment_date')}</div>,
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
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }) => <div>{row.original.customer?.name || '-'}</div>,
        filterFn: (row, id, value) => {
            const customerName = row.original.customer?.name?.toLowerCase() || '';
            return customerName.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
        filterFn: (row, id, value) => {
            const branchName = row.original.branch?.name?.toLowerCase() || '';
            return branchName.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'amount',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="text-right font-mono font-medium text-green-600">{formatCurrency(row.getValue('amount'))} Ks</div>,
        filterFn: (row, id, value: { min?: number; max?: number }) => {
            const amount = row.getValue(id) as number;
            if (value.min !== undefined && amount < value.min) return false;
            if (value.max !== undefined && amount > value.max) return false;
            return true;
        },
    },
    {
        accessorKey: 'payment_method',
        header: 'Method',
        cell: ({ row }) => <div className="capitalize">{row.getValue('payment_method')}</div>,
        filterFn: (row, id, value: string) => {
            return value === row.getValue(id);
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { customer_payment: row.original.id };
            return <DataTableActions routePrefix="customer-payments" routeParam={param} />;
        },
    },
];

// Filter Panel Component
function CustomerPaymentFilterPanel({ table, onClearFilters }: FilterPanelProps<CustomerPayment>) {
    // Payment No filter
    const paymentNoColumn = table.getColumn('payment_no');
    const paymentNoFilter = (paymentNoColumn?.getFilterValue() as string) || '';

    // Customer filter
    const customerColumn = table.getColumn('customer.name');
    const customerFilter = (customerColumn?.getFilterValue() as string) || '';

    // Branch filter
    const branchColumn = table.getColumn('branch.name');
    const branchFilter = (branchColumn?.getFilterValue() as string) || '';

    // Payment Method filter
    const methodColumn = table.getColumn('payment_method');
    const methodFilter = (methodColumn?.getFilterValue() as string) || 'all';

    // Date range filter
    const dateColumn = table.getColumn('payment_date');
    const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

    // Amount range filter
    const amountColumn = table.getColumn('amount');
    const amountFilter = (amountColumn?.getFilterValue() as { min?: number; max?: number }) || {};

    const hasActiveFilters =
        paymentNoFilter ||
        customerFilter ||
        branchFilter ||
        (methodFilter && methodFilter !== 'all') ||
        dateFilter.start ||
        dateFilter.end ||
        amountFilter.min ||
        amountFilter.max;

    return (
        <div className="space-y-4">
             {/* Clear All Button */}
             {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            {/* Payment No Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Payment No</Label>
                <Input
                    placeholder="Filter by payment no..."
                    value={paymentNoFilter}
                    onChange={(e) => paymentNoColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>

            <Separator />

            {/* Customer Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Customer</Label>
                <Input
                    placeholder="Filter by customer name..."
                    value={customerFilter}
                    onChange={(e) => customerColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>

            <Separator />

            {/* Payment Method Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Payment Method</Label>
                <Select
                    value={methodFilter}
                    onValueChange={(value) => methodColumn?.setFilterValue(value === 'all' ? undefined : value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="All Methods" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Methods</SelectItem>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="cheque">Cheque</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
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

            <Separator />

            {/* Amount Range Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Amount Range</Label>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Min</Label>
                        <Input
                            type="number"
                            placeholder="0"
                            value={amountFilter.min || ''}
                            onChange={(e) =>
                                amountColumn?.setFilterValue({ ...amountFilter, min: e.target.value ? Number(e.target.value) : undefined })
                            }
                        />
                    </div>
                    <div className="space-y-1">
                        <Label className="text-muted-foreground text-xs">Max</Label>
                        <Input
                            type="number"
                            placeholder="999999"
                            value={amountFilter.max || ''}
                            onChange={(e) =>
                                amountColumn?.setFilterValue({ ...amountFilter, max: e.target.value ? Number(e.target.value) : undefined })
                            }
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CustomerPaymentIndex({ customerPayments }: { customerPayments: PaginatedData<CustomerPayment> | LaravelPaginator<CustomerPayment> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Payments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('customer-payments.create')} />
                </div>
                <DataTable
                    data={customerPayments}
                    columns={columns}
                    filterPanel={CustomerPaymentFilterPanel}
                    searchColumn="payment_no"
                    searchPlaceholder="Search payment no..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
