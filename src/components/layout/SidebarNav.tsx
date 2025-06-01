
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { NavItem } from '@/lib/constants';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar, // To handle mobile sidebar behavior
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
// ChevronDown is part of AccordionTrigger, not needed separately here
import { useSound } from '@/hooks/useSound';


interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const { setOpenMobile, isMobile: isSidebarHookMobile } = useSidebar();
  const { playSound: playClickSound } = useSound('/sounds/ting.mp3', 0.2);

  const handleItemClick = () => {
    playClickSound();
    // Close mobile sidebar on item click
    if (isSidebarHookMobile) {
      setOpenMobile(false);
    }
  };

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu> {/* UL as the main container */}
      {items.map((item) => {
        const Icon = item.icon; // Define Icon here for use in both branches

        // Determine if the current group (Accordion) should be active based on its children
        const isGroupActive = item.children?.some(child => pathname === child.href) ?? false;

        return (
          <SidebarMenuItem key={item.href || item.title} className={cn(item.children?.length && "p-0", "group-data-[collapsible=icon]:p-0")}> {/* LI for each top-level item */}
            {item.children?.length ? (
              // This is a group, render it as an Accordion
              <Accordion type="single" collapsible className="w-full" defaultValue={isGroupActive ? item.title : undefined}>
                <AccordionItem value={item.title} className="border-b-0">
                  <AccordionTrigger 
                    onClick={() => playClickSound()} // playClickSound for accordion toggle
                    className={cn(
                      "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-all hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:p-2 [&>svg:last-child]:group-data-[collapsible=icon]:hidden",
                      isGroupActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
                      "group-data-[collapsible=icon]:justify-center"
                    )}
                  >
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {/* ChevronDown is part of AccordionTrigger styling via [&[data-state=open]>svg]:rotate-180 */}
                  </AccordionTrigger>
                  <AccordionContent className="pb-0 pt-0 group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub className="ml-3.5 mt-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        const childIsActive = pathname === child.href;
                        return (
                          <SidebarMenuSubItem key={child.href}>
                            <SidebarMenuSubButton
                              href={child.href}
                              asChild={!child.external}
                              isActive={childIsActive}
                              onClick={handleItemClick} // This will close mobile sidebar
                              className="h-8 text-xs" // Adjusted for consistent sub-item height
                            >
                              {child.external ? (
                                <a href={child.href} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2">
                                  {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                                  <span className="truncate">{child.title}</span>
                                  {child.label && <span className="ml-auto text-xs">{child.label}</span>}
                                </a>
                              ) : (
                                <Link href={child.href} className="flex w-full items-center gap-2">
                                  {ChildIcon && <ChildIcon className="size-4 shrink-0" />}
                                  <span className="truncate">{child.title}</span>
                                  {child.label && <span className="ml-auto text-xs">{child.label}</span>}
                                </Link>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              // This is a simple link item
              <SidebarMenuButton
                asChild={!item.external}
                isActive={pathname === item.href}
                tooltip={item.title} // Tooltip for desktop icon-only mode
                className="group-data-[collapsible=icon]:justify-center" // For desktop icon-only mode
                onClick={handleItemClick} // This will close mobile sidebar
              >
                {item.external ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2">
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {item.label && <span className="ml-auto text-xs group-data-[collapsible=icon]:hidden">{item.label}</span>}
                  </a>
                ) : (
                  <Link href={item.href} className="flex w-full items-center gap-2">
                    {Icon && <Icon className="size-4 shrink-0" />}
                    <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                    {item.label && <span className="ml-auto text-xs group-data-[collapsible=icon]:hidden">{item.label}</span>}
                  </Link>
                )}
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
