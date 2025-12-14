import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, SaleReturn } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Construction } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Sale Returns',
        href: route('sale-returns.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function SaleReturnEdit({ saleReturn }: { saleReturn: SaleReturn }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${saleReturn.return_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Alert>
                    <Construction className="h-4 w-4" />
                    <AlertTitle>Return Edit</AlertTitle>
                    <AlertDescription>Return editing will be available in the Return Management module.</AlertDescription>
                </Alert>
                <div className="flex gap-4">
                    <Button asChild variant="outline">
                        <Link href={route('sale-returns.show', { sale_return: saleReturn.id })}>View Return</Link>
                    </Button>
                    <Button asChild variant="outline">
                        <Link href={route('sale-returns.index')}>Back to Returns</Link>
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
