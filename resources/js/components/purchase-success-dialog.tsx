import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Eye, Plus, Printer } from 'lucide-react';

type CompletedPurchase = {
    id: number;
    purchase_no: string;
    total_amount: number;
    paid_amount: number;
    payment_status: string;
    supplier?: {
        id: number;
        name: string;
    };
};

type PurchaseSuccessDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    purchase: CompletedPurchase | null;
    onNewPurchase: () => void;
    onPrint: (format: 'a4' | 'a5' | 'thermal') => void;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function PurchaseSuccessDialog({ open, onOpenChange, purchase, onNewPurchase, onPrint }: PurchaseSuccessDialogProps) {
    if (!purchase) return null;

    const handleNewPurchase = () => {
        onNewPurchase();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <DialogTitle className="text-center text-xl">Purchase Recorded!</DialogTitle>
                    <DialogDescription className="text-center">The purchase has been saved successfully.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">PO Number</span>
                        <span className="font-mono font-semibold">{purchase.purchase_no}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Supplier</span>
                        <span className="font-medium">{purchase.supplier?.name || 'No Supplier'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                        <span className="font-medium">Total</span>
                        <span className="text-primary font-mono font-bold">{formatCurrency(purchase.total_amount)} Ks</span>
                    </div>
                    {purchase.paid_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="font-mono text-green-600">{formatCurrency(purchase.paid_amount)} Ks</span>
                        </div>
                    )}
                    {purchase.total_amount - purchase.paid_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Balance Due</span>
                            <span className="font-mono text-orange-600">{formatCurrency(purchase.total_amount - purchase.paid_amount)} Ks</span>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <div className="flex w-full gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="flex-1">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print
                                    <ChevronDown className="ml-2 h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="center" className="w-48">
                                <DropdownMenuItem onClick={() => onPrint('a4')}>A4 Purchase Order</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onPrint('a5')}>A5 Purchase Order</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onPrint('thermal')}>Thermal Receipt</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" className="flex-1" asChild>
                            <Link href={route('purchases.show', { purchase: purchase.id })}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </Button>
                    </div>
                    <Button onClick={handleNewPurchase} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Record New Purchase
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
