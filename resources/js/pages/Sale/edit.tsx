import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Construction } from 'lucide-react';

type Sale = {
    id: number;
    invoice_no: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sales',
        href: route('sales.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function SaleEdit({ sale }: { sale: Sale }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${sale.invoice_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Alert>
                    <Construction className="h-4 w-4" />
                    <AlertTitle>Sale Edit</AlertTitle>
                    <AlertDescription>
                        Sale editing with line item modifications will be available in the POS module. For now, you can view sale details or process
                        returns.
                    </AlertDescription>
                </Alert>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href={route('sales.show', { sale: sale.id })}>View Sale</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('sales.index')}>Back to Sales</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
