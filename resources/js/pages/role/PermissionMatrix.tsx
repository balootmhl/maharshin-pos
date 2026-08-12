import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { BreadcrumbItem, Role } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { Loader2, ShieldCheck } from 'lucide-react';
import React, { useEffect } from 'react';

type Permission = {
    id: number;
    name: string;
    guard_name: string;
};

type GroupedPermissions = {
    [key: string]: Permission[];
};

type Props = {
    role: Role & { permissions: Permission[] };
    groupedPermissions: GroupedPermissions;
};

export default function PermissionMatrix({ role, groupedPermissions }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Roles',
            href: route('roles.index'),
        },
        {
            title: role.name,
            href: route('roles.show', { role: role.id }),
        },
        {
            title: 'Permissions',
            href: '#',
        },
    ];

    const { data, setData, put, processing, isDirty } = useForm({
        permissions: role.permissions.map((p) => p.name),
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('roles.permissions.update', { role: role.id }));
    };

    const handlePermissionToggle = (permissionName: string, checked: boolean) => {
        if (checked) {
            setData('permissions', [...data.permissions, permissionName]);
        } else {
            setData('permissions', data.permissions.filter((p) => p !== permissionName));
        }
    };

    const handleModuleToggle = (moduleName: string, checked: boolean) => {
        const modulePermissions = groupedPermissions[moduleName].map((p) => p.name);
        
        if (checked) {
            // Add all module permissions that aren't already in data.permissions
            const newPermissions = [...data.permissions];
            modulePermissions.forEach(p => {
                if (!newPermissions.includes(p)) {
                    newPermissions.push(p);
                }
            });
            setData('permissions', newPermissions);
        } else {
            // Remove all module permissions
            setData('permissions', data.permissions.filter(p => !modulePermissions.includes(p)));
        }
    };

    // Calculate if all permissions in a module are selected
    const isModuleFullySelected = (moduleName: string) => {
        const modulePermissions = groupedPermissions[moduleName].map((p) => p.name);
        return modulePermissions.every(p => data.permissions.includes(p));
    };

    // Calculate if some (but not all) permissions in a module are selected
    const isModulePartiallySelected = (moduleName: string) => {
        const modulePermissions = groupedPermissions[moduleName].map((p) => p.name);
        const selectedCount = modulePermissions.filter(p => data.permissions.includes(p)).length;
        return selectedCount > 0 && selectedCount < modulePermissions.length;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Manage Permissions - ${role.name}`} />

            <div className="flex flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <ShieldCheck className="h-8 w-8 text-blue-600 dark:text-blue-500" />
                            Role Permissions: <span className="text-blue-600 dark:text-blue-500">{role.name}</span>
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Configure access control and module permissions for this role.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Button variant="outline" onClick={() => window.history.back()}>Cancel</Button>
                        <Button 
                            onClick={submit} 
                            disabled={processing || !isDirty}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </div>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 py-4">
                        <CardTitle className="text-base font-semibold text-slate-800 dark:text-slate-200">
                            Modules & Permissions Matrix
                        </CardTitle>
                        <CardDescription>
                            Select the individual actions or check the module name to toggle all.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {Object.entries(groupedPermissions).map(([moduleName, permissions]) => (
                                <div key={moduleName} className="flex flex-col md:flex-row md:items-center p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors gap-4">
                                    <div className="w-full md:w-48 shrink-0">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox 
                                                id={`module-${moduleName}`}
                                                checked={isModuleFullySelected(moduleName) ? true : (isModulePartiallySelected(moduleName) ? 'indeterminate' : false)}
                                                onCheckedChange={(checked) => handleModuleToggle(moduleName, checked as boolean)}
                                            />
                                            <label htmlFor={`module-${moduleName}`} className="capitalize font-medium text-slate-800 dark:text-slate-200 cursor-pointer">
                                                {moduleName}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-x-8 gap-y-3">
                                        {permissions.map((permission) => {
                                            const actionName = permission.name.split('.')[1] || permission.name;
                                            return (
                                                <div key={permission.id} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`perm-${permission.id}`} 
                                                        checked={data.permissions.includes(permission.name)}
                                                        onCheckedChange={(checked) => handlePermissionToggle(permission.name, checked as boolean)}
                                                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 h-4 w-4"
                                                    />
                                                    <label
                                                        htmlFor={`perm-${permission.id}`}
                                                        className="text-sm cursor-pointer capitalize text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                                                    >
                                                        {actionName}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
