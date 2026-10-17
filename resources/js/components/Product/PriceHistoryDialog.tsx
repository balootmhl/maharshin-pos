import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { ProductPriceHistory } from '@/types';
import { ArrowDown, ArrowRight, ArrowUp, Clock, History, Loader2, Minus, User as UserIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface PriceHistoryDialogProps {
    productId: number | null;
    productName?: string;
    productCode?: string;
    branchId?: number | string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const formatNumber = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined || val === '') return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    if (isNaN(num)) return '-';
    return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
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
            <span className="text-muted-foreground font-mono">{formatNumber(oldVal)}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-semibold font-mono">{formatNumber(newVal)}</span>
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
                    {formatNumber(diff)}
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

export default function PriceHistoryDialog({
    productId,
    productName,
    productCode,
    branchId,
    open,
    onOpenChange,
}: PriceHistoryDialogProps) {
    const [loading, setLoading] = useState(false);
    const [histories, setHistories] = useState<ProductPriceHistory[]>([]);
    const [fetchedProduct, setFetchedProduct] = useState<{ name: string; code: string; unit: string } | null>(null);

    useEffect(() => {
        if (!open || !productId) {
            setHistories([]);
            setFetchedProduct(null);
            return;
        }

        let isMounted = true;
        setLoading(true);

        const url = new URL(route('products.price-history', productId), window.location.origin);
        if (branchId && branchId !== 'all') {
            url.searchParams.set('branch_id', branchId.toString());
        }

        fetch(url.toString(), {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        })
            .then((res) => res.json())
            .then((data) => {
                if (isMounted) {
                    setHistories(data.histories || []);
                    setFetchedProduct(data.product || null);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isMounted) {
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
    }, [open, productId, branchId]);

    const displayName = productName || fetchedProduct?.name || 'Product';
    const displayCode = productCode || fetchedProduct?.code || '';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-4 border-b">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <History className="h-5 w-5 text-primary" />
                                <DialogTitle className="text-lg font-bold">Price Audit History</DialogTitle>
                            </div>
                            <DialogDescription className="text-xs">
                                Historical changes for{' '}
                                <span className="font-semibold text-foreground">{displayName}</span>
                                {displayCode && (
                                    <span className="ml-1 text-muted-foreground font-mono">({displayCode})</span>
                                )}
                            </DialogDescription>
                        </div>
                        <Badge variant="outline" className="text-xs font-mono">
                            {histories.length} {histories.length === 1 ? 'record' : 'records'}
                        </Badge>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden p-6 pt-2">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-xs">Loading price audit logs...</p>
                        </div>
                    ) : histories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground text-center gap-2">
                            <Clock className="h-10 w-10 text-muted-foreground/40 stroke-1" />
                            <p className="text-sm font-medium">No price changes recorded yet</p>
                            <p className="text-xs text-muted-foreground max-w-sm">
                                Future updates to cost price or selling price will automatically appear in this audit trail.
                            </p>
                        </div>
                    ) : (
                        <ScrollArea className="h-[52vh] rounded-md border">
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10">
                                    <TableRow>
                                        <TableHead className="w-[140px] text-xs">Date & Time</TableHead>
                                        <TableHead className="w-[110px] text-xs">Branch</TableHead>
                                        <TableHead className="text-xs">Cost Price (Old → New)</TableHead>
                                        <TableHead className="text-xs">Selling Price (Old → New)</TableHead>
                                        <TableHead className="w-[90px] text-xs">Type</TableHead>
                                        <TableHead className="w-[100px] text-xs">Changed By</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {histories.map((h) => (
                                        <TableRow key={h.id} className="text-xs">
                                            <TableCell className="font-mono text-[11px] text-muted-foreground">
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
                                                    <span className="truncate max-w-[80px]">
                                                        {h.changedBy?.name || h.changed_by_user?.name || 'System'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
