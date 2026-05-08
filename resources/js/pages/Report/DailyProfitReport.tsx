import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ChevronDown, ChevronRight, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

type InvoiceItem = {
    product_name: string;
    product_code: string;
    quantity: number;
    unit_price: number;
    cost_price: number;
    profit_per_unit: number;
    item_profit: number;
    subtotal: number;
};

type Invoice = {
    id: number;
    invoice_no: string;
    customer_name: string | null;
    branch_name: string | null;
    sale_date: string;
    payment_status: string;
    total_amount: number;
    invoice_profit: number;
    items: InvoiceItem[];
};

type Summary = {
    total_invoices: number;
    total_revenue: number;
    total_profit: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

const profitColor = (value: number) =>
    value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-muted-foreground';

const profitMargin = (profit: number, revenue: number) => {
    if (!revenue) return '0%';
    return ((profit / revenue) * 100).toFixed(1) + '%';
};

const statusVariant = (status: string): 'default' | 'outline' | 'destructive' | 'secondary' => {
    switch (status) {
        case 'paid':    return 'default';
        case 'partial': return 'outline';
        case 'unpaid':  return 'destructive';
        default:        return 'secondary';
    }
};

// ─── Breadcrumbs ─────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '#' },
    { title: 'Daily Profit', href: route('reports.daily-profit') },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DailyProfitReport({
    branches,
    filters,
    summary,
    invoices,
}: {
    branches: Branch[];
    filters: { date: string; branch_id?: string };
    summary: Summary;
    invoices: Invoice[];
}) {
    const [date, setDate] = useState(filters.date);
    const [branchId, setBranchId] = useState(filters.branch_id || 'all');
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    // Sync local state with props when filters change (e.g. via browser back/forward or external links)
    useEffect(() => {
        setDate(filters.date);
        setBranchId(filters.branch_id || 'all');
    }, [filters]);

    const applyFilters = () => {
        router.get(
            route('reports.daily-profit'),
            {
                date,
                branch_id: branchId === 'all' ? undefined : branchId,
            },
            { preserveState: true },
        );
    };

    const toggleExpand = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const expandAll = () => setExpanded(new Set(invoices.map((i) => i.id)));
    const collapseAll = () => setExpanded(new Set());

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Daily Profit Report" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">

                {/* ── Filter Bar ──────────────────────────────────────────── */}
                <Card>
                    <CardContent className="flex flex-wrap items-end gap-4 pt-4">
                        <div className="space-y-1">
                            <Label className="text-xs">Date</Label>
                            <Input
                                id="profit-date-filter"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-44"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Branch</Label>
                            <Select value={branchId} onValueChange={setBranchId}>
                                <SelectTrigger id="profit-branch-filter" className="w-44">
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
                        <Button id="profit-apply-btn" onClick={applyFilters}>
                            Apply Filter
                        </Button>
                    </CardContent>
                </Card>

                {/* ── Summary Cards ────────────────────────────────────────── */}
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                            <Receipt className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{summary.total_invoices}</div>
                            <p className="text-muted-foreground text-xs">Transactions for {filters.date}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                            <DollarSign className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(summary.total_revenue)} Ks</div>
                            <p className="text-muted-foreground text-xs">Gross sales amount</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
                            <TrendingUp className="text-muted-foreground h-4 w-4" />
                        </CardHeader>
                        <CardContent>
                            <div className={`text-2xl font-bold ${profitColor(summary.total_profit)}`}>
                                {formatCurrency(summary.total_profit)} Ks
                            </div>
                            <p className="text-muted-foreground text-xs">
                                Margin: {profitMargin(summary.total_profit, summary.total_revenue)}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Invoice Table ────────────────────────────────────────── */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Invoices &amp; Profit Breakdown</CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={expandAll}>
                                Expand All
                            </Button>
                            <Button variant="outline" size="sm" onClick={collapseAll}>
                                Collapse All
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8" />
                                    <TableHead>Invoice #</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Branch</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Revenue</TableHead>
                                    <TableHead className="text-right">Profit</TableHead>
                                    <TableHead className="text-right">Margin</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoices.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-muted-foreground py-10 text-center">
                                            No sales found for {filters.date}
                                        </TableCell>
                                    </TableRow>
                                )}

                                {invoices.map((invoice) => {
                                    const isOpen = expanded.has(invoice.id);
                                    return (
                                        <>
                                            {/* ── Invoice row ── */}
                                            <TableRow
                                                key={`inv-${invoice.id}`}
                                                className="cursor-pointer hover:bg-muted/50"
                                                onClick={() => toggleExpand(invoice.id)}
                                            >
                                                <TableCell className="text-muted-foreground">
                                                    {isOpen ? (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4" />
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-mono font-semibold">
                                                    {invoice.invoice_no}
                                                </TableCell>
                                                <TableCell>{invoice.customer_name ?? '—'}</TableCell>
                                                <TableCell className="text-muted-foreground text-xs">
                                                    {invoice.branch_name ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariant(invoice.payment_status)}>
                                                        {invoice.payment_status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {formatCurrency(invoice.total_amount)} Ks
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right font-mono font-semibold ${profitColor(invoice.invoice_profit)}`}
                                                >
                                                    {formatCurrency(invoice.invoice_profit)} Ks
                                                </TableCell>
                                                <TableCell
                                                    className={`text-right text-xs ${profitColor(invoice.invoice_profit)}`}
                                                >
                                                    {profitMargin(invoice.invoice_profit, invoice.total_amount)}
                                                </TableCell>
                                            </TableRow>

                                            {/* ── Line items (expanded) ── */}
                                            {isOpen &&
                                                invoice.items.map((item, idx) => (
                                                    <TableRow
                                                        key={`item-${invoice.id}-${idx}`}
                                                        className="bg-muted/30 text-sm"
                                                    >
                                                        <TableCell />
                                                        <TableCell colSpan={2}>
                                                            <div className="flex items-center gap-2 pl-4">
                                                                <span className="bg-background rounded border px-1 font-mono text-xs">
                                                                    {item.product_code}
                                                                </span>
                                                                <span className="text-muted-foreground truncate max-w-[200px]" title={item.product_name}>
                                                                    {item.product_name}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-xs">
                                                            <div className="flex flex-col">
                                                                <span>Qty: {item.quantity}</span>
                                                                <span>@{formatCurrency(item.unit_price)}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-muted-foreground text-xs">
                                                            <div className="flex flex-col">
                                                                <span>Cost: {formatCurrency(item.cost_price)}</span>
                                                                {item.cost_price === 0 && (
                                                                    <span className="text-amber-500 text-[10px] flex items-center gap-1">
                                                                        <TrendingUp className="h-3 w-3" /> No cost found
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs">
                                                            {formatCurrency(item.subtotal)} Ks
                                                        </TableCell>
                                                        <TableCell
                                                            className={`text-right font-mono text-xs font-semibold ${profitColor(item.item_profit)}`}
                                                        >
                                                            {formatCurrency(item.item_profit)} Ks
                                                        </TableCell>
                                                        <TableCell className={`text-right text-xs ${profitColor(item.item_profit)}`}>
                                                            {profitMargin(item.item_profit, item.subtotal)}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                        </>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
