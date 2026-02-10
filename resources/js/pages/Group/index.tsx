import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Branch } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

type Group = {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
    branch_id: number;
    branch?: Branch;
    created_at?: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Groups',
        href: route('groups.index'),
    },
];

const columns: ColumnDef<Group>[] = [
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
        cell: ({ row }) => <div className="font-mono">{row.getValue('code')}</div>,
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
                className="text-link font-medium"
                href={route('groups.show', {
                    group: row.original.id,
                })}
            >
                {row.getValue('name')}
            </Link>
        ),
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <Badge variant="outline">{row.original.branch?.name || '-'}</Badge>,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue('description') || '-'}</div>,
    },
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
            const param = { group: row.original.id };
            return <DataTableActions routePrefix="groups" routeParam={param} />;
        },
    },
];

export default function GroupIndex({
    groups,
    branches,
    filters,
}: {
    groups: Group[];
    branches: Branch[];
    filters: { branch_id?: string };
}) {
    const handleBranchFilter = (branchId: string) => {
        router.get(
            route('groups.index'),
            { branch_id: branchId === 'all' ? undefined : branchId },
            { preserveState: true, preserveScroll: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Groups" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <CreateBtn route={route('groups.create')} />
                        <Select value={filters.branch_id || 'all'} onValueChange={handleBranchFilter}>
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Filter by branch" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map((branch) => (
                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DataTable data={groups} columns={columns} />
            </div>
        </AppLayout>
    );
}
