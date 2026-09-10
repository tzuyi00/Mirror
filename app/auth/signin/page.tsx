// app/auth/signin/page.tsx

"use client"

import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FaGoogle, FaGithub } from "react-icons/fa"
import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useState } from "react"

function SignInContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const error = searchParams.get("error")
  
  // Credentials form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [credentialsError, setCredentialsError] = useState("")

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl })
  }

  const handleGitHubSignIn = () => {
    signIn("github", { callbackUrl })
  }

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setCredentialsError("")

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setCredentialsError(result.error)
      } else if (result?.ok) {
        router.push(callbackUrl)
      }
    } catch (err) {
      setCredentialsError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-white">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-slate-400">
            Sign in to your account to continue using Me 2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* OAuth Error */}
          {error && (
            <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
              <p className="text-sm text-red-400">
                {error === "OAuthAccountNotLinked"
                  ? "This email is already registered with a different sign-in method"
                  : "Sign in failed. Please try again."}
              </p>
            </div>
          )}

          {/* Credentials Form */}
          <form onSubmit={handleCredentialsSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
            </div>

            {credentialsError && (
              <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
                <p className="text-sm text-red-400">{credentialsError}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Signing in..." : "Sign in with Email"}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800/50 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full h-10 border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-white"
              size="sm"
            >
              <FaGoogle className="mr-2 h-4 w-4" />
              Google
            </Button>

            <Button
              onClick={handleGitHubSignIn}
              variant="outline"
              className="w-full h-10 border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-white"
              size="sm"
            >
              <FaGithub className="mr-2 h-4 w-4" />
              GitHub
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center text-sm text-slate-400 pt-4">
            Don't have an account?{" "}
            <a href="/auth/signup" className="text-blue-400 hover:underline">
              Sign up here
            </a>
          </div>

          <div className="text-center text-xs text-slate-500 pt-4 border-t border-slate-700">
            By signing in, you agree to our
            <a href="#" className="text-blue-400 hover:underline ml-1">
              Terms of Service
            </a>
            {" "}and{" "}
            <a href="#" className="text-blue-400 hover:underline">
              Privacy Policy
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-white">Loading...</div>}>
      <SignInContent />
    </Suspense>
  )
}
