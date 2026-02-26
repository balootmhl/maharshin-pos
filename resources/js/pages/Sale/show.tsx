import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Sale } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit, Printer } from 'lucide-react';
import { useRef } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: route('sales.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const getPaymentStatusVariant = (status: string) => {
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

export default function SaleShow({ sale }: { sale: Sale }) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Invoice ${sale.invoice_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="md:max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Invoice {sale.invoice_no}
                                    <Badge variant={getPaymentStatusVariant(sale.payment_status)}>
                                        {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    {sale.sale_date} • {sale.branch?.name} • {sale.customer?.name || 'Walk-in Customer'}
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                </Button>
                                <Button asChild>
                                    <Link href={route('sales.edit', { sale: sale.id })}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {sale.sale_items && sale.sale_items.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sale.sale_items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-bold text-xs font-mono">{item.product?.code}</div>
                                                <div className="text-muted-foreground text-xs">{item.product?.name}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right font-mono font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-mono">{formatCurrency(sale.subtotal)} Ks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-mono">{formatCurrency(sale.tax_amount)} Ks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Discount {sale.discount_amount > 0 && sale.subtotal > 0 && `(${parseFloat(((sale.discount_amount / sale.subtotal) * 100).toFixed(2))}%)`}</span>
                                <span className="font-mono">-{formatCurrency(sale.discount_amount)} Ks</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>Total</span>
                                <span className="font-mono">{formatCurrency(sale.total_amount)} Ks</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-mono text-green-600">{formatCurrency(sale.paid_amount)} Ks</span>
                            </div>
                            {sale.credit_amount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Credit</span>
                                    <span className="font-mono text-red-600">{formatCurrency(sale.credit_amount)} Ks</span>
                                </div>
                            )}
                        </div>
                        {sale.notes && (
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground text-sm">Notes: {sale.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hidden Receipt for Printing */}
                <div className="hidden">
                    <div ref={receiptRef}>
                        <div className="header">
                            <div className="company">Mahar Shin POS</div>
                            <div>{sale.branch?.name}</div>
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
                            <span>{sale.sale_date}</span>
                        </div>
                        <div className="row">
                            <span>Customer:</span>
                            <span>{sale.customer?.name || 'Walk-in'}</span>
                        </div>
                        <div className="divider"></div>
                        {sale.sale_items?.map((item) => (
                            <div className="item" key={item.id}>
                                <div className="item-name">{item.product?.name}</div>
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
                        {sale.tax_amount > 0 && (
                            <div className="row">
                                <span>Tax:</span>
                                <span>{formatCurrency(sale.tax_amount)} Ks</span>
                            </div>
                        )}
                        {sale.discount_amount > 0 && (
                            <div className="row">
                                <span>Discount {sale.subtotal > 0 && `(${parseFloat(((sale.discount_amount / sale.subtotal) * 100).toFixed(2))}%)`}:</span>
                                <span>-{formatCurrency(sale.discount_amount)} Ks</span>
                            </div>
                        )}
                        <div className="divider"></div>
                        <div className="row total-row">
                            <span>TOTAL:</span>
                            <span>{formatCurrency(sale.total_amount)} Ks</span>
                        </div>
                        <div className="row">
                            <span>Paid:</span>
                            <span>{formatCurrency(sale.paid_amount)} Ks</span>
                        </div>
                        {sale.credit_amount > 0 && (
                            <div className="row">
                                <span>Credit:</span>
                                <span>{formatCurrency(sale.credit_amount)} Ks</span>
                            </div>
                        )}
                        {sale.paid_amount > sale.total_amount && (
                            <div className="row">
                                <span>Change:</span>
                                <span>{formatCurrency(sale.paid_amount - sale.total_amount)} Ks</span>
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
