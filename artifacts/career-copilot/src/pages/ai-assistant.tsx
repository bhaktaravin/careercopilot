import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useListResumes, 
  getListResumesQueryKey,
  useGenerateAiContent,
  useAnalyzeAts,
  useAnswerApplicationQuestion
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Copy, Check, Loader2, ArrowRight } from "lucide-react";

export default function AiAssistant() {
  const { toast } = useToast();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: resumes, isLoading: resumesLoading } = useListResumes({
    query: { queryKey: getListResumesQueryKey() }
  });

  const generateContent = useGenerateAiContent();
  const analyzeAts = useAnalyzeAts();

  const [atsResult, setAtsResult] = useState<any>(null);
  const [genResults, setGenResults] = useState<any[]>([]);

  const form = useForm({
    defaultValues: {
      resumeId: "",
      jobDescription: "",
      types: ["resume_summary", "cover_letter"],
    },
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({ title: "Copied to clipboard" });
  };

  const onSubmitGenerate = async (values: any) => {
    const resume = resumes?.find(r => r.id.toString() === values.resumeId);
    if (!resume) {
      toast({ title: "Please select a resume", variant: "destructive" });
      return;
    }
    if (!values.jobDescription) {
      toast({ title: "Job description is required", variant: "destructive" });
      return;
    }
    if (values.types.length === 0) {
      toast({ title: "Select at least one content type", variant: "destructive" });
      return;
    }

    try {
      const res = await generateContent.mutateAsync({
        data: {
          applicationId: 0, // Generic assistant mode, no specific app
          resumeContent: resume.content,
          jobDescription: values.jobDescription,
          types: values.types as any,
        }
      });
      setGenResults(res.results);
      toast({ title: "Content generated successfully" });
    } catch (err) {
      toast({ title: "Failed to generate content", variant: "destructive" });
    }
  };

  const onAnalyzeAts = async () => {
    const values = form.getValues();
    const resume = resumes?.find(r => r.id.toString() === values.resumeId);
    if (!resume) {
      toast({ title: "Please select a resume", variant: "destructive" });
      return;
    }
    if (!values.jobDescription) {
      toast({ title: "Job description is required", variant: "destructive" });
      return;
    }

    try {
      const res = await analyzeAts.mutateAsync({
        data: {
          resumeContent: resume.content,
          jobDescription: values.jobDescription,
        }
      });
      setAtsResult(res);
      toast({ title: "ATS Analysis complete" });
    } catch (err) {
      toast({ title: "Failed to analyze ATS compatibility", variant: "destructive" });
    }
  };

  const contentTypes = [
    { id: "resume_summary", label: "Resume Summary" },
    { id: "bullet_points", label: "Tailored Bullet Points" },
    { id: "cover_letter", label: "Cover Letter" },
    { id: "why_role", label: "Q: Why this role?" },
    { id: "tell_me_about_yourself", label: "Q: Tell me about yourself" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground mt-1">Generate tailored content for your next application.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="bg-card/50 backdrop-blur border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle>Input Details</CardTitle>
              <CardDescription>Provide context for the AI to work with.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-6">
                  <FormField
                    control={form.control}
                    name="resumeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Select Resume</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={resumesLoading ? "Loading resumes..." : "Choose a resume"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {resumes?.map(r => (
                              <SelectItem key={r.id} value={r.id.toString()}>{r.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="jobDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Paste the job description here..." 
                            className="min-h-[250px] font-mono text-sm"
                            {...field} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="types"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base">What to generate?</FormLabel>
                        </div>
                        <div className="grid grid-cols-1 gap-2 bg-muted/30 p-4 rounded-lg border">
                          {contentTypes.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="types"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 py-1"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value: string) => value !== item.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {item.label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col gap-3 pt-2">
                    <Button 
                      type="button" 
                      className="w-full" 
                      onClick={form.handleSubmit(onSubmitGenerate)}
                      disabled={generateContent.isPending}
                    >
                      {generateContent.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Generate Selected Content</>
                      )}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="secondary" 
                      className="w-full" 
                      onClick={onAnalyzeAts}
                      disabled={analyzeAts.isPending}
                    >
                      {analyzeAts.isPending ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <>Run ATS Analysis</>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Output */}
        <div className="lg:col-span-7 space-y-6">
          {(genResults.length > 0 || atsResult) ? (
            <Tabs defaultValue={genResults.length > 0 ? "content" : "ats"} className="w-full">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="content" disabled={genResults.length === 0}>Generated Content</TabsTrigger>
                <TabsTrigger value="ats" disabled={!atsResult}>ATS Analysis</TabsTrigger>
              </TabsList>
              
              <TabsContent value="content" className="mt-4 space-y-4">
                {genResults.map((result, idx) => (
                  <Card key={idx} className="border-primary/20 shadow-md">
                    <CardHeader className="py-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-lg capitalize flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        {result.type.replace(/_/g, ' ')}
                      </CardTitle>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleCopy(result.content, `gen-${idx}`)}
                      >
                        {copiedId === `gen-${idx}` ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="whitespace-pre-wrap text-sm leading-relaxed font-serif">
                        {result.content}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
              
              <TabsContent value="ats" className="mt-4 space-y-4">
                {atsResult && (
                  <Card className="border-border">
                    <CardHeader className="py-4 border-b bg-muted/20">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">ATS Match Score</CardTitle>
                        <div className={`text-2xl font-bold ${atsResult.matchScore > 75 ? 'text-green-500' : atsResult.matchScore > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                          {atsResult.matchScore}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 space-y-6">
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-green-500 mb-2">Matched Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.matchedKeywords.map((kw: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs border border-green-500/20">{kw}</span>
                          ))}
                          {atsResult.matchedKeywords.length === 0 && <span className="text-muted-foreground text-sm">None detected</span>}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-red-500 mb-2">Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {atsResult.missingKeywords.map((kw: string, i: number) => (
                            <span key={i} className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs border border-red-500/20">{kw}</span>
                          ))}
                          {atsResult.missingKeywords.length === 0 && <span className="text-muted-foreground text-sm">None missing</span>}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-sm uppercase tracking-wider text-primary mb-2">Improvement Suggestions</h4>
                        <ul className="space-y-2">
                          {atsResult.suggestions.map((sug: string, i: number) => (
                            <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                              <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{sug}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full min-h-[400px] border border-dashed rounded-xl bg-card/30 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Results will appear here</h3>
              <p className="text-muted-foreground max-w-sm">
                Select a resume, paste a job description, and choose what you want to generate to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}