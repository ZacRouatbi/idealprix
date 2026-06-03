"use client"

import { usePathname, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { useAuth } from "@/lib/context/auth-context"
import { Button } from "@/components/ui/button"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useEffect } from "react"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isLoginPage = pathname === "/login"
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage) {
      router.push("/login")
    }
  }, [isLoading, user, isLoginPage, router])

  if (isLoginPage) {
    return <>{children}</>
  }

  if (isLoading || !user) {
    return null
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