"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/context/auth-context"
import { User, Mail, Calendar, Shield } from "lucide-react"

export function AccountModal() {
  const { user } = useAuth()
  const [open, setOpen] = React.useState(false)

  if (!user) return null

  const triggerButton = (
    <button className="group flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-all duration-200">
      <User className="h-5 w-5 shrink-0 text-sidebar-foreground group-hover:text-sidebar-accent-foreground" aria-hidden="true" />
      Account
    </button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your profile and account preferences
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-lg font-semibold">{user.first_name} {user.last_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm capitalize">Role: {user.role}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}