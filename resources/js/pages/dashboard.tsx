import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    AlertCircle,
    ArrowUpRight,
    ArrowRight,
    BarChart3,
    CheckCircle2,
    DollarSign,
    Layers,
    Package,
    Plus,
    Receipt,
    ShoppingCart,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type DailySummary = {
    today_sales: number;
    today_revenue: number;
    today_cash: number;
    percent_change: number;
};

type RecentSale = {
    id: number;
    invoice_no: string;
    customer_name: string;
    branch_name: string;
    total_amount: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    sale_date: string;
};

type TopProduct = {
    name: string;
    code: string;
    qty_sold: number;
    revenue: number;
};

type SalesTrendItem = {
    date: string;
    revenue: number;
    sales_count: number;
};

type StockSummary = {
    total_products: number;
    low_stock_count: number;
    out_of_stock_count: number;
};

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        payload: {
            date: string;
            revenue: number;
            sales_count: number;
        };
    }>;
}

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

export default function Dashboard({
    dailySummary,
    recentSales = [],
    topProducts = [],
    salesTrend = [],
    stockSummary,
}: {
    dailySummary?: DailySummary;
    recentSales?: RecentSale[];
    topProducts?: TopProduct[];
    salesTrend?: SalesTrendItem[];
    stockSummary?: StockSummary;
}) {
    const { auth } = usePage<SharedData>().props;
    const summary = dailySummary ?? {
        today_sales: 0,
        today_revenue: 0,
        today_cash: 0,
        percent_change: 0,
    };

    // Calculate greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Format current date display
    const formatDateDisplay = () => {
        return new Intl.DateTimeFormat('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date());
    };

    const getStatusBadge = (status: RecentSale['payment_status']) => {
        switch (status) {
            case 'paid':
                return (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20">
                        Paid
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20">
                        Partial
                    </Badge>
                );
            case 'unpaid':
                return (
                    <Badge variant="destructive" className="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20">
                        Unpaid
                    </Badge>
                );
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    // Custom recharts tooltip
    const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-xl border border-neutral-200/80 bg-white p-3 shadow-xl dark:border-neutral-800/80 dark:bg-neutral-900">
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{payload[0].payload.date}</p>
                    <div className="mt-1.5 space-y-1">
                        <p className="text-sm font-bold text-violet-600 dark:text-violet-400">
                            Revenue: {formatCurrency(payload[0].value)} Ks
                        </p>
                        {payload[1] && (
                            <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                Transactions: {payload[1].value} sales
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            
            <div className="flex flex-col gap-6 p-6">
                
                {/* Greeting & Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-800 pb-5">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                            {getGreeting()}, <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-indigo-400">{auth.user.name}</span>!
                        </h1>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1 flex items-center gap-1.5">
                            <Activity className="h-4 w-4 text-emerald-500" />
                            Here is the current state of your business today.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Today's Date</p>
                            <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{formatDateDisplay()}</p>
                        </div>
                        {auth.user.branch && (
                            <div className="px-3.5 py-1.5 bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/50 dark:border-neutral-700/50 rounded-lg text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                🏢 {auth.user.branch.name}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Operations Floating Panel */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <Button asChild size="lg" className="h-16 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-indigo-500/10 text-white border-0">
                        <Link href={route('sales.create')} className="flex items-center justify-center gap-3 w-full text-base font-bold">
                            <ShoppingCart className="h-5 w-5" />
                            New POS Sale
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <Link href={route('purchases.create')} className="flex items-center justify-center gap-3 w-full text-base font-bold text-neutral-700 dark:text-neutral-300">
                            <Plus className="h-5 w-5 text-indigo-500" />
                            New Purchase
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <Link href={route('reports.sales')} className="flex items-center justify-center gap-3 w-full text-base font-bold text-neutral-700 dark:text-neutral-300">
                            <BarChart3 className="h-5 w-5 text-indigo-500" />
                            Sales Analytics
                        </Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="h-16 rounded-2xl border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <Link href={route('products.index')} className="flex items-center justify-center gap-3 w-full text-base font-bold text-neutral-700 dark:text-neutral-300">
                            <Package className="h-5 w-5 text-indigo-500" />
                            Manage Products
                        </Link>
                    </Button>
                </div>

                {/* Primary Metrics Section */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Today's Revenue */}
                    <Card className="relative overflow-hidden border-neutral-200/80 dark:border-neutral-800/80 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-violet-500 to-indigo-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Today's Revenue</CardTitle>
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl">
                                <DollarSign className="text-indigo-600 dark:text-indigo-400 h-4.5 w-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">{formatCurrency(summary.today_revenue)} Ks</div>
                            <div className="flex items-center mt-2.5 text-xs">
                                {summary.percent_change >= 0 ? (
                                    <div className="flex items-center text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingUp className="mr-1 h-3 w-3" />
                                        <span>+{summary.percent_change}%</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-rose-500 font-semibold bg-rose-500/10 px-2 py-0.5 rounded-full">
                                        <TrendingDown className="mr-1 h-3 w-3" />
                                        <span>{summary.percent_change}%</span>
                                    </div>
                                )}
                                <span className="text-neutral-400 dark:text-neutral-500 ml-2 font-medium">vs yesterday</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Today's Sales Count */}
                    <Card className="relative overflow-hidden border-neutral-200/80 dark:border-neutral-800/80 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-0 h-1.5 w-full bg-violet-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Today's Sales</CardTitle>
                            <div className="p-2 bg-violet-50 dark:bg-violet-950/40 rounded-xl">
                                <Receipt className="text-violet-600 dark:text-violet-400 h-4.5 w-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-neutral-900 dark:text-white">{summary.today_sales}</div>
                            <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-3 font-medium">Total sales orders completed today</p>
                        </CardContent>
                    </Card>

                    {/* Cash Collected */}
                    <Card className="relative overflow-hidden border-neutral-200/80 dark:border-neutral-800/80 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                        <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">Cash Collected</CardTitle>
                            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                                <TrendingUp className="text-emerald-600 dark:text-emerald-400 h-4.5 w-4.5" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(summary.today_cash)} Ks</div>
                            <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-3 font-medium">Net liquid cash payments accepted today</p>
                        </CardContent>
                    </Card>

                    {/* Stock Alert Card */}
                    {stockSummary && (stockSummary.low_stock_count > 0 || stockSummary.out_of_stock_count > 0) ? (
                        <Card className="relative overflow-hidden border-amber-200 dark:border-amber-900/60 bg-amber-500/5 shadow-sm rounded-2xl hover:shadow-md transition-all">
                            <div className="absolute top-0 left-0 h-1.5 w-full bg-amber-500 animate-pulse" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400">Stock Alerts</CardTitle>
                                <div className="p-2 bg-amber-100 dark:bg-amber-950/50 rounded-xl">
                                    <AlertCircle className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-extrabold text-amber-700 dark:text-amber-400">
                                        {stockSummary.low_stock_count + stockSummary.out_of_stock_count}
                                    </span>
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold">items need attention</span>
                                </div>
                                <div className="flex items-center justify-between mt-2.5">
                                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                        {stockSummary.out_of_stock_count} out of stock | {stockSummary.low_stock_count} low
                                    </span>
                                    <Link href={route('reports.low-stock')} className="inline-flex items-center text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline">
                                        Reorder <ArrowRight className="ml-1 h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="relative overflow-hidden border-emerald-200 dark:border-emerald-900/60 bg-emerald-500/5 shadow-sm rounded-2xl hover:shadow-md transition-shadow">
                            <div className="absolute top-0 left-0 h-1.5 w-full bg-emerald-500" />
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Stock Health</CardTitle>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/50 rounded-xl">
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-extrabold text-emerald-700 dark:text-emerald-400">Healthy</div>
                                <p className="text-neutral-400 dark:text-neutral-500 text-xs mt-3 font-medium">All products are adequately stocked</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sales Analytics Chart */}
                <Card className="border-neutral-200/80 dark:border-neutral-800/80 shadow-sm rounded-2xl overflow-hidden">
                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4">
                        <div>
                            <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-indigo-500" />
                                Weekly Sales Performance
                            </CardTitle>
                            <CardDescription>Visual trend of revenue and transaction volumes over the last 7 days</CardDescription>
                        </div>
                        {salesTrend.length > 0 && (
                            <div className="px-3.5 py-1.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-violet-600 dark:bg-violet-400 animate-pulse" />
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                                    Total 7D Revenue: {formatCurrency(salesTrend.reduce((sum, item) => sum + item.revenue, 0))} Ks
                                </span>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent className="px-2 pt-0 sm:px-6">
                        <div className="h-[300px] w-full mt-4">
                            {salesTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.01} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-neutral-100 dark:stroke-neutral-800" />
                                        <XAxis
                                            dataKey="date"
                                            axisLine={false}
                                            tickLine={false}
                                            className="text-[11px] font-semibold fill-neutral-400"
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tickFormatter={(val) => `${formatCurrency(val / 1000)}k`}
                                            className="text-[11px] font-semibold fill-neutral-400"
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#8b5cf6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-neutral-400 text-sm font-medium">
                                    No sales trend data available for this week.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Dashboard Split Grid: Recent Sales & Top Selling Products */}
                <div className="grid gap-6 lg:grid-cols-3">
                    
                    {/* Recent Transactions */}
                    <Card className="lg:col-span-2 border-neutral-200/80 dark:border-neutral-800/80 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-4">
                            <div>
                                <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5 text-indigo-500" />
                                    Recent Invoices
                                </CardTitle>
                                <CardDescription>Monitor the latest customer sales orders</CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 flex items-center gap-1">
                                <Link href={route('sales.index')}>
                                    View All <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0">
                            {recentSales.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader className="bg-neutral-50 dark:bg-neutral-900/60 border-y border-neutral-100 dark:border-neutral-800">
                                            <TableRow>
                                                <TableHead className="font-bold text-xs uppercase tracking-wider pl-6">Invoice No</TableHead>
                                                <TableHead className="font-bold text-xs uppercase tracking-wider">Customer</TableHead>
                                                <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                                                <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Total</TableHead>
                                                <TableHead className="font-bold text-xs uppercase tracking-wider text-center pr-6">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {recentSales.map((sale) => (
                                                <TableRow key={sale.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20 border-b border-neutral-100 dark:border-neutral-800/60 group">
                                                    <TableCell className="font-bold font-mono pl-6 text-sm text-neutral-900 dark:text-white">
                                                        <Link href={route('sales.show', sale.id)} className="hover:underline hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1.5">
                                                            {sale.invoice_no}
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                                        {sale.customer_name}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-neutral-500 dark:text-neutral-400">
                                                        {sale.sale_date}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-sm font-mono text-neutral-900 dark:text-white">
                                                        {formatCurrency(sale.total_amount)} Ks
                                                    </TableCell>
                                                    <TableCell className="text-center pr-6">
                                                        {getStatusBadge(sale.payment_status)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-neutral-400 text-sm font-medium">
                                    No recent transactions found. Get started by placing a new sale!
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top Products */}
                    <Card className="border-neutral-200/80 dark:border-neutral-800/80 shadow-sm rounded-2xl overflow-hidden">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <Layers className="h-5 w-5 text-indigo-500" />
                                Top Products
                            </CardTitle>
                            <CardDescription>Highest revenue products this period</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-2">
                            {topProducts.length > 0 ? (
                                <div className="space-y-4.5">
                                    {topProducts.map((product, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 hover:bg-neutral-100/70 dark:bg-neutral-900/40 dark:hover:bg-neutral-900/80 border border-neutral-100/50 dark:border-neutral-800/60 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                                                    idx === 0 
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400' 
                                                        : idx === 1 
                                                        ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                                        : idx === 2
                                                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400'
                                                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-neutral-900 dark:text-white truncate max-w-[130px] group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                                                        {product.name}
                                                    </h4>
                                                    <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500 font-bold block mt-0.5">
                                                        Code: {product.code}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-neutral-950 dark:text-white font-mono">{formatCurrency(product.revenue)} Ks</p>
                                                <p className="text-[11px] text-neutral-400 dark:text-neutral-500 font-semibold mt-0.5">{product.qty_sold} units sold</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-neutral-400 text-sm font-medium">
                                    No sales records recorded yet.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

            </div>
        </AppLayout>
    );
}
