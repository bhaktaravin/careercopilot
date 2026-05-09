import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id?: string; user_id?: string; full_name?: string; email?: string; phone?: string;
  location?: string; linkedin_url?: string; website_url?: string; bio?: string;
  current_title?: string; years_of_experience?: number;
}

const profileSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  location: z.string().optional().or(z.literal("")),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  website_url: z.string().url().optional().or(z.literal("")),
  bio: z.string().optional().or(z.literal("")),
  current_title: z.string().optional().or(z.literal("")),
  years_of_experience: z.coerce.number().min(0).optional(),
});

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/profiles/me"],
    queryFn: async () => {
      try { return await api.get<Profile>("/profiles/me"); } catch { return {}; }
    },
    retry: false,
  });

  const upsertProfile = useMutation({
    mutationFn: (data: z.infer<typeof profileSchema>) => api.put<Profile>("/profiles/me", data),
    onSuccess: () => {
      toast({ title: "Profile updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/profiles/me"] });
    },
    onError: () => toast({ title: "Failed to update profile", variant: "destructive" }),
  });

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: "", email: "", phone: "", location: "",
      linkedin_url: "", website_url: "", bio: "", current_title: "", years_of_experience: 0,
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name ?? "",
        email: profile.email ?? "",
        phone: profile.phone ?? "",
        location: profile.location ?? "",
        linkedin_url: profile.linkedin_url ?? "",
        website_url: profile.website_url ?? "",
        bio: profile.bio ?? "",
        current_title: profile.current_title ?? "",
        years_of_experience: profile.years_of_experience ?? 0,
      });
    }
  }, [profile, form]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your profile details.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle>Profile Details</CardTitle>
          <CardDescription>These details help AI tailor your applications more accurately.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(v => upsertProfile.mutate(v))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: "full_name" as const, label: "Full Name", type: "text" },
                    { name: "email" as const, label: "Contact Email", type: "email" },
                    { name: "current_title" as const, label: "Current/Target Title", type: "text", placeholder: "e.g. Senior Frontend Engineer" },
                    { name: "years_of_experience" as const, label: "Years of Experience", type: "number" },
                    { name: "phone" as const, label: "Phone", type: "text" },
                    { name: "location" as const, label: "Location", type: "text", placeholder: "e.g. San Francisco, CA" },
                    { name: "linkedin_url" as const, label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/..." },
                    { name: "website_url" as const, label: "Website/Portfolio URL", type: "url", placeholder: "https://..." },
                  ].map(({ name, label, type, placeholder }) => (
                    <FormField key={name} control={form.control} name={name} render={({ field }) => (
                      <FormItem>
                        <FormLabel>{label}</FormLabel>
                        <FormControl><Input type={type} placeholder={placeholder} {...field} value={field.value as string} data-testid={`input-${name}`} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                  ))}
                </div>
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio / Summary</FormLabel>
                    <FormControl><Textarea className="min-h-[120px]" placeholder="Brief summary of your career, goals, and strengths..." {...field} data-testid="textarea-bio" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex justify-end">
                  <Button type="submit" disabled={upsertProfile.isPending} data-testid="button-save-profile">
                    {upsertProfile.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
