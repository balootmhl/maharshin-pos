import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CreditCard,
    Eye,
    EyeOff,
    KeyRound,
    Lock,
    Mail,
    MapPin,
    Package,
    Phone,
    ShieldAlert,
    ShoppingBag,
    Store,
    Truck,
    Unlock,
    Users,
} from 'lucide-react';
import { FormEventHandler, useState } from 'react';

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

const moduleConfigs = {
    sale: {
        icon: CreditCard,
        color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20',
        desc: 'Access POS screens, cash register checkout endpoints, and sales reports.',
    },
    purchase: {
        icon: ShoppingBag,
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20',
        desc: 'Access purchase ordering workflow, supplier stock receipts, and logs.',
    },
    inventory: {
        icon: Package,
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20',
        desc: 'Access stock list, adjustments, groups, categories, pricing, and history.',
    },
    customer: {
        icon: Users,
        color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20',
        desc: 'Access customer directories, credit ledgers, and payment adjustments.',
    },
    supplier: {
        icon: Truck,
        color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20',
        desc: 'Access supplier contact databases, details, and purchase records.',
    },
};

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

    const [showPassword, setShowPassword] = useState<Record<string, boolean>>({});

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

    const togglePasswordVisibility = (module: string) => {
        setShowPassword((prev) => ({ ...prev, [module]: !prev[module] }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit - ${branch.name}`} />
            <div className="mx-auto w-full max-w-4xl space-y-8 p-4 pb-12">
                {/* Header Actions */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" asChild className="text-muted-foreground hover:text-foreground gap-2">
                        <Link href={route('branches.index')}>
                            <ArrowLeft className="h-4 w-4" />
                            Back to Branches
                        </Link>
                    </Button>
                </div>

                {/* Form 1: General Branch Details */}
                <form onSubmit={submit}>
                    <Card className="border border-slate-200 shadow-xs dark:border-slate-800">
                        <CardHeader className="pb-6">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <Building2 className="h-5 w-5 text-indigo-500" />
                                General Information
                            </CardTitle>
                            <CardDescription>Update the name, unique code, contact channels, and address of this branch.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code" className="font-semibold">
                                        Branch Code*
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="code"
                                            value={data.code}
                                            onChange={(e) => setData('code', e.target.value)}
                                            required
                                            placeholder="BR-001"
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
                                        Branch Name*
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            placeholder="Main Branch"
                                            className="pl-9"
                                        />
                                        <Store className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    </div>
                                    <InputError className="mt-1" message={errors.name} />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                                            placeholder="branch@example.com"
                                            className="pl-9"
                                        />
                                        <Mail className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                                    </div>
                                    <InputError className="mt-1" message={errors.email} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="font-semibold">
                                    Physical Address
                                </Label>
                                <div className="relative">
                                    <Textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(e) => setData('address', e.target.value)}
                                        placeholder="Enter branch address"
                                        rows={3}
                                        className="pt-2.5 pl-9"
                                    />
                                    <MapPin className="text-muted-foreground absolute top-3 left-3 h-4 w-4" />
                                </div>
                                <InputError className="mt-1" message={errors.address} />
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800">
                                <Switch id="is_active" checked={data.is_active} onCheckedChange={(checked) => setData('is_active', checked)} />
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_active" className="cursor-pointer text-sm font-semibold">
                                        Active Status
                                    </Label>
                                    <p className="text-muted-foreground text-[11px]">Inactive branches cannot perform new transactions.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t pt-6">
                                <Button variant="outline" asChild>
                                    <Link href={route('branches.index')}>Cancel</Link>
                                </Button>
                                <Button type="submit" disabled={processing} className="min-w-[100px]">
                                    Update Details
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>

                {/* Form 2: Module Password Gating */}
                <form onSubmit={submitPasswords}>
                    <Card className="border border-slate-200 shadow-xs dark:border-slate-800">
                        <CardHeader className="pb-6">
                            <CardTitle className="flex items-center gap-2 text-xl font-bold">
                                <ShieldAlert className="h-5 w-5 text-amber-500" />
                                Module Gating Configuration
                            </CardTitle>
                            <CardDescription>
                                Set passwords to gate access to specific modules for this branch. If disabled, access remains unrestricted.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {(['sale', 'purchase', 'inventory', 'customer', 'supplier'] as const).map((module) => {
                                    const displayName = module.charAt(0).toUpperCase() + module.slice(1);
                                    const moduleData = passwordForm.data[module];
                                    const cfg = moduleConfigs[module];
                                    const IconComponent = cfg.icon;

                                    return (
                                        <div
                                            key={module}
                                            className="group flex flex-col gap-6 py-5 first:pt-0 last:pb-0 md:flex-row md:items-center md:justify-between"
                                        >
                                            {/* Module Info */}
                                            <div className="flex flex-1 items-start gap-4">
                                                <div className={`mt-0.5 rounded-lg p-2 ${cfg.color}`}>
                                                    <IconComponent className="h-5 w-5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Label
                                                            htmlFor={`lock-${module}`}
                                                            className="text-foreground cursor-pointer text-base font-bold"
                                                        >
                                                            {displayName}
                                                        </Label>
                                                        {moduleData.locked ? (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-amber-200 bg-amber-50/50 text-[10px] text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-400"
                                                            >
                                                                <Lock className="mr-1 h-2.5 w-2.5" /> Locked
                                                            </Badge>
                                                        ) : (
                                                            <Badge
                                                                variant="outline"
                                                                className="border-green-200 bg-green-50/50 text-[10px] text-green-700 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-400"
                                                            >
                                                                <Unlock className="mr-1 h-2.5 w-2.5" /> Open
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-muted-foreground max-w-md text-xs leading-relaxed">{cfg.desc}</p>
                                                </div>
                                            </div>

                                            {/* Gate Inputs */}
                                            <div className="flex items-center gap-6 md:w-fit md:justify-end">
                                                {/* Toggle Lock */}
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
                                                </div>

                                                {/* Password Input */}
                                                {moduleData.locked && (
                                                    <div className="relative w-full md:w-56">
                                                        <Input
                                                            id={`pass-${module}`}
                                                            type={showPassword[module] ? 'text' : 'password'}
                                                            value={moduleData.password}
                                                            onChange={(e) => {
                                                                passwordForm.setData(module, {
                                                                    ...moduleData,
                                                                    password: e.target.value,
                                                                });
                                                            }}
                                                            placeholder={lockedModules[module] ? '•••••••• (Keep existing)' : 'Enter password'}
                                                            className="h-9 pr-9 font-mono"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="absolute top-0 right-0 h-full px-2.5 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                                            onClick={() => togglePasswordVisibility(module)}
                                                        >
                                                            {showPassword[module] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </Button>
                                                        <InputError
                                                            className="absolute mt-1 text-[10px]"
                                                            message={(passwordForm.errors as Record<string, string>)[`${module}.password`]}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-end border-t pt-6">
                                <Button type="submit" disabled={passwordForm.processing} className="min-w-[100px] gap-2">
                                    <KeyRound className="h-4 w-4" />
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
