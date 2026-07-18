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
import { FormEventHandler } from 'react';

type Branch = {
    id: number;
    code: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    is_active: boolean;
};

type BranchForm = {
    code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    is_active: boolean;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Branches',
        href: route('branches.index'),
    },
    {
        title: 'Edit',
        href: '#',
    },
];

export default function BranchEdit({ branch, lockedModules }: { branch: Branch; lockedModules: { [key: string]: boolean } }) {
    const { data, setData, patch, reset, errors, processing } = useForm<BranchForm>({
        code: branch.code,
        name: branch.name,
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        is_active: branch.is_active,
    });

    const passwordForm = useForm({
        sale: { locked: lockedModules.sale, password: '' },
        purchase: { locked: lockedModules.purchase, password: '' },
        inventory: { locked: lockedModules.inventory, password: '' },
        customer: { locked: lockedModules.customer, password: '' },
        supplier: { locked: lockedModules.supplier, password: '' },
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        patch(route('branches.update', { branch: branch.id }), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    const submitPasswords: FormEventHandler = (e) => {
        e.preventDefault();
        passwordForm.post(route('branches.module-passwords.update', { branch: branch.id }), {
            preserveScroll: true,
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${branch.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="mx-auto w-full max-w-3xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="code">Branch Code*</Label>
                                <Input
                                    id="code"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value)}
                                    required
                                    placeholder="BR-001"
                                    autoFocus={true}
                                />
                                <InputError className="mt-2" message={errors.code} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="name">Branch Name*</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                    placeholder="Main Branch"
                                />
                                <InputError className="mt-2" message={errors.name} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="phone">Phone</Label>
                                <Input
                                    id="phone"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    placeholder="+95 9 123 456 789"
                                />
                                <InputError className="mt-2" message={errors.phone} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="branch@example.com"
                                />
                                <InputError className="mt-2" message={errors.email} />
                            </div>
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="address">Address</Label>
                            <Textarea
                                id="address"
                                value={data.address}
                                onChange={(e) => setData('address', e.target.value)}
                                placeholder="Enter branch address"
                                rows={3}
                            />
                            <InputError className="mt-2" message={errors.address} />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                            <Label htmlFor="is_active">Active</Label>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('branches.index')}>Cancel</Link>
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update
                            </Button>
                        </div>
                    </div>
                </form>

                <form onSubmit={submitPasswords} className="mx-auto mt-8 w-full max-w-3xl">
                    <Card>
                        <CardHeader>
                            <CardTitle>Module Password Protection</CardTitle>
                            <CardDescription>
                                Set passwords to gate access to specific modules for this branch. If lock is disabled or password is empty, access is
                                unrestricted.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {(['sale', 'purchase', 'inventory', 'customer', 'supplier'] as const).map((module) => {
                                const displayName = module.charAt(0).toUpperCase() + module.slice(1);
                                const moduleData = passwordForm.data[module];
                                return (
                                    <div key={module} className="flex flex-col gap-4 border-b py-3 last:border-b-0 md:flex-row md:items-center">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-2">
                                                <Switch
                                                    id={`lock-${module}`}
                                                    checked={moduleData.locked}
                                                    onCheckedChange={(checked) => {
                                                        passwordForm.setData(module, {
                                                            ...moduleData,
                                                            locked: checked,
                                                        });
                                                    }}
                                                />
                                                <Label htmlFor={`lock-${module}`} className="text-base font-semibold">
                                                    {displayName} Module
                                                </Label>
                                            </div>
                                            <p className="text-muted-foreground mt-1 ml-10 text-xs">
                                                {moduleData.locked ? 'Requires password to access' : 'Unrestricted access'}
                                            </p>
                                        </div>

                                        {moduleData.locked && (
                                            <div className="w-full space-y-1 md:w-64">
                                                <Label htmlFor={`pass-${module}`} className="text-xs">
                                                    Password
                                                </Label>
                                                <Input
                                                    id={`pass-${module}`}
                                                    type="password"
                                                    value={moduleData.password}
                                                    onChange={(e) => {
                                                        passwordForm.setData(module, {
                                                            ...moduleData,
                                                            password: e.target.value,
                                                        });
                                                    }}
                                                    placeholder={lockedModules[module] ? '•••••••• (Keep existing)' : 'Enter password'}
                                                    className="h-9"
                                                />
                                                <InputError
                                                    className="mt-1"
                                                    message={(passwordForm.errors as Record<string, string>)[`${module}.password`]}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            <div className="flex justify-end pt-2">
                                <Button type="submit" disabled={passwordForm.processing}>
                                    Save Passwords
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AppLayout>
    );
}
