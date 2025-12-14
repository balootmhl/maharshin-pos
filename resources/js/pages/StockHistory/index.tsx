import { DataTable } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown } from 'lucide-react';

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
    created_at: string;
};

type PaginatedActivities = {
    data: Activity[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
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
    },
    {
        accessorKey: 'subject_type',
        header: 'Model',
        cell: ({ row }) => <div className="font-mono text-xs">{formatSubjectType(row.getValue('subject_type'))}</div>,
    },
    {
        accessorKey: 'description',
        header: 'Description',
        cell: ({ row }) => <div className="max-w-md truncate text-sm">{row.getValue('description')}</div>,
    },
    {
        accessorKey: 'properties',
        header: 'Changes',
        cell: ({ row }) => (
            <div className="text-muted-foreground max-w-xs truncate text-xs">{formatChanges(row.getValue('properties') as ActivityProperties)}</div>
        ),
    },
    {
        accessorKey: 'causer',
        header: 'User',
        cell: ({ row }) => {
            const causer = row.original.causer;
            return <div className="text-sm">{causer?.name || 'System'}</div>;
        },
    },
];

export default function StockHistoryIndex({ activities }: { activities: PaginatedActivities }) {
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
                <DataTable data={activities.data} columns={columns} />
            </div>
        </AppLayout>
    );
}
