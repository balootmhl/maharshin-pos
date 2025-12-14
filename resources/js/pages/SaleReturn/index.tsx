import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

type Branch = { id: number; name: string };
type Sale = { id: number; invoice_no: string };
type User = { id: number; name: string };

type SaleReturn = {
    id: number;
    return_no: string;
    sale_id: number;
    sale?: Sale;
    branch_id: number;
    branch?: Branch;
    return_date: string;
    total_amount: number;
    refund_amount: number;
    refund_method?: string;
    reason?: string;
    created_by?: number;
    createdBy?: User;
    created_at?: string;
};

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
    },
    {
        accessorKey: 'return_date',
        header: 'Date',
        cell: ({ row }) => <div>{row.getValue('return_date')}</div>,
    },
    {
        accessorKey: 'sale.invoice_no',
        header: 'Original Invoice',
        cell: ({ row }) => <div className="font-mono">{row.original.sale?.invoice_no || '-'}</div>,
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div>{row.original.branch?.name || '-'}</div>,
    },
    {
        accessorKey: 'total_amount',
        header: 'Amount',
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

export default function SaleReturnIndex({ saleReturns }: { saleReturns: SaleReturn[] }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sale Returns" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('sale-returns.create')} />
                </div>
                <DataTable data={saleReturns} columns={columns} />
            </div>
        </AppLayout>
    );
}
