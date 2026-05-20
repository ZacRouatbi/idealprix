import "@/styles/globals.css"
import { ThemeProvider } from "next-themes"

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
      {children}
    </ThemeProvider>
  )
}
