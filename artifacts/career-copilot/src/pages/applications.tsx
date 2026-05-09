import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Application {
  id: string; company_name: string; job_title: string; job_url?: string;
  status: string; match_score?: number; updated_at: string; created_at: string;
}

const appSchema = z.object({
  company_name: z.string().min(1, "Company name is required"),
  job_title: z.string().min(1, "Job title is required"),
  job_url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  status: z.enum(["saved","applied","interview","offer","rejected","withdrawn"]).default("saved"),
});

export default function Applications() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: applications, isLoading } = useQuery<Application[]>({
    queryKey: ["/api/applications", statusFilter],
    queryFn: () => api.get(`/applications${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
  });

  const createApplication = useMutation({
    mutationFn: (data: z.infer<typeof appSchema>) => api.post<Application>("/applications", data),
    onSuccess: () => {
      toast({ title: "Application added" });
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: () => toast({ title: "Failed to add application", variant: "destructive" }),
  });

  const form = useForm<z.infer<typeof appSchema>>({
    resolver: zodResolver(appSchema),
    defaultValues: { company_name: "", job_title: "", job_url: "", status: "saved" },
  });

  const filtered = applications?.filter(app =>
    !searchQuery ||
    app.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Applications</h1>
          <p className="text-muted-foreground mt-1">Track your job applications and progress.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-new-application"><Plus className="w-4 h-4 mr-2" />New Application</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Application</DialogTitle></DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(v => createApplication.mutate(v))} className="space-y-4">
                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem><FormLabel>Company Name</FormLabel><FormControl><Input placeholder="e.g. Acme Corp" {...field} data-testid="input-company-name" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="job_title" render={({ field }) => (
                  <FormItem><FormLabel>Job Title</FormLabel><FormControl><Input placeholder="e.g. Frontend Engineer" {...field} data-testid="input-job-title" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="job_url" render={({ field }) => (
                  <FormItem><FormLabel>Job URL (Optional)</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger data-testid="select-status"><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {["saved","applied","interview","offer","rejected","withdrawn"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createApplication.isPending} data-testid="button-submit-application">
                    {createApplication.isPending ? "Adding..." : "Add Application"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full overflow-x-auto">
          <TabsList>
            {["all","saved","applied","interview","offer","rejected"].map(s => (
              <TabsTrigger key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72 shrink-0">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search applications..." className="pl-8" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} data-testid="input-search" />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid gap-4">
          {filtered.map(app => (
            <Link key={app.id} href={`/applications/${app.id}`}>
              <Card className="hover:bg-accent/40 transition-colors cursor-pointer border-border/50 bg-card/50 backdrop-blur" data-testid={`card-application-${app.id}`}>
                <div className="flex flex-col sm:flex-row p-5 sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg truncate">{app.job_title}</h3>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center text-muted-foreground gap-4 text-sm">
                      <div className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /><span className="truncate max-w-[200px]">{app.company_name}</span></div>
                      <div className="hidden sm:flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /><span>Updated {format(new Date(app.updated_at), 'MMM d')}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0 sm:pl-4 sm:border-l sm:border-border/50">
                    {app.match_score != null && (
                      <div className="flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg px-3 py-1.5 border border-primary/20">
                        <span className="text-xs font-medium uppercase tracking-wider">Match</span>
                        <span className="text-lg font-bold leading-tight">{app.match_score}%</span>
                      </div>
                    )}
                    {app.job_url && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(app.job_url, '_blank'); }}>
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
        <EmptyState icon={<Briefcase />}
          title={searchQuery ? "No matches found" : "No applications"}
          description={searchQuery ? "Try adjusting your search or filter." : "Start tracking your job search by adding an application."}
          action={!searchQuery && <Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Application</Button>} />
      )}
    </div>
  );
}
