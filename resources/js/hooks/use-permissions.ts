import { usePage } from '@inertiajs/react';
import { SharedData } from '@/types';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;
    const permissions = auth.user?.can_do || [];
    const isSuperAdmin = auth.user?.is_super_admin || false;

    const can = (permission: string) => {
        if (isSuperAdmin) return true;
        return permissions.includes(permission);
    };

    const canAny = (permissionsList: string[]) => {
        if (isSuperAdmin) return true;
        return permissionsList.some((p) => permissions.includes(p));
    };

    const canAll = (permissionsList: string[]) => {
        if (isSuperAdmin) return true;
        return permissionsList.every((p) => permissions.includes(p));
    };

    return { can, canAny, canAll, permissions };
}
