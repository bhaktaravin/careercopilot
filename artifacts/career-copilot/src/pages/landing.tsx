import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Briefcase, Sparkles, Target, Zap, Shield, CheckCircle2, ChevronRight, FileText } from "lucide-react";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary/30">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg tracking-tight">CareerCopilot</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-24 pb-32 lg:pt-36 lg:pb-40">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] -z-10" />
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
              <Sparkles className="mr-2 h-4 w-4" />
              The Future of Job Hunting is Here
            </div>
            <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl mb-6">
              An unfair advantage for <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">serious job seekers.</span>
            </h1>
            <p className="max-w-2xl text-lg sm:text-xl text-muted-foreground mb-10">
              Stop sending generic applications. CareerCopilot analyzes job descriptions, tailors your resume, and generates precise cover letters in seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link href="/sign-up" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-12 px-8 text-base bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 border-0">
                  Start for Free <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="#how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-12 px-8 text-base">
                  See how it works
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Everything you need to land the offer.</h2>
              <p className="text-muted-foreground text-lg">Powerful AI tools designed to help you stand out from the crowd and bypass the ATS.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: Target,
                  title: "ATS Optimization",
                  description: "Instantly analyze job descriptions against your resume to identify missing keywords and improve your match score."
                },
                {
                  icon: FileText,
                  title: "Tailored Content",
                  description: "Generate highly specific cover letters, resume summaries, and bullet points tailored to the exact role."
                },
                {
                  icon: Briefcase,
                  title: "Application Tracking",
                  description: "Manage all your applications in one place. Move them through your pipeline from 'Saved' to 'Offer'."
                },
                {
                  icon: Zap,
                  title: "Instant Answers",
                  description: "Get smart answers to common application questions like 'Why this role?' based on your actual experience."
                },
                {
                  icon: Shield,
                  title: "Privacy First",
                  description: "Your data is yours. We don't share your resumes or applications with recruiters or third parties."
                },
                {
                  icon: Sparkles,
                  title: "Interview Coaching",
                  description: "Review generated talking points and prepare for interviews with context-aware AI suggestions."
                }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col p-6 bg-background rounded-2xl border border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="flex-1 space-y-8">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">From job posting to application in minutes.</h2>
                <div className="space-y-6">
                  {[
                    { step: "1", title: "Upload your master resume", desc: "Add your comprehensive work history. We'll use this as the foundation." },
                    { step: "2", title: "Paste the job description", desc: "Found a role you like? Drop the JD into our AI Assistant." },
                    { step: "3", title: "Generate tailored content", desc: "Get a customized cover letter and optimized resume bullet points instantly." },
                    { step: "4", title: "Track your progress", desc: "Save the application to your pipeline and update its status as you interview." }
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{item.title}</h4>
                        <p className="text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl -z-10 rounded-full" />
                <div className="border border-border/50 rounded-2xl bg-card/50 backdrop-blur p-2 shadow-2xl">
                  <img 
                    src="https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                    alt="Dashboard Preview" 
                    className="rounded-xl w-full h-auto object-cover opacity-80"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-muted/30 border-y border-border/50">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Simple, transparent pricing.</h2>
              <p className="text-muted-foreground text-lg">Invest in your career. Upgrade when you need more power.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {/* Free Tier */}
              <div className="flex flex-col p-8 bg-background rounded-3xl border border-border/50">
                <h3 className="text-2xl font-semibold mb-2">Free</h3>
                <div className="text-muted-foreground mb-6">For casual job seekers.</div>
                <div className="text-4xl font-bold mb-8">$0<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Track up to 10 applications", "1 master resume", "5 AI generations per month", "Basic ATS scoring"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button className="w-full" variant="outline">Get Started</Button>
                </Link>
              </div>

              {/* Pro Tier */}
              <div className="flex flex-col p-8 bg-background rounded-3xl border-2 border-primary relative transform md:-translate-y-4 shadow-xl">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                  Most Popular
                </div>
                <h3 className="text-2xl font-semibold mb-2">Pro</h3>
                <div className="text-muted-foreground mb-6">For active job hunters.</div>
                <div className="text-4xl font-bold mb-8">$19<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Unlimited applications", "Unlimited resumes", "Unlimited AI generations", "Advanced ATS keyword analysis", "Interview prep tools"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Upgrade to Pro</Button>
                </Link>
              </div>

              {/* Enterprise Tier */}
              <div className="flex flex-col p-8 bg-background rounded-3xl border border-border/50">
                <h3 className="text-2xl font-semibold mb-2">Coaching</h3>
                <div className="text-muted-foreground mb-6">For elite candidates.</div>
                <div className="text-4xl font-bold mb-8">$99<span className="text-lg font-normal text-muted-foreground">/mo</span></div>
                <ul className="space-y-4 mb-8 flex-1">
                  {["Everything in Pro", "Human resume review (1/mo)", "Mock interview sessions", "Priority support"].map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button className="w-full" variant="outline">Contact Sales</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/5 -z-10" />
          <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl mb-6">Ready to land your dream job?</h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Join thousands of job seekers who use CareerCopilot to write better applications, faster.
            </p>
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-10 text-lg bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 border-0">
                Create Your Free Account
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="py-8 border-t border-border/50 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>© {new Date().getFullYear()} CareerCopilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}