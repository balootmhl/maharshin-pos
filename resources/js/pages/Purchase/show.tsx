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
import { type BreadcrumbItem, Purchase } from '@/types';
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
    Package,
    Phone,
    Printer,
    Receipt,
    Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';

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

export default function PurchaseShow({ purchase }: { purchase: Purchase }) {
    const [backUrl, setBackUrl] = useState<string>(route('purchases.index'));

    useEffect(() => {
        const savedUrl = sessionStorage.getItem('last_purchases_url');
        if (savedUrl) {
            setBackUrl(savedUrl);
        }
    }, []);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Purchases',
            href: backUrl,
        },
        {
            title: purchase.purchase_no,
            href: '#',
        },
    ];

    const items = purchase.purchase_items || (purchase as unknown as { purchaseItems?: typeof purchase.purchase_items }).purchaseItems || [];
    const totalQuantity = items.reduce((acc, item) => acc + Number(item.quantity || 0), 0);

    const openPrintFormat = (format: 'a4' | 'a5' | 'thermal') => {
        window.open(route('purchases.print', { purchase: purchase.id, format }), '_blank');
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
                    label: 'Unpaid (Due)',
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

    const statusConfig = getStatusConfig(purchase.payment_status);
    const StatusIcon = statusConfig.icon;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase ${purchase.purchase_no}`} />

            <div className="w-full space-y-6 p-4 sm:p-6 pb-16 max-w-7xl mx-auto">
                {/* Header Action Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild className="h-9 gap-1.5 shadow-xs">
                            <Link href={backUrl}>
                                <ArrowLeft className="h-4 w-4" />
                                <span>Back to Purchases</span>
                            </Link>
                        </Button>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">Order:</span>
                            <span className="font-mono font-bold text-sm tracking-tight text-foreground">{purchase.purchase_no}</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Print Dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="h-9 gap-2 shadow-xs">
                                    <Printer className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    <span>Print Order</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">Print Options</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openPrintFormat('a4')} className="cursor-pointer gap-2">
                                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    <span>Standard A4 Order</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openPrintFormat('a5')} className="cursor-pointer gap-2">
                                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Compact A5 Order</span>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openPrintFormat('thermal')} className="cursor-pointer gap-2">
                                    <Receipt className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    <span>Thermal Order Slip</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Edit Button */}
                        <Button size="sm" asChild className="h-9 gap-1.5 shadow-xs">
                            <Link href={route('purchases.edit', { purchase: purchase.id })}>
                                <Edit className="h-4 w-4" />
                                <span>Edit Purchase</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* Hero Purchase Banner */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900/50">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="font-mono text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                                    {purchase.purchase_no}
                                </h1>
                                <Badge variant="outline" className={`gap-1.5 px-2.5 py-0.5 font-medium ${statusConfig.className}`}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    <span>{statusConfig.label}</span>
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                                <span>Branch:</span>
                                <span className="font-medium text-foreground">{purchase.branch?.name}</span>
                                <span>•</span>
                                <span>Supplier:</span>
                                <span className="font-medium text-foreground">{purchase.supplier?.name || '-'}</span>
                                <span>•</span>
                                <span>Order Date:</span>
                                <span className="font-medium text-foreground">{formatDate(purchase.purchase_date)}</span>
                            </p>
                        </div>

                        {/* Total Cost Highlight */}
                        <div className="flex flex-col sm:items-end justify-center rounded-lg bg-slate-50 px-4 py-3 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                            <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total Cost</span>
                            <div className="font-mono text-2xl font-bold text-foreground sm:text-3xl">
                                {formatCurrency(purchase.total_amount)} <span className="text-base font-normal text-muted-foreground">Ks</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Metrics Row */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* KPI 1: Total & Units */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Received Products</span>
                                <div className="rounded-lg bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                                    <Package className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="font-mono text-xl font-bold text-foreground">
                                    {items.length} <span className="text-sm font-normal text-muted-foreground">items</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Total quantity: <span className="font-mono font-semibold text-foreground">{totalQuantity}</span> units
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 2: Total Cost */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Bill</span>
                                <div className="rounded-lg bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                                    <DollarSign className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="font-mono text-xl font-bold text-foreground">
                                    {formatCurrency(purchase.total_amount)} <span className="text-xs font-normal">Ks</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    Subtotal: {formatCurrency(purchase.subtotal)} Ks
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 3: Paid to Supplier */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paid to Supplier</span>
                                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="font-mono text-xl font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(purchase.paid_amount)} <span className="text-xs font-normal">Ks</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                                    Method: <span className="font-semibold text-foreground">{purchase.payment_method || 'Cash'}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* KPI 4: Balance Due */}
                    <Card className="shadow-xs border-slate-200 dark:border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Supplier Balance Due</span>
                                <div className={`rounded-lg p-2 ${
                                    purchase.credit_amount > 0 
                                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400' 
                                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                    <CreditCard className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className={`font-mono text-xl font-bold ${
                                    purchase.credit_amount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'
                                }`}>
                                    {formatCurrency(purchase.credit_amount)} <span className="text-xs font-normal">Ks</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {purchase.credit_amount > 0 ? 'Payable balance remaining' : 'Fully settled to supplier'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main 2-Column Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left Column (8 cols): Items Table & Cost Breakdown */}
                    <div className="space-y-6 lg:col-span-8">
                        {/* Items Table Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-base font-bold flex items-center gap-2">
                                            <Package className="h-4 w-4 text-primary" />
                                            Received Inventory Items
                                        </CardTitle>
                                        <CardDescription className="text-xs">
                                            Breakdown of stock items received in this purchase order.
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
                                                    <TableHead className="text-right text-xs">Unit Cost</TableHead>
                                                    <TableHead className="text-center text-xs">Quantity</TableHead>
                                                    <TableHead className="text-right text-xs">Tax</TableHead>
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
                                                            {formatCurrency(item.unit_cost)} <span className="text-[10px] text-muted-foreground">Ks</span>
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono font-semibold text-sm">
                                                            {item.quantity}
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono text-xs text-muted-foreground">
                                                            {Number(item.tax_amount) > 0 ? `${formatCurrency(item.tax_amount)} Ks` : '-'}
                                                        </TableCell>
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
                                        No items recorded for this purchase order.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Cost & Payment Breakdown Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <CreditCard className="h-4 w-4 text-primary" />
                                    Cost & Payment Breakdown
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-mono font-medium text-foreground">{formatCurrency(purchase.subtotal)} Ks</span>
                                </div>

                                {Number(purchase.discount_amount) > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-purple-600 dark:text-purple-400">Supplier Discount</span>
                                        <span className="font-mono font-medium text-purple-600 dark:text-purple-400">
                                            -{formatCurrency(purchase.discount_amount)} Ks
                                        </span>
                                    </div>
                                )}

                                {Number(purchase.tax_amount) > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span className="font-mono font-medium text-foreground">+{formatCurrency(purchase.tax_amount)} Ks</span>
                                    </div>
                                )}

                                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between items-center">
                                    <span className="font-bold text-base text-foreground">Total Purchase Cost</span>
                                    <span className="font-mono text-xl font-bold text-foreground">{formatCurrency(purchase.total_amount)} Ks</span>
                                </div>

                                <div className="rounded-lg bg-slate-50 dark:bg-slate-900/80 p-3.5 space-y-2 border border-slate-100 dark:border-slate-800 mt-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                                            <CheckCircle2 className="h-4 w-4" /> Paid Amount
                                        </span>
                                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                                            {formatCurrency(purchase.paid_amount)} Ks
                                        </span>
                                    </div>

                                    {Number(purchase.credit_amount) > 0 && (
                                        <div className="flex justify-between items-center text-sm pt-1 border-t border-slate-200/60 dark:border-slate-800">
                                            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1.5">
                                                <AlertCircle className="h-4 w-4" /> Outstanding Credit (Payable)
                                            </span>
                                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                                                {formatCurrency(purchase.credit_amount)} Ks
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes Card */}
                        {purchase.notes && (
                            <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
                                        <FileText className="h-4 w-4" />
                                        Purchase Notes & Remarks
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap rounded-lg bg-slate-50 dark:bg-slate-900/50 p-3 border border-slate-100 dark:border-slate-800 text-foreground">
                                        {purchase.notes}
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column (4 cols): Supplier Profile, Branch, and Purchasing Officer Metadata */}
                    <div className="space-y-6 lg:col-span-4">
                        {/* Supplier Profile Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-primary" />
                                        Supplier Details
                                    </CardTitle>
                                    {purchase.supplier && (
                                        <Badge variant="outline" className="font-mono text-[10px]">
                                            {purchase.supplier.code}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3.5">
                                <div>
                                    <div className="text-xs text-muted-foreground">Supplier Company</div>
                                    <div className="font-semibold text-base text-foreground mt-0.5">
                                        {purchase.supplier?.name || '-'}
                                    </div>
                                </div>

                                {purchase.supplier?.contact_person && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Contact Person</div>
                                        <div className="text-sm font-medium text-foreground mt-0.5">
                                            {purchase.supplier.contact_person}
                                        </div>
                                    </div>
                                )}

                                {purchase.supplier?.phone && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Phone Number</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <a
                                                href={`tel:${purchase.supplier.phone}`}
                                                className="font-mono text-sm text-primary hover:underline"
                                            >
                                                {purchase.supplier.phone}
                                            </a>
                                        </div>
                                    </div>
                                )}

                                {purchase.supplier?.email && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Email</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="text-sm text-foreground">{purchase.supplier.email}</span>
                                        </div>
                                    </div>
                                )}

                                {purchase.supplier?.address && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Address</div>
                                        <div className="flex items-start gap-2 mt-0.5">
                                            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                            <span className="text-xs text-foreground whitespace-pre-wrap">{purchase.supplier.address}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Receiving Branch & Officer Card */}
                        <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                                <CardTitle className="text-base font-bold flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" />
                                    Receiving Branch & Officer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3.5">
                                <div>
                                    <div className="text-xs text-muted-foreground">Branch</div>
                                    <div className="font-semibold text-sm text-foreground mt-0.5 flex items-center gap-2">
                                        <span>{purchase.branch?.name || '-'}</span>
                                        {purchase.branch?.code && (
                                            <Badge variant="secondary" className="font-mono text-[10px]">
                                                {purchase.branch.code}
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                {purchase.branch?.invoice_title && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Invoice Print Header</div>
                                        <div className="font-semibold text-xs text-primary mt-0.5">
                                            {purchase.branch.invoice_title}
                                        </div>
                                    </div>
                                )}

                                {purchase.branch?.phone && (
                                    <div>
                                        <div className="text-xs text-muted-foreground">Branch Contact</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="font-mono text-xs">{purchase.branch.phone}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                    <div>
                                        <div className="text-xs text-muted-foreground">Recorded By</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-foreground">
                                                {purchase.createdBy?.name ? purchase.createdBy.name.charAt(0).toUpperCase() : 'U'}
                                            </div>
                                            <span className="text-xs font-medium text-foreground">
                                                {purchase.createdBy?.name || 'System User'}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-xs text-muted-foreground">Order Timestamp</div>
                                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3.5 w-3.5" />
                                            <span>{formatDateTime(purchase.created_at)}</span>
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
                                    Print Formats
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="default"
                                    className="w-full justify-start gap-2 shadow-xs"
                                    onClick={() => openPrintFormat('a4')}
                                >
                                    <FileText className="h-4 w-4 text-white" />
                                    <span>Print A4 Purchase Order</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 bg-white dark:bg-slate-900 shadow-xs"
                                    onClick={() => openPrintFormat('a5')}
                                >
                                    <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                    <span>Print A5 Purchase Order</span>
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start gap-2 bg-white dark:bg-slate-900 shadow-xs"
                                    onClick={() => openPrintFormat('thermal')}
                                >
                                    <Receipt className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                    <span>Print Thermal Slip</span>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
