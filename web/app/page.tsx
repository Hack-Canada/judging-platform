"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function Home() {
  const [otp, setOtp] = React.useState("")
  const [error, setError] = React.useState("")
  const router = useRouter()

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "") // Remove non-digits
    
    // Format as XXX-XXX
    if (value.length > 3) {
      value = value.slice(0, 3) + "-" + value.slice(3, 6)
    }
    
    setOtp(value)
    setError("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (otp === ACCESS_CODE) {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_CODE_KEY, ACCESS_CODE)
        toast.success("Access granted!", {
          description: "Redirecting to dashboard...",
        })
        router.push("/dashboard")
      }
    } else {
      setError("Incorrect access code. Please try again.")
      setOtp("")
      toast.error("Access denied", {
        description: "The access code you entered is incorrect. Please try again.",
      })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">HackCanada</CardTitle>
          <CardDescription>
            Enter your access code to continue to the judging platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Access Code</Label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={handleOtpChange}
                placeholder="000-000"
                maxLength={7}
                className={`text-center text-lg tracking-widest font-mono ${error ? "border-destructive" : ""}`}
                autoFocus
                autoComplete="off"
              />
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Access Dashboard
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
