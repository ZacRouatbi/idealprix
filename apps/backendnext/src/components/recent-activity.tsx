"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Clock, ShoppingCart, Package, Users, AlertCircle } from "lucide-react"
import { EmptyState } from "@/components/ui/empty-state"

interface Activity {
  id: string
  type: "order" | "product" | "user" | "inventory" | "system"
  message: string
  timestamp: string
  status?: "success" | "warning" | "error"
}

interface RecentActivityProps {
  activities?: Activity[]
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "order":
      return <ShoppingCart className="h-4 w-4" />
    case "product":
      return <Package className="h-4 w-4" />
    case "user":
      return <Users className="h-4 w-4" />
    case "inventory":
      return <AlertCircle className="h-4 w-4" />
    default:
      return <Clock className="h-4 w-4" />
  }
}

const getStatusVariant = (status?: Activity["status"]) => {
  switch (status) {
    case "success":
      return "default"
    case "warning":
      return "secondary"
    case "error":
      return "destructive"
    default:
      return "outline"
  }
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const data = activities && activities.length > 0 ? activities : []

  if (data.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="h-8 w-8 text-muted-foreground" />}
        title="No recent activity"
        description="Activities will appear here as you use the system."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Last {data.length} activities</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((activity) => (
              <TableRow key={activity.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="text-muted-foreground">
                      {getActivityIcon(activity.type)}
                    </div>
                    <span className="text-sm">{activity.message}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {activity.status && (
                    <Badge variant={getStatusVariant(activity.status)} className="capitalize">
                      {activity.status}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}