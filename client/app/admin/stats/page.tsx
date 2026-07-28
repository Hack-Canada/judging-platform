import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, Users, UsersRound, Tags } from "lucide-react";
import {
  getSubmissionStats,
  getTrackCounts,
  getTeamSizeDistribution,
  getSubmissionTimeline,
} from "@/lib/queries";
import { TrackChart, TimelineChart, TeamSizeChart } from "@/components/admin/charts";
import { AdminPageHeading } from "@/components/admin/page-heading";

export const metadata = { title: "Admin · Stats" };

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold tracking-tight">{value}</div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  );
}

export default async function StatsPage() {
  const [stats, tracks, teamSizes, timeline] = await Promise.all([
    getSubmissionStats(),
    getTrackCounts(),
    getTeamSizeDistribution(),
    getSubmissionTimeline(),
  ]);

  return (
    <div className="space-y-6">
      <AdminPageHeading
        title="Submission stats"
        description="Live from the submissions database."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Projects" value={stats.totalProjects} icon={FolderGit2} />
        <StatCard label="Hackers" value={stats.totalHackers} hint="across all teams" icon={Users} />
        <StatCard
          label="Avg team size"
          value={stats.avgTeamSize}
          hint="members per project"
          icon={UsersRound}
        />
        <StatCard label="Tracks" value={stats.distinctTracks} hint="distinct tracks entered" icon={Tags} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Projects per track</CardTitle>
            <CardDescription>Top tracks by number of submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <TrackChart data={tracks} />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submissions over time</CardTitle>
              <CardDescription>Cumulative submissions by hour</CardDescription>
            </CardHeader>
            <CardContent>
              <TimelineChart data={timeline} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Team sizes</CardTitle>
              <CardDescription>Projects by number of members</CardDescription>
            </CardHeader>
            <CardContent>
              <TeamSizeChart data={teamSizes} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            All tracks
            <Badge variant="secondary">{tracks.length}</Badge>
          </CardTitle>
          <CardDescription>Full breakdown, including smaller tracks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tracks.map((t) => (
              <Badge key={t.track} variant="outline" className="font-normal">
                {t.track}
                <span className="ml-1.5 text-muted-foreground">{t.count}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
