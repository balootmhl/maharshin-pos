import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LaravelPaginator, PaginatedData } from '@/types';
import { Link, router } from '@inertiajs/react';
import {
    ColumnDef,
    ColumnFiltersState,
    FilterFn,
    PaginationState,
    Row,
    SortingState,
    Table as TanStackTable,
    Updater,
    VisibilityState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Eye, Filter, Pencil } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

// Simple debounce implementation to avoid adding lodash dependency
function debounce<Args extends unknown[], R>(func: (...args: Args) => R, wait: number): (...args: Args) => void {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: Args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

type ActionsProp = {
    routePrefix: string;
    routeParam: { [key: string]: number | string | undefined };
    canEdit?: boolean;
};

export function DataTableActions({ routePrefix, routeParam, canEdit = true }: ActionsProp) {
    return (
        <div className="flex items-center gap-1.5">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg border border-slate-200 text-slate-600 shadow-xs transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-800 dark:text-slate-400 dark:hover:border-blue-800/80 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                        asChild
                    >
                        <Link href={route(`${routePrefix}.show`, routeParam)}>
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                        </Link>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>View</TooltipContent>
            </Tooltip>

            {canEdit && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg border border-slate-200 text-amber-600 shadow-xs transition-all duration-200 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-slate-800 dark:text-amber-500 dark:hover:border-amber-800/80 dark:hover:bg-amber-950/30 dark:hover:text-amber-400"
                            asChild
                        >
                            <Link href={route(`${routePrefix}.edit`, routeParam)}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Edit</TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export type FilterPanelProps<TData> = {
    table: TanStackTable<TData>;
    onClearFilters: () => void;
};

type TableProps<TData> = {
    data: TData[] | PaginatedData<TData> | LaravelPaginator<TData>;
    columns: ColumnDef<TData>[];
    filterPanel?: React.ComponentType<FilterPanelProps<TData>>;
    searchColumn?: string;
    searchPlaceholder?: string;
    initialColumnVisibility?: VisibilityState;
    initialPageSize?: number;
    compact?: boolean;
    globalFilterFn?: (row: TData, query: string) => boolean;
    scrollable?: boolean;
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
    scrollable = false,
}: TableProps<TData>) {
    // Determine if we are in server-side mode
    // We check for 'meta' (API Resource) or 'current_page' (Standard Paginator)
    const isServerSide = !Array.isArray(data) && ('meta' in data || 'current_page' in data);

    const tableData = isServerSide ? (data as PaginatedData<TData> | LaravelPaginator<TData>).data : (data as TData[]);

    // Extract meta: if data has 'meta' property, use it. Otherwise, data IS the meta (LaravelPaginator).

    const meta = isServerSide ? ('meta' in data ? (data as PaginatedData<TData>).meta : (data as LaravelPaginator<TData>)) : null;

    // State
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(initialColumnVisibility);
    const [rowSelection, setRowSelection] = useState({});
    const [filterOpen, setFilterOpen] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');

    // Pagination State
    const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
        pageIndex: meta ? meta.current_page - 1 : 0,
        pageSize: meta ? meta.per_page : initialPageSize,
    });

    const pagination = React.useMemo(
        () => ({
            pageIndex,
            pageSize,
        }),
        [pageIndex, pageSize],
    );

    // Sync state with props when valid server-side data updates occur
    useEffect(() => {
        if (isServerSide && meta) {
            setPagination({
                pageIndex: meta.current_page - 1,
                pageSize: meta.per_page,
            });
        }
    }, [isServerSide, meta]);

    // Handle Server-Side parameter updates
    const updateServerParams = useCallback((newParams: Record<string, string | number | undefined>) => {
        const currentQuery = new URLSearchParams(window.location.search);
        Object.entries(newParams).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                currentQuery.delete(key);
            } else {
                currentQuery.set(key, String(value));
            }
        });

        // Convert to object for Inertia
        const queryObj: Record<string, string> = {};
        currentQuery.forEach((val, key) => {
            queryObj[key] = val;
        });

        router.get(window.location.pathname, queryObj, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, []);

    // Server-side change handlers
    const onPaginationChange = (updater: Updater<PaginationState>) => {
        if (isServerSide) {
            const nextState = typeof updater === 'function' ? updater(pagination) : updater;
            updateServerParams({
                page: nextState.pageIndex + 1,
                per_page: nextState.pageSize,
            });
        } else {
            setPagination(updater);
        }
    };

    const onSortingChange = (updater: Updater<SortingState>) => {
        const nextState = typeof updater === 'function' ? updater(sorting) : updater;
        setSorting(nextState);

        if (isServerSide) {
            const sortParam = nextState.map((sort) => (sort.desc ? `-${sort.id}` : sort.id)).join(',');
            updateServerParams({ sort: sortParam || undefined });
        }
    };

    const onColumnFiltersChange = (updater: Updater<ColumnFiltersState>) => {
        const nextState = typeof updater === 'function' ? updater(columnFilters) : updater;
        setColumnFilters(nextState);
    };

    // Debounced global search
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSearch = useCallback(
        debounce((value: string) => {
            if (isServerSide) {
                updateServerParams({ 'filter[global]': value || undefined, page: 1 });
            }
        }, 500),
        [isServerSide, updateServerParams],
    );

    const onGlobalFilterChange = (value: string) => {
        setGlobalFilter(value);
        debouncedSearch(value);
    };

    // Adapter for globalFilterFn to match useReactTable signature
    const globalFilterFnAdapter: FilterFn<TData> | undefined = globalFilterFn
        ? (row: Row<TData>, _columnId: string, filterValue: unknown) => globalFilterFn(row.original, String(filterValue))
        : undefined;

    // React Table Instance
    const table = useReactTable({
        data: tableData,
        columns,
        pageCount: isServerSide && meta ? meta.last_page : undefined,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
            pagination,
            globalFilter,
        },
        onSortingChange: onSortingChange,
        onColumnFiltersChange: onColumnFiltersChange,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        onPaginationChange: onPaginationChange,
        onGlobalFilterChange: onGlobalFilterChange,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        manualPagination: isServerSide,
        manualSorting: isServerSide,
        manualFiltering: isServerSide,
        globalFilterFn: globalFilterFnAdapter,
    });

    // Check if we need to sync column filters for server-side
    useEffect(() => {
        if (!isServerSide) return;

        const timeoutId = setTimeout(() => {
            const filterParams: Record<string, string | number | undefined> = {};

            columnFilters.forEach((filter) => {
                const value = filter.value;
                if (value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)) {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        Object.entries(value).forEach(([subKey, subValue]) => {
                            if (subValue !== undefined && subValue !== '') {
                                filterParams[`filter[${filter.id}_${subKey}]`] = String(subValue);
                            }
                        });
                    } else {
                        const val = Array.isArray(value) ? value.join(',') : String(value);
                        filterParams[`filter[${filter.id}]`] = val;
                    }
                }
            });

            // We also need to clear filters that were removed.
            const currentUrlParams = new URLSearchParams(window.location.search);
            const keysToDelete: string[] = [];
            currentUrlParams.forEach((_, key) => {
                if (key.startsWith('filter[') && key !== 'filter[global]') {
                    if (!(key in filterParams)) {
                        keysToDelete.push(key);
                    }
                }
            });

            // Check if there are ACTUAL differences between URL and our new state to avoid infinite ping
            let hasChanges = keysToDelete.length > 0;
            Object.entries(filterParams).forEach(([key, value]) => {
                if (currentUrlParams.get(key) !== value) {
                    hasChanges = true;
                }
            });

            // Apply updates if there are changes
            if (hasChanges) {
                const paramsToUpdate: Record<string, string | number | undefined> = { ...filterParams };
                keysToDelete.forEach((k) => (paramsToUpdate[k] = ''));
                paramsToUpdate['page'] = 1; // Reset to page 1

                updateServerParams(paramsToUpdate);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [columnFilters, isServerSide, updateServerParams]);

    const handleClearFilters = () => {
        setColumnFilters([]);
        if (isServerSide) {
            const currentUrlParams = new URLSearchParams(window.location.search);
            const paramsToUpdate: Record<string, string> = {};
            currentUrlParams.forEach((_, key) => {
                if (key.startsWith('filter[')) {
                    paramsToUpdate[key] = '';
                }
            });
            updateServerParams(paramsToUpdate);
        }
    };

    const activeFilterCount = columnFilters.length;

    // Initial value logic for Input
    const initialGlobalFilter = globalFilterFn ? globalFilter : ((table.getColumn(searchColumn)?.getFilterValue() as string) ?? '');

    return (
        <div className="w-full">
            <div className="flex items-center gap-2 py-4">
                <Input
                    placeholder={searchPlaceholder}
                    value={globalFilterFn ? globalFilter : initialGlobalFilter}
                    onChange={(event) =>
                        globalFilterFn ? onGlobalFilterChange(event.target.value) : table.getColumn(searchColumn)?.setFilterValue(event.target.value)
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
            <div className={`rounded-md border ${scrollable ? 'relative h-[calc(100vh-280px)] overflow-auto' : ''}`}>
                <Table>
                    <TableHeader className={scrollable ? 'bg-background sticky top-0 z-10 shadow-sm' : ''}>
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
                    {/* For server side, we might verify if we want to show selected count locally or total */}
                    {table.getFilteredSelectedRowModel().rows.length} of {isServerSide && meta ? meta.total : table.getFilteredRowModel().rows.length}{' '}
                    row(s) selected.
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">Rows</span>
                        <Select value={String(table.getState().pagination.pageSize)} onValueChange={(value) => table.setPageSize(Number(value))}>
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
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
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
