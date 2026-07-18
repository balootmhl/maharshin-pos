import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

type Category = {
    id: number;
    code: string;
    name: string;
    description?: string;
    parent_id?: number | null;
    is_active: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Categories',
        href: route('categories.index'),
    },
];

const columns: ColumnDef<Category>[] = [
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
        header: ({ column }) => {
            return (
                <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
                    Code
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => <div className="font-mono">{row.getValue('code')}</div>,
        filterFn: (row, id, value) => {
            const code = row.getValue(id) as string;
            return code.toLowerCase().includes(value.toLowerCase());
        },
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
                href={route('categories.show', {
                    category: row.original.id,
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
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue('description') || '-'}</div>,
        filterFn: (row, id, value) => {
            const description = row.getValue(id) as string;
            return description?.toLowerCase().includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>{row.getValue('is_active') ? 'Active' : 'Inactive'}</Badge>
        ),
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const status = row.getValue(id) ? '1' : '0';
            return value.includes(status);
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { category: row.original.id };
            return <DataTableActions routePrefix="categories" routeParam={param} />;
        },
    },
];

// Filter Panel Component
function CategoryFilterPanel({ table, onClearFilters }: FilterPanelProps<Category>) {
    // Status filter
    const statusColumn = table.getColumn('is_active');
    const statusFilter = (statusColumn?.getFilterValue() as string[]) || [];

    const toggleStatus = (statusValue: string) => {
        const current = [...statusFilter];
        const index = current.indexOf(statusValue);
        if (index === -1) {
            current.push(statusValue);
        } else {
            current.splice(index, 1);
        }
        statusColumn?.setFilterValue(current.length > 0 ? current : undefined);
    };

    // Code filter
    const codeColumn = table.getColumn('code');
    const codeFilter = (codeColumn?.getFilterValue() as string) || '';

    // Description filter
    const descriptionColumn = table.getColumn('description');
    const descriptionFilter = (descriptionColumn?.getFilterValue() as string) || '';

    const hasActiveFilters = statusFilter.length > 0 || codeFilter || descriptionFilter;

    return (
        <div className="space-y-4">
            {/* Clear All Button */}
            {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                    <X className="mr-2 h-4 w-4" />
                    Clear all filters
                </Button>
            )}

            {/* Status Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Status</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox id="status-active" checked={statusFilter.includes('1')} onCheckedChange={() => toggleStatus('1')} />
                    <Label htmlFor="status-active" className="text-sm font-normal">
                        Active
                    </Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="status-inactive" checked={statusFilter.includes('0')} onCheckedChange={() => toggleStatus('0')} />
                    <Label htmlFor="status-inactive" className="text-sm font-normal">
                        Inactive
                    </Label>
                </div>
            </div>

            <Separator />

            {/* Code Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Code</Label>
                <Input placeholder="Filter by code..." value={codeFilter} onChange={(e) => codeColumn?.setFilterValue(e.target.value || undefined)} />
            </div>

            <Separator />

            {/* Description Filter */}
            <div className="space-y-3">
                <Label className="text-sm font-medium">Description</Label>
                <Input
                    placeholder="Filter by description..."
                    value={descriptionFilter}
                    onChange={(e) => descriptionColumn?.setFilterValue(e.target.value || undefined)}
                />
            </div>
        </div>
    );
}

export default function CategoryIndex({ categories }: { categories: PaginatedData<Category> | LaravelPaginator<Category> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Categories" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('categories.create')} />
                </div>
                <DataTable
                    data={categories}
                    columns={columns}
                    filterPanel={CategoryFilterPanel}
                    searchColumn="name"
                    searchPlaceholder="Search category name..."
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
