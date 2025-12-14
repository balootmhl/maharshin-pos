import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Minus, Plus, Search, Undo2 } from 'lucide-react';
import { FormEventHandler, useEffect, useMemo, useState } from 'react';

type Branch = { id: number; name: string; code: string };
type Customer = { id: number; name: string; code: string };
type Product = { id: number; name: string; code: string };
type SaleItem = {
    id: number;
    product_id: number;
    product?: Product;
    quantity: number;
    unit_price: number;
    subtotal: number;
};
type Sale = {
    id: number;
    invoice_no: string;
    sale_date: string;
    customer_id?: number;
    customer?: Customer;
    branch_id: number;
    branch?: Branch;
    total_amount: number;
    sale_items?: SaleItem[];
};

type ReturnItem = {
    sale_item_id: number;
    product_id: number;
    product: Product;
    max_quantity: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    selected: boolean;
};

type ReturnForm = {
    sale_id: string;
    branch_id: string;
    return_date: string;
    total_amount: number;
    refund_amount: number;
    refund_method: string;
    reason: string;
    items: {
        sale_item_id: number;
        product_id: number;
        quantity: number;
        unit_price: number;
        subtotal: number;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Sale Returns', href: route('sale-returns.index') },
    { title: 'New Return', href: '#' },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

const refundMethods = ['Cash', 'Credit Adjustment', 'Bank Transfer', 'KBZ Pay', 'Wave Money'];

export default function SaleReturnCreate({ sales, branches }: { sales: Sale[]; branches: Branch[] }) {
    const today = new Date().toISOString().split('T')[0];
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);

    const { data, setData, post, errors, processing, reset } = useForm<ReturnForm>({
        sale_id: '',
        branch_id: '',
        return_date: today,
        total_amount: 0,
        refund_amount: 0,
        refund_method: 'Cash',
        reason: '',
        items: [],
    });

    // Filter sales based on search
    const filteredSales = useMemo(() => {
        if (!searchQuery) return sales.slice(0, 20);
        const query = searchQuery.toLowerCase();
        return sales.filter((s) => s.invoice_no.toLowerCase().includes(query) || s.customer?.name.toLowerCase().includes(query));
    }, [sales, searchQuery]);

    // Handle sale selection
    const handleSelectSale = (sale: Sale) => {
        setSelectedSale(sale);
        setData('sale_id', sale.id.toString());
        setData('branch_id', sale.branch_id.toString());

        // Initialize return items from sale items
        const items: ReturnItem[] = (sale.sale_items || []).map((item) => ({
            sale_item_id: item.id,
            product_id: item.product_id,
            product: item.product!,
            max_quantity: item.quantity,
            quantity: 0,
            unit_price: Number(item.unit_price),
            subtotal: 0,
            selected: false,
        }));
        setReturnItems(items);
    };

    // Calculate totals
    const returnTotals = useMemo(() => {
        const selectedItems = returnItems.filter((item) => item.selected && item.quantity > 0);
        const total = selectedItems.reduce((sum, item) => sum + item.subtotal, 0);
        return { total, count: selectedItems.length };
    }, [returnItems]);

    // Update form data when return items change
    useEffect(() => {
        const selectedItems = returnItems.filter((item) => item.selected && item.quantity > 0);
        const items = selectedItems.map((item) => ({
            sale_item_id: item.sale_item_id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            subtotal: item.subtotal,
        }));

        setData((prev) => ({
            ...prev,
            items,
            total_amount: returnTotals.total,
            refund_amount: Math.min(prev.refund_amount || returnTotals.total, returnTotals.total),
        }));
    }, [returnItems, returnTotals]);

    const toggleItemSelection = (saleItemId: number) => {
        setReturnItems((prev) =>
            prev.map((item) => {
                if (item.sale_item_id === saleItemId) {
                    const newSelected = !item.selected;
                    const newQty = newSelected ? item.max_quantity : 0;
                    return {
                        ...item,
                        selected: newSelected,
                        quantity: newQty,
                        subtotal: newQty * item.unit_price,
                    };
                }
                return item;
            }),
        );
    };

    const updateQuantity = (saleItemId: number, delta: number) => {
        setReturnItems((prev) =>
            prev.map((item) => {
                if (item.sale_item_id === saleItemId) {
                    const newQty = Math.max(0, Math.min(item.max_quantity, item.quantity + delta));
                    return {
                        ...item,
                        quantity: newQty,
                        subtotal: newQty * item.unit_price,
                        selected: newQty > 0,
                    };
                }
                return item;
            }),
        );
    };

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('sale-returns.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setSelectedSale(null);
                setReturnItems([]);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="New Return" />
            <form onSubmit={submit} className="flex h-[calc(100vh-120px)] gap-4 p-4">
                {/* Left: Sale Selection */}
                <div className="flex w-2/5 flex-col gap-4">
                    <div className="relative">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                        <Input
                            placeholder="Search by invoice number or customer..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                            autoFocus
                        />
                    </div>

                    <ScrollArea className="bg-card flex-1 rounded-lg border">
                        <div className="space-y-2 p-3">
                            {filteredSales.map((sale) => (
                                <button
                                    key={sale.id}
                                    type="button"
                                    onClick={() => handleSelectSale(sale)}
                                    className={`hover:bg-accent flex w-full flex-col gap-1 rounded-lg border p-3 text-left transition-colors ${
                                        selectedSale?.id === sale.id ? 'border-primary bg-accent' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold">{sale.invoice_no}</span>
                                        <span className="text-primary font-mono">{formatCurrency(Number(sale.total_amount))} Ks</span>
                                    </div>
                                    <div className="text-muted-foreground flex items-center justify-between text-sm">
                                        <span>{sale.customer?.name || 'Walk-in'}</span>
                                        <span>{sale.sale_date}</span>
                                    </div>
                                </button>
                            ))}
                            {filteredSales.length === 0 && <div className="text-muted-foreground py-8 text-center">No sales found</div>}
                        </div>
                    </ScrollArea>
                </div>

                {/* Right: Return Details */}
                <div className="flex w-3/5 flex-col gap-4">
                    {!selectedSale ? (
                        <Card className="flex flex-1 items-center justify-center">
                            <CardContent className="text-muted-foreground text-center">
                                <Undo2 className="mx-auto mb-4 h-12 w-12 opacity-50" />
                                <p>Select an invoice from the left to process a return</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="py-3">
                                    <CardTitle className="flex items-center gap-2">
                                        {selectedSale.invoice_no}
                                        <Badge variant="outline">{selectedSale.sale_date}</Badge>
                                    </CardTitle>
                                    <CardDescription>
                                        {selectedSale.customer?.name || 'Walk-in Customer'} • {selectedSale.branch?.name}
                                    </CardDescription>
                                </CardHeader>
                            </Card>

                            <Card className="flex flex-1 flex-col">
                                <CardHeader className="py-3">
                                    <CardTitle className="text-lg">Select Items to Return</CardTitle>
                                </CardHeader>
                                <CardContent className="flex-1 overflow-hidden p-0">
                                    <ScrollArea className="h-[240px]">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-10"></TableHead>
                                                    <TableHead>Product</TableHead>
                                                    <TableHead className="text-center">Sold Qty</TableHead>
                                                    <TableHead className="w-28 text-center">Return Qty</TableHead>
                                                    <TableHead className="text-right">Refund</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {returnItems.map((item) => (
                                                    <TableRow key={item.sale_item_id}>
                                                        <TableCell>
                                                            <Checkbox
                                                                checked={item.selected}
                                                                onCheckedChange={() => toggleItemSelection(item.sale_item_id)}
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="font-medium">{item.product.name}</div>
                                                            <div className="text-muted-foreground text-xs">
                                                                @ {formatCurrency(item.unit_price)} Ks each
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center">{item.max_quantity}</TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-center gap-1">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => updateQuantity(item.sale_item_id, -1)}
                                                                    disabled={item.quantity === 0}
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </Button>
                                                                <span className="w-8 text-center font-mono">{item.quantity}</span>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => updateQuantity(item.sale_item_id, 1)}
                                                                    disabled={item.quantity >= item.max_quantity}
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right font-mono font-medium">
                                                            {item.quantity > 0 ? formatCurrency(item.subtotal) : '-'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardContent className="space-y-3 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span>Items to Return</span>
                                        <span className="font-medium">{returnTotals.count} items</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold">
                                        <span>Total Refund</span>
                                        <span className="text-primary font-mono">{formatCurrency(returnTotals.total)} Ks</span>
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Refund Method</Label>
                                            <Select value={data.refund_method} onValueChange={(v) => setData('refund_method', v)}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {refundMethods.map((m) => (
                                                        <SelectItem key={m} value={m}>
                                                            {m}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Refund Amount</Label>
                                            <Input
                                                type="number"
                                                value={data.refund_amount}
                                                onChange={(e) => setData('refund_amount', Number(e.target.value))}
                                                className="h-9 font-mono"
                                                max={returnTotals.total}
                                                min={0}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Reason</Label>
                                        <Textarea
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            rows={2}
                                            placeholder="Reason for return..."
                                        />
                                    </div>
                                    <InputError message={errors.items} />
                                    <Button type="submit" className="h-12 w-full text-lg" disabled={processing || returnTotals.count === 0}>
                                        {processing ? 'Processing...' : `Process Return - ${formatCurrency(returnTotals.total)} Ks`}
                                    </Button>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </form>
        </AppLayout>
    );
}
