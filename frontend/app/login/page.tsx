"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getCurrentUserWithRole, signInAdmin, signOut } from "@/lib/auth-helpers"
import { getDefaultRouteForRole } from "@/lib/rbac"

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    const check = async () => {
      const { role } = await getCurrentUserWithRole()
      if (!role) return
      router.replace(getDefaultRouteForRole(role))
    }
    void check()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await signInAdmin(email.trim(), password)
      if (error) throw error

      const { role } = await getCurrentUserWithRole()
      if (role !== "admin" && role !== "superadmin") {
        await signOut()
        toast.error("Unauthorized role", {
          description: "This login is for admin and superadmin users only.",
        })
        return
      }

      router.replace(getDefaultRouteForRole(role))
    } catch (error) {
      toast.error("Sign in failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Admin Login</CardTitle>
          <CardDescription>Sign in as admin or superadmin.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

