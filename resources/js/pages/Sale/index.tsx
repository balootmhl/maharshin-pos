import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

type Branch = { id: number; name: string };
type Customer = { id: number; name: string };
type User = { id: number; name: string };

type Sale = {
    id: number;
    invoice_no: string;
    branch_id: number;
    branch?: Branch;
    customer_id?: number;
    customer?: Customer;
    sale_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_status: string;
    payment_method?: string;
    paid_amount: number;
    credit_amount: number;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: route('sales.index'),
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getPaymentStatusVariant = (status: string) => {
    switch (status) {
        case 'paid':
            return 'default';
        case 'partial':
            return 'outline';
        case 'unpaid':
            return 'destructive';
        default:
            return 'secondary';
    }
};

const columns: ColumnDef<Sale>[] = [
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
        accessorKey: 'invoice_no',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Invoice
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => (
            <Link
                className="text-link font-mono font-medium"
                href={route('sales.show', {
                    sale: row.original.id,
                })}
            >
                {row.getValue('invoice_no')}
            </Link>
        ),
    },
    {
        accessorKey: 'sale_date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('sale_date')}</div>,
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
    },
    {
        accessorKey: 'customer.name',
        header: 'Customer',
        cell: ({ row }) => <div>{row.original.customer?.name || 'Walk-in'}</div>,
    },
    {
        accessorKey: 'total_amount',
        header: 'Total',
        cell: ({ row }) => <div className="text-right font-mono">{formatCurrency(row.getValue('total_amount'))} Ks</div>,
    },
    {
        accessorKey: 'payment_status',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={getPaymentStatusVariant(row.getValue('payment_status'))}>
                {(row.getValue('payment_status') as string).charAt(0).toUpperCase() + (row.getValue('payment_status') as string).slice(1)}
            </Badge>
        ),
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { sale: row.original.id };
            return <DataTableActions routePrefix="sales" routeParam={param} />;
        },
    },
];

export default function SaleIndex({ sales }: { sales: Sale[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('sales.create')} />
                </div>
                <DataTable data={sales} columns={columns} />
            </div>
        </AppLayout>
    );
}
