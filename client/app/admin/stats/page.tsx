import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderGit2, Users, LinkIcon, UsersRound, Tags } from "lucide-react";
import {
  getSubmissionStats,
  getTrackCounts,
  getTeamSizeDistribution,
  getSubmissionTimeline,
} from "@/lib/queries";
import { TrackChart, TimelineChart, TeamSizeChart } from "@/components/admin/charts";

export const metadata = { title: "Admin · Stats" };
export const dynamic = "force-dynamic";

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
  let data: Awaited<
    ReturnType<typeof Promise.all<[
      ReturnType<typeof getSubmissionStats>,
      ReturnType<typeof getTrackCounts>,
      ReturnType<typeof getTeamSizeDistribution>,
      ReturnType<typeof getSubmissionTimeline>,
    ]>>
  >;

  try {
    data = await Promise.all([
      getSubmissionStats(),
      getTrackCounts(),
      getTeamSizeDistribution(),
      getSubmissionTimeline(),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Submission stats</h2>
          <p className="text-sm text-muted-foreground">
            Live from the submissions database.
          </p>
        </div>
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {errorMessage}
        </div>
      </div>
    );
  }

  const [stats, tracks, teamSizes, timeline] = data;

  const devpostPct =
    stats.totalProjects > 0
      ? Math.round((stats.withDevpost / stats.totalProjects) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Submission stats</h2>
        <p className="text-sm text-muted-foreground">
          Live from the submissions database.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Projects" value={stats.totalProjects} icon={FolderGit2} />
        <StatCard label="Hackers" value={stats.totalHackers} hint="across all teams" icon={Users} />
        <StatCard
          label="Avg team size"
          value={stats.avgTeamSize}
          hint="members per project"
          icon={UsersRound}
        />
        <StatCard label="Tracks" value={stats.distinctTracks} hint="distinct tracks entered" icon={Tags} />
        <StatCard
          label="Devpost links"
          value={`${devpostPct}%`}
          hint={`${stats.withDevpost} of ${stats.totalProjects} projects`}
          icon={LinkIcon}
        />
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
