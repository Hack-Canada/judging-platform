"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ACCESS_CODE = "111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export function AccessCodeDialog() {
  const [accessCode, setAccessCode] = React.useState("")
  const [error, setError] = React.useState("")
  const [open, setOpen] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    // Check if access code is already stored
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACCESS_CODE_KEY)
      if (stored === ACCESS_CODE) {
        setOpen(false)
      }
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (accessCode === ACCESS_CODE) {
      if (typeof window !== "undefined") {
        localStorage.setItem(ACCESS_CODE_KEY, ACCESS_CODE)
        setOpen(false)
        toast.success("Access granted!", {
          description: "Welcome to the dashboard",
        })
        // Reload to update the dashboard
        window.location.reload()
      }
    } else {
      setError("Incorrect access code. Please try again.")
      setAccessCode("")
      toast.error("Access denied", {
        description: "The access code you entered is incorrect. Please try again.",
      })
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // If user tries to close without correct code, redirect to home
      router.push("/")
      return
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Access Code Required</DialogTitle>
          <DialogDescription>
            Please enter the access code to continue to the dashboard.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="access-code">Access Code</Label>
              <Input
                id="access-code"
                type="password"
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value)
                  setError("")
                }}
                placeholder="Enter access code"
                autoFocus
                className={error ? "border-destructive" : ""}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => router.push("/")}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

