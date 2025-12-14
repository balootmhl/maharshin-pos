import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Eye, Plus, Printer } from 'lucide-react';

type CompletedSale = {
    id: number;
    invoice_no: string;
    total_amount: number;
    paid_amount: number;
    credit_amount: number;
    payment_status: string;
    customer?: {
        id: number;
        name: string;
    };
};

type SaleSuccessDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sale: CompletedSale | null;
    onNewSale: () => void;
    onPrint: (format: 'a4' | 'a5' | 'thermal') => void;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export function SaleSuccessDialog({ open, onOpenChange, sale, onNewSale, onPrint }: SaleSuccessDialogProps) {
    if (!sale) return null;

    const handleNewSale = () => {
        onNewSale();
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                        <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                    </div>
                    <DialogTitle className="text-center text-xl">Sale Completed!</DialogTitle>
                    <DialogDescription className="text-center">Your sale has been processed successfully.</DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Invoice</span>
                        <span className="font-mono font-semibold">{sale.invoice_no}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Customer</span>
                        <span className="font-medium">{sale.customer?.name || 'Walk-in'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg">
                        <span className="font-medium">Total</span>
                        <span className="text-primary font-mono font-bold">{formatCurrency(sale.total_amount)} Ks</span>
                    </div>
                    {sale.paid_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="font-mono text-green-600">{formatCurrency(sale.paid_amount)} Ks</span>
                        </div>
                    )}
                    {sale.credit_amount > 0 && (
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Credit</span>
                            <span className="font-mono text-red-600">{formatCurrency(sale.credit_amount)} Ks</span>
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
                                <DropdownMenuItem onClick={() => onPrint('a4')}>A4 Invoice</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onPrint('a5')}>A5 Invoice</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onPrint('thermal')}>Thermal Receipt (80mm)</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button variant="outline" className="flex-1" asChild>
                            <Link href={route('sales.show', { sale: sale.id })}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                            </Link>
                        </Button>
                    </div>
                    <Button onClick={handleNewSale} className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Sale
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
