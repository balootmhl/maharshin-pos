import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    Table as TanStackTable,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, MoreHorizontal } from 'lucide-react';
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ActionsProp = {
    routePrefix: string;
    routeParam: { [key: string]: number | string | undefined };
};
export function DataTableActions({ routePrefix, routeParam }: ActionsProp) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href={route(`${routePrefix}.show`, routeParam)}>View</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href={route(`${routePrefix}.edit`, routeParam)}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="hidden" asChild>
                    <Link
                        href={route(`${routePrefix}.show`, {
                            ...routeParam,
                            delete: true,
                        })}
                    >
                        Delete
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

type FilterPanelProps<TData> = {
    table: TanStackTable<TData>;
    onClearFilters: () => void;
};

type TableProps<TData> = {
    data: TData[];
    columns: ColumnDef<TData>[];
    filterPanel?: React.ComponentType<FilterPanelProps<TData>>;
    searchColumn?: string;
    searchPlaceholder?: string;
    initialColumnVisibility?: VisibilityState;
    initialPageSize?: number;
    compact?: boolean;
    globalFilterFn?: (row: TData, query: string) => boolean;
};

export function DataTable<TData>({
    data,
    columns,
    filterPanel: FilterPanel,
    searchColumn = 'name',
    searchPlaceholder = 'Filter name...',
    initialColumnVisibility = {},
    initialPageSize = 25,
    compact = false,
    globalFilterFn,
}: TableProps<TData>) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(initialColumnVisibility);
    const [rowSelection, setRowSelection] = React.useState({});
    const [filterOpen, setFilterOpen] = React.useState(false);
    const [globalFilter, setGlobalFilter] = React.useState('');

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onGlobalFilterChange: setGlobalFilter,
        globalFilterFn: globalFilterFn
            ? (row, _columnId, filterValue) => globalFilterFn(row.original, filterValue)
            : undefined,
        initialState: {
            pagination: {
                pageSize: initialPageSize,
            },
        },
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            globalFilter,
        },
    });

    const handleClearFilters = () => {
        setColumnFilters([]);
    };

    const activeFilterCount = columnFilters.length;

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 py-4">
                <Input
                    placeholder={searchPlaceholder}
                    value={globalFilterFn ? globalFilter : ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? '')}
                    onChange={(event) =>
                        globalFilterFn
                            ? setGlobalFilter(event.target.value)
                            : table.getColumn(searchColumn)?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <div className="ml-auto flex gap-2">
                    {FilterPanel && (
                        <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline">
                                    <Filter className="mr-2 h-4 w-4" />
                                    Filter
                                    {activeFilterCount > 0 && (
                                        <span className="bg-primary text-primary-foreground ml-2 rounded-full px-2 py-0.5 text-xs">
                                            {activeFilterCount}
                                        </span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent align="end" className="w-80 p-0">
                                <ScrollArea className="h-[400px]">
                                    <div className="p-4">
                                        <FilterPanel table={table} onClearFilters={handleClearFilters} />
                                    </div>
                                </ScrollArea>
                            </PopoverContent>
                        </Popover>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Columns <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) => column.toggleVisibility(!!value)}
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row, index) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && 'selected'}
                                    className={`${index % 2 === 1 ? 'bg-muted/30' : ''} ${compact ? '[&>td]:py-1.5' : ''}`}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id} className={compact ? 'text-xs' : ''}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of {table.getFilteredRowModel().rows.length} row(s) selected.
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Rows</span>
                        <Select
                            value={String(table.getState().pagination.pageSize)}
                            onValueChange={(value) => table.setPageSize(Number(value))}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[10, 25, 50, 100].map((size) => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        {(() => {
                            const currentPage = table.getState().pagination.pageIndex;
                            const totalPages = table.getPageCount();
                            const pages: (number | 'ellipsis')[] = [];

                            if (totalPages <= 7) {
                                // Show all pages
                                for (let i = 0; i < totalPages; i++) pages.push(i);
                            } else {
                                // Always show first page
                                pages.push(0);

                                if (currentPage > 2) pages.push('ellipsis');

                                // Pages around current
                                const start = Math.max(1, currentPage - 1);
                                const end = Math.min(totalPages - 2, currentPage + 1);
                                for (let i = start; i <= end; i++) pages.push(i);

                                if (currentPage < totalPages - 3) pages.push('ellipsis');

                                // Always show last page
                                pages.push(totalPages - 1);
                            }

                            return pages.map((page, idx) =>
                                page === 'ellipsis' ? (
                                    <span key={`ellipsis-${idx}`} className="text-muted-foreground px-1 text-sm">
                                        …
                                    </span>
                                ) : (
                                    <Button
                                        key={page}
                                        variant={currentPage === page ? 'default' : 'outline'}
                                        size="icon"
                                        className="h-8 w-8 text-xs"
                                        onClick={() => table.setPageIndex(page)}
                                    >
                                        {page + 1}
                                    </Button>
                                ),
                            );
                        })()}
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                            disabled={!table.getCanNextPage()}
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Re-export the FilterPanelProps type for use in filter panel components
export type { FilterPanelProps };
