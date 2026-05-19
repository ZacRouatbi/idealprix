"use client"

import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"
  const { user } = useAuth()

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen bg-snow overflow-hidden">
      <div className="hidden md:flex w-64 flex-col">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="m-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>
        </div>
        
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      
      <Toaster />
    </div>
  )
}