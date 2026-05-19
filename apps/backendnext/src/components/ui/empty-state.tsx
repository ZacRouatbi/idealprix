"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Package, ShoppingCart, Users, BarChart3, Plus } from "lucide-react"

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick?: () => void
    href?: string
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          {icon || <Package className="h-8 w-8 text-muted-foreground" />}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        {description && (
          <p className="mb-4 text-sm text-muted-foreground max-w-sm">{description}</p>
        )}
        {action && (
          <Button onClick={action.onClick} asChild={!!action.href}>
            {action.href ? <a href={action.href}>{action.label}</a> : action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

export function OrdersEmptyState() {
  return (
    <EmptyState
      icon={<ShoppingCart className="h-8 w-8 text-muted-foreground" />}
      title="No orders yet"
      description="Orders will appear here once customers start placing them."
      action={{ label: "View Orders", href: "/orders" }}
    />
  )
}

export function ProductsEmptyState() {
  return (
    <EmptyState
      icon={<Package className="h-8 w-8 text-muted-foreground" />}
      title="No products yet"
      description="Start adding products to your catalog."
      action={{ label: "Add Product", href: "/products/new" }}
    />
  )
}

export function AnalyticsEmptyState() {
  return (
    <EmptyState
      icon={<BarChart3 className="h-8 w-8 text-muted-foreground" />}
      title="No analytics data yet"
      description="Analytics will be available once there's activity in your store."
    />
  )
}

export function UsersEmptyState() {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="No customers yet"
      description="Customer accounts will appear here when users register."
    />
  )
}