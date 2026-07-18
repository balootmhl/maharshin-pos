import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LayoutGrid, Lock } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Module Access',
        href: '#',
    },
    {
        title: 'Unlock',
        href: '#',
    },
];

export default function Unlock({ module }: { module: string }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const [showPassword, setShowPassword] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('modules.unlock.submit', { module }), {
            onFinish: () => reset('password'),
        });
    };

    // Capitalize module name for display
    const moduleDisplayName = module.charAt(0).toUpperCase() + module.slice(1);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Unlock ${moduleDisplayName} Module`} />

            <div className="flex min-h-[70vh] flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md border-red-100 shadow-lg dark:border-red-950/20">
                    <CardHeader className="pb-2 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                            <Lock className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-foreground text-xl font-bold tracking-tight">{moduleDisplayName} Module Locked</CardTitle>
                        <CardDescription className="text-muted-foreground mt-2 px-2 text-xs">
                            This module is protected by a password lock. Please enter the password set for your branch to unlock access.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="pt-4">
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Module Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="pr-10"
                                        placeholder="Enter password"
                                        required
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 focus:outline-none"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Button type="submit" className="w-full" disabled={processing}>
                                    Unlock Module
                                </Button>
                                <Button variant="outline" asChild className="w-full">
                                    <Link href={route('dashboard')}>
                                        <LayoutGrid className="mr-2 h-4 w-4" />
                                        Return to Dashboard
                                    </Link>
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
