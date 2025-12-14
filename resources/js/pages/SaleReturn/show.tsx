import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Edit } from 'lucide-react';

type Branch = { id: number; name: string };
type Sale = { id: number; invoice_no: string };
type Customer = { id: number; name: string };
type User = { id: number; name: string };
type Product = { id: number; name: string; code: string };
type SaleReturnItem = {
    id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_price: number;
    total: number;
};

type SaleReturn = {
    id: number;
    return_no: string;
    sale_id: number;
    sale?: Sale & { customer?: Customer };
    branch_id: number;
    branch?: Branch;
    return_date: string;
    total_amount: number;
    refund_amount: number;
    refund_method?: string;
    reason?: string;
    created_by?: number;
    createdBy?: User;
    saleReturnItems?: SaleReturnItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sale Returns',
        href: route('sale-returns.index'),
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

export default function SaleReturnShow({ saleReturn }: { saleReturn: SaleReturn }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Return ${saleReturn.return_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="md:max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Return {saleReturn.return_no}</CardTitle>
                                <CardDescription>
                                    {saleReturn.return_date} • {saleReturn.branch?.name} • Original Invoice: {saleReturn.sale?.invoice_no}
                                </CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('sale-returns.edit', { sale_return: saleReturn.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {saleReturn.saleReturnItems && saleReturn.saleReturnItems.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product</TableHead>
                                        <TableHead className="text-right">Qty</TableHead>
                                        <TableHead className="text-right">Price</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {saleReturn.saleReturnItems.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.product?.name}</div>
                                                <div className="text-muted-foreground font-mono text-xs">{item.product?.code}</div>
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right font-mono">{formatCurrency(item.unit_price)}</TableCell>
                                            <TableCell className="text-right font-mono font-medium">{formatCurrency(item.total)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        <div className="space-y-2 border-t pt-4">
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total Return</span>
                                <span className="font-mono">{formatCurrency(saleReturn.total_amount)} Ks</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Refunded</span>
                                <span className="font-mono text-green-600">{formatCurrency(saleReturn.refund_amount)} Ks</span>
                            </div>
                            {saleReturn.refund_method && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Refund Method</span>
                                    <span>{saleReturn.refund_method}</span>
                                </div>
                            )}
                        </div>
                        {saleReturn.reason && (
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground text-sm">Reason: {saleReturn.reason}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
