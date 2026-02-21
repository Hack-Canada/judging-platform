"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { supabase } from "@/lib/supabase-client"


type Submission = {
  id: string
  name: string
  team_name: string
  members: string[]
  devpost_link: string
  project_name: string
  tracks: string[]
  submitted_at: string
  created_at: string
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = React.useState<Submission[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const loadSubmissions = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("submissions")
          .select("*")
          .order("submitted_at", { ascending: false })

        if (error) {

          return
        }

        if (data) {
          setSubmissions(data as Submission[])
        }
      } catch (error) {

      } finally {
        setLoading(false)
      }
    }

    void loadSubmissions()
  }, [])

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
                  <Card>
                    <CardHeader>
                      <CardTitle>Submissions</CardTitle>
                      <CardDescription>
                        View all project submissions from hackers
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                          Loading submissions...
                        </div>
                      ) : submissions.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No submissions found.
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Project Name</TableHead>
                              <TableHead>Team Name</TableHead>
                              <TableHead>Members</TableHead>
                              <TableHead>Tracks</TableHead>
                              <TableHead>Devpost Link</TableHead>
                              <TableHead>Submitted At</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {submissions.map((submission) => (
                              <TableRow key={submission.id}>
                                <TableCell className="font-medium">
                                  {submission.project_name}
                                </TableCell>
                                <TableCell>{submission.team_name}</TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {submission.members && submission.members.length > 0 ? (
                                      submission.members.map((member, idx) => (
                                        <Badge key={idx} variant="outline">
                                          {member}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-muted-foreground text-sm">N/A</span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-wrap gap-1">
                                    {submission.tracks && submission.tracks.length > 0 ? (
                                      submission.tracks.map((track, idx) => (
                                        <Badge key={idx} variant="secondary">
                                          {track}
                                        </Badge>
                                      ))
                                    ) : (
                                      <Badge variant="secondary">General</Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {submission.devpost_link ? (
                                    <a
                                      href={submission.devpost_link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-primary hover:underline"
                                    >
                                      View
                                    </a>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">N/A</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {new Date(submission.submitted_at).toLocaleString()}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
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
