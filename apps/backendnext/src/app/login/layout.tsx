import "@/styles/globals.css"
import { ThemeProvider } from "next-themes"
import { AuthProvider } from "@/lib/context/auth-context"

export const metadata = {
  title: "Ideal Prix - Login",
  description: "Login to Ideal Prix Admin Dashboard",
}

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}