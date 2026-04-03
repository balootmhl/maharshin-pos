import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Product } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Barcode, Edit, Package, Tag } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Products',
        href: route('products.index'),
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

export default function ProductShow({ product }: { product: Product }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="max-w-4xl mx-auto w-full">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {product.name}
                                    <Badge variant={product.is_active ? 'default' : 'secondary'}>{product.is_active ? 'Active' : 'Inactive'}</Badge>
                                </CardTitle>
                                <CardDescription className="font-mono">{product.code}</CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('products.edit', { product: product.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {product.barcode && (
                            <div className="flex items-center gap-2">
                                <Barcode className="text-muted-foreground h-4 w-4" />
                                <span className="font-mono">{product.barcode}</span>
                            </div>
                        )}
                        {product.category && (
                            <div className="flex items-center gap-2">
                                <Tag className="text-muted-foreground h-4 w-4" />
                                <span>{product.category.name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <Package className="text-muted-foreground h-4 w-4" />
                            <span>Unit: {product.unit}</span>
                        </div>
                        {product.description && <p className="text-muted-foreground">{product.description}</p>}
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <p className="text-muted-foreground text-sm">Tax Rate</p>
                                <p className="font-mono text-lg">{product.tax_rate}%</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Low Stock Alert</p>
                                <p className="font-mono text-lg">{product.low_stock_alert}</p>
                            </div>
                        </div>

                        {product.branch_stocks && product.branch_stocks.length > 0 && (
                            <div className="border-t pt-4 space-y-3">
                                <h3 className="font-semibold text-sm text-foreground">Branch Configurations</h3>
                                <div className="rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Branch</TableHead>
                                                <TableHead>Group</TableHead>
                                                <TableHead className="text-right">Stock</TableHead>
                                                <TableHead className="text-right">Cost Price</TableHead>
                                                <TableHead className="text-right">Selling Price</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {product.branch_stocks.map((bs) => (
                                                <TableRow key={bs.id}>
                                                    <TableCell className="font-medium text-xs">{bs.branch?.name}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{bs.group?.name || '-'}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs font-semibold">{bs.quantity}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs">{bs.cost_price ? `${formatCurrency(Number(bs.cost_price))} Ks` : '-'}</TableCell>
                                                    <TableCell className="text-right font-mono text-xs">{bs.selling_price ? `${formatCurrency(Number(bs.selling_price))} Ks` : '-'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
