import Link from "next/link"

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Page Not Found</h2>
      <Link href="/" className="text-primary hover:underline">
        Return to Dashboard
      </Link>
    </div>
  )
}