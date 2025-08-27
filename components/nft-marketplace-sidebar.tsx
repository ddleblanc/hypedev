"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Layers, 
  TrendingUp, 
  User, 
  Search, 
  ShoppingBag,
  Heart,
  Activity,
  Settings,
  Crown,
  Zap,
  BarChart3,
  Wallet,
  Tag
} from "lucide-react";

import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

// NFT Marketplace navigation data
const data = {
  navMain: [
    {
      title: "Home",
      url: "/",
      icon: Home,
      isActive: true,
    },
    {
      title: "Explore",
      url: "/explore",
      icon: Search,
      isActive: false,
    },
    {
      title: "Collections",
      url: "/collections",
      icon: Layers,
      isActive: false,
    },
    {
      title: "Trending",
      url: "/trending",
      icon: TrendingUp,
      isActive: false,
      badge: "Hot"
    },
    {
      title: "Portfolio", 
      url: "/portfolio",
      icon: Wallet,
      isActive: false,
    },
    {
      title: "Activity",
      url: "/activity", 
      icon: Activity,
      isActive: false,
    },
    {
      title: "Favorites",
      url: "/favorites",
      icon: Heart,
      isActive: false,
    },
    {
      title: "Offers",
      url: "/offers",
      icon: Tag,
      isActive: false,
      badge: "3"
    }
  ],
  quickActions: [
    {
      title: "Analytics",
      url: "/analytics",
      icon: BarChart3,
      isActive: false,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
      isActive: false,
    }
  ]
};

export function NFTMarketplaceSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="transition-all duration-300 ease-in-out"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="md:h-8 md:p-0">
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Crown className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">HypeX</span>
                  <span className="truncate text-xs">Gaming NFT Marketplace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {data.navMain.map((item) => {
                const isActive = pathname === item.url || 
                  (item.url === "/collections" && pathname.startsWith("/collection/"));
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      asChild
                      isActive={isActive}
                      className="px-2.5 md:px-2"
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={item.badge === "Hot" ? "destructive" : "secondary"} 
                            className="ml-auto h-5 px-1.5 text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Quick Actions */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent className="px-1.5 md:px-0">
            <SidebarMenu>
              {data.quickActions.map((item) => {
                const isActive = pathname === item.url;
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={{
                        children: item.title,
                        hidden: false,
                      }}
                      asChild
                      isActive={isActive}
                      className="px-2.5 md:px-2"
                    >
                      <Link href={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}