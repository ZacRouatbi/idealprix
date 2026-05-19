"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface MetricsCardProps {
  title: string
  value: string
  trend: string
  trendDirection: "up" | "down"
  isLoading?: boolean
}

export function MetricsCard({ title, value, trend, trendDirection, isLoading }: MetricsCardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold">{value}</h3>
          <div className="flex items-center gap-1">
            {trendDirection === "up" ? (
              <ArrowUpRight className="h-3 w-3 text-green-600" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-red-600" />
            )}
            <p
              className={`text-xs font-medium ${trendDirection === "up" ? "text-green-600" : "text-red-600"}`}
            >
              {trend} from last month
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}