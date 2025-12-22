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
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react"
import { toast } from "sonner"
import { defaultTracks } from "@/lib/tracks-data"
import { supabase } from "@/lib/supabase-client"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

type DbProjectStatus = "Active" | "Completed" | "Draft"

type DbProject = {
  id: string
  name: string
  status: DbProjectStatus
  entries: number
  judges: number
  track: string
}

export default function ProjectsPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [projects, setProjects] = React.useState<DbProject[]>([])
  const [loading, setLoading] = React.useState(true)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<DbProject | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [projectToDelete, setProjectToDelete] = React.useState<DbProject | null>(null)
  
  const [formData, setFormData] = React.useState({
    name: "",
    status: "Active" as DbProjectStatus,
    track: "General",
  })

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ACCESS_CODE_KEY)
      if (stored === ACCESS_CODE) {
        setHasAccess(true)
      } else {
        setHasAccess(false)
        router.push("/")
        return
      }
    }

    const loadProjects = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("projects")
          .select("id, name, status, track")
          .order("name", { ascending: true })

        if (error) {
          toast.error("Failed to load projects from Supabase", {
            description: error.message,
          })
          return
        }

        const mapped: DbProject[] =
          data?.map((row: any) => ({
            id: String(row.id),
            name: row.name ?? "",
            status: (row.status ?? "Active") as DbProjectStatus,
            track: row.track ?? "General",
            entries: 0,
            judges: 0,
          })) ?? []

        setProjects(mapped)
      } catch (error) {
        toast.error("Failed to load projects from Supabase", {
          description: error instanceof Error ? error.message : "Unknown error",
        })
      } finally {
        setLoading(false)
      }
    }

    void loadProjects()
  }, [router])

  const handleOpenDialog = (project?: DbProject) => {
    if (project) {
      setEditingProject(project)
      setFormData({ name: project.name, status: project.status, track: project.track || "General" })
    } else {
      setEditingProject(null)
      setFormData({ name: "", status: "Active", track: "General" })
    }
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingProject(null)
    setFormData({ name: "", status: "Active", track: "General" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Validation error", {
        description: "Project name is required",
      })
      return
    }

    try {
      if (editingProject) {
        const { error } = await supabase
          .from("projects")
          .update({
            name: formData.name,
            status: formData.status,
            track: formData.track,
          })
          .eq("id", editingProject.id)

        if (error) {
          toast.error("Failed to update project", { description: error.message })
          return
        }

        setProjects((prev) =>
          prev.map((p) =>
            p.id === editingProject.id
              ? { ...p, name: formData.name, status: formData.status, track: formData.track }
              : p
          )
        )

        toast.success("Project updated!", {
          description: `${formData.name} has been updated`,
        })
      } else {
        const { data, error } = await supabase
          .from("projects")
          .insert({
            name: formData.name,
            status: formData.status,
            track: formData.track,
          })
          .select("id, name, status, track")
          .single()

        if (error) {
          toast.error("Failed to create project", { description: error.message })
          return
        }

        const newProject: DbProject = {
          id: String(data.id),
          name: data.name ?? "",
          status: (data.status ?? "Active") as DbProjectStatus,
          track: data.track ?? "General",
          entries: 0,
          judges: 0,
        }

        setProjects((prev) => [...prev, newProject])

        toast.success("Project created!", {
          description: `${formData.name} has been added`,
        })
      }
      handleCloseDialog()
    } catch (error) {
      toast.error("Unexpected error while saving project", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    }
  }

  const handleDeleteClick = (project: DbProject) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectToDelete.id)

      if (error) {
        toast.error("Failed to delete project", { description: error.message })
        return
      }

      setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id))
      toast.success("Project deleted!", {
        description: `${projectToDelete.name} has been removed`,
      })
    } catch (error) {
      toast.error("Unexpected error while deleting project", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h1 className="text-3xl font-bold tracking-tight">Projects</h1>
                      <p className="text-muted-foreground">
                        Manage and view all competition projects
                      </p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                      <IconPlus className="mr-2 h-4 w-4" />
                      New Project
                    </Button>
                  </div>

                  <div className="flex gap-4 mb-6">
                    <div className="relative flex-1 max-w-sm">
                      <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search projects..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {loading ? (
                      <p className="px-1 text-sm text-muted-foreground">
                        Loading projects from Supabase…
                      </p>
                    ) : filteredProjects.length === 0 ? (
                      <p className="px-1 text-sm text-muted-foreground">
                        {searchQuery
                          ? "No projects found matching your search."
                          : "No projects yet. Create your first project or insert rows into public.projects."}
                      </p>
                    ) : (
                      filteredProjects.map((project) => (
                        <Card key={project.id} className="transition-shadow hover:shadow-lg">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <CardTitle className="text-xl">{project.name}</CardTitle>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    project.status === "Active"
                                      ? "default"
                                      : project.status === "Completed"
                                      ? "secondary"
                                      : "outline"
                                  }
                                >
                                  {project.status}
                                </Badge>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <IconDotsVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleOpenDialog(project)}>
                                      <IconEdit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => handleDeleteClick(project)}
                                      className="text-destructive"
                                    >
                                      <IconTrash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                            <CardDescription>Project ID: {project.id}</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-2">
                              <div className="mb-2 flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Track</span>
                                <Badge variant="outline">{project.track || "General"}</Badge>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Entries</span>
                                <span className="font-medium">{project.entries}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Judges</span>
                                <span className="font-medium">{project.judges}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProject ? "Edit Project" : "New Project"}</DialogTitle>
            <DialogDescription>
              {editingProject
                ? "Update the project details below."
                : "Create a new project by filling in the details below."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData({ ...formData, status: value as Project["status"] })
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="track">Track</Label>
                <Select
                  value={formData.track}
                  onValueChange={(value) =>
                    setFormData({ ...formData, track: value })
                  }
                >
                  <SelectTrigger id="track">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultTracks.map((track) => (
                      <SelectItem key={track.id} value={track.name}>
                        {track.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">{editingProject ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{projectToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDeleteConfirm}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
