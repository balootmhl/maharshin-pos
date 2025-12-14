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
        accessorKey: 'debit',
        header: 'Amount',
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
        header: 'Balance',
        cell: ({ row }) => {
            const balance = Number(row.original.balance) || 0;
            return <div className={`text-right font-mono font-medium ${balance > 0 ? 'text-red-600' : ''}`}>{formatCurrency(balance)} Ks</div>;
        },
    },
    {
        accessorKey: 'description',
        header: 'Notes',
        cell: ({ row }) => <div className="text-muted-foreground max-w-xs truncate text-sm">{row.getValue('description') || '-'}</div>,
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
