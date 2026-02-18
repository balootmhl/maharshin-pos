import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Product } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface QuickAdjustDialogProps {
    product: Product;
    branchId: number;
    currentStock: number;
    reasons: Record<string, string>;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

type Mode = 'adjust' | 'set';

export default function QuickAdjustDialog({
    product,
    branchId,
    currentStock,
    reasons,
    open,
    onOpenChange,
    onSuccess,
}: QuickAdjustDialogProps) {
    const [mode, setMode] = useState<Mode>('adjust'); // 'adjust' (+/-) or 'set' (=)

    const form = useForm({
        branch_id: branchId,
        product_id: product.id,
        adjustment_date: new Date().toISOString().split('T')[0],
        adjustment_type: 'add', // 'add' or 'subtract'
        quantity: '',
        reason: '',
        notes: '',
    });

    // Reset form when dialog opens or product changes
    useEffect(() => {
        if (open) {
            form.setData({
                branch_id: branchId,
                product_id: product.id,
                adjustment_date: new Date().toISOString().split('T')[0],
                adjustment_type: 'add',
                quantity: '',
                reason: '',
                notes: '',
            });
            setMode('adjust');
            form.clearErrors();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, product.id, branchId]);

    // Handle "Set" mode calculation
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalType = form.data.adjustment_type;
        let finalQty = Number(form.data.quantity);

        if (mode === 'set') {
            const newStock = Number(form.data.quantity);
            const diff = newStock - currentStock;

            if (diff === 0) {
                toast.error('New stock is same as current stock.');
                return;
            }

            if (diff > 0) {
                finalType = 'add';
                finalQty = diff;
            } else {
                finalType = 'subtract';
                finalQty = Math.abs(diff);
            }
        }

        form.transform((data) => ({
            ...data,
            adjustment_type: finalType,
            quantity: finalQty,
        }));

        form.post(route('stock-adjustments.quick'), {
            onSuccess: () => {
                toast.success('Stock adjusted successfully');
                onOpenChange(false);
                onSuccess?.();
            },
            onError: () => {
                toast.error('Failed to adjust stock. Please check inputs.');
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Quick Adjust Stock</DialogTitle>
                    <DialogDescription>
                        Adjust stock for <span className="font-semibold">{product.name}</span> ({product.code}).
                        <br />
                        Current Stock: <span className="font-mono font-medium">{currentStock}</span> {product.unit}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    {/* Mode Selection */}
                    <div className="flex items-center gap-4">
                        <Label>Mode</Label>
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={mode === 'adjust' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setMode('adjust')}
                            >
                                Adjust (+/-)
                            </Button>
                            <Button
                                type="button"
                                variant={mode === 'set' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setMode('set')}
                            >
                                Set (=)
                            </Button>
                        </div>
                    </div>

                    {/* Adjust Mode: Type */}
                    {mode === 'adjust' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="type" className="text-right">
                                Type
                            </Label>
                            <Select
                                value={form.data.adjustment_type}
                                onValueChange={(val) => form.setData('adjustment_type', val)}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="add">Add (+)</SelectItem>
                                    <SelectItem value="subtract">Subtract (-)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                            {mode === 'set' ? 'New Total' : 'Quantity'}
                        </Label>
                        <Input
                            id="quantity"
                            type="number"
                            className="col-span-3"
                            value={form.data.quantity}
                            onChange={(e) => form.setData('quantity', e.target.value)} // Keep as string for input
                            required
                            min="0"
                            step="0.01" // Assuming quantity can be decimal
                        />
                    </div>
                    {form.errors.quantity && (
                        <p className="text-destructive col-start-2 col-span-3 text-sm">{form.errors.quantity}</p>
                    )}

                    {/* Reason */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="reason" className="text-right">
                            Reason
                        </Label>
                        <Select
                            value={form.data.reason}
                            onValueChange={(val) => form.setData('reason', val)}
                            required // Required by backend
                        >
                            <SelectTrigger className="col-span-3">
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
                    </div>
                    {form.errors.reason && (
                        <p className="text-destructive col-start-2 col-span-3 text-sm">{form.errors.reason}</p>
                    )}

                    {/* Notes */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="notes" className="text-right">
                            Notes
                        </Label>
                        <Textarea
                            id="notes"
                            className="col-span-3"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                        />
                    </div>
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={form.processing}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={form.processing}>
                        {mode === 'set' ? 'Set Stock' : form.data.adjustment_type === 'add' ? 'Add Stock' : 'Remove Stock'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
