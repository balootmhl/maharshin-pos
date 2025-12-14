import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Construction } from 'lucide-react';

type Purchase = {
    id: number;
    purchase_no: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Purchases',
        href: route('purchases.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function PurchaseEdit({ purchase }: { purchase: Purchase }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${purchase.purchase_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Alert>
                    <Construction className="h-4 w-4" />
                    <AlertTitle>Purchase Edit</AlertTitle>
                    <AlertDescription>
                        Purchase editing with line item modifications will be available in the Purchase Management module.
                    </AlertDescription>
                </Alert>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href={route('purchases.show', { purchase: purchase.id })}>View Purchase</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('purchases.index')}>Back to Purchases</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
