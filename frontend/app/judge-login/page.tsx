"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { getCurrentUserWithRole, signInJudgeWithPin, signOut } from "@/lib/auth-helpers"
import { getDefaultRouteForRole } from "@/lib/rbac"

export default function JudgeLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [pin, setPin] = React.useState("")
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
      const { error } = await signInJudgeWithPin(email.trim(), pin)
      if (error) throw error

      const { role } = await getCurrentUserWithRole()
      if (role !== "judge" && role !== "sponsor") {
        await signOut()
        toast.error("Unauthorized role", {
          description: "This login is for judges and sponsors only.",
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
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Judge/Sponsor Login</CardTitle>
          <CardDescription>Sign in with your email and admin-issued PIN code.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pin">PIN Code</Label>
              <Input id="pin" type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} required />
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
