import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Sale } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    Building2,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    DollarSign,
    Edit,
    FileText,
    Mail,
    MapPin,
    Phone,
    Printer,
    Receipt,
    ShoppingBag,
    User as UserIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const formatCurrency = (value: number | string | undefined | null) => {
    const num = Number(value) || 0;
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(d);
    } catch {
        return dateStr;
    }
};

const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        }).format(d);
    } catch {
        return dateStr;
    }
};

export default function SaleShow({ sale }: { sale: Sale }) {
    const receiptRef = useRef<HTMLDivElement>(null);
    const [backUrl, setBackUrl] = useState<string>(route('sales.index'));

    useEffect(() => {
        const savedUrl = sessionStorage.getItem('last_sales_url');
        if (savedUrl) {
            setBackUrl(savedUrl);
        }
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Sales',
            href: backUrl,
        },
        {
            title: sale.invoice_no,
            href: '#',
        },
    ];

    const items = sale.sale_items || (sale as unknown as { saleItems?: typeof sale.sale_items }).saleItems || [];
    const totalQuantity = items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);

    const handleThermalPrint = () => {
        const printContent = receiptRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${sale.invoice_no}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px; }
                    .header { text-align: center; margin-bottom: 10px; }
                    .company { font-size: 16px; font-weight: bold; }
                    .divider { border-top: 1px dashed #000; margin: 8px 0; }
                    .row { display: flex; justify-content: space-between; margin: 2px 0; }
                    .item { margin: 4px 0; }
                    .item-name { font-weight: bold; }
                    .item-detail { display: flex; justify-content: space-between; padding-left: 10px; }
                    .total-row { font-weight: bold; font-size: 14px; }
                    .footer { text-align: center; margin-top: 15px; font-size: 11px; }
                    @media print { body { width: 80mm; } }
                </style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    };

    const openPrintFormat = (format: 'a4' | 'a5' | 'thermal') => {
        window.open(route('sales.print', { sale: sale.id, format }), '_blank');
    };

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'paid':
                return {
                    label: 'Paid in Full',
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
                    icon: CheckCircle2,
                };
            case 'partial':
                return {
                    label: 'Partially Paid',
                    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
                    icon: Clock,
                };
            case 'unpaid':
                return {
                    label: 'Unpaid (Credit)',
                    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
                    icon: AlertCircle,
                };
            default:
                return {
                    label: status,
                    className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    icon: Clock,
                };
        }
    };

    const statusConfig = getStatusConfig(sale.payment_status);
    const StatusIcon = statusConfig.icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${sale.invoice_no}`} />

            <div className="w-full space-y-6 p-4 sm:p-6 pb-16 max-w-7xl mx-auto">
                {/* Header Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 shadow-xs">
                            <Link href={backUrl}>
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Sales</span>
                            </Link>
                        </Button>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">Invoice:</span>
                            <span className="font-mono font-bold text-sm tracking-tight text-foreground">{sale.invoice_no}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Print Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2 shadow-xs">
                                    <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    <span>Print Invoice</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Print Options</DropdownMenuLabel>
                                <DropdownMenuItem onClick={handleThermalPrint} className="cursor-pointer gap-2">
                                    <Receipt className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    <span>Thermal Receipt (80mm)</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openPrintFormat('a4')} className="cursor-pointer gap-2">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>Standard A4 Invoice</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPrintFormat('a5')} className="cursor-pointer gap-2">
                                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Compact A5 Invoice</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPrintFormat('thermal')} className="cursor-pointer gap-2">
                                    <Receipt className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    <span>Thermal Browser View</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Edit Button */}
                        <Button size="sm" asChild className="h-9 gap-1.5 shadow-xs">
                            <Link href={route('sales.edit', { sale: sale.id })}>
                                <Edit className="h-4 w-4" />
                                <span>Edit Sale</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Hero Invoice Banner */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {sale.invoice_no}
                                </h1>
                                <Badge variant="outline" className={`gap-1.5 px-2.5 py-0.5 font-medium ${statusConfig.className}`}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    <span>{statusConfig.label}</span>
                                </Badge>
                                {sale.price_type && (
                                    <Badge variant="secondary" className="capitalize text-xs font-mono">
                                        {sale.price_type} Price
                                    </Badge>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                                <span>Branch:</span>
                                <span className="font-medium text-foreground">{sale.branch?.name}</span>
                                <span>•</span>
                                <span>Customer:</span>
                                <span className="font-medium text-foreground">{sale.customer?.name || 'Walk-in Customer'}</span>
                                <span>•</span>
                                <span>Date:</span>
                                <span className="font-medium text-foreground">{formatDate(sale.sale_date)}</span>
                            </p>
                        </div>

                        {/* Total Highlight */}
                        <div className="flex flex-col sm:items-end justify-center rounded-lg bg-slate-50 px-4 py-3 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Amount</span>
                            <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">
                                {formatCurrency(sale.total_amount)} <span className="text-base font-normal text-muted-foreground">Ks</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* KPI 1: Total & Items */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Purchased Items</span>
                                <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="font-mono text-xl font-bold text-foreground">
                                    {items.length} <span className="text-sm font-normal text-muted-foreground">lines</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Total quantity: <span className="font-mono font-semibold text-foreground">{totalQuantity}</span> units
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 2: Paid Amount */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount Paid</span>
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(sale.paid_amount)} <span className="text-xs font-normal">Ks</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                    Method: <span className="font-semibold text-foreground">{sale.payment_method || 'Cash'}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 3: Credit / Due */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credit / Balance Due</span>
                                <div className={`rounded-lg p-2 ${
                                    sale.credit_amount > 0 
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' 
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    <CreditCard className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className={`font-mono text-xl font-bold ${
                                    sale.credit_amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                                }`}>
                                    {formatCurrency(sale.credit_amount)} <span className="text-xs font-normal">Ks</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {sale.credit_amount > 0 ? 'Pending customer payment' : 'No credit outstanding'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 4: Net Discount */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Discount Applied</span>
                                <div className="rounded-lg bg-purple-50 p-2 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="font-mono text-xl font-bold text-foreground">
                                    {formatCurrency(sale.discount_amount)} <span className="text-xs font-normal">Ks</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {sale.discount_amount > 0 && sale.subtotal > 0
                                        ? `${parseFloat(((sale.discount_amount / sale.subtotal) * 100).toFixed(2))}% off subtotal`
                                        : 'Zero discount'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column (8 cols): Items Table & Financial Breakdown */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Items Table Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <ShoppingBag className="h-4 w-4 text-primary" />
                                            Invoice Line Items
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            List of products and quantities included in this invoice.
                                        </CardDescription>
                                    </div>
                                    <Badge variant="secondary" className="font-mono text-xs">
                                        {items.length} {items.length === 1 ? 'item' : 'items'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                {items.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="bg-slate-50/75 dark:bg-slate-900/50">
                                                <TableRow>
                                                    <TableHead className="w-12 text-center text-xs">#</TableHead>
                                                    <TableHead className="text-xs">Product Details</TableHead>
                                                    <TableHead className="text-right text-xs">Unit Price</TableHead>
                                                    <TableHead className="text-center text-xs">Quantity</TableHead>
                                                    {sale.discount_amount > 0 && <TableHead className="text-right text-xs">Discount</TableHead>}
                                                    <TableHead className="text-right text-xs">Subtotal</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {items.map((item, index) => (
                                                    <TableRow key={item.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                                                        <TableCell className="text-center font-mono text-xs text-muted-foreground">
                                                            {index + 1}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="space-y-0.5">
                                                                <div className="font-mono font-bold text-xs text-foreground">
                                                                    {item.product?.code || '-'}
                                                                </div>
                                                                <div className="text-sm font-medium text-foreground">
                                                                    {item.product?.name || 'Unknown Product'}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-sm">
                                                            {formatCurrency(item.unit_price)} <span className="text-[10px] text-muted-foreground">Ks</span>
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono font-semibold text-sm">
                                                            {item.quantity}
                                                        </TableCell>
                                                        {sale.discount_amount > 0 && (
                                                            <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                                {item.discount_amount ? `${formatCurrency(item.discount_amount)} Ks` : '-'}
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="text-right font-mono font-bold text-sm text-foreground">
                                                            {formatCurrency(item.subtotal)} <span className="text-[10px] font-normal text-muted-foreground">Ks</span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                ) : (
                                    <div className="p-8 text-center text-sm text-muted-foreground">
                                        No items recorded for this invoice.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment & Financial Breakdown Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    Financial & Payment Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Items Subtotal</span>
                                    <span className="font-mono font-medium text-foreground">{formatCurrency(sale.subtotal)} Ks</span>
                                </div>

                                {sale.discount_amount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                                            Discount
                                            {sale.subtotal > 0 && (
                                                <Badge variant="outline" className="text-[10px] border-purple-200 dark:border-purple-800">
                                                    {parseFloat(((sale.discount_amount / sale.subtotal) * 100).toFixed(2))}%
                                                </Badge>
                                            )}
                                        </span>
                                        <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                            -{formatCurrency(sale.discount_amount)} Ks
                                        </span>
                                    </div>
                                )}

                                {sale.tax_amount > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Commercial Tax</span>
                                        <span className="font-mono font-medium text-foreground">+{formatCurrency(sale.tax_amount)} Ks</span>
                                    </div>
                                )}

                                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-base text-foreground">Total Payable</span>
                                    <span className="font-mono text-xl font-bold text-foreground">{formatCurrency(sale.total_amount)} Ks</span>
                                </div>

                                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/80 p-3.5 space-y-2 border border-slate-100 dark:border-slate-800 mt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4" /> Amount Paid
                                        </span>
                                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatCurrency(sale.paid_amount)} Ks
                                        </span>
                                    </div>

                                    {sale.credit_amount > 0 && (
                                        <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4" /> Credit (Due)
                                            </span>
                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                                {formatCurrency(sale.credit_amount)} Ks
                                            </span>
                                        </div>
                                    )}

                                    {Number(sale.paid_amount) > Number(sale.total_amount) && (
                                        <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                            <span className="text-muted-foreground font-medium">Change Returned</span>
                                            <span className="font-mono font-semibold text-foreground">
                                                {formatCurrency(Number(sale.paid_amount) - Number(sale.total_amount))} Ks
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes Card */}
                        {sale.notes && (
                            <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        Invoice Notes & Remarks
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800 text-foreground">
                                        {sale.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column (4 cols): Customer Profile, Branch, and Cashier Metadata */}
                    <div className="space-y-6 lg:col-span-4">
                        {/* Customer Information Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <UserIcon className="h-4 w-4 text-primary" />
                                        Customer Details
                                    </CardTitle>
                                    {sale.customer && (
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {sale.customer.code}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3.5">
                                <div>
                                    <div className="text-xs text-muted-foreground">Customer Name</div>
                                    <div className="font-semibold text-base text-foreground mt-0.5">
                                        {sale.customer?.name || 'Walk-in Customer'}
                                    </div>
                                </div>

                                {sale.customer?.phone && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Phone Number</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <a
                                                href={`tel:${sale.customer.phone}`}
                                                className="font-mono text-sm text-primary hover:underline"
                                            >
                                                {sale.customer.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {sale.customer?.email && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Email</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm text-foreground">{sale.customer.email}</span>
                                        </div>
                                    </div>
                                )}

                                {sale.customer?.address && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Address</div>
                                        <div className="flex items-start gap-2 mt-0.5">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                            <span className="text-xs text-foreground whitespace-pre-wrap">{sale.customer.address}</span>
                                        </div>
                                    </div>
                                )}

                                {sale.customer && (
                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Credit Balance:</span>
                                            <span className={`font-mono font-semibold ${
                                                Number(sale.customer.current_balance) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                                            }`}>
                                                {formatCurrency(sale.customer.current_balance)} Ks
                                            </span>
                                        </div>
                                        {sale.customer.credit_limit > 0 && (
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Credit Limit:</span>
                                                <span className="font-mono text-muted-foreground">
                                                    {formatCurrency(sale.customer.credit_limit)} Ks
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Branch & Register Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Branch & Register
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3.5">
                                <div>
                                    <div className="text-xs text-muted-foreground">Branch Name</div>
                                    <div className="font-semibold text-sm text-foreground mt-0.5 flex items-center gap-2">
                                        <span>{sale.branch?.name || '-'}</span>
                                        {sale.branch?.code && (
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                {sale.branch.code}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {sale.branch?.invoice_title && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Invoice Print Header</div>
                                        <div className="font-semibold text-xs text-primary mt-0.5">
                                            {sale.branch.invoice_title}
                                        </div>
                                    </div>
                                )}

                                {sale.branch?.phone && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Branch Contact</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="font-mono text-xs">{sale.branch.phone}</span>
                                        </div>
                                    </div>
                                )}

                                {sale.branch?.address && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Location</div>
                                        <div className="flex items-start gap-2 mt-0.5">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                            <span className="text-xs text-muted-foreground">{sale.branch.address}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Processed by (Cashier)</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-foreground">
                                                {sale.createdBy?.name ? sale.createdBy.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <span className="text-xs font-medium text-foreground">
                                                {sale.createdBy?.name || 'System User'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-muted-foreground">Created Timestamp</div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDateTime(sale.created_at)}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Print Actions Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                    <Printer className="h-4 w-4 text-muted-foreground" />
                                    Quick Print Formats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="default"
                                    className="w-full justify-start gap-2 shadow-xs"
                                    onClick={handleThermalPrint}
                                >
                                    <Receipt className="h-4 w-4" />
                                    <span>Thermal Receipt (80mm)</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 bg-white dark:bg-slate-900 shadow-xs"
                                    onClick={() => openPrintFormat('a4')}
                                >
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>Print A4 Invoice</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 bg-white dark:bg-slate-900 shadow-xs"
                                    onClick={() => openPrintFormat('a5')}
                                >
                                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Print A5 Invoice</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Hidden Thermal Receipt for Direct Printing */}
                <div className="hidden">
                    <div ref={receiptRef}>
                        <div className="header">
                            {sale.branch?.logo_url && (
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                    <img
                                        src={sale.branch.logo_url}
                                        alt={sale.branch.name}
                                        style={{ maxHeight: '60px', maxWidth: '120px', objectFit: 'contain' }}
                                    />
                                </div>
                            )}
                            <div className="company">{sale.branch?.invoice_title || sale.branch?.name || 'Mahar Shin POS'}</div>
                            {sale.branch?.invoice_title && sale.branch?.name && sale.branch.invoice_title !== sale.branch.name && (
                                <div>{sale.branch.name}</div>
                            )}
                            {sale.branch?.address && <div>{sale.branch.address}</div>}
                            {sale.branch?.phone && <div>Tel: {sale.branch.phone}</div>}
                        </div>
                        <div className="divider"></div>
                        <div className="row">
                            <span>Invoice:</span>
                            <span>{sale.invoice_no}</span>
                        </div>
                        <div className="row">
                            <span>Date:</span>
                            <span>{formatDate(sale.sale_date)}</span>
                        </div>
                        <div className="row">
                            <span>Customer:</span>
                            <span>{sale.customer?.name || 'Walk-in'}</span>
                        </div>
                        {sale.createdBy?.name && (
                            <div className="row">
                                <span>Cashier:</span>
                                <span>{sale.createdBy.name}</span>
                            </div>
                        )}
                        <div className="divider"></div>
                        {items.map((item, idx) => (
                            <div className="item" key={item.id || idx}>
                                <div className="item-name">{item.product?.name || 'Item'}</div>
                                <div className="item-detail">
                                    <span>
                                        {item.quantity} x {formatCurrency(item.unit_price)}
                                    </span>
                                    <span>{formatCurrency(item.subtotal)}</span>
                                </div>
                            </div>
                        ))}
                        <div className="divider"></div>
                        <div className="row">
                            <span>Subtotal:</span>
                            <span>{formatCurrency(sale.subtotal)} Ks</span>
                        </div>
                        {Number(sale.tax_amount) > 0 && (
                            <div className="row">
                                <span>Tax:</span>
                                <span>{formatCurrency(sale.tax_amount)} Ks</span>
                            </div>
                        )}
                        {Number(sale.discount_amount) > 0 && (
                            <div className="row">
                                <span>
                                    Discount {Number(sale.subtotal) > 0 && `(${parseFloat(((Number(sale.discount_amount) / Number(sale.subtotal)) * 100).toFixed(2))}%)`}:
                                </span>
                                <span>-{formatCurrency(sale.discount_amount)} Ks</span>
                            </div>
                        )}
                        <div className="divider"></div>
                        <div className="row total-row">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(sale.total_amount)} Ks</span>
                        </div>
                        <div className="row">
                            <span>Paid ({sale.payment_method || 'Cash'}):</span>
                            <span>{formatCurrency(sale.paid_amount)} Ks</span>
                        </div>
                        {Number(sale.credit_amount) > 0 && (
                            <div className="row">
                                <span>Credit:</span>
                                <span>{formatCurrency(sale.credit_amount)} Ks</span>
                            </div>
                        )}
                        {Number(sale.paid_amount) > Number(sale.total_amount) && (
                            <div className="row">
                                <span>Change:</span>
                                <span>{formatCurrency(Number(sale.paid_amount) - Number(sale.total_amount))} Ks</span>
                            </div>
                        )}
                        {sale.notes && (
                            <div className="row" style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '0.9em' }}>
                                <span>Note:</span>
                                <span>{sale.notes}</span>
                            </div>
                        )}
                        <div className="footer">
                            <div className="divider"></div>
                            <div>Thank you for shopping with us!</div>
                            <div>Please come again</div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
