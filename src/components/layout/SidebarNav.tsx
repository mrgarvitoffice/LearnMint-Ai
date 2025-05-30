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
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ChevronDown } from 'lucide-react';


interface SidebarNavProps {
  items: NavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  if (!items?.length) {
    return null;
  }

  const renderNavItem = (item: NavItem, isSubItem = false) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    if (item.children?.length) {
      return (
        <AccordionItem value={item.title} key={item.title} className="border-b-0">
          <AccordionTrigger className={cn(
            "flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-none ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-data-[collapsible=icon]:!size-8 group-data-[collapsible=icon]:!p-2 [&>svg:last-child]:group-data-[collapsible=icon]:hidden",
            isActive && "bg-sidebar-accent font-medium text-sidebar-accent-foreground",
            "group-data-[collapsible=icon]:justify-center"
          )}>
            <Icon className="size-4 shrink-0" />
            <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
            {/* ChevronDown is part of AccordionTrigger */}
          </AccordionTrigger>
          <AccordionContent className="pb-0 group-data-[collapsible=icon]:hidden">
            <SidebarMenuSub className="ml-3.5 mt-1">
              {item.children.map((child) => (
                <SidebarMenuSubItem key={child.href}>
                  {renderNavItem(child, true)}
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </AccordionContent>
        </AccordionItem>
      );
    }
    
    const commonProps = {
      isActive,
      tooltip: item.title,
      className: cn(isSubItem && "h-7 text-xs", "group-data-[collapsible=icon]:justify-center"),
      onClick: () => {
        if (useSidebar().isMobile) {
          setOpenMobile(false);
        }
      }
    };

    const buttonContent = (
      <>
        <Icon className="size-4 shrink-0" />
        <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
        {item.label && <span className="ml-auto text-xs group-data-[collapsible=icon]:hidden">{item.label}</span>}
      </>
    );
    
    if (isSubItem) {
       return (
        <SidebarMenuSubButton
          href={item.href}
          asChild={!item.external}
          {...commonProps}
        >
          {item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2">
              {buttonContent}
            </a>
          ) : (
            <Link href={item.href} className="flex w-full items-center gap-2">
              {buttonContent}
            </Link>
          )}
        </SidebarMenuSubButton>
      );
    }

    return (
      <SidebarMenuItem key={item.href}>
        <SidebarMenuButton
          asChild={!item.external}
          {...commonProps}
        >
          {item.external ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer">
              {buttonContent}
            </a>
          ) : (
            <Link href={item.href}>
              {buttonContent}
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  return (
     <Accordion type="multiple" className="w-full group-data-[collapsible=icon]:space-y-1">
      <SidebarMenu>
        {items.map((item) => renderNavItem(item))}
      </SidebarMenu>
    </Accordion>
  );
}
