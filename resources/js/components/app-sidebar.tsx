import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { navFooter, navMain } from '@/lib/nav-menu';
import { Link } from '@inertiajs/react';
import AppLogo from './app-logo';
import { usePermissions } from '@/hooks/use-permissions';

export function AppSidebar() {
    const { canAny } = usePermissions();

    const filteredNavMain = navMain.filter((item) => {
        if (item.title === 'Sales') return canAny(['sales.view']);
        if (item.title === 'Purchases') return canAny(['purchases.view']);
        if (item.title === 'Inventory') return canAny(['products.view', 'stocks.view']);
        if (item.title === 'Customers') return canAny(['customers.view']);
        if (item.title === 'Suppliers') return canAny(['suppliers.view']);
        if (item.title === 'Reports') return canAny(['reports.sales', 'reports.stocks', 'reports.financial']);
        
        if (item.title === 'Branches') return canAny(['branches.view']);
        if (item.title === 'Users') return canAny(['users.view']);
        if (item.title === 'Settings') return canAny(['settings.view', 'roles.view', 'roles.manage']);
        
        return true;
    });

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader className="p-3">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <Link href={route('dashboard')} prefetch className="flex items-center">
                            <AppLogo />
                        </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={filteredNavMain} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={navFooter} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
