import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Product, SharedData } from '@/types';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

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
        title: 'New Adjustment',
        href: '#',
    },
];

export default function StockAdjustmentCreate({ branches, products, reasons }: { branches: Branch[]; products: Product[]; reasons: Reasons }) {
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

    const { auth } = usePage<SharedData>().props;

    const defaultBranchId = auth.user.is_super_admin
        ? (branches[0]?.id?.toString() || '')
        : (auth.user.branch_id?.toString() || '');

    const { data, setData, post, processing, errors } = useForm({
        branch_id: defaultBranchId,
        product_id: '',
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: 'add',
        quantity: '',
        reason: '',
        notes: '',
    });

    const handleProductChange = (productId: string) => {
        setData('product_id', productId);
        const product = products.find((p) => p.id.toString() === productId);
        setSelectedProduct(product || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('stock-adjustments.store'));
    };

    const calculateNewBalance = () => {
        if (!selectedProduct || !data.quantity) return null;
        const qty = parseInt(data.quantity) || 0;
        const currentStock = selectedProduct.stock || 0;
        if (data.adjustment_type === 'add') {
            return currentStock + qty;
        } else {
            return currentStock - qty;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Stock Adjustment" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>New Stock Adjustment</CardTitle>
                        <CardDescription>Manually adjust stock levels for count corrections, damaged goods, etc.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="branch_id">Branch*</Label>
                                    <Select value={data.branch_id} onValueChange={(value) => setData('branch_id', value)} disabled={!auth.user.is_super_admin}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id.toString()}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.branch_id && <p className="text-sm text-red-500">{errors.branch_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="adjustment_date">Date*</Label>
                                    <Input
                                        id="adjustment_date"
                                        type="date"
                                        value={data.adjustment_date}
                                        onChange={(e) => setData('adjustment_date', e.target.value)}
                                    />
                                    {errors.adjustment_date && <p className="text-sm text-red-500">{errors.adjustment_date}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="product_id">Product*</Label>
                                <Select value={data.product_id} onValueChange={handleProductChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {products.map((product) => (
                                            <SelectItem key={product.id} value={product.id.toString()}>
                                                {product.code} - {product.name} (Stock: {product.stock})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.product_id && <p className="text-sm text-red-500">{errors.product_id}</p>}
                            </div>

                            {selectedProduct && (
                                <div className="bg-muted rounded-lg p-4">
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-muted-foreground">Product:</span>
                                            <p className="font-medium">{selectedProduct.name}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">Current Stock:</span>
                                            <p className="font-mono font-medium">
                                                {selectedProduct.stock} {selectedProduct.unit || 'units'}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">New Balance:</span>
                                            <p
                                                className={`font-mono font-medium ${calculateNewBalance() !== null && calculateNewBalance()! < 0 ? 'text-red-600' : 'text-green-600'}`}
                                            >
                                                {calculateNewBalance() !== null ? `${calculateNewBalance()} ${selectedProduct.unit || 'units'}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="adjustment_type">Adjustment Type*</Label>
                                    <Select value={data.adjustment_type} onValueChange={(value) => setData('adjustment_type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">+ Add Stock</SelectItem>
                                            <SelectItem value="subtract">- Subtract Stock</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.adjustment_type && <p className="text-sm text-red-500">{errors.adjustment_type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity*</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        placeholder="Enter quantity"
                                    />
                                    {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reason">Reason*</Label>
                                <Select value={data.reason} onValueChange={(value) => setData('reason', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select reason" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(reasons).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notes</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Additional notes about this adjustment..."
                                    rows={3}
                                />
                                {errors.notes && <p className="text-sm text-red-500">{errors.notes}</p>}
                            </div>

                            <div className="flex gap-4">
                                <Button type="button" variant="outline" onClick={() => router.visit(route('stock-adjustments.index'))}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Saving...' : 'Save Adjustment'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
