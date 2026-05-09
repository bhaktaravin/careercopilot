import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { FileText, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface Resume { id: string; title: string; content: string; is_default: boolean; created_at: string; }

const resumeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(10, "Resume content is too short"),
  is_default: z.boolean().default(false),
});

export default function Resume() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: resumes, isLoading } = useQuery<Resume[]>({
    queryKey: ["/api/resumes"],
    queryFn: () => api.get("/resumes"),
  });

  const createResume = useMutation({
    mutationFn: (data: z.infer<typeof resumeSchema>) => api.post<Resume>("/resumes", data),
    onSuccess: () => {
      toast({ title: "Resume added successfully" });
      setIsCreateOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: () => toast({ title: "Failed to add resume", variant: "destructive" }),
  });

  const deleteResume = useMutation({
    mutationFn: (id: string) => api.delete(`/resumes/${id}`),
    onSuccess: () => {
      toast({ title: "Resume deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/resumes"] });
    },
    onError: () => toast({ title: "Failed to delete resume", variant: "destructive" }),
  });

  const form = useForm<z.infer<typeof resumeSchema>>({
    resolver: zodResolver(resumeSchema),
    defaultValues: { title: "", content: "", is_default: false },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Resumes</h1>
          <p className="text-muted-foreground mt-1">Manage your resumes for AI analysis and tailoring.</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-resume"><Plus className="w-4 h-4 mr-2" />Add Resume</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Add New Resume</DialogTitle>
              <DialogDescription>Paste your resume content below. This will be used to generate tailored applications.</DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(v => createResume.mutate(v))} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl><Input placeholder="e.g. Software Engineer (General)" {...field} data-testid="input-resume-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl><Textarea placeholder="Paste your plain text resume here..." className="min-h-[200px] font-mono text-sm" {...field} data-testid="input-resume-content" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createResume.isPending} data-testid="button-save-resume">
                    {createResume.isPending ? "Saving..." : "Save Resume"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => <Card key={i}><CardHeader><Skeleton className="h-6 w-3/4" /><Skeleton className="h-4 w-1/2" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent></Card>)}
        </div>
      ) : resumes && resumes.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {resumes.map(resume => (
            <Card key={resume.id} className="flex flex-col relative group" data-testid={`card-resume-${resume.id}`}>
              {resume.is_default && (
                <div className="absolute -top-2 -right-2">
                  <Badge variant="default" className="shadow-md"><CheckCircle2 className="w-3 h-3 mr-1" />Default</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{resume.title}</CardTitle>
                <CardDescription>Added {format(new Date(resume.created_at), 'MMM d, yyyy')}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="text-sm text-muted-foreground line-clamp-4 font-mono bg-muted/30 p-3 rounded-md">{resume.content}</div>
              </CardContent>
              <CardFooter className="justify-between border-t p-4 mt-auto">
                <div className="text-xs text-muted-foreground">{resume.content.length} characters</div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => deleteResume.mutate(resume.id)} disabled={deleteResume.isPending} data-testid={`button-delete-resume-${resume.id}`}>
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState icon={<FileText />} title="No resumes yet" description="Add your first resume to start generating tailored cover letters and applications."
          action={<Button onClick={() => setIsCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />Add Resume</Button>} />
      )}
    </div>
  );
}
