import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, FileText, Sparkles, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { StatusBadge } from "@/components/status-badge";
import { Link } from "wouter";

interface DashboardStats {
  totalApplications: number;
  byStatus: Record<string, number>;
  totalResumes: number;
  totalGeneratedResponses: number;
  recentActivityCount: number;
}

interface Application {
  id: string;
  job_title: string;
  company_name: string;
  status: string;
  updated_at: string;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: () => api.get("/dashboard/stats"),
  });

  const { data: recentApps, isLoading: recentLoading } = useQuery<Application[]>({
    queryKey: ["/api/dashboard/recent-applications"],
    queryFn: () => api.get("/dashboard/recent-applications"),
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-2">Here's what's happening with your job search.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Applications", value: stats?.totalApplications, icon: Briefcase, iconClass: "text-muted-foreground" },
          { label: "Active Interviews", value: stats?.byStatus?.interview, icon: Activity, iconClass: "text-amber-500" },
          { label: "Resumes", value: stats?.totalResumes, icon: FileText, iconClass: "text-muted-foreground" },
          { label: "AI Responses", value: stats?.totalGeneratedResponses, icon: Sparkles, iconClass: "text-primary" },
        ].map(({ label, value, icon: Icon, iconClass }) => (
          <Card key={label} className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className={`h-4 w-4 ${iconClass}`} />
            </CardHeader>
            <CardContent>
              {statsLoading ? <Skeleton className="h-8 w-20 mt-1" /> : <div className="text-3xl font-bold">{value ?? 0}</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur border-border/50">
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : recentApps && recentApps.length > 0 ? (
              <div className="space-y-4">
                {recentApps.map(app => (
                  <Link key={app.id} href={`/applications/${app.id}`}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border/50 bg-background/50 hover:bg-accent/50 transition-colors cursor-pointer group">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium group-hover:text-primary transition-colors">{app.job_title}</span>
                        <span className="text-sm text-muted-foreground">{app.company_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-muted-foreground hidden md:inline-block">
                          {format(new Date(app.updated_at), 'MMM d, yyyy')}
                        </span>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No recent activity to show.</div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur border-border/50">
          <CardHeader><CardTitle>Application Pipeline</CardTitle></CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</div>
            ) : (
              <div className="space-y-4">
                {Object.entries(stats?.byStatus ?? {}).filter(([, count]) => count > 0).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="capitalize text-muted-foreground">{status}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 rounded-full bg-primary/20 w-32 overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${(Number(count) / (stats?.totalApplications || 1)) * 100}%` }} />
                      </div>
                      <span className="font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
                {!stats?.totalApplications && <div className="text-center py-8 text-muted-foreground text-sm">Add applications to see your pipeline.</div>}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
