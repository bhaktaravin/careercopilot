import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/status-badge";
import { ArrowLeft, Save, ExternalLink, Calendar, Copy, Check, Briefcase } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Application {
  id: string; company_name: string; job_title: string; job_url?: string;
  status: string; notes?: string; job_description?: string; match_score?: number;
  created_at: string; updated_at: string;
}
interface GeneratedResponse { id: string; type: string; content: string; created_at: string; }

const updateSchema = z.object({
  status: z.enum(["saved","applied","interview","offer","rejected","withdrawn"]),
  notes: z.string().optional().or(z.literal("")),
  job_url: z.string().url().optional().or(z.literal("")),
});

export default function ApplicationDetails({ id }: { id?: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["/api/applications", id],
    queryFn: () => api.get(`/applications/${id}`),
    enabled: !!id,
  });

  const { data: generatedContent, isLoading: genLoading } = useQuery<GeneratedResponse[]>({
    queryKey: ["/api/applications", id, "generated-responses"],
    queryFn: () => api.get(`/applications/${id}/generated-responses`),
    enabled: !!id,
  });

  const updateApp = useMutation({
    mutationFn: (data: z.infer<typeof updateSchema>) => api.patch<Application>(`/applications/${id}`, data),
    onSuccess: () => {
      toast({ title: "Application updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/applications", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const form = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: { status: "saved", notes: "", job_url: "" },
  });

  useEffect(() => {
    if (application) {
      form.reset({
        status: application.status as z.infer<typeof updateSchema>["status"],
        notes: application.notes ?? "",
        job_url: application.job_url ?? "",
      });
    }
  }, [application, form]);

  const handleCopy = (text: string, cid: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(cid);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-32 mb-8" /><Card><CardHeader><Skeleton className="h-10 w-1/2" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card></div>;
  }
  if (!application) return <div className="p-8 text-center">Application not found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/applications">
          <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight truncate">{application.job_title}</h1>
            <StatusBadge status={application.status} />
          </div>
          <div className="flex items-center gap-4 mt-1 text-muted-foreground">
            <span className="flex items-center gap-1"><Briefcase className="h-4 w-4" /> {application.company_name}</span>
            <span className="hidden sm:flex items-center gap-1"><Calendar className="h-4 w-4" /> Added {format(new Date(application.created_at), 'MMM d, yyyy')}</span>
          </div>
        </div>
        {application.match_score != null && (
          <div className="hidden sm:flex flex-col items-center justify-center bg-primary/10 text-primary rounded-lg px-4 py-2 border border-primary/20">
            <span className="text-[10px] font-bold uppercase tracking-wider">Match</span>
            <span className="text-xl font-bold leading-tight">{application.match_score}%</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(v => updateApp.mutate(v))} className="space-y-4">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {["saved","applied","interview","offer","rejected","withdrawn"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="job_url" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Link</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input placeholder="https://..." {...field} />
                          {field.value && <Button type="button" variant="outline" size="icon" onClick={() => window.open(field.value, '_blank')}><ExternalLink className="h-4 w-4" /></Button>}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal Notes</FormLabel>
                      <FormControl><Textarea placeholder="Add notes about interviews, recruiters, etc." className="min-h-[150px]" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <Button type="submit" className="w-full" disabled={updateApp.isPending} data-testid="button-save-changes">
                    {updateApp.isPending ? "Saving..." : <><Save className="w-4 h-4 mr-2" />Save Changes</>}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="job-description">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="job-description">Job Description</TabsTrigger>
              <TabsTrigger value="ai-content">Saved AI Content</TabsTrigger>
            </TabsList>
            <TabsContent value="job-description" className="mt-4">
              <Card className="border-border/50 bg-card/50 backdrop-blur min-h-[500px]">
                <CardContent className="p-6">
                  {application.job_description
                    ? <div className="whitespace-pre-wrap font-mono text-sm text-muted-foreground leading-relaxed">{application.job_description}</div>
                    : <div className="text-center py-20 text-muted-foreground">No job description saved.</div>}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="ai-content" className="mt-4 space-y-4">
              {genLoading ? (
                <div className="space-y-4"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>
              ) : generatedContent && generatedContent.length > 0 ? (
                generatedContent.map(item => (
                  <Card key={item.id} className="border-border/50 shadow-sm">
                    <CardHeader className="py-3 px-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
                      <div>
                        <CardTitle className="text-sm font-medium capitalize">{item.type.replace(/_/g, ' ')}</CardTitle>
                        <CardDescription className="text-xs mt-1">Generated {format(new Date(item.created_at), 'MMM d, h:mm a')}</CardDescription>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(item.content, item.id)}>
                        {copiedId === item.id ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">{item.content}</div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 border border-dashed rounded-xl bg-card/30">
                  <p className="text-muted-foreground mb-4">No AI content generated for this application yet.</p>
                  <Link href="/ai"><Button variant="outline">Go to AI Assistant</Button></Link>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
