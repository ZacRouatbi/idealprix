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
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-xl sm:text-2xl font-bold">{value}</h3>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center gap-2">
            {trendDirection === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <p className={`text-sm font-medium ${trendDirection === "up" ? "text-green-600" : "text-red-600"}`}>
              {trend}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}