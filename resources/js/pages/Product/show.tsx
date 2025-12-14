import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Barcode, Edit, Package, Tag } from 'lucide-react';

type Category = {
    id: number;
    name: string;
};

type Product = {
    id: number;
    code: string;
    barcode?: string;
    name: string;
    description?: string;
    category_id: number;
    category?: Category;
    unit: string;
    cost_price: number;
    selling_price: number;
    tax_rate: number;
    low_stock_alert: number;
    is_active: boolean;
    created_at?: string;
};

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
                <Card className="md:max-w-2xl">
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
                                <p className="text-muted-foreground text-sm">Cost Price</p>
                                <p className="font-mono text-lg font-bold">{formatCurrency(product.cost_price)} Ks</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Selling Price</p>
                                <p className="font-mono text-lg font-bold">{formatCurrency(product.selling_price)} Ks</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Tax Rate</p>
                                <p className="font-mono text-lg">{product.tax_rate}%</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Low Stock Alert</p>
                                <p className="font-mono text-lg">{product.low_stock_alert}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
