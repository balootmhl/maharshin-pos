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
type Customer = { id: number; name: string; code: string };
type User = { id: number; name: string };

type CustomerCreditLedger = {
    id: number;
    customer_id: number;
    customer?: Customer;
    branch_id: number;
    branch?: Branch;
    transaction_type: string;
    amount: number;
    balance_after: number;
    reference_type?: string;
    reference_id?: number;
    notes?: string;
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

const formatCurrency = (value: number) => {
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
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }) => (
            <div>
                <div className="font-medium">{row.original.customer?.name}</div>
                <div className="text-muted-foreground font-mono text-xs">{row.original.customer?.code}</div>
            </div>
        ),
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name}</div>,
    },
    {
        accessorKey: 'transaction_type',
        header: 'Type',
        cell: ({ row }) => (
            <Badge variant={getTransactionTypeVariant(row.getValue('transaction_type'))}>
                {(row.getValue('transaction_type') as string).charAt(0).toUpperCase() + (row.getValue('transaction_type') as string).slice(1)}
            </Badge>
        ),
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => {
            const amount = row.getValue('amount') as number;
            const type = row.original.transaction_type;
            const isCredit = type === 'credit';
            return (
                <div className={`text-right font-mono font-medium ${isCredit ? 'text-red-600' : 'text-green-600'}`}>
                    {isCredit ? '+' : '-'}
                    {formatCurrency(Math.abs(amount))} Ks
                </div>
            );
        },
    },
    {
        accessorKey: 'balance_after',
        header: 'Balance',
        cell: ({ row }) => {
            const balance = row.getValue('balance_after') as number;
            return <div className={`text-right font-mono font-medium ${balance > 0 ? 'text-red-600' : ''}`}>{formatCurrency(balance)} Ks</div>;
        },
    },
    {
        accessorKey: 'notes',
        header: 'Notes',
        cell: ({ row }) => <div className="text-muted-foreground max-w-xs truncate text-sm">{row.getValue('notes') || '-'}</div>,
    },
];

export default function CustomerCreditLedgerIndex({ ledgers }: { ledgers: CustomerCreditLedger[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Credit Ledger" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <DataTable data={ledgers} columns={columns} />
            </div>
        </AppLayout>
    );
}
