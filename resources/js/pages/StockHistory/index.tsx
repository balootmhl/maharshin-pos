import { DataTable, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

type User = { id: number; name: string };

type ActivityProperties = {
    attributes?: Record<string, unknown>;
    old?: Record<string, unknown>;
};

type Activity = {
    id: number;
    log_name: string;
    description: string;
    subject_type?: string;
    subject_id?: number;
    causer_type?: string;
    causer_id?: number;
    causer?: User;
    properties: ActivityProperties;
    event?: string;
    subject?: {
        product?: {
            code: string;
            name: string;
        };
    };
    created_at: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '#',
    },
    {
        title: 'Stock History',
        href: route('stock-history.index'),
    },
];

const getEventBadgeVariant = (event?: string) => {
    switch (event) {
        case 'created':
            return 'default';
        case 'updated':
            return 'secondary';
        case 'deleted':
            return 'destructive';
        default:
            return 'outline';
    }
};

const formatSubjectType = (subjectType?: string) => {
    if (!subjectType) return '-';
    // Extract class name from full namespace
    const parts = subjectType.split('\\');
    return parts[parts.length - 1];
};

const formatChanges = (properties: ActivityProperties) => {
    if (!properties.attributes) return '-';

    const changes: string[] = [];
    const attrs = properties.attributes;
    const old = properties.old || {};

    for (const key of Object.keys(attrs)) {
        if (key === 'updated_at' || key === 'created_at') continue;

        const newVal = attrs[key];
        const oldVal = old[key];

        if (oldVal !== undefined && oldVal !== newVal) {
            changes.push(`${key}: ${oldVal} → ${newVal}`);
        } else if (oldVal === undefined) {
            changes.push(`${key}: ${newVal}`);
        }
    }

    return changes.length > 0 ? changes.slice(0, 3).join(', ') + (changes.length > 3 ? '...' : '') : '-';
};

const columns: ColumnDef<Activity>[] = [
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
                    Date/Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            );
        },
        cell: ({ row }) => {
            const date = new Date(row.getValue('created_at'));
            return (
                <div className="text-sm">
                    <div>{date.toLocaleDateString()}</div>
                    <div className="text-muted-foreground text-xs">{date.toLocaleTimeString()}</div>
                </div>
            );
        },
    },
    {
        accessorKey: 'event',
        header: 'Event',
        cell: ({ row }) => {
            const event = row.getValue('event') as string | undefined;
            return <Badge variant={getEventBadgeVariant(event)}>{event ? event.charAt(0).toUpperCase() + event.slice(1) : 'Unknown'}</Badge>;
        },
        filterFn: (row, id, value) => {
            return row.getValue(id) === value;
        },
    },
    {
        accessorKey: 'subject.product.name',
        header: 'Product',
        cell: ({ row }) => {
            const product = row.original.subject?.product as { code: string; name: string } | undefined;
            if (!product) return <span className="text-muted-foreground">-</span>;
            return (
                <div className="flex flex-col">
                    <span className="font-mono text-sm font-medium">{product.code}</span>
                    <span className="text-muted-foreground text-xs">{product.name}</span>
                </div>
            );
        },
        enableSorting: false, // Sorting by related model field requires more backend logic
    },
    {
        accessorKey: 'subject_type',
        header: 'Model',
        cell: ({ row }) => <div className="font-mono text-xs">{formatSubjectType(row.getValue('subject_type'))}</div>,
        enableSorting: false,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="max-w-md truncate text-sm">{row.getValue('description')}</div>,
        filterFn: (row, id, value) => {
            const desc = row.getValue(id) as string;
            return desc.toLowerCase().includes((value as string).toLowerCase());
        },
    },
    {
        accessorKey: 'properties',
        header: 'Changes',
        cell: ({ row }) => (
            <div className="text-muted-foreground max-w-xs truncate text-xs">{formatChanges(row.getValue('properties') as ActivityProperties)}</div>
        ),
        enableSorting: false,
    },
    {
        accessorKey: 'causer.name',
        header: 'User',
        cell: ({ row }) => {
            const causer = row.original.causer;
            return <div className="text-sm">{causer?.name || 'System'}</div>;
        },
        filterFn: (row, id, value) => {
            const name = row.original.causer?.name?.toLowerCase() || '';
            return name.includes((value as string).toLowerCase());
        },
    },
];

export default function StockHistoryIndex({
    activities,
}: {
    activities: PaginatedActivities | PaginatedData<Activity> | LaravelPaginator<Activity>;
}) {
    const StockHistoryFilterPanel = ({ table, onClearFilters }: FilterPanelProps<Activity>) => {
        // Description Filter
        const descriptionColumn = table.getColumn('description');
        const descriptionFilter = (descriptionColumn?.getFilterValue() as string) || '';

        // User Filter
        const userColumn = table.getColumn('causer.name');
        const userFilter = (userColumn?.getFilterValue() as string) || '';

        // Event Filter
        const eventColumn = table.getColumn('event');
        const eventFilter = (eventColumn?.getFilterValue() as string) || 'all';

        // Date Range Filter (created_at) -> mapped to 'date_start' and 'date_end' in backend
        // But for DataTable state, we keep it on the column, and update logic mapping in DataTable component or just pass as flattened
        const dateColumn = table.getColumn('created_at');
        const dateFilter = (dateColumn?.getFilterValue() as { start?: string; end?: string }) || {};

        const hasActiveFilters = !!descriptionFilter || !!userFilter || (eventFilter && eventFilter !== 'all') || dateFilter.start || dateFilter.end;

        return (
            <div className="space-y-4">
                {/* Clear All Button */}
                {hasActiveFilters && (
                    <Button variant="ghost" size="sm" onClick={onClearFilters} className="w-full justify-start text-red-500 hover:text-red-600">
                        <X className="mr-2 h-4 w-4" />
                        Clear all filters
                    </Button>
                )}

                {/* Description Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Description</Label>
                    <Input
                        placeholder="Search description..."
                        value={descriptionFilter}
                        onChange={(e) => descriptionColumn?.setFilterValue(e.target.value || undefined)}
                    />
                </div>

                <Separator />

                {/* User Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">User</Label>
                    <Input
                        placeholder="Search user..."
                        value={userFilter}
                        onChange={(e) => userColumn?.setFilterValue(e.target.value || undefined)}
                    />
                </div>

                <Separator />

                {/* Event Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Event Type</Label>
                    <Select value={eventFilter} onValueChange={(value) => eventColumn?.setFilterValue(value === 'all' ? undefined : value)}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select Event" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Events</SelectItem>
                            <SelectItem value="created">Created</SelectItem>
                            <SelectItem value="updated">Updated</SelectItem>
                            <SelectItem value="deleted">Deleted</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <Separator />

                {/* Date Range Filter */}
                <div className="space-y-3">
                    <Label className="text-sm font-medium">Date Range</Label>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Input
                                type="date"
                                value={dateFilter.start || ''}
                                onChange={(e) =>
                                    dateColumn?.setFilterValue((old: { start?: string; end?: string } | undefined) => ({
                                        ...old,
                                        start: e.target.value || undefined,
                                    }))
                                }
                                aria-label="Start Date"
                            />
                        </div>
                        <div className="flex-1">
                            <Input
                                type="date"
                                value={dateFilter.end || ''}
                                onChange={(e) =>
                                    dateColumn?.setFilterValue((old: { start?: string; end?: string } | undefined) => ({
                                        ...old,
                                        end: e.target.value || undefined,
                                    }))
                                }
                                aria-label="End Date"
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Stock History" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Stock Activity History</h2>
                        <p className="text-muted-foreground text-sm">Audit log of all stock-related changes (adjustments, movements, etc.)</p>
                    </div>
                </div>
                <DataTable
                    data={activities}
                    columns={columns}
                    filterPanel={StockHistoryFilterPanel}
                    searchColumn="description"
                    searchPlaceholder="Search history..."
                    scrollable
                    initialColumnVisibility={{ subject_type: false, properties: false }}
                />
            </div>
        </AppLayout>
    );
}

// Keep the old type for now if needed, or remove it.
type PaginatedActivities = {
    data: Activity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};
