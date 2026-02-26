import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Purchase } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchases',
        href: route('purchases.index'),
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

export default function PurchaseShow({ purchase }: { purchase: Purchase }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Purchase ${purchase.purchase_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="md:max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    Purchase {purchase.purchase_no}
                                    <Badge variant={getPaymentStatusVariant(purchase.payment_status)}>
                                        {purchase.payment_status.charAt(0).toUpperCase() + purchase.payment_status.slice(1)}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>
                                    {purchase.purchase_date} • {purchase.branch?.name} • {purchase.supplier?.name || '-'}
                                </CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('purchases.edit', { purchase: purchase.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {purchase.purchase_items && purchase.purchase_items.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Unit Cost</TableHead>
                                        <TableHead className="text-right">Tax</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.purchase_items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="text-xs font-bold font-mono">{item.product?.code}</div>
                                                <div className="text-muted-foreground text-xs">{item.product?.name}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.unit_cost)}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.tax_amount)}</TableCell>
                                            <TableCell className="text-right font-mono font-medium">{formatCurrency(item.subtotal)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-mono">{formatCurrency(purchase.subtotal)} Ks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax</span>
                                <span className="font-mono">{formatCurrency(purchase.tax_amount)} Ks</span>
                            </div>
                            <div className="flex justify-between border-t pt-2 text-lg font-bold">
                                <span>Total</span>
                                <span className="font-mono">{formatCurrency(purchase.total_amount)} Ks</span>
                            </div>
                            <div className="flex justify-between pt-2">
                                <span className="text-muted-foreground">Paid</span>
                                <span className="font-mono text-green-600">{formatCurrency(purchase.paid_amount)} Ks</span>
                            </div>
                        </div>
                        {purchase.notes && (
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground text-sm">Notes: {purchase.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
