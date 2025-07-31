"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FileText,
  Shield,
  Receipt,
  Calculator,
  CreditCard,
  HeadphonesIcon,
  Plus,
  Bell,
  Settings,
  LogOut,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAccount, useDisconnect } from "wagmi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const menuItems = [
  {
    label: "OVERVIEW",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard", badge: null },
      { icon: CreditCard, label: "Transactions", href: "/transactions", badge: null },
    ],
  },
  {
    label: "CONTRACTS",
    items: [
      { icon: FileText, label: "All Contracts", href: "/contracts", badge: "12" },
      { icon: Plus, label: "Create Contract", href: "/contracts/new", badge: null },
    ],
  },
  {
    label: "FINANCE",
    items: [
      { icon: Receipt, label: "Invoices", href: "/invoices", badge: "3" },
      { icon: Calculator, label: "Taxes", href: "/taxes", badge: null },
    ],
  },
  {
    label: "COMPLIANCE",
    items: [
      { icon: Shield, label: "Documents", href: "/compliance", badge: "2" },
    ],
  },
  {
    label: "SUPPORT",
    items: [
      { icon: HeadphonesIcon, label: "Support", href: "/support", badge: null },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Z</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Zapow</h1>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Bell className="h-4 w-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-3 border-b border-gray-100">
        <Link href="/contracts/new">
          <Button className="w-full btn-premium bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            New Contract
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-6 px-4 py-6 custom-scrollbar overflow-y-auto">
        {menuItems.map((section) => (
          <div key={section.label}>
            <h2 className="mb-3 px-2 text-xs font-medium uppercase text-gray-500 tracking-wider">
              {section.label}
            </h2>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (pathname === '/dashboard' && item.href === '/') ||
                  (pathname === '/' && item.href === '/dashboard');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 hover-lift",
                      isActive 
                        ? "bg-blue-50 text-blue-700 border border-blue-200" 
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={cn(
                        "h-5 w-5",
                        isActive ? "text-blue-600" : "text-gray-500"
                      )} />
                      {item.label}
                    </div>
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs h-5 px-2",
                          isActive 
                            ? "bg-blue-100 text-blue-700" 
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-100 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                  {address ? address.slice(0, 2).toUpperCase() : 'ZP'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Wallet User
                </p>
              </div>
              <Settings className="h-4 w-4 text-gray-400" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              disconnect();
              router.push('/login');
            }} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect Wallet
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}