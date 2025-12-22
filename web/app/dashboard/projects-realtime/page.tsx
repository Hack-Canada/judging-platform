"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { supabase } from "@/lib/supabase-client"
import { IconChevronLeft, IconChevronRight, IconRefresh } from "@tabler/icons-react"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

type RealtimeProject = {
  id: string
  name: string
  status: string
  track: string
  created_at: string
}

export default function ProjectsRealtimePage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [projects, setProjects] = React.useState<RealtimeProject[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACCESS_CODE_KEY)
      if (stored === ACCESS_CODE) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        router.push("/")
      }
    }
  }, [router])

  React.useEffect(() => {
    if (!hasAccess) return

    const loadProjects = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, status, track, created_at")
          .order("created_at", { ascending: true })

        if (error) {
          setError(error.message)
          return
        }

        setProjects((data ?? []) as RealtimeProject[])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load projects")
      } finally {
        setIsLoading(false)
      }
    }

    void loadProjects()

    const channel = supabase
      .channel("projects-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        (payload) => {
          setProjects((current) => {
            switch (payload.eventType) {
              case "INSERT":
                return [...current, payload.new as RealtimeProject]
              case "UPDATE":
                return current.map((p) =>
                  p.id === (payload.new as RealtimeProject).id ? (payload.new as RealtimeProject) : p
                )
              case "DELETE":
                return current.filter((p) => p.id !== (payload.old as RealtimeProject).id)
              default:
                return current
            }
          })
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [hasAccess])

  if (!hasAccess) {
    return null
  }

  return (
    <div suppressHydrationWarning className="relative">
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
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold tracking-tight">Realtime Projects (Supabase)</h1>
                      <p className="text-sm text-muted-foreground">
                        This view reads projects from Supabase and updates live when rows are inserted, updated, or deleted.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push("/dashboard/projects")}
                      >
                        <IconChevronLeft className="mr-1 h-4 w-4" />
                        Back to Projects
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        <IconRefresh className="mr-1 h-4 w-4" />
                        Refresh
                      </Button>
                    </div>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Supabase Projects</CardTitle>
                      <CardDescription>
                        Table: <code>public.projects</code>. Configure this in your Supabase project to see data here.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {error && (
                        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                          {error}
                        </div>
                      )}
                      {isLoading ? (
                        <p className="text-sm text-muted-foreground">Loading projects from Supabase…</p>
                      ) : projects.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          No projects found. Insert rows into <code>public.projects</code> to see them here.
                        </p>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {projects.map((project) => (
                            <div
                              key={project.id}
                              className="flex flex-col gap-2 rounded-lg border bg-card/60 p-3 text-sm shadow-sm"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="line-clamp-2 font-semibold">{project.name}</p>
                                <Badge variant="outline" className="text-[10px]">
                                  {project.status}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="font-medium">Track:</span>
                                <Badge variant="secondary" className="text-[10px]">
                                  {project.track || "General"}
                                </Badge>
                              </div>
                              <p className="text-[11px] text-muted-foreground">
                                Created:{" "}
                                {new Date(project.created_at).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}

