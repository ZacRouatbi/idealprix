"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Package,
  Warehouse,
  Tags,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  User,
  Ticket,
} from "lucide-react"
import { AccountModal } from "@/components/account-modal"
import { useAuth } from "@/lib/context/auth-context"

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Clients",
    href: "/clients",
    icon: Users,
  },
  {
    name: "Orders",
    href: "/orders",
    icon: ShoppingCart,
  },
  {
    name: "Products",
    href: "/products",
    icon: Package,
  },
  {
    name: "Inventory",
    href: "/inventory",
    icon: Warehouse,
  },
  {
    name: "Categories",
    href: "/categories",
    icon: Tags,
  },
  {
    name: "Promotions",
    href: "/promotions",
    icon: Ticket,
  },
  {
    name: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: FileText,
  },
]

const bottomNavigation = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
  },
  {
    name: "Account",
    href: "/account",
    icon: User,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { user: sidebarUser, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex h-full w-64 flex-col ideaprix-sidebar">
      <div className="flex h-full flex-col gap-y-5 overflow-y-auto bg-sidebar px-6 pb-4">
        <div className="flex h-16 shrink-0 items-center justify-center">
          <Link href="/" className="block">
            <img
              src="/Idealprixlogo.png"
              alt="Ideal Prix"
              className="h-8 w-auto"
            />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                          "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all duration-200"
                        )}
                      >
                        <item.icon
                          className={cn(
                            isActive
                              ? "text-sidebar-primary-foreground"
                              : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground",
                            "h-5 w-5 shrink-0"
                          )}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </li>
            <li className="mt-auto">
              <ul role="list" className="-mx-2 space-y-1">
                {bottomNavigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <li key={item.name}>
                      {item.name === "Account" ? (
                        <AccountModal />
                      ) : (
                        <Link
                          href={item.href}
                          className={cn(
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                            "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 transition-all duration-200"
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? "text-sidebar-primary-foreground"
                                : "text-sidebar-foreground group-hover:text-sidebar-accent-foreground",
                              "h-5 w-5 shrink-0"
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      )}
                    </li>
                  )
                })}
                {sidebarUser && (
                  <li>
                    <button
                      onClick={handleLogout}
                      className="group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200"
                    >
                      <LogOut
                        className="h-5 w-5 shrink-0 text-sidebar-foreground group-hover:text-sidebar-accent-foreground"
                        aria-hidden="true"
                      />
                      Log out
                    </button>
                  </li>
                )}
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}