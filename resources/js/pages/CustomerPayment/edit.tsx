import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch, Customer, CustomerPayment, SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { FormEventHandler } from 'react';

type PaymentForm = {
    customer_id: string;
    branch_id: string;
    payment_date: string;
    amount: string;
    payment_method: string;
    reference_no: string;
    notes: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Customer Payments',
        href: route('customer-payments.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

const paymentMethods = ['Cash', 'Bank Transfer', 'Mobile Banking', 'Check', 'Other'];

export default function CustomerPaymentEdit({
    customerPayment,
    customers,
    branches,
}: {
    customerPayment: CustomerPayment;
    customers: Customer[];
    branches: Branch[];
}) {
    const { auth } = usePage<SharedData>().props;

    // The backend BaseModel serializes dates as Y/m/d by default
    // We must replace / with - because HTML5 date inputs strictly require YYYY-MM-DD
    let formattedDate = '';
    try {
        if (customerPayment.payment_date) {
            formattedDate = customerPayment.payment_date.replace(/\//g, '-').substring(0, 10);
        }
    } catch (e) {
        console.error('Date parsing error:', e);
    }

    const { data, setData, patch, errors, processing } = useForm<PaymentForm>({
        customer_id: String(customerPayment.customer_id),
        branch_id: String(customerPayment.branch_id),
        payment_date: formattedDate,
        amount: String(customerPayment.amount),
        payment_method: customerPayment.payment_method,
        reference_no: customerPayment.reference_no || '',
        notes: customerPayment.notes || '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('customer-payments.update', { customer_payment: customerPayment.id }), {
            preserveScroll: true,
        });
    };

    // Filter out errors that don't match any form field (to prevent "silent" errors)
    const formFieldKeys = ['customer_id', 'branch_id', 'payment_date', 'amount', 'payment_method', 'reference_no', 'notes'];
    const orphanedErrors = Object.keys(errors).filter((key) => !formFieldKeys.includes(key));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit Payment ${customerPayment.payment_no}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="max-w-3xl mx-auto w-full">
                    <div className="space-y-6">
                        {/* Display orphaned errors at the top */}
                        {orphanedErrors.length > 0 && (
                            <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/10 dark:text-red-400">
                                <p className="font-bold">Please check the following errors:</p>
                                <ul className="mt-1 list-disc pl-5">
                                    {orphanedErrors.map((key) => (
                                        <li key={key}>
                                            <span className="capitalize">{key.replace('_', ' ')}</span>: {(errors as Record<string, string | undefined>)[key]}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="customer_id">Customer*</Label>
                                <Select value={data.customer_id} onValueChange={(v) => setData('customer_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select customer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {customers.map((c) => (
                                            <SelectItem key={c.id} value={String(c.id)}>
                                                {c.name} ({c.code})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError className="mt-2" message={errors.customer_id} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="branch_id">Branch*</Label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)} disabled={!auth.user.is_super_admin}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((b) => (
                                            <SelectItem key={b.id} value={String(b.id)}>
                                                {b.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError className="mt-2" message={errors.branch_id} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="payment_date">Payment Date*</Label>
                                <Input
                                    id="payment_date"
                                    type="date"
                                    value={data.payment_date}
                                    onChange={(e) => setData('payment_date', e.target.value)}
                                    required
                                />
                                <InputError className="mt-2" message={errors.payment_date} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="amount">Amount (Ks)*</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={data.amount}
                                    onChange={(e) => setData('amount', e.target.value)}
                                    required
                                    placeholder="0"
                                />
                                <InputError className="mt-2" message={errors.amount} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="payment_method">Payment Method*</Label>
                                <Select value={data.payment_method} onValueChange={(v) => setData('payment_method', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {paymentMethods.map((method) => (
                                            <SelectItem key={method} value={method}>
                                                {method}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError className="mt-2" message={errors.payment_method} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="reference_no">Reference No</Label>
                                <Input
                                    id="reference_no"
                                    value={data.reference_no}
                                    onChange={(e) => setData('reference_no', e.target.value)}
                                    placeholder="Transaction ID / Check No"
                                />
                                <InputError className="mt-2" message={errors.reference_no} />
                            </div>
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea
                                id="notes"
                                value={data.notes}
                                onChange={(e) => setData('notes', e.target.value)}
                                placeholder="Additional notes"
                                rows={2}
                            />
                            <InputError className="mt-2" message={errors.notes} />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('customer-payments.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update Payment
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
