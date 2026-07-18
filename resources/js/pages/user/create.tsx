import InputError from '@/components/input-error';
import SimpleSelect from '@/components/inputs/simple-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { AtSign, GitBranch, KeyRound, LockKeyhole, User2, UserPlus } from 'lucide-react';
import { FormEventHandler } from 'react';

type UserForm = {
    name: string;
    email: string;
    password: string;
    main_role: string;
    branch_id: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User',
        href: route('users.index'),
    },
    {
        title: 'Create',
        href: '#',
    },
];

function FieldGroup({ children }: { children: React.ReactNode }) {
    return <div className="space-y-1.5">{children}</div>;
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
    return (
        <Label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {children}
        </Label>
    );
}

export default function UserCreate({ roles, branches }: { roles: string[]; branches: Branch[] }) {
    const { data, setData, post, reset, errors, processing } = useForm<UserForm>({
        name: '',
        email: '',
        password: '',
        main_role: '',
        branch_id: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('users.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create - User" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 lg:p-6">
                {/* Page Header */}
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-950/50">
                        <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Create User</h1>
                        <p className="text-sm text-muted-foreground">Add a new user account</p>
                    </div>
                </div>

                <Card className="border-slate-200 shadow-xs dark:border-slate-800">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                            <User2 className="h-4 w-4 text-indigo-500" />
                            <CardTitle className="text-base font-semibold">User Details</CardTitle>
                        </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-5">
                        <form onSubmit={submit} className="space-y-5">
                            {/* Name */}
                            <FieldGroup>
                                <FieldLabel htmlFor="name">Name *</FieldLabel>
                                <div className="relative">
                                    <User2 className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                        placeholder="Moe Moe"
                                        autoFocus={true}
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.name} />
                            </FieldGroup>

                            {/* Email */}
                            <FieldGroup>
                                <FieldLabel htmlFor="email">Email *</FieldLabel>
                                <div className="relative">
                                    <AtSign className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        required
                                        pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
                                        title="Please enter a valid email address with a dot in the domain (e.g. user@example.com)"
                                        placeholder="moemoe@mail.com"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.email} />
                            </FieldGroup>

                            {/* Password */}
                            <FieldGroup>
                                <FieldLabel htmlFor="password">Password *</FieldLabel>
                                <div className="relative">
                                    <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        required
                                        placeholder="A long and secure password"
                                        className="pl-9"
                                    />
                                </div>
                                <InputError message={errors.password} />
                            </FieldGroup>

                            {/* Role & Branch */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FieldGroup>
                                    <FieldLabel htmlFor="role">Role *</FieldLabel>
                                    <div className="relative">
                                        <KeyRound className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <div className="[&>button]:pl-9">
                                            <SimpleSelect options={roles} item={data.main_role} setItem={(v) => setData('main_role', v)} />
                                        </div>
                                    </div>
                                    <InputError message={errors.main_role} />
                                </FieldGroup>

                                <FieldGroup>
                                    <FieldLabel htmlFor="branch_id">Branch{data.main_role !== 'god' ? ' *' : ''}</FieldLabel>
                                    <div className="relative">
                                        <GitBranch className="pointer-events-none absolute top-1/2 left-3 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                            <SelectTrigger className="pl-9">
                                                <SelectValue placeholder={data.main_role !== 'god' ? 'Select branch' : 'Select branch (optional)'} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {branches.map((branch) => (
                                                    <SelectItem key={branch.id} value={branch.id.toString()}>
                                                        {branch.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <InputError message={errors.branch_id} />
                                </FieldGroup>
                            </div>

                            {/* Actions */}
                            <Separator />
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" asChild>
                                    <Link href={route('users.index')}>Cancel</Link>
                                </Button>
                                <Button variant="secondary" type="button" onClick={() => reset()} disabled={processing}>
                                    Reset
                                </Button>
                                <Button type="submit" disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800">
                                    {processing ? 'Saving...' : 'Create User'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
