import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, BarChart3, DollarSign, Package, Receipt, ShoppingCart, TrendingDown, TrendingUp, Users } from 'lucide-react';

type DailySummary = {
    today_sales: number;
    today_revenue: number;
    today_cash: number;
    percent_change: number;
};

type LowStockCount = number;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '#',
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function Dashboard({ dailySummary, lowStockCount }: { dailySummary?: DailySummary; lowStockCount?: LowStockCount }) {
    const summary = dailySummary ?? {
        today_sales: 0,
        today_revenue: 0,
        today_cash: 0,
        percent_change: 0,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Quick Actions */}
                <div className="flex gap-4">
                    <Button asChild size="lg" className="flex-1">
                        <Link href={route('sales.create')}>
                            <ShoppingCart className="mr-2 h-5 w-5" />
                            New Sale (POS)
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href={route('purchases.create')}>
                            <Package className="mr-2 h-5 w-5" />
                            New Purchase
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg">
                        <Link href={route('reports.sales')}>
                            <BarChart3 className="mr-2 h-5 w-5" />
                            Sales Report
                        </Link>
                    </Button>
                </div>

                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
                            <Receipt className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.today_sales}</div>
                            <p className="text-muted-foreground text-xs">Transactions today</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                            <DollarSign className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.today_revenue)} Ks</div>
                            <div className="flex items-center text-xs">
                                {summary.percent_change >= 0 ? (
                                    <>
                                        <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                                        <span className="text-green-500">+{summary.percent_change}%</span>
                                    </>
                                ) : (
                                    <>
                                        <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                                        <span className="text-red-500">{summary.percent_change}%</span>
                                    </>
                                )}
                                <span className="text-muted-foreground ml-1">vs yesterday</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
                            <TrendingUp className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{formatCurrency(summary.today_cash)} Ks</div>
                            <p className="text-muted-foreground text-xs">Paid amount today</p>
                        </CardContent>
                    </Card>

                    {(lowStockCount ?? 0) > 0 ? (
                        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-400">Low Stock Alert</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-700 dark:text-orange-400">{lowStockCount}</div>
                                <Link href={route('reports.low-stock')} className="inline-flex items-center text-xs text-orange-600 hover:underline">
                                    View details <ArrowRight className="ml-1 h-3 w-3" />
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Stock Status</CardTitle>
                                <Package className="text-muted-foreground h-4 w-4" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">Good</div>
                                <p className="text-muted-foreground text-xs">All products stocked</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Quick Links Grid */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                Sales
                            </CardTitle>
                            <CardDescription>Manage your sales transactions</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button asChild variant="outline" className="justify-start">
                                <Link href={route('sales.create')}>
                                    <ShoppingCart className="mr-2 h-4 w-4" /> New POS Sale
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" className="justify-start">
                                <Link href={route('sales.index')}>View All Sales</Link>
                            </Button>
                            <Button asChild variant="ghost" className="justify-start">
                                <Link href={route('sale-returns.index')}>Sale Returns</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Inventory
                            </CardTitle>
                            <CardDescription>Manage products and stock</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button asChild variant="outline" className="justify-start">
                                <Link href={route('purchases.create')}>
                                    <Package className="mr-2 h-4 w-4" /> New Purchase
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" className="justify-start">
                                <Link href={route('products.index')}>Products</Link>
                            </Button>
                            <Button asChild variant="ghost" className="justify-start">
                                <Link href={route('branch-stocks.index')}>Stock Levels</Link>
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Customers
                            </CardTitle>
                            <CardDescription>Manage customers and credit</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button asChild variant="outline" className="justify-start">
                                <Link href={route('customers.create')}>
                                    <Users className="mr-2 h-4 w-4" /> Add Customer
                                </Link>
                            </Button>
                            <Button asChild variant="ghost" className="justify-start">
                                <Link href={route('customers.index')}>All Customers</Link>
                            </Button>
                            <Button asChild variant="ghost" className="justify-start">
                                <Link href={route('customer-payments.index')}>Payments</Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
