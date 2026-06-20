import InputError from '@/components/input-error';
import SimpleSelect from '@/components/inputs/simple-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, Branch } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <form onSubmit={submit} className="max-w-3xl mx-auto w-full">
                    <div className="space-y-6">
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="name">Name*</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                required
                                placeholder="Moe Moe"
                                autoFocus={true}
                            />
                            <InputError className="mt-2" message={errors.name} />
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="name">Email*</Label>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                required
                                placeholder="moemoe@mail.com"
                            />
                            <InputError className="mt-2" message={errors.email} />
                        </div>
                        <div className="grid grid-flow-row gap-2">
                            <Label htmlFor="password">Password*</Label>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                required
                                placeholder="A long and secure password"
                            />
                            <InputError className="mt-2" message={errors.password} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="Role">Role*</Label>
                                <SimpleSelect options={roles} item={data.main_role} setItem={(v) => setData('main_role', v)} />
                                <InputError className="mt-2" message={errors.main_role} />
                            </div>
                            <div className="grid grid-flow-row gap-2">
                                <Label htmlFor="branch_id">Branch{data.main_role !== 'god' ? '*' : ''}</Label>
                                <Select value={data.branch_id} onValueChange={(v) => setData('branch_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={data.main_role !== 'god' ? "Select branch" : "Select branch (optional)"} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches.map((branch) => (
                                            <SelectItem key={branch.id} value={branch.id.toString()}>
                                                {branch.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <InputError className="mt-2" message={errors.branch_id} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" asChild>
                                <Link href={route('users.index')}>Cancel</Link>
                            </Button>
                            <Button variant="secondary" type="button" onClick={() => reset()} disabled={processing}>
                                Reset
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

