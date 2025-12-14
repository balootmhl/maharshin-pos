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
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { AlertTriangle, Minus, Package, Pause, Play, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';
import { FormEventHandler, useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Category = { id: number; name: string };
type Branch = { id: number; name: string; code: string };
type Customer = { id: number; name: string; code: string; credit_limit: number; current_balance: number };
type Product = {
    id: number;
    name: string;
    code: string;
    barcode?: string;
    selling_price: number;
    cost_price: number;
    tax_rate: number;
    category_id?: number;
    category?: Category;
    unit?: string;
    stock?: number;
};

type CartItem = {
    product_id: number;
    product: Product;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    tax_amount: number;
    subtotal: number;
};

type HeldSale = {
    id: string;
    cart: CartItem[];
    timestamp: Date;
    note: string;
};

type SaleForm = {
    branch_id: string;
    customer_id: string;
    sale_date: string;
    subtotal: number;
    tax_amount: number;
    discount_amount: number;
    total_amount: number;
    payment_status: string;
    payment_method: string;
    paid_amount: number;
    credit_amount: number;
    notes: string;
    items: {
        product_id: number;
        quantity: number;
        unit_price: number;
        tax_rate: number;
        tax_amount: number;
        subtotal: number;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [{ title: 'POS', href: route('sales.create') }];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const paymentMethods = ['Cash', 'KBZ Pay', 'Wave Money', 'Bank Transfer', 'Card'];

export default function SaleCreate({
    branches,
    customers,
    products,
    categories,
}: {
    branches: Branch[];
    customers: Customer[];
    products: Product[];
    categories: Category[];
    invoiceNo: string;
}) {
    const today = new Date().toISOString().split('T')[0];
    const [cart, setCart] = useState<CartItem[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [heldSales, setHeldSales] = useState<HeldSale[]>([]);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    const { data, setData, post, errors, processing, reset } = useForm<SaleForm>({
        branch_id: branches[0]?.id?.toString() || '',
        customer_id: 'walk-in',
        sale_date: today,
        subtotal: 0,
        tax_amount: 0,
        discount_amount: 0,
        total_amount: 0,
        payment_status: 'paid',
        payment_method: 'Cash',
        paid_amount: 0,
        credit_amount: 0,
        notes: '',
        items: [],
    });

    // Calculate totals when cart changes
    const cartTotals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const taxAmount = cart.reduce((sum, item) => sum + item.tax_amount, 0);
        const total = subtotal + taxAmount - data.discount_amount;
        return { subtotal, taxAmount, total };
    }, [cart, data.discount_amount]);

    // Update form data when cart or totals change
    useEffect(() => {
        const items = cart.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
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

    // Update credit amount when paid amount changes
    useEffect(() => {
        const credit = Math.max(0, cartTotals.total - data.paid_amount);
        const status = credit === 0 ? 'paid' : credit < cartTotals.total ? 'partial' : 'unpaid';
        setData((prev) => ({
            ...prev,
            credit_amount: credit,
            payment_status: status,
        }));
    }, [data.paid_amount, cartTotals.total]);

    // Filter products based on search and category
    const filteredProducts = useMemo(() => {
        let filtered = products;

        // Filter by category
        if (selectedCategory !== null) {
            filtered = filtered.filter((p) => p.category_id === selectedCategory);
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (p) =>
                    p.name.toLowerCase().includes(query) ||
                    p.code.toLowerCase().includes(query) ||
                    p.barcode?.toLowerCase().includes(query) ||
                    p.category?.name.toLowerCase().includes(query),
            );
        }

        return filtered;
    }, [products, searchQuery, selectedCategory]);

    const addToCart = useCallback((product: Product) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.product_id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.product_id === product.id
                        ? {
                              ...item,
                              quantity: item.quantity + 1,
                              tax_amount: (item.quantity + 1) * item.unit_price * (item.tax_rate / 100),
                              subtotal: (item.quantity + 1) * item.unit_price,
                          }
                        : item,
                );
            }
            const newItem: CartItem = {
                product_id: product.id,
                product,
                quantity: 1,
                unit_price: Number(product.selling_price),
                tax_rate: Number(product.tax_rate),
                tax_amount: Number(product.selling_price) * (Number(product.tax_rate) / 100),
                subtotal: Number(product.selling_price),
            };
            return [...prev, newItem];
        });
        setSearchQuery('');
        searchInputRef.current?.focus();
    }, []);

    const updateQuantity = (productId: number, delta: number) => {
        setCart((prev) =>
            prev
                .map((item) => {
                    if (item.product_id === productId) {
                        const newQty = Math.max(0, item.quantity + delta);
                        return {
                            ...item,
                            quantity: newQty,
                            tax_amount: newQty * item.unit_price * (item.tax_rate / 100),
                            subtotal: newQty * item.unit_price,
                        };
                    }
                    return item;
                })
                .filter((item) => item.quantity > 0),
        );
    };

    const removeFromCart = (productId: number) => {
        setCart((prev) => prev.filter((item) => item.product_id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setData((prev) => ({ ...prev, paid_amount: 0, discount_amount: 0 }));
    };

    // Hold/Recall Sale functionality
    const holdSale = () => {
        if (cart.length === 0) return;
        const heldSale: HeldSale = {
            id: Date.now().toString(),
            cart: [...cart],
            timestamp: new Date(),
            note: `${cart.length} items - ${formatCurrency(cartTotals.total)} Ks`,
        };
        setHeldSales((prev) => [...prev, heldSale]);
        clearCart();
    };

    const recallSale = (id: string) => {
        const sale = heldSales.find((s) => s.id === id);
        if (sale) {
            setCart(sale.cart);
            setHeldSales((prev) => prev.filter((s) => s.id !== id));
        }
    };

    const handleBarcodeInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const barcode = (e.target as HTMLInputElement).value.trim();
            const product = products.find((p) => p.barcode === barcode || p.code === barcode);
            if (product) {
                addToCart(product);
                (e.target as HTMLInputElement).value = '';
            }
        }
    };

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // F1 - Focus search
            if (e.key === 'F1') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            // F2 - Focus barcode
            if (e.key === 'F2') {
                e.preventDefault();
                barcodeInputRef.current?.focus();
            }
            // F8 - Hold sale
            if (e.key === 'F8') {
                e.preventDefault();
                holdSale();
            }
            // F12 or Ctrl+Enter - Complete sale
            if (e.key === 'F12' || (e.ctrlKey && e.key === 'Enter')) {
                e.preventDefault();
                if (cart.length > 0 && !processing) {
                    document.getElementById('complete-sale-btn')?.click();
                }
            }
            // Escape - Clear search
            if (e.key === 'Escape') {
                setSearchQuery('');
                searchInputRef.current?.blur();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart.length, processing]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('sales.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setCart([]);
            },
        });
    };

    const selectedCustomer = data.customer_id !== 'walk-in' ? customers.find((c) => c.id.toString() === data.customer_id) : undefined;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="POS - New Sale" />
            <form onSubmit={submit} className="flex h-[calc(100vh-120px)] gap-4 p-4">
                {/* Left: Product Selection */}
                <div className="flex w-3/5 flex-col gap-4">
                    {/* Search and Barcode */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                ref={searchInputRef}
                                placeholder="Search products (F1)..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                                autoFocus
                            />
                        </div>
                        <Input ref={barcodeInputRef} placeholder="Scan barcode (F2)..." onKeyDown={handleBarcodeInput} className="w-48" />
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex flex-wrap gap-2">
                        <Button
                            type="button"
                            variant={selectedCategory === null ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedCategory(null)}
                        >
                            All
                        </Button>
                        {categories.map((cat) => (
                            <Button
                                key={cat.id}
                                type="button"
                                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedCategory(cat.id)}
                            >
                                {cat.name}
                            </Button>
                        ))}
                    </div>

                    {/* Product Grid */}
                    <ScrollArea className="bg-card flex-1 rounded-lg border">
                        <div className="grid grid-cols-4 gap-2 p-3">
                            {filteredProducts.map((product) => (
                                <button
                                    key={product.id}
                                    type="button"
                                    onClick={() => addToCart(product)}
                                    className="bg-background hover:bg-accent hover:text-accent-foreground flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors"
                                >
                                    <span className="line-clamp-2 text-sm font-medium">{product.name}</span>
                                    <span className="text-muted-foreground font-mono text-xs">{product.code}</span>
                                    <div className="flex w-full items-center justify-between">
                                        <span className="text-primary font-mono font-bold">{formatCurrency(Number(product.selling_price))}</span>
                                        {/* Stock Display */}
                                        <div className="flex items-center gap-1">
                                            {(product.stock ?? 0) <= 10 ? (
                                                <Badge variant="destructive" className="text-xs">
                                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                                    {product.stock ?? 0}
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="text-xs">
                                                    <Package className="mr-1 h-3 w-3" />
                                                    {product.stock ?? 0}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                            {filteredProducts.length === 0 && (
                                <div className="text-muted-foreground col-span-4 py-8 text-center">No products found</div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right: Cart and Payment */}
                <div className="flex w-2/5 flex-col gap-4">
                    {/* Header with Branch and Customer */}
                    <Card>
                        <CardContent className="grid grid-cols-2 gap-4 pt-4">
                            <div className="space-y-2">
                                <Label>Branch</Label>
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
                                <Label>Customer</Label>
                                <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Walk-in customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.name} ({c.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Held Sales */}
                    {heldSales.length > 0 && (
                        <Card className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
                            <CardContent className="py-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                                        <Pause className="mr-1 inline h-4 w-4" />
                                        {heldSales.length} Held Sale(s)
                                    </span>
                                    <div className="flex gap-1">
                                        {heldSales.map((held, index) => (
                                            <Button
                                                key={held.id}
                                                type="button"
                                                size="sm"
                                                variant="outline"
                                                onClick={() => recallSale(held.id)}
                                                className="text-xs"
                                            >
                                                <Play className="mr-1 h-3 w-3" />#{index + 1}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Cart Items */}
                    <Card className="flex flex-1 flex-col">
                        <CardHeader className="flex flex-row items-center justify-between py-3">
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5" />
                                <CardTitle className="text-lg">Cart</CardTitle>
                                <Badge variant="secondary">{cart.length} items</Badge>
                            </div>
                            <div className="flex gap-1">
                                {cart.length > 0 && (
                                    <>
                                        <Button type="button" variant="outline" size="sm" onClick={holdSale}>
                                            <Pause className="mr-1 h-4 w-4" />
                                            Hold (F8)
                                        </Button>
                                        <Button type="button" variant="ghost" size="sm" onClick={clearCart}>
                                            <X className="mr-1 h-4 w-4" />
                                            Clear
                                        </Button>
                                    </>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-hidden p-0">
                            <ScrollArea className="h-[200px]">
                                {cart.length === 0 ? (
                                    <div className="text-muted-foreground flex h-full items-center justify-center py-8">
                                        Cart is empty. Add products to start.
                                    </div>
                                ) : (
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Product</TableHead>
                                                <TableHead className="w-28 text-center">Qty</TableHead>
                                                <TableHead className="text-right">Total</TableHead>
                                                <TableHead className="w-10"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {cart.map((item) => (
                                                <TableRow key={item.product_id}>
                                                    <TableCell>
                                                        <div className="font-medium">{item.product.name}</div>
                                                        <div className="text-muted-foreground text-xs">@ {formatCurrency(item.unit_price)} Ks</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center justify-center gap-1">
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
                                                    <TableCell className="text-right font-mono font-medium">
                                                        {formatCurrency(item.subtotal)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive h-7 w-7"
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

                    {/* Totals and Payment */}
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
                            <div className="flex items-center justify-between text-sm">
                                <span>Discount</span>
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={data.discount_amount || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/[^0-9]/g, '');
                                        setData('discount_amount', val === '' ? 0 : parseInt(val, 10));
                                    }}
                                    className="h-8 w-28 text-right font-mono"
                                />
                            </div>
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span className="text-primary font-mono">{formatCurrency(cartTotals.total)} Ks</span>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-xs">Payment Method</Label>
                                    <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                        <SelectTrigger className="h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {paymentMethods.map((m) => (
                                                <SelectItem key={m} value={m}>
                                                    {m}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Paid Amount</Label>
                                    <Input
                                        type="text"
                                        inputMode="numeric"
                                        value={data.paid_amount || ''}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9]/g, '');
                                            setData('paid_amount', val === '' ? 0 : parseInt(val, 10));
                                        }}
                                        className="h-9 font-mono"
                                    />
                                </div>
                            </div>
                            {/* Quick Cash Buttons */}
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setData('paid_amount', data.paid_amount + 1000)}
                                    className="flex-1"
                                >
                                    +1,000
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setData('paid_amount', data.paid_amount + 5000)}
                                    className="flex-1"
                                >
                                    +5,000
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setData('paid_amount', data.paid_amount + 10000)}
                                    className="flex-1"
                                >
                                    +10,000
                                </Button>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setData('paid_amount', cartTotals.total)}
                                    className="flex-1"
                                >
                                    Exact
                                </Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setData('paid_amount', 0)} className="flex-1">
                                    Clear
                                </Button>
                            </div>
                            {/* Change Display */}
                            {data.paid_amount > cartTotals.total && (
                                <div className="flex justify-between rounded-lg bg-green-100 p-2 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                    <span className="font-medium">Change</span>
                                    <span className="font-mono font-bold">{formatCurrency(data.paid_amount - cartTotals.total)} Ks</span>
                                </div>
                            )}
                            {data.credit_amount > 0 && (
                                <div className="flex justify-between text-sm text-red-600">
                                    <span>Credit Amount</span>
                                    <span className="font-mono font-bold">{formatCurrency(data.credit_amount)} Ks</span>
                                </div>
                            )}
                            {selectedCustomer && data.credit_amount > 0 && (
                                <div className="text-muted-foreground text-xs">
                                    Customer balance after: {formatCurrency(selectedCustomer.current_balance + data.credit_amount)} Ks (Limit:{' '}
                                    {formatCurrency(selectedCustomer.credit_limit)} Ks)
                                </div>
                            )}
                            <InputError message={errors.items} />
                            <Button id="complete-sale-btn" type="submit" className="h-12 w-full text-lg" disabled={processing || cart.length === 0}>
                                {processing ? 'Processing...' : `Complete Sale (F12) - ${formatCurrency(cartTotals.total)} Ks`}
                            </Button>
                            {/* Keyboard Shortcuts Help */}
                            <div className="text-muted-foreground text-center text-xs">F1: Search • F2: Barcode • F8: Hold • F12: Complete</div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </AppLayout>
    );
}
