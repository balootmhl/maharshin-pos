import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, User } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, LogInIcon, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User',
        href: route('users.index'),
    },
];

const columns: ColumnDef<User>[] = [
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
                className="text-link"
                href={route('users.show', {
                    user: row.original.id,
                })}
            >
                {row.getValue('name')}
            </Link>
        ),
        filterFn: (row, id, value) => {
            const name = row.getValue(id) as string;
            return name.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'email',
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Email
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="">{row.getValue('email')}</div>,
        filterFn: (row, id, value) => {
            const email = row.getValue(id) as string;
            return email.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'main_role',
        header: 'Role',
        cell: ({ row }) => <div className="">{row.getValue('main_role')}</div>,
        filterFn: (row, id, value) => {
            // Note: 'main_role' is an accessor, so filtering might be handled via 'role.name' in backend
            // or we map it correctly. In this case, we use 'role.name' in backend.
            // Client side filter might not be perfect if we filter by accessor string.
            // But since we are server-side, this filterFn is mostly for TS compliance or client-side backup.
            const role = row.getValue(id) as string;
            return role === value;
        },
    },
    {
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <div className="">{row.original.branch?.name || '-'}</div>,
        filterFn: (row, id, value) => {
            const branchName = row.original.branch?.name?.toLowerCase() || '';
            return branchName.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'impersonate',
        header: 'Impersonate',
        cell: ({ row }) =>
            !row.original.is_super_admin && (
                <Button variant="outline" asChild>
                    <Link href={route('impersonate', { id: row.original.id })}>
                        <LogInIcon />
                    </Link>
                </Button>
            ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { user: row.original.id };

            return !row.original.is_super_admin && <DataTableActions routePrefix="users" routeParam={param} />;
        },
    },
];

// Filter Panel Component
function UserFilterPanel({ table, onClearFilters }: FilterPanelProps<User>) {
    // Name filter
    const nameColumn = table.getColumn('name');
    const nameFilter = (nameColumn?.getFilterValue() as string) || '';

    // Email filter
    const emailColumn = table.getColumn('email');
    const emailFilter = (emailColumn?.getFilterValue() as string) || '';

    // Branch filter
    const branchColumn = table.getColumn('branch.name');
    const branchFilter = (branchColumn?.getFilterValue() as string) || '';

    const hasActiveFilters = nameFilter || emailFilter || branchFilter;

    return (
        <div className="space-y-4">
            {/* Clear All Button */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            {/* Name Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Name</Label>
                <Input placeholder="Filter by name..." value={nameFilter} onChange={(e) => nameColumn?.setFilterValue(e.target.value || undefined)} />
            </div>

            <Separator />

            {/* Email Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                    placeholder="Filter by email..."
                    value={emailFilter}
                    onChange={(e) => emailColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>

            <Separator />

            {/* Branch Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Branch</Label>
                <Input
                    placeholder="Filter by branch..."
                    value={branchFilter}
                    onChange={(e) => branchColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>
        </div>
    );
}

export default function UserIndex({ users }: { users: PaginatedData<User> | LaravelPaginator<User> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="User" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('users.create')} />
                </div>
                <DataTable
                    data={users}
                    columns={columns}
                    filterPanel={UserFilterPanel}
                    searchColumn="name"
                    searchPlaceholder="Search user name..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
