// app/auth/error/page.tsx

"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Suspense } from "react"

function ErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  const errorMessages: Record<string, string> = {
    Configuration: "Server configuration error",
    AccessDenied: "Access denied",
    Verification: "Verification failed",
    OAuthAccountNotLinked: "This email is already registered with a different sign-in method",
    Default: "An unknown error occurred",
  }

  const message = errorMessages[error || "Default"] || errorMessages.Default

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-red-400">
            Sign In Failed
          </CardTitle>
          <CardDescription className="text-slate-400">
            {message}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/auth/signin">
            <Button className="w-full" variant="default">
              Back to Sign In
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  )
}
