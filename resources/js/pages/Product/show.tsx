import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Product, ProductPriceHistory } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowDown, ArrowRight, ArrowUp, Barcode, Clock, Edit, History, Package, Tag, User as UserIcon } from 'lucide-react';

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

const formatCurrency = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '-';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(num);
};

const formatDate = (dateString: string): string => {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        return d.toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch {
        return dateString;
    }
};

const renderPriceDiff = (oldVal: string | number | null | undefined, newVal: string | number | null | undefined) => {
    const oldNum = oldVal !== null && oldVal !== undefined && oldVal !== '' ? parseFloat(oldVal.toString()) : null;
    const newNum = newVal !== null && newVal !== undefined && newVal !== '' ? parseFloat(newVal.toString()) : null;

    if (oldNum === null && newNum === null) return <span className="text-muted-foreground">-</span>;

    const diff = (newNum ?? 0) - (oldNum ?? 0);
    const hasChanged = oldNum !== null && newNum !== null && Math.abs(diff) > 0.001;

    return (
        <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground font-mono">{formatCurrency(oldVal)}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-semibold font-mono">{formatCurrency(newVal)}</span>
            {hasChanged && (
                <span
                    className={`inline-flex items-center text-[10px] px-1 py-0.5 rounded font-mono font-medium ${
                        diff > 0
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                            : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                    }`}
                >
                    {diff > 0 ? <ArrowUp className="h-2.5 w-2.5 mr-0.5" /> : <ArrowDown className="h-2.5 w-2.5 mr-0.5" />}
                    {diff > 0 ? '+' : ''}
                    {formatCurrency(diff)}
                </span>
            )}
        </div>
    );
};

const getChangeTypeBadge = (type: string) => {
    switch (type) {
        case 'branch_pricing':
            return <Badge variant="secondary" className="text-[10px]">Branch Pricing</Badge>;
        case 'product_edit':
            return <Badge variant="outline" className="text-[10px]">Product Edit</Badge>;
        case 'purchase':
            return <Badge variant="default" className="text-[10px] bg-blue-600">Purchase</Badge>;
        default:
            return <Badge variant="outline" className="text-[10px]">{type}</Badge>;
    }
};

export default function ProductShow({ product }: { product: Product }) {
    const histories: ProductPriceHistory[] = product.price_histories || [];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={product.name} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="mx-auto w-full max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {product.name}
                                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                        {product.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
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
                    <CardContent className="space-y-6">
                        <Tabs defaultValue="overview" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="overview">Overview & Stock</TabsTrigger>
                                <TabsTrigger value="price-history" className="flex items-center gap-2">
                                    <History className="h-4 w-4" />
                                    Price History
                                    {histories.length > 0 && (
                                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0 font-mono">
                                            {histories.length}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            </TabsList>

                            {/* TAB 1: OVERVIEW */}
                            <TabsContent value="overview" className="space-y-4 pt-4">
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
                                    <div className="space-y-3 border-t pt-4">
                                        <h3 className="text-foreground text-sm font-semibold">Branch Configurations</h3>
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
                                                            <TableCell className="text-xs font-medium">{bs.branch?.name}</TableCell>
                                                            <TableCell className="text-muted-foreground text-xs">{bs.group?.name || '-'}</TableCell>
                                                            <TableCell className="text-right font-mono text-xs font-semibold">{bs.quantity}</TableCell>
                                                            <TableCell className="text-right font-mono text-xs">
                                                                {bs.cost_price ? `${formatCurrency(bs.cost_price)} Ks` : '-'}
                                                            </TableCell>
                                                            <TableCell className="text-right font-mono text-xs">
                                                                {bs.selling_price ? `${formatCurrency(bs.selling_price)} Ks` : '-'}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* TAB 2: PRICE HISTORY */}
                            <TabsContent value="price-history" className="pt-4">
                                {histories.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center gap-2">
                                        <Clock className="h-10 w-10 text-muted-foreground/40 stroke-1" />
                                        <p className="text-sm font-medium">No price changes recorded yet</p>
                                        <p className="text-xs text-muted-foreground max-w-sm">
                                            Every change made to this product's cost price or selling price will be recorded with date, branch, and user attribution.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="text-xs">Date & Time</TableHead>
                                                    <TableHead className="text-xs">Branch</TableHead>
                                                    <TableHead className="text-xs">Cost Price (Old → New)</TableHead>
                                                    <TableHead className="text-xs">Selling Price (Old → New)</TableHead>
                                                    <TableHead className="text-xs">Type</TableHead>
                                                    <TableHead className="text-xs">Changed By</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {histories.map((h) => (
                                                    <TableRow key={h.id} className="text-xs">
                                                        <TableCell className="font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                                                            {formatDate(h.effective_date || h.created_at)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {h.branch ? (
                                                                <span className="font-medium text-xs">{h.branch.name}</span>
                                                            ) : (
                                                                <Badge variant="outline" className="text-[10px]">All / Base</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {renderPriceDiff(h.old_cost_price, h.new_cost_price)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {renderPriceDiff(h.old_selling_price, h.new_selling_price)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {getChangeTypeBadge(h.change_type)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <UserIcon className="h-3 w-3" />
                                                                <span>{h.changedBy?.name || h.changed_by_user?.name || 'System'}</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
