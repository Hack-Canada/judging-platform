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
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { defaultTracks } from "@/lib/tracks-data"
import { supabase } from "@/lib/supabase-client"

const ACCESS_CODE = "111-111"
const ACCESS_CODE_KEY = "dashboard_access_code"

export default function HackersPage() {
  const router = useRouter()
  const [hasAccess, setHasAccess] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    teamName: "",
    members: ["", "", "", ""], // Up to 4 members
    devpostLink: "",
    projectName: "",
    tracks: [] as string[], // Selected tracks/categories
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
    }
  }, [router])

  const handleMemberChange = (index: number, value: string) => {
    const newMembers = [...formData.members]
    newMembers[index] = value
    setFormData({ ...formData, members: newMembers })
  }

  const handleTrackToggle = (trackName: string) => {
    setFormData(prev => ({
      ...prev,
      tracks: prev.tracks.includes(trackName)
        ? prev.tracks.filter(t => t !== trackName)
        : [...prev.tracks, trackName],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.name.trim()) {
      toast.error("Validation error", {
        description: "Your name is required",
      })
      return
    }

    if (!formData.teamName.trim()) {
      toast.error("Validation error", {
        description: "Team name is required",
      })
      return
    }

    if (!formData.projectName.trim()) {
      toast.error("Validation error", {
        description: "Project name is required",
      })
      return
    }

    if (!formData.devpostLink.trim()) {
      toast.error("Validation error", {
        description: "Devpost link is required",
      })
      return
    }

    if (formData.tracks.length === 0) {
      toast.error("Validation error", {
        description: "Please select at least one category/track",
      })
      return
    }

    // Validate devpost link format
    try {
      new URL(formData.devpostLink)
    } catch {
      toast.error("Validation error", {
        description: "Please enter a valid Devpost URL",
      })
      return
    }

    try {
      setSubmitting(true)

      // Filter out empty members
      const validMembers = formData.members.filter(m => m.trim() !== "")

      // Create submission in Supabase (assuming a submissions table exists)
      // For now, we'll store in a submissions table or projects table
      const submissionData = {
        name: formData.name.trim(),
        team_name: formData.teamName.trim(),
        members: validMembers,
        devpost_link: formData.devpostLink.trim(),
        project_name: formData.projectName.trim(),
        tracks: formData.tracks,
        submitted_at: new Date().toISOString(),
      }

      // Try to insert into a submissions table (create if doesn't exist)
      // For MVP, we'll also create the project if it doesn't exist
      const { error: submissionError } = await supabase
        .from("submissions")
        .insert([submissionData])

      if (submissionError) {
        // If submissions table doesn't exist, we'll create a project instead
        // This is a fallback for MVP
        console.warn("Submissions table not found, creating project instead:", submissionError)

        // Create project for each selected track
        for (const track of formData.tracks) {
          const { error: projectError } = await supabase
            .from("projects")
            .insert([{
              name: formData.projectName.trim(),
              track: track,
            }])

          if (projectError && !projectError.message.includes("duplicate")) {
            throw projectError
          }
        }
      }

      toast.success("Submission successful!", {
        description: "Your project has been submitted for judging",
      })

      // Reset form
      setFormData({
        name: "",
        teamName: "",
        members: ["", "", "", ""],
        devpostLink: "",
        projectName: "",
        tracks: [],
      })
    } catch (error) {
      console.error("Submission error:", error)
      toast.error("Failed to submit", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      })
    } finally {
      setSubmitting(false)
    }
  }

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
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Submission</CardTitle>
                      <CardDescription>
                        Submit your hackathon project for judging
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="name">
                              Your Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({ ...formData, name: e.target.value })
                              }
                              placeholder="John Doe"
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="teamName">
                              Team Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="teamName"
                              value={formData.teamName}
                              onChange={(e) =>
                                setFormData({ ...formData, teamName: e.target.value })
                              }
                              placeholder="Team Awesome"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Team Members (up to 4 members, including yourself)</Label>
                          <div className="grid gap-2">
                            {formData.members.map((member, index) => (
                              <Input
                                key={index}
                                value={member}
                                onChange={(e) => handleMemberChange(index, e.target.value)}
                                placeholder={`Member ${index + 1} name (optional)`}
                              />
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="projectName">
                            Project Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="projectName"
                            value={formData.projectName}
                            onChange={(e) =>
                              setFormData({ ...formData, projectName: e.target.value })
                            }
                            placeholder="Amazing Hack Project"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="devpostLink">
                            Devpost Link <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="devpostLink"
                            type="url"
                            value={formData.devpostLink}
                            onChange={(e) =>
                              setFormData({ ...formData, devpostLink: e.target.value })
                            }
                            placeholder="https://devpost.com/software/your-project"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>
                            Categories/Tracks <span className="text-destructive">*</span>
                          </Label>
                          <Card>
                            <CardContent className="pt-6">
                              <div className="grid gap-4 md:grid-cols-2">
                                {defaultTracks.map((track) => (
                                  <div key={track.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`track-${track.id}`}
                                      checked={formData.tracks.includes(track.name)}
                                      onCheckedChange={() => handleTrackToggle(track.name)}
                                    />
                                    <Label
                                      htmlFor={`track-${track.id}`}
                                      className="text-sm font-normal cursor-pointer flex-1"
                                    >
                                      {track.name}
                                      {track.description && (
                                        <span className="text-muted-foreground ml-2">
                                          - {track.description}
                                        </span>
                                      )}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                          <p className="text-xs text-muted-foreground">
                            Select all categories/tracks your project applies to
                          </p>
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setFormData({
                                name: "",
                                teamName: "",
                                members: ["", "", "", ""],
                                devpostLink: "",
                                projectName: "",
                                tracks: [],
                              })
                            }}
                          >
                            Clear
                          </Button>
                          <Button type="submit" disabled={submitting}>
                            {submitting ? "Submitting..." : "Submit Project"}
                          </Button>
                        </div>
                      </form>
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
