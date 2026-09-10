// app/auth/signup/page.tsx

"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { signUp } from "@/lib/api"

export default function SignUpPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Validate password strength
  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (pwd.length < 8) {
      errors.push("Password must be at least 8 characters")
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("Password must contain at least one uppercase letter")
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("Password must contain at least one lowercase letter")
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("Password must contain at least one number")
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) {
      newErrors.name = "Name is required"
    }

    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Invalid email format"
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.errors[0]
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setValidationErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      // Call signup API through lib/api.ts
      const user = await signUp(
        email.toLowerCase().trim(),
        password,
        name.trim()
      );

      console.log('Signup successful:', user);

      // Sign in automatically after signup
      const signInResult = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      })

      if (signInResult?.error) {
        setError(signInResult.error)
      } else if (signInResult?.ok) {
        router.push("/")
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.")
      console.error("Signup error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-white">
            Create Account
          </CardTitle>
          <CardDescription className="text-slate-400">
            Sign up to start using Me 2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignUp} className="space-y-4">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">
                Full Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
              {validationErrors.name && (
                <p className="text-sm text-red-400">{validationErrors.name}</p>
              )}
            </div>

            {/* Email Field */}
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
              {validationErrors.email && (
                <p className="text-sm text-red-400">{validationErrors.email}</p>
              )}
            </div>

            {/* Password Field */}
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
              {validationErrors.password && (
                <p className="text-sm text-red-400">{validationErrors.password}</p>
              )}
              {/* Password Requirements */}
              {password && (
                <div className="text-xs text-slate-400 space-y-1 pt-2">
                  <p className={validatePassword(password).valid ? "text-green-400" : ""}>
                    ✓ At least 8 characters
                  </p>
                  <p className={/[A-Z]/.test(password) ? "text-green-400" : ""}>
                    ✓ One uppercase letter
                  </p>
                  <p className={/[a-z]/.test(password) ? "text-green-400" : ""}>
                    ✓ One lowercase letter
                  </p>
                  <p className={/[0-9]/.test(password) ? "text-green-400" : ""}>
                    ✓ One number
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                required
              />
              {validationErrors.confirmPassword && (
                <p className="text-sm text-red-400">{validationErrors.confirmPassword}</p>
              )}
            </div>

            {/* General Error */}
            {error && (
              <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? "Creating account..." : "Sign up"}
            </Button>
          </form>

          {/* Sign In Link */}
          <div className="text-center text-sm text-slate-400 pt-4 border-t border-slate-700">
            Already have an account?{" "}
            <a href="/auth/signin" className="text-blue-400 hover:underline">
              Sign in here
            </a>
          </div>

          <div className="text-center text-xs text-slate-500">
            By signing up, you agree to our
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
