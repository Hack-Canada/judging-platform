"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { IconCoins } from "@tabler/icons-react"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function ScoringSystemPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [minInvestment, setMinInvestment] = React.useState("0")
  const [maxInvestment, setMaxInvestment] = React.useState("1000")

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACCESS_CODE_KEY)
      if (stored === ACCESS_CODE) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        router.push("/")
      }
      // Load settings from admin (read-only)
      const savedMinInvestment = localStorage.getItem("scoring_min_investment")
      if (savedMinInvestment) {
        setMinInvestment(savedMinInvestment)
      }
      const savedMaxInvestment = localStorage.getItem("scoring_max_investment")
      if (savedMaxInvestment) {
        setMaxInvestment(savedMaxInvestment)
      }
    }
  }, [router])

  if (!hasAccess) {
    return null
  }

  return (
    <div suppressHydrationWarning className="relative">
      {/* Animated Grid Background */}
      <div className="animated-grid fixed inset-0 z-0" />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="relative z-10">
          <SiteHeader />
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                <div className="px-4 lg:px-6">
                  <div className="mb-6">
                    <h1 className="text-3xl font-bold tracking-tight">Scoring System</h1>
                    <p className="text-muted-foreground">
                      View the investment-based scoring configuration used by judges.
                    </p>
                  </div>

                  <div className="mb-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <IconCoins className="h-5 w-5" />
                          Investment-Based Scoring
                        </CardTitle>
                        <CardDescription>
                          Judges allocate funds based on project quality. Higher investments indicate better scores.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <Label>Default Investment Range</Label>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex-1">
                                <Label htmlFor="min-investment" className="text-xs text-muted-foreground">
                                  Minimum ($)
                                </Label>
                                <Input 
                                  id="min-investment" 
                                  type="number" 
                                  value={minInvestment}
                                  disabled
                                  className="bg-muted"
                                />
                              </div>
                              <div className="flex-1">
                                <Label htmlFor="max-investment" className="text-xs text-muted-foreground">
                                  Maximum ($)
                                </Label>
                                <Input 
                                  id="max-investment" 
                                  type="number" 
                                  value={maxInvestment}
                                  disabled
                                  className="bg-muted"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                              These settings can be changed in the Admin page.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Scoring criteria inputs have been removed; scoring is fully investment-based now. */}
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
