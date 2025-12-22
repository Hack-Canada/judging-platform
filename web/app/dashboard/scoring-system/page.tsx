"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AccessCodeDialog } from "@/components/access-code-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { IconPlus, IconCoins } from "@tabler/icons-react"
import { toast } from "sonner"

const ACCESS_CODE = "111"
const ACCESS_CODE_KEY = "dashboard_access_code"

const scoringCriteria = [
  {
    id: 1,
    name: "Innovation",
    weight: 30,
    description: "Creativity and originality of the solution",
    minScore: 0,
    maxScore: 100,
  },
  {
    id: 2,
    name: "Technical Excellence",
    weight: 25,
    description: "Quality of technical implementation",
    minScore: 0,
    maxScore: 100,
  },
  {
    id: 3,
    name: "Impact",
    weight: 25,
    description: "Potential social and economic impact",
    minScore: 0,
    maxScore: 100,
  },
  {
    id: 4,
    name: "Feasibility",
    weight: 20,
    description: "Practicality and implementation feasibility",
    minScore: 0,
    maxScore: 100,
  },
]

export default function ScoringSystemPage() {
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
  }, [])

  if (!hasAccess) {
    return <AccessCodeDialog />
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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Scoring System</h1>
                      <p className="text-muted-foreground">
                        Configure scoring criteria and investment allocation rules
                      </p>
                    </div>
                    <Button
                      onClick={() => toast.info("Add criteria feature coming soon")}
                    >
                      <IconPlus className="mr-2 h-4 w-4" />
                      Add Criteria
                    </Button>
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

                  <div className="space-y-4">
                    <h2 className="text-2xl font-semibold tracking-tight">Scoring Criteria</h2>
                    <div className="grid gap-4">
                      {scoringCriteria.map((criterion, index) => (
                        <Card key={criterion.id}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="text-lg">{criterion.name}</CardTitle>
                                <CardDescription className="mt-1">
                                  {criterion.description}
                                </CardDescription>
                              </div>
                              <Badge variant="outline" className="ml-4">
                                Weight: {criterion.weight}%
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor={`min-${criterion.id}`}>Min Score</Label>
                                  <Input
                                    id={`min-${criterion.id}`}
                                    type="number"
                                    defaultValue={criterion.minScore}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`max-${criterion.id}`}>Max Score</Label>
                                  <Input
                                    id={`max-${criterion.id}`}
                                    type="number"
                                    defaultValue={criterion.maxScore}
                                  />
                                </div>
                              </div>
                              {index < scoringCriteria.length - 1 && (
                                <Separator className="mt-4" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
