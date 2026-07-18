import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Branch, BreadcrumbItem, LaravelPaginator, PaginatedData } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

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
                href={route('groups.show', {
                    group: row.original.id,
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
        accessorKey: 'branch.name',
        header: 'Branch',
        cell: ({ row }) => <Badge variant="outline">{row.original.branch?.name || '-'}</Badge>,
        filterFn: (row, id, value) => {
            const branchName = row.original.branch?.name?.toLowerCase() || '';
            return branchName.includes(value.toLowerCase());
        },
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="max-w-xs truncate">{row.getValue('description') || '-'}</div>,
        enableSorting: false,
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
            const param = { group: row.original.id };
            return <DataTableActions routePrefix="groups" routeParam={param} />;
        },
    },
];

// Context for branches (since FilterPanel is separate)
// NOTE: Ideally we should pass branches to filter panel props or context.
// But DataTable doesn't support custom props for FilterPanel directly easily without wrapper.
// Since 'branches' is passed to page, we can use a closure or just pass it if we inline or use context.
// For now, I will modify the FilterPanel signature to accept additional data if checking DataTable implementation allows,
// OR since I am generating the code, I will create a factory or just use props.
// BUT `FilterPanel` prop in `DataTable` expects `React.ComponentType<FilterPanelProps<TData>>`.
// So standard way is to define it inside the component or use context.
// I'll define it inside `GroupIndex` to access `branches`.

export default function GroupIndex({ groups, branches }: { groups: PaginatedData<Group> | LaravelPaginator<Group>; branches: Branch[] }) {
    const GroupFilterPanel = ({ table, onClearFilters }: FilterPanelProps<Group>) => {
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

        // Branch ID filter (backend uses 'branch_id' for exact match, but frontend table usually filters by accessor)
        // However, `QueryBuilder` has `AllowedFilter::exact('branch_id')`.
        // If we want to use that, we need a column or manual filter set.
        // `DataTable` syncs standard column filters.
        // Let's use `branch.name` partial filter as defined in controller: `AllowedFilter::callback('branch.name'...)`.
        // Or `branch_id` exact filter.
        // Let's use `branch_id` exact filter for Dropdown selecting specific branch.
        // But the column is `branch.name`.
        // We can set filter on a hidden `branch_id` column OR just use `branch_id` as the filter key if `DataTable` supports it.
        // `DataTable` maps column filters to `filter[columnId]=value`.
        // So if we set filter on `branch.name` column, it sends `filter[branch.name]`.
        // Backend handles `branch.name`.
        // If we want to use `branch_id` exact filter (select dropdown), we can add a hidden `branch_id` column.

        const branchIdColumn = table.getColumn('branch_id'); // We need to add this column definitions
        const branchIdFilter = (branchIdColumn?.getFilterValue() as string) || 'all';

        // Code filter
        const codeColumn = table.getColumn('code');
        const codeFilter = (codeColumn?.getFilterValue() as string) || '';

        // Name filter
        const nameColumn = table.getColumn('name');
        const nameFilter = (nameColumn?.getFilterValue() as string) || '';

        const hasActiveFilters = statusFilter.length > 0 || (branchIdFilter && branchIdFilter !== 'all') || codeFilter || nameFilter;

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

                {/* Branch Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Branch</Label>
                    <Select value={branchIdFilter} onValueChange={(value) => branchIdColumn?.setFilterValue(value === 'all' ? undefined : value)}>
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

                {/* Code Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Code</Label>
                    <Input
                        placeholder="Filter by code..."
                        value={codeFilter}
                        onChange={(e) => codeColumn?.setFilterValue(e.target.value || undefined)}
                    />
                </div>

                <Separator />

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
    };

    // Add branch_id column to columns definition (dynamically or statically)
    // UseMemo is better but for now let's just append it.
    // Actually we need to add it to the columns array above or use a useMemo here.
    // Since columns is constant outside, we can't add it easily without mutating.
    // Better to define columns inside component useMemo OR add it to static definition as hidden.
    // I'll add 'branch_id' to static columns as hidden.

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Groups" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('groups.create')} />
                </div>
                <DataTable
                    data={groups}
                    columns={[
                        ...columns,
                        { accessorKey: 'branch_id', enableHiding: true, meta: { hidden: true }, header: () => null, cell: () => null },
                    ]}
                    filterPanel={GroupFilterPanel} // Pass the component defined inside to access branches
                    searchColumn="name"
                    searchPlaceholder="Search group name..."
                    scrollable
                    initialColumnVisibility={{ branch_id: false }}
                />
            </div>
        </AppLayout>
    );
}
