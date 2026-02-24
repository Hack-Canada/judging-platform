"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { defaultTracks } from "@/lib/tracks-data"

export default function SubmitPage() {
  const [submitting, setSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState({
    teamName: "",
    members: ["", "", "", ""],
    projectName: "",
    devpostLink: "",
    tracks: [] as string[],
  })

  const handleMemberChange = (index: number, value: string) => {
    const next = [...formData.members]
    next[index] = value
    setFormData((prev) => ({ ...prev, members: next }))
  }

  const handleTrackToggle = (trackName: string) => {
    setFormData((prev) => ({
      ...prev,
      tracks: prev.tracks.includes(trackName) ? prev.tracks.filter((t) => t !== trackName) : [...prev.tracks, trackName],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teamName.trim() || !formData.members[0].trim() || !formData.projectName.trim() || !formData.devpostLink.trim()) {
      toast.error("Please complete all required fields.")
      return
    }
    if (formData.tracks.length === 0) {
      toast.error("Please select at least one track.")
      return
    }

    try {
      setSubmitting(true)
      const validMembers = formData.members.filter((m) => m.trim() !== "")
      const payload = {
        name: validMembers[0].trim(),
        team_name: formData.teamName.trim(),
        members: validMembers,
        devpost_link: formData.devpostLink.trim(),
        project_name: formData.projectName.trim(),
        tracks: formData.tracks,
        submitted_at: new Date().toISOString(),
      }
      const { error } = await supabase.from("submissions").insert([payload])
      if (error) throw error

      toast.success("Submission received!", {
        description: "Your project was submitted successfully.",
      })
      setFormData({
        teamName: "",
        members: ["", "", "", ""],
        projectName: "",
        devpostLink: "",
        tracks: [],
      })
    } catch (error) {
      toast.error("Failed to submit project", {
        description: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Submission</CardTitle>
            <CardDescription>Hackers can submit projects here. No login required.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="teamName">Team Name *</Label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, teamName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Team Members *</Label>
                <p className="text-xs text-muted-foreground">List yourself first, then add up to 3 teammates.</p>
                <div className="grid gap-2">
                  {formData.members.map((member, index) => (
                    <Input
                      key={index}
                      value={member}
                      onChange={(e) => handleMemberChange(index, e.target.value)}
                      placeholder={index === 0 ? "Your name (required)" : `Teammate ${index + 1} (optional)`}
                      required={index === 0}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Input
                  id="projectName"
                  value={formData.projectName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="devpostLink">Devpost Link *</Label>
                <Input
                  id="devpostLink"
                  type="url"
                  value={formData.devpostLink}
                  onChange={(e) => setFormData((prev) => ({ ...prev, devpostLink: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Tracks *</Label>
                <div className="grid gap-3 rounded-md border p-4 md:grid-cols-2">
                  {defaultTracks.map((track) => (
                    <div key={track.id} className="flex items-center space-x-2">
                      <Checkbox id={`track-${track.id}`} checked={formData.tracks.includes(track.name)} onCheckedChange={() => handleTrackToggle(track.name)} />
                      <Label htmlFor={`track-${track.id}`} className="text-sm font-normal">
                        {track.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Project"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
