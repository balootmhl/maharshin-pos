import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem } from '@/components/ui/sidebar';
import { navFooter, navMain } from '@/lib/nav-menu';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<SharedData>().props;
    const isSuperAdmin = auth.user.is_super_admin;

    const filteredNavMain = navMain.filter((item) => {
        if (['Branches', 'Users', 'Settings'].includes(item.title)) {
            return isSuperAdmin;
        }
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
