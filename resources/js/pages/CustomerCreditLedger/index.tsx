import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, LaravelPaginator, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

type Customer = { id: number; name: string; code: string };
type User = { id: number; name: string };

type CustomerCreditLedger = {
    id: number;
    customer_id: number;
    customer?: Customer;
    branch_id: number;
    branch?: Branch;
    transaction_date: string;
    transaction_type: string;
    reference_no?: string;
    debit: number;
    credit: number;
    balance: number;
    description?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customers',
        href: route('customers.index'),
    },
    {
        title: 'Credit Ledger',
        href: route('customer-credit-ledgers.index'),
    },
];

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || isNaN(value)) {
        return '0';
    }
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getTransactionTypeVariant = (type: string) => {
    switch (type) {
        case 'credit':
            return 'destructive';
        case 'payment':
            return 'default';
        case 'refund':
            return 'outline';
        default:
            return 'secondary';
    }
};

const columns: ColumnDef<CustomerCreditLedger>[] = [
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
        accessorKey: 'transaction_date',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Date
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="text-sm">{row.getValue('transaction_date')}</div>,
    },
    {
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.customer?.name}</div>
                <div className="text-muted-foreground font-mono text-xs">{row.original.customer?.code}</div>
            </div>
        ),
        filterFn: (row, id, value) => {
            const name = row.original.customer?.name?.toLowerCase() || '';
            const code = row.original.customer?.code?.toLowerCase() || '';
            const filter = (value as string).toLowerCase();
            return name.includes(filter) || code.includes(filter);
        },
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name}</div>,
        enableSorting: false,
        filterFn: (row, id, value) => {
            const name = row.original.branch?.name?.toLowerCase() || '';
            return name.includes((value as string).toLowerCase());
        },
    },
    {
        accessorKey: 'transaction_type',
        header: 'Type',
        cell: ({ row }) => (
            <Badge variant={getTransactionTypeVariant(row.getValue('transaction_type'))}>
                {(row.getValue('transaction_type') as string).charAt(0).toUpperCase() + (row.getValue('transaction_type') as string).slice(1)}
            </Badge>
        ),
        filterFn: (row, id, value) => {
            const type = row.getValue(id) as string;
            return type === value;
        },
    },
    {
        accessorKey: 'debit',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const debit = Number(row.original.debit) || 0;
            const credit = Number(row.original.credit) || 0;
            const type = row.original.transaction_type;
            const isDebit = type === 'credit'; // credit sale = customer owes us (debit)
            const amount = isDebit ? debit : credit;
            return (
                <div className={`text-right font-mono font-medium ${isDebit ? 'text-red-600' : 'text-green-600'}`}>
                    {isDebit ? '-' : '+'}
                    {formatCurrency(amount)} Ks
                </div>
            );
        },
    },
    {
        accessorKey: 'balance',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Balance
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const balance = Number(row.original.balance) || 0;
            return <div className={`text-right font-mono font-medium ${balance > 0 ? 'text-red-600' : ''}`}>{formatCurrency(balance)} Ks</div>;
        },
    },
    {
        accessorKey: 'description',
        header: 'Notes',
        cell: ({ row }) => <div className="text-muted-foreground max-w-xs truncate text-sm">{row.getValue('description') || '-'}</div>,
        enableSorting: false,
    },
];

export default function CustomerCreditLedgerIndex({
    ledgers,
    branches,
}: {
    ledgers: PaginatedData<CustomerCreditLedger> | LaravelPaginator<CustomerCreditLedger>;
    branches: Branch[];
}) {

    const CustomerCreditLedgerFilterPanel = ({ table, onClearFilters }: FilterPanelProps<CustomerCreditLedger>) => {
        // Customer Filter
        const customerColumn = table.getColumn('customer.name');
        const customerFilter = (customerColumn?.getFilterValue() as string) || '';

        // Branch Filter
        const branchIdColumn = table.getColumn('branch_id');
        const branchIdFilter = (branchIdColumn?.getFilterValue() as string) || 'all';

        // Type Filter
        const typeColumn = table.getColumn('transaction_type');
        const typeFilter = (typeColumn?.getFilterValue() as string) || 'all';

        // Date Range Filter
        const dateColumn = table.getColumn('transaction_date');
        const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

        const hasActiveFilters = !!customerFilter || (branchIdFilter && branchIdFilter !== 'all') || (typeFilter && typeFilter !== 'all') || dateFilter.start || dateFilter.end;

        return (
            <div className="space-y-4">
                 {/* Clear All Button */}
                 {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                        <X className="mr-2 h-4 w-4" />
                        Clear all filters
                    </Button>
                )}

                {/* Customer Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Customer</Label>
                    <Input
                        placeholder="Search name or code..."
                        value={customerFilter}
                        onChange={(e) => customerColumn?.setFilterValue(e.target.value || undefined)}
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

                {/* Type Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Transaction Type</Label>
                    <Select
                        value={typeFilter}
                        onValueChange={(value) => typeColumn?.setFilterValue(value === 'all' ? undefined : value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="credit">Credit (Sale)</SelectItem>
                            <SelectItem value="payment">Payment</SelectItem>
                            <SelectItem value="refund">Refund</SelectItem>
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
            <Head title="Credit Ledger" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <DataTable
                    data={ledgers}
                    columns={[...columns, { accessorKey: 'branch_id', enableHiding: true, meta: { hidden: true }, header: () => null, cell: () => null }]}
                    filterPanel={CustomerCreditLedgerFilterPanel}
                    searchColumn="customer.name"
                    searchPlaceholder="Search customer..."
                    scrollable
                    initialColumnVisibility={{ branch_id: false }}
                />
            </div>
        </AppLayout>
    );
}
