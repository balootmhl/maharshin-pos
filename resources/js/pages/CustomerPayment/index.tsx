import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, CustomerPayment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

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
    },
    {
        accessorKey: 'payment_date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('payment_date')}</div>,
    },
    {
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }) => <div>{row.original.customer?.name || '-'}</div>,
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
    },
    {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => <div className="text-right font-mono font-medium text-green-600">{formatCurrency(row.getValue('amount'))} Ks</div>,
    },
    {
        accessorKey: 'payment_method',
        header: 'Method',
        cell: ({ row }) => <div>{row.getValue('payment_method')}</div>,
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

export default function CustomerPaymentIndex({ customerPayments }: { customerPayments: CustomerPayment[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Customer Payments" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('customer-payments.create')} />
                </div>
                <DataTable data={customerPayments} columns={columns} />
            </div>
        </AppLayout>
    );
}
