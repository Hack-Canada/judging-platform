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
import { defaultProjects, type Project } from "@/lib/projects-data"
import { defaultTracks } from "@/lib/tracks-data"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function ProjectsPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [projects, setProjects] = React.useState<Project[]>(defaultProjects)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [projectToDelete, setProjectToDelete] = React.useState<Project | null>(null)
  
  const [formData, setFormData] = React.useState({
    name: "",
    status: "Active" as Project["status"],
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
      }
      // Load saved projects
      const savedProjects = localStorage.getItem("projects_data")
      if (savedProjects) {
        try {
          setProjects(JSON.parse(savedProjects))
        } catch (e) {
          // Use default if parsing fails
        }
      }
    }
  }, [router])

  const saveProjects = (newProjects: Project[]) => {
    setProjects(newProjects)
    if (typeof window !== "undefined") {
      localStorage.setItem("projects_data", JSON.stringify(newProjects))
    }
  }

  const handleOpenDialog = (project?: Project) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error("Validation error", {
        description: "Project name is required",
      })
      return
    }

    if (editingProject) {
      // Update existing project
      const updated = projects.map(p =>
        p.id === editingProject.id
          ? { ...p, name: formData.name, status: formData.status, track: formData.track }
          : p
      )
      saveProjects(updated)
      toast.success("Project updated!", {
        description: `${formData.name} has been updated`,
      })
    } else {
      // Create new project
      const newProject: Project = {
        id: Math.max(...projects.map(p => p.id), 0) + 1,
        name: formData.name,
        status: formData.status,
        entries: 0,
        judges: 0,
        track: formData.track,
      }
      saveProjects([...projects, newProject])
      toast.success("Project created!", {
        description: `${formData.name} has been added`,
      })
    }
    handleCloseDialog()
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (projectToDelete) {
      const updated = projects.filter(p => p.id !== projectToDelete.id)
      saveProjects(updated)
      toast.success("Project deleted!", {
        description: `${projectToDelete.name} has been removed`,
      })
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
                    {filteredProjects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-shadow">
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
                            <div className="flex items-center justify-between text-sm mb-2">
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
                    ))}
                  </div>

                  {filteredProjects.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      {searchQuery ? "No projects found matching your search." : "No projects yet. Create your first project!"}
                    </div>
                  )}
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
