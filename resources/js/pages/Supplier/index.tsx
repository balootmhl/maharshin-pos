import { CreateBtn } from '@/components/buttons/create-btn';
import { DataTable, DataTableActions, FilterPanelProps } from '@/components/tables/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, LaravelPaginator, PaginatedData, Supplier } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowUpDown, X } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: route('suppliers.index'),
    },
];

const columns: ColumnDef<Supplier>[] = [
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
                href={route('suppliers.show', {
                    supplier: row.original.id,
                })}
            >
                {row.getValue('name')}
            </Link>
        ),
    },
    {
        accessorKey: 'contact_person',
        header: 'Contact Person',
        cell: ({ row }) => <div>{row.getValue('contact_person') || '-'}</div>,
    },
    {
        accessorKey: 'phone',
        header: 'Phone',
        cell: ({ row }) => <div>{row.getValue('phone') || '-'}</div>,
    },
    {
        accessorKey: 'is_active',
        header: 'Status',
        cell: ({ row }) => (
            <Badge variant={row.getValue('is_active') ? 'default' : 'secondary'}>{row.getValue('is_active') ? 'Active' : 'Inactive'}</Badge>
        ),
        filterFn: (row, id, value: string[]) => {
            if (!value || value.length === 0) return true;
            const isActive = row.getValue(id);
            return value.some((v) => (v === '1' && isActive) || (v === '0' && !isActive));
        },
    },
    {
        id: 'actions',
        enableHiding: false,
        cell: ({ row }) => {
            const param = { supplier: row.original.id };
            return <DataTableActions routePrefix="suppliers" routeParam={param} />;
        },
    },
];

// Filter Panel Component
function SupplierFilterPanel({ table, onClearFilters }: FilterPanelProps<Supplier>) {
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

    const hasActiveFilters = statusFilter.length > 0;

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
                <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-active" checked={statusFilter.includes('1')} onCheckedChange={() => toggleStatus('1')} />
                        <Label htmlFor="status-active" className="cursor-pointer text-sm font-normal">
                            Active
                        </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="status-inactive" checked={statusFilter.includes('0')} onCheckedChange={() => toggleStatus('0')} />
                        <Label htmlFor="status-inactive" className="cursor-pointer text-sm font-normal">
                            Inactive
                        </Label>
                    </div>
                </div>
            </div>
            
            <Separator />
            
            {/* Note: More filters can be added here if needed, e.g. Phone, Contact Person search */}
        </div>
    );
}

export default function SupplierIndex({ suppliers }: { suppliers: PaginatedData<Supplier> | LaravelPaginator<Supplier> }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suppliers" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex flex-row justify-between">
                    <CreateBtn route={route('suppliers.create')} />
                </div>
                <DataTable 
                    data={suppliers} 
                    columns={columns} 
                    filterPanel={SupplierFilterPanel}
                    searchColumn="name"
                    searchPlaceholder="Search supplier..."
                    initialColumnVisibility={{ phone: true, contact_person: true }}
                    scrollable
                />
            </div>
        </AppLayout>
    );
}
