import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch } from '@/types';
import { Head, router } from '@inertiajs/react';
import { BarChart3, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { useState } from 'react';
type SaleByDate = { date: string; sales_count: number; total_amount: number; paid_amount: number };
type SaleByStatus = { payment_status: string; count: number; total: number };
type TopProduct = { name: string; code: string; qty_sold: number; revenue: number };
type Summary = {
    total_sales: number;
    total_revenue: number;
    total_paid: number;
    total_credit: number;
    average_sale: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '#' },
    { title: 'Sales Report', href: route('reports.sales') },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function SalesReport({
    branches,
    filters,
    summary,
    salesByDate,
    salesByStatus,
    topProducts,
}: {
    branches: Branch[];
    filters: { start_date: string; end_date: string; branch_id?: string; group_by: string };
    summary: Summary;
    salesByDate: SaleByDate[];
    salesByStatus: SaleByStatus[];
    topProducts: TopProduct[];
}) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');

    const applyFilters = () => {
        router.get(
            route('reports.sales'),
            {
                start_date: startDate,
                end_date: endDate,
                branch_id: branchId === 'all' ? undefined : branchId,
            },
            { preserveState: true },
        );
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'paid':
                return 'default';
            case 'partial':
                return 'outline';
            case 'unpaid':
                return 'destructive';
            default:
                return 'secondary';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Filters */}
                <Card>
                    <CardContent className="flex flex-wrap items-end gap-4 pt-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Start Date</Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-40" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">End Date</Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-40" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger className="w-40">
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
                        </div>
                        <Button onClick={applyFilters}>Apply Filters</Button>
                    </CardContent>
                </Card>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                            <Receipt className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_sales ?? 0}</div>
                            <p className="text-muted-foreground text-xs">Transactions</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue ?? 0)} Ks</div>
                            <p className="text-muted-foreground text-xs">Gross sales</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
                            <TrendingUp className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.total_paid ?? 0)} Ks</div>
                            <p className="text-muted-foreground text-xs">Paid amount</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Outstanding Credit</CardTitle>
                            <BarChart3 className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{formatCurrency(summary.total_credit ?? 0)} Ks</div>
                            <p className="text-muted-foreground text-xs">Unpaid balance</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Daily Sales */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Sales by Date</CardTitle>
                            <CardDescription>Daily breakdown of sales</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Sales</TableHead>
                                        <TableHead className="text-right">Revenue</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesByDate.map((row) => (
                                        <TableRow key={row.date}>
                                            <TableCell className="font-medium">{row.date}</TableCell>
                                            <TableCell className="text-right">{row.sales_count}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(row.total_amount)} Ks</TableCell>
                                        </TableRow>
                                    ))}
                                    {salesByDate.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-muted-foreground text-center">
                                                No sales data for this period
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Sales by Status & Top Products */}
                    <div className="space-y-4">
                        {/* Sales by Payment Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Sales by Payment Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {salesByStatus.map((status) => (
                                        <div key={status.payment_status} className="flex items-center justify-between rounded-lg border p-2">
                                            <div className="flex items-center gap-2">
                                                <Badge variant={getStatusVariant(status.payment_status)}>{status.payment_status}</Badge>
                                                <span className="text-muted-foreground text-sm">{status.count} sales</span>
                                            </div>
                                            <span className="font-mono font-medium">{formatCurrency(status.total)} Ks</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Products */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top Selling Products</CardTitle>
                                <CardDescription>By revenue</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Product</TableHead>
                                            <TableHead className="text-right">Qty</TableHead>
                                            <TableHead className="text-right">Revenue</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topProducts.slice(0, 5).map((p, i) => (
                                            <TableRow key={i}>
                                                <TableCell>
                                                    <div className="font-medium">{p.name}</div>
                                                    <div className="text-muted-foreground text-xs">{p.code}</div>
                                                </TableCell>
                                                <TableCell className="text-right">{p.qty_sold}</TableCell>
                                                <TableCell className="text-right font-mono">{formatCurrency(p.revenue)} Ks</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
