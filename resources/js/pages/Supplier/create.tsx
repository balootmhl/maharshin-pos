import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Contact, Mail, MapPin, Phone, Truck, User } from 'lucide-react';
import { FormEventHandler } from 'react';

type SupplierForm = {
    code: string;
    name: string;
    contact_person: string;
    phone: string;
    email: string;
    address: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Suppliers',
        href: route('suppliers.index'),
    },
    {
        title: 'Create',
        href: '#',
    },
];

export default function SupplierCreate() {
    const { data, setData, post, reset, errors, processing } = useForm<SupplierForm>({
        code: '',
        name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        is_active: true,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('suppliers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Supplier" />
            <div className="w-full space-y-6 p-4 pb-12">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground gap-2 p-0">
                        <Link href={route('suppliers.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to Suppliers
                        </Link>
                    </Button>
                </div>

                <form onSubmit={submit}>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                        {/* Left Card: Supplier Profile */}
                        <div className="space-y-6 lg:col-span-7">
                            <Card className="flex h-full flex-col justify-between border border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <Truck className="h-5 w-5 text-indigo-500" />
                                        Supplier Profile
                                    </CardTitle>
                                    <CardDescription>Configure primary codes, vendor names, and point-of-contact details.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="code" className="font-semibold">
                                                Supplier Code*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="code"
                                                    value={data.code}
                                                    onChange={(e) => setData('code', e.target.value)}
                                                    required
                                                    placeholder="SUP-001"
                                                    autoFocus={true}
                                                    className="pl-9"
                                                />
                                                <span className="text-muted-foreground absolute top-1/2 left-3 -translate-y-1/2 font-mono text-xs font-bold">
                                                    #
                                                </span>
                                            </div>
                                            <InputError className="mt-1" message={errors.code} />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="font-semibold">
                                                Supplier Name*
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="name"
                                                    value={data.name}
                                                    onChange={(e) => setData('name', e.target.value)}
                                                    required
                                                    placeholder="ABC Trading Co."
                                                    className="pl-9"
                                                />
                                                <Truck className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                            </div>
                                            <InputError className="mt-1" message={errors.name} />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contact_person" className="font-semibold">
                                            Contact Person Name
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="contact_person"
                                                value={data.contact_person}
                                                onChange={(e) => setData('contact_person', e.target.value)}
                                                placeholder="John Doe"
                                                className="pl-9"
                                            />
                                            <User className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.contact_person} />
                                    </div>

                                    <div className="flex items-center space-x-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) => setData('is_active', checked)}
                                        />
                                        <div className="space-y-0.5">
                                            <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold">
                                                Active Status
                                            </Label>
                                            <p className="text-muted-foreground text-[10px]">
                                                Inactive suppliers are restricted from processing new orders.
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Card: Contact Details */}
                        <div className="space-y-6 lg:col-span-5">
                            <Card className="flex h-full flex-col justify-between border border-slate-200 shadow-xs dark:border-slate-800">
                                <CardHeader className="pb-6">
                                    <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                        <Contact className="h-5 w-5 text-amber-500" />
                                        Contact Channels
                                    </CardTitle>
                                    <CardDescription>Manage supplier contact numbers, email channels, and physical address.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="font-semibold">
                                            Phone Number
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="phone"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                                placeholder="+95 9 123 456 789"
                                                className="pl-9"
                                            />
                                            <Phone className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.phone} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="font-semibold">
                                            Email Address
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="email"
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="supplier@example.com"
                                                className="pl-9"
                                            />
                                            <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                        </div>
                                        <InputError className="mt-1" message={errors.email} />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address" className="font-semibold">
                                            Physical Office Address
                                        </Label>
                                        <div className="relative">
                                            <Textarea
                                                id="address"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                                placeholder="Enter physical address details"
                                                rows={2}
                                                className="pt-2.5 pl-9"
                                            />
                                            <MapPin className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                        </div>
                                        <InputError className="mt-1" message={errors.address} />
                                    </div>
                                </CardContent>
                                <CardContent className="pt-0">
                                    <div className="flex justify-end gap-3 border-t pt-5">
                                        <Button variant="outline" asChild>
                                            <Link href={route('suppliers.index')}>Cancel</Link>
                                        </Button>
                                        <Button variant="secondary" type="button" onClick={() => reset()} disabled={processing}>
                                            Reset
                                        </Button>
                                        <Button type="submit" disabled={processing} className="min-w-[80px]">
                                            Save
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
