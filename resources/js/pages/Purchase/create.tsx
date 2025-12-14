import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Product, Supplier } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Minus, Package, Plus, Search, Trash2, X } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useRef, useState } from 'react';

type CartItem = {
    product_id: number;
    product: Product;
    quantity: number;
    unit_cost: number;
    tax_rate: number;
    tax_amount: number;
    subtotal: number;
};

type PurchaseForm = {
    branch_id: string;
    supplier_id: string;
    purchase_date: string;
    subtotal: number;
    tax_amount: number;
    total_amount: number;
    payment_status: string;
    paid_amount: number;
    notes: string;
    items: {
        product_id: number;
        quantity: number;
        unit_cost: number;
        tax_rate: number;
        tax_amount: number;
        subtotal: number;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Purchases', href: route('purchases.index') },
    { title: 'New Purchase', href: '#' },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function PurchaseCreate({
    branches,
    suppliers,
    products,
    purchaseNo,
}: {
    branches: Branch[];
    suppliers: Supplier[];
    products: Product[];
    purchaseNo: string;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, errors, processing, reset } = useForm<PurchaseForm>({
        branch_id: branches[0]?.id?.toString() || '',
        supplier_id: 'none',
        purchase_date: today,
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        payment_status: 'unpaid',
        paid_amount: 0,
        notes: '',
        items: [],
    });

    const cartTotals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = cart.reduce((sum, item) => sum + item.tax_amount, 0);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [cart]);

    useEffect(() => {
        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            tax_rate: item.tax_rate,
            tax_amount: item.tax_amount,
            subtotal: item.subtotal,
        }));

        setData((prev) => ({
            ...prev,
            items,
            subtotal: cartTotals.subtotal,
            tax_amount: cartTotals.taxAmount,
            total_amount: cartTotals.total,
        }));
    }, [cart, cartTotals]);

    useEffect(() => {
        const status = data.paid_amount >= cartTotals.total ? 'paid' : data.paid_amount > 0 ? 'partial' : 'unpaid';
        setData((prev) => ({ ...prev, payment_status: status }));
    }, [data.paid_amount, cartTotals.total]);

    const filteredProducts = useMemo(() => {
        if (!searchQuery) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(
            (p) => p.name.toLowerCase().includes(query) || p.code.toLowerCase().includes(query) || p.barcode?.toLowerCase().includes(query),
        );
    }, [products, searchQuery]);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product_id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                              tax_amount: (item.quantity + 1) * item.unit_cost * (item.tax_rate / 100),
                              subtotal: (item.quantity + 1) * item.unit_cost,
                          }
                        : item,
                );
            }
            const newItem: CartItem = {
                product_id: product.id,
                product,
                quantity: 1,
                unit_cost: Number(product.cost_price),
                tax_rate: Number(product.tax_rate),
                tax_amount: Number(product.cost_price) * (Number(product.tax_rate) / 100),
                subtotal: Number(product.cost_price),
            };
            return [...prev, newItem];
        });
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.product_id === productId) {
                        const newQty = Math.max(0, item.quantity + delta);
                        return {
                            ...item,
                            quantity: newQty,
                            tax_amount: newQty * item.unit_cost * (item.tax_rate / 100),
                            subtotal: newQty * item.unit_cost,
                        };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0),
        );
    };

    const updateUnitCost = (productId: number, cost: number) => {
        setCart((prev) =>
            prev.map((item) => {
                if (item.product_id === productId) {
                    return {
                        ...item,
                        unit_cost: cost,
                        tax_amount: item.quantity * cost * (item.tax_rate / 100),
                        subtotal: item.quantity * cost,
                    };
                }
                return item;
            }),
        );
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product_id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setData((prev) => ({ ...prev, paid_amount: 0 }));
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('purchases.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setCart([]);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Purchase" />
            <form onSubmit={submit} className="flex h-[calc(100vh-120px)] gap-4 p-4">
                {/* Left: Product Selection */}
                <div className="flex w-1/2 flex-col gap-4">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            ref={searchInputRef}
                            placeholder="Search products by name, code, or barcode..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="bg-card flex-1 rounded-lg border">
                        <div className="grid grid-cols-3 gap-2 p-3">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addToCart(product)}
                                    className="bg-background hover:bg-accent flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                                >
                                    <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{product.code}</span>
                                    <span className="text-primary font-mono font-bold">{formatCurrency(Number(product.cost_price))} Ks</span>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right: Purchase Details */}
                <div className="flex w-1/2 flex-col gap-4">
                    <Card>
                        <CardContent className="grid grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                                <Label>Branch*</Label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={b.id.toString()}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError message={errors.branch_id} />
                            </div>
                            <div className="space-y-2">
                                <Label>Supplier</Label>
                                <Select value={data.supplier_id} onValueChange={(v) => setData('supplier_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No supplier</SelectItem>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Purchase Date</Label>
                                <Input type="date" value={data.purchase_date} onChange={(e) => setData('purchase_date', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>PO Number</Label>
                                <Input value={purchaseNo} disabled className="font-mono" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-1 flex-col">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                <CardTitle className="text-lg">Items</CardTitle>
                                <Badge variant="secondary">{cart.length}</Badge>
                            </div>
                            {cart.length > 0 && (
                                <Button type="button" variant="ghost" size="sm" onClick={clearCart}>
                                    <X className="mr-1 h-4 w-4" />
                                    Clear
                                </Button>
                            )}
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-[200px]">
                                {cart.length === 0 ? (
                                    <div className="text-muted-foreground flex h-full items-center justify-center py-8">Add products to continue</div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="w-24">Qty</TableHead>
                                                <TableHead className="w-28">Unit Cost</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>
                                                        <div className="font-medium">{item.product.name}</div>
                                                        <div className="text-muted-foreground font-mono text-xs">{item.product.code}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1">
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => updateQuantity(item.product_id, -1)}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>
                                                            <span className="w-8 text-center font-mono">{item.quantity}</span>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={() => updateQuantity(item.product_id, 1)}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Input
                                                            type="number"
                                                            value={item.unit_cost}
                                                            onChange={(e) => updateUnitCost(item.product_id, Number(e.target.value))}
                                                            className="h-8 w-24 text-right font-mono"
                                                            min={0}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono font-medium">
                                                        {formatCurrency(item.subtotal)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive h-7 w-7"
                                                            onClick={() => removeFromCart(item.product_id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="space-y-3 pt-4">
                            <div className="flex justify-between text-sm">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatCurrency(cartTotals.subtotal)} Ks</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span>Tax</span>
                                <span className="font-mono">{formatCurrency(cartTotals.taxAmount)} Ks</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary font-mono">{formatCurrency(cartTotals.total)} Ks</span>
                            </div>
                            <Separator />
                            <div className="space-y-1">
                                <Label className="text-xs">Amount Paid</Label>
                                <Input
                                    type="number"
                                    value={data.paid_amount}
                                    onChange={(e) => setData('paid_amount', Number(e.target.value))}
                                    className="font-mono"
                                    min={0}
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    rows={2}
                                    placeholder="Optional notes..."
                                />
                            </div>
                            <InputError message={errors.items} />
                            <Button type="submit" className="h-12 w-full text-lg" disabled={processing || cart.length === 0}>
                                {processing ? 'Processing...' : `Record Purchase - ${formatCurrency(cartTotals.total)} Ks`}
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
}
