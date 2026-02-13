import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, Role } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role',
        href: route('roles.index'),
    },
];

const columns: ColumnDef<Role>[] = [
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
                href={route('roles.show', {
                    role: row.original.id,
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
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { role: row.original.id };

            return <DataTableActions routePrefix="roles" routeParam={param} />;
        },
    },
];

// Filter Panel Component
function RoleFilterPanel({ table, onClearFilters }: FilterPanelProps<Role>) {
    // Name filter
    const nameColumn = table.getColumn('name');
    const nameFilter = (nameColumn?.getFilterValue() as string) || '';

    const hasActiveFilters = !!nameFilter;

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
                <Input
                    placeholder="Filter by name..."
                    value={nameFilter}
                    onChange={(e) => nameColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>
        </div>
    );
}

export default function RoleIndex({ roles }: { roles: PaginatedData<Role> | LaravelPaginator<Role> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('roles.create')} />
                </div>
                <DataTable
                    data={roles}
                    columns={columns}
                    filterPanel={RoleFilterPanel}
                    searchColumn="name"
                    searchPlaceholder="Search role name..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
