import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { 
  useListApplications, 
  useCreateApplication,
  getListApplicationsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Briefcase, Plus, Search, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/status-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const appSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  jobTitle: z.string().min(1, "Job title is required"),
  jobUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["saved", "applied", "interview", "offer", "rejected", "withdrawn"]).default("saved"),
});

export default function Applications() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useListApplications(
    statusFilter !== "all" ? { status: statusFilter } : undefined,
    {
      query: { queryKey: getListApplicationsQueryKey(statusFilter !== "all" ? { status: statusFilter } : undefined) }
    }
  );

  const createApplication = useCreateApplication();

  const form = useForm<z.infer<typeof appSchema>>({
    resolver: zodResolver(appSchema),
    defaultValues: {
      companyName: "",
      jobTitle: "",
      jobUrl: "",
      status: "saved",
    },
  });

  const onSubmit = (values: z.infer<typeof appSchema>) => {
    createApplication.mutate(
      { data: values as any },
      {
        onSuccess: () => {
          toast({ title: "Application added" });
          setIsCreateOpen(false);
          form.reset();
          queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        },
        onError: () => {
          toast({ title: "Failed to add application", variant: "destructive" });
        },
      }
    );
  };

  const filteredApps = applications?.filter(app => {
    if (!searchQuery) return true;
    return app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) || 
           app.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1">Track your job applications and progress.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Frontend Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="jobUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="saved">Saved</SelectItem>
                          <SelectItem value="applied">Applied</SelectItem>
                          <SelectItem value="interview">Interviewing</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                          <SelectItem value="withdrawn">Withdrawn</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createApplication.isPending}>
                    {createApplication.isPending ? "Adding..." : "Add Application"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter} className="w-full overflow-x-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
            <TabsTrigger value="interview">Interview</TabsTrigger>
            <TabsTrigger value="offer">Offer</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search applications..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredApps && filteredApps.length > 0 ? (
        <div className="grid gap-4">
          {filteredApps.map((app) => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card className="hover:bg-accent/40 transition-colors cursor-pointer border-border/50 bg-card/50 backdrop-blur">
                <div className="flex flex-col sm:flex-row p-5 sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg truncate">{app.jobTitle}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center text-muted-foreground gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5" />
                        <span className="truncate max-w-[200px]">{app.companyName}</span>
                      </div>
                      <div className="flex items-center gap-1.5 hidden sm:flex">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Updated {format(new Date(app.updatedAt), 'MMM d')}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-border/50">
                    {app.matchScore !== null && app.matchScore !== undefined && (
                      <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg px-3 py-1.5 border border-primary/20">
                        <span className="text-xs font-medium uppercase tracking-wider">Match</span>
                        <span className="text-lg font-bold leading-tight">{app.matchScore}%</span>
                      </div>
                    )}
                    {app.jobUrl && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={(e) => { e.stopPropagation(); window.open(app.jobUrl!, '_blank'); }}>
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Briefcase />}
          title={searchQuery ? "No matches found" : "No applications"}
          description={searchQuery ? "Try adjusting your search or filter." : "Start tracking your job search by adding an application."}
          action={
            !searchQuery && (
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </Button>
            )
          }
        />
      )}
    </div>
  );
}