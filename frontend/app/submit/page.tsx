"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase-client"
import { defaultTracks } from "@/lib/tracks-data"
import { defaultRooms, type Room } from "@/lib/rooms-data"

type SlotRow = {
  id: string
  date: string
  start_time: string
  end_time: string
  room_id: number
  submission_id: string
}

type SubmissionRow = {
  id: string
  project_name: string
}

export default function SubmitPage() {
  const [submitting, setSubmitting] = React.useState(false)
  const [refreshing, setRefreshing] = React.useState(false)
  const [scheduleVisible, setScheduleVisible] = React.useState(false)
  const [slots, setSlots] = React.useState<SlotRow[]>([])
  const [submissionNames, setSubmissionNames] = React.useState<Map<string, string>>(new Map())
  const [rooms, setRooms] = React.useState<Room[]>(defaultRooms)
  const [formData, setFormData] = React.useState({
    teamName: "",
    members: ["", "", "", ""],
    projectName: "",
    devpostLink: "",
    tracks: [] as string[],
  })

  const loadSchedule = React.useCallback(async () => {
    setRefreshing(true)
    try {
      const [{ data: settingsData }, { data: roomsData }, { data: slotData }, { data: submissionsData }] =
        await Promise.all([
          supabase.from("admin_settings").select("setting_key, setting_value").eq("setting_key", "hacker_schedule_visibility"),
          supabase.from("admin_settings").select("setting_key, setting_value").eq("setting_key", "rooms_data"),
          supabase
            .from("calendar_schedule_slots")
            .select("id, date, start_time, end_time, room_id, submission_id")
            .order("date", { ascending: true })
            .order("start_time", { ascending: true }),
          supabase.from("submissions").select("id, project_name"),
        ])

      const visibilitySetting = settingsData?.[0]?.setting_value === "enabled"
      setScheduleVisible(visibilitySetting)

      if (roomsData?.[0]?.setting_value) {
        try {
          const parsed = JSON.parse(roomsData[0].setting_value)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setRooms(parsed)
          }
        } catch {
          // no-op
        }
      }

      const names = new Map<string, string>()
      ;((submissionsData as SubmissionRow[] | null) ?? []).forEach((s) => names.set(s.id, s.project_name ?? "Untitled Project"))
      setSubmissionNames(names)
      setSlots((slotData as SlotRow[] | null) ?? [])
    } finally {
      setRefreshing(false)
    }
  }, [])

  React.useEffect(() => {
    void loadSchedule()
  }, [loadSchedule])

  const groupedSlots = React.useMemo(() => {
    const map = new Map<string, SlotRow[]>()
    slots.forEach((slot) => {
      if (!map.has(slot.date)) map.set(slot.date, [])
      map.get(slot.date)!.push(slot)
    })
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [slots])

  const roomsById = React.useMemo(() => {
    const map = new Map<number, Room>()
    rooms.forEach((room) => map.set(room.id, room))
    return map
  }, [rooms])

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
      void loadSchedule()
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Judging Schedule</CardTitle>
                <CardDescription>
                  {scheduleVisible
                    ? "Schedule visibility is enabled. Showing all project schedules."
                    : "Schedule visibility is currently disabled by admins."}
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadSchedule()} disabled={refreshing}>
                {refreshing ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!scheduleVisible ? (
              <p className="text-sm text-muted-foreground">Check back later for published judging times.</p>
            ) : groupedSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No schedule published yet.</p>
            ) : (
              <div className="space-y-4">
                {groupedSlots.map(([date, dateSlots]) => (
                  <Card key={date} className="border-dashed">
                    <CardHeader>
                      <CardTitle className="text-sm">
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {dateSlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                          <div className="space-y-1">
                            <p className="font-medium">{submissionNames.get(slot.submission_id) ?? "Untitled Project"}</p>
                            <p className="text-xs text-muted-foreground">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </p>
                          </div>
                          <Badge variant="outline">{roomsById.get(slot.room_id)?.name ?? `Room ${slot.room_id}`}</Badge>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

