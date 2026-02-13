import { ChevronRight } from 'lucide-react';

import { Icon } from '@/components/icon';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { NavGroup, NavItem } from '@/types';
import { Link } from '@inertiajs/react';

export function NavMain({ items }: { items: NavGroup[] }) {
    const { state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    function checkActiveUrl(url: string) {
        return url === location.href;
    }
    function checkCollapseOpen(arr: NavItem[]) {
        const result = arr.find((i) => checkActiveUrl(i.url));
        return result !== undefined;
    }

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) =>
                    item.subItems && item.subItems.length >= 1 ? (
                        isCollapsed ? (
                            // When sidebar is collapsed, use dropdown menu for sub-items
                            <DropdownMenu key={item.title}>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton tooltip={item.title} size="lg">
                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto h-4 w-4" />
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </DropdownMenuTrigger>
                                    <DropdownMenuContent side="right" align="start" sideOffset={12} className="min-w-56 rounded-lg p-2 shadow-lg">
                                        <div className="text-muted-foreground mb-2 border-b px-3 pb-2 text-base font-bold">{item.title}</div>
                                        {item.subItems?.map((subItem) => (
                                            <DropdownMenuItem
                                                key={subItem.title}
                                                asChild
                                                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium"
                                            >
                                                <Link href={subItem.url} className={checkActiveUrl(subItem.url) ? 'bg-accent' : ''}>
                                                    {subItem.title}
                                                </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            // When sidebar is expanded, use collapsible
                            <Collapsible key={item.title} defaultOpen={checkCollapseOpen(item.subItems)} className="group/collapsible" asChild>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton tooltip={item.title} size="lg">
                                            {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.subItems?.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild isActive={checkActiveUrl(subItem.url)} size="md">
                                                        <Link href={subItem.url}>
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        )
                    ) : (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={checkActiveUrl(item.url)} size="lg" tooltip={item.title}>
                                <Link href={item.url}>
                                    {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                                    <span>{item.title}</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ),
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
}
