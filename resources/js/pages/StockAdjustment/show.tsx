import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, StockAdjustment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Calendar, MapPin, Package, User } from 'lucide-react';

type Reasons = Record<string, string>;

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory',
        href: '#',
    },
    {
        title: 'Stock Adjustments',
        href: route('stock-adjustments.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

export default function StockAdjustmentShow({ stockAdjustment, reasons }: { stockAdjustment: StockAdjustment; reasons: Reasons }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Adjustment ${stockAdjustment.adjustment_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm" asChild>
                        <Link href={route('stock-adjustments.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
                    </Button>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {stockAdjustment.adjustment_no}
                                    <Badge variant={stockAdjustment.adjustment_type === 'add' ? 'default' : 'destructive'}>
                                        {stockAdjustment.adjustment_type === 'add' ? '+ Add' : '- Subtract'}
                                    </Badge>
                                </CardTitle>
                                <CardDescription>Stock Adjustment Details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Product Info */}
                        <div className="flex items-start gap-3">
                            <Package className="text-muted-foreground mt-1 h-5 w-5" />
                            <div>
                                <p className="text-muted-foreground text-sm">Product</p>
                                <p className="font-medium">{stockAdjustment.product?.name}</p>
                                <p className="text-muted-foreground font-mono text-xs">{stockAdjustment.product?.code}</p>
                            </div>
                        </div>

                        {/* Branch Info */}
                        <div className="flex items-start gap-3">
                            <MapPin className="text-muted-foreground mt-1 h-5 w-5" />
                            <div>
                                <p className="text-muted-foreground text-sm">Branch</p>
                                <p className="font-medium">{stockAdjustment.branch?.name}</p>
                            </div>
                        </div>

                        {/* Date */}
                        <div className="flex items-start gap-3">
                            <Calendar className="text-muted-foreground mt-1 h-5 w-5" />
                            <div>
                                <p className="text-muted-foreground text-sm">Adjustment Date</p>
                                <p className="font-medium">{stockAdjustment.adjustment_date}</p>
                            </div>
                        </div>

                        {/* Stock Change */}
                        <div className="bg-muted rounded-lg p-4">
                            <p className="text-muted-foreground mb-3 text-sm font-medium">Stock Change</p>
                            <div className="flex items-center justify-center gap-4">
                                <div className="text-center">
                                    <p className="text-muted-foreground text-xs">Before</p>
                                    <p className="font-mono text-2xl font-bold">{stockAdjustment.quantity_before}</p>
                                </div>
                                <div className="flex flex-col items-center">
                                    <ArrowRight className="text-muted-foreground h-6 w-6" />
                                    <span
                                        className={`font-mono text-sm font-medium ${stockAdjustment.adjustment_type === 'add' ? 'text-green-600' : 'text-red-600'}`}
                                    >
                                        {stockAdjustment.adjustment_type === 'add' ? '+' : '-'}
                                        {stockAdjustment.quantity}
                                    </span>
                                </div>
                                <div className="text-center">
                                    <p className="text-muted-foreground text-xs">After</p>
                                    <p className="font-mono text-2xl font-bold">{stockAdjustment.quantity_after}</p>
                                </div>
                            </div>
                        </div>

                        {/* Reason */}
                        <div>
                            <p className="text-muted-foreground text-sm">Reason</p>
                            <Badge variant="outline" className="mt-1">
                                {reasons[stockAdjustment.reason] || stockAdjustment.reason}
                            </Badge>
                        </div>

                        {/* Notes */}
                        {stockAdjustment.notes && (
                            <div>
                                <p className="text-muted-foreground text-sm">Notes</p>
                                <p className="mt-1 whitespace-pre-wrap">{stockAdjustment.notes}</p>
                            </div>
                        )}

                        {/* Created By */}
                        {stockAdjustment.createdBy && (
                            <div className="flex items-start gap-3 border-t pt-4">
                                <User className="text-muted-foreground mt-1 h-5 w-5" />
                                <div>
                                    <p className="text-muted-foreground text-sm">Created By</p>
                                    <p className="font-medium">{stockAdjustment.createdBy?.name}</p>
                                    <p className="text-muted-foreground text-xs">{stockAdjustment.created_at}</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
