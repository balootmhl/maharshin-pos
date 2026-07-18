import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, CustomerPayment } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Banknote, Edit } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customer Payments',
        href: route('customer-payments.index'),
    },
    {
        title: 'Details',
        href: '#',
    },
];

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function CustomerPaymentShow({ customerPayment }: { customerPayment: CustomerPayment }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Payment ${customerPayment.payment_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <Card className="mx-auto w-full max-w-4xl">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Banknote className="h-5 w-5" />
                                    Payment {customerPayment.payment_no}
                                </CardTitle>
                                <CardDescription>
                                    {customerPayment.payment_date} • {customerPayment.branch?.name}
                                </CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('customer-payments.edit', { customer_payment: customerPayment.id })}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-muted-foreground text-sm">Customer</p>
                                <p className="font-medium">{customerPayment.customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground text-sm">Payment Method</p>
                                <p className="font-medium">{customerPayment.payment_method}</p>
                            </div>
                        </div>
                        <div className="border-t pt-4">
                            <p className="text-muted-foreground text-sm">Amount</p>
                            <p className="font-mono text-2xl font-bold text-green-600">{formatCurrency(customerPayment.amount)} Ks</p>
                        </div>
                        {customerPayment.reference_no && (
                            <div>
                                <p className="text-muted-foreground text-sm">Reference No</p>
                                <p className="font-mono">{customerPayment.reference_no}</p>
                            </div>
                        )}
                        {customerPayment.notes && (
                            <div className="border-t pt-4">
                                <p className="text-muted-foreground text-sm">Notes: {customerPayment.notes}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
