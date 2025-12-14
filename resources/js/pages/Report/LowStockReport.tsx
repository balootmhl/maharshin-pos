import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch } from '@/types';
import { Head, router } from '@inertiajs/react';
import { AlertTriangle, Package, PackageX } from 'lucide-react';
import { useState } from 'react';
type LowStockItem = {
    id: string;
    branch: string;
    product_name: string;
    product_code: string;
    unit?: string;
    current_stock: number;
    low_stock_alert: number;
    status: 'low_stock' | 'out_of_stock';
};
type Summary = {
    low_stock_count: number;
    out_of_stock_count: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '#' },
    { title: 'Low Stock Report', href: route('reports.low-stock') },
];

export default function LowStockReport({
    branches,
    filters,
    lowStockItems,
    summary,
}: {
    branches: Branch[];
    filters: { branch_id?: string; threshold: number };
    lowStockItems: LowStockItem[];
    summary: Summary;
}) {
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');

    const applyFilters = () => {
        router.get(
            route('reports.low-stock'),
            {
                branch_id: branchId === 'all' ? undefined : branchId,
            },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Low Stock Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Low Stock Report</h1>
                        <p className="text-muted-foreground text-sm">Products that need restocking</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={branchId} onValueChange={setBranchId}>
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Branches</SelectItem>
                                {branches.map((b) => (
                                    <SelectItem key={b.id} value={b.id.toString()}>
                                        {b.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={applyFilters}>Apply</Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Low Stock Items</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{summary.low_stock_count}</div>
                            <p className="text-xs text-orange-600/80">Need restocking soon</p>
                        </CardContent>
                    </Card>
                    <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Out of Stock</CardTitle>
                            <PackageX className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{summary.out_of_stock_count}</div>
                            <p className="text-xs text-red-600/80">Urgent attention needed</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                            <Package className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{lowStockItems.length}</div>
                            <p className="text-muted-foreground text-xs">Items requiring attention</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Low Stock Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Stock Alerts</CardTitle>
                        <CardDescription>Products below minimum stock threshold</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Product</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead className="text-center">Current Stock</TableHead>
                                    <TableHead className="text-center">Min. Stock</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {lowStockItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <div className="font-medium">{item.product_name}</div>
                                            <div className="text-muted-foreground font-mono text-xs">{item.product_code}</div>
                                        </TableCell>
                                        <TableCell>{item.branch}</TableCell>
                                        <TableCell className="text-center">
                                            <span className={`font-mono font-bold ${item.current_stock === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                                                {item.current_stock} {item.unit}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-center font-mono">{item.low_stock_alert}</TableCell>
                                        <TableCell className="text-center">
                                            {item.status === 'out_of_stock' ? (
                                                <Badge variant="destructive">
                                                    <PackageX className="mr-1 h-3 w-3" />
                                                    Out of Stock
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="border-orange-300 text-orange-700">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    Low Stock
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {lowStockItems.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-muted-foreground py-8 text-center">
                                            <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                            <p>All products are well stocked!</p>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
