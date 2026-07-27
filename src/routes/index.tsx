import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText, Users, ArrowRight, GraduationCap, ShieldCheck, Scale, Quote, Code2, LogIn, BookOpen, Award, Sparkles } from "lucide-react";
import hero from "@/assets/hero.jpg";
import founder from "@/assets/founder.jpg";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Simba Legal Academy — Assignment Portal" },
      { name: "description", content: "Portal ya wanafunzi kwa individual na group assignments — Simba Legal Academy." },
      { property: "og:title", content: "Simba Legal Academy — Assignment Portal" },
      { property: "og:description", content: "Learn • Research • Submit • Succeed." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: FileText, title: "Individual Assignment", desc: "Ingia kwa Registration Number, pakua swali, tuma jibu lako.", to: "/individual-assignment", cta: "Enter" },
  { icon: Users, title: "Group Assignment", desc: "Jiunge automatiki na wenzako, jadili online, kisha tuma kazi.", to: "/group-assignment", cta: "Join" },
  { icon: GraduationCap, title: "Student Registration", desc: "Jisajili kwa jina, reg number, phone, course na academic year.", to: "/register", cta: "Register" },
] as const;

const stats = [
  { icon: BookOpen, label: "Courses" },
  { icon: Users, label: "Group Chat" },
  { icon: Sparkles, label: "AI Check" },
  { icon: Award, label: "Instant Marks" },
] as const;

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60 bg-primary">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/70" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-6 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div className="text-primary-foreground">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold">
              <Scale className="h-3.5 w-3.5" /> Assignment Management System
            </div>
            <h1 className="mt-6 font-display text-4xl leading-tight sm:text-6xl">
              Simba Legal <span className="text-gold">Academy</span>
            </h1>
            <p className="mt-3 font-display text-xl italic text-gold">Learn • Research • Submit • Succeed</p>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-primary-foreground/85 sm:text-lg">
              Mfumo wa kisasa wa kusimamia assignments — jisajili, wasilisha kazi zako binafsi au za kikundi, jadili na wenzako online, na fuatilia matokeo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-gold text-primary hover:bg-gold/90">
                <Link to="/register">Anza Kujisajili <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/login"><LogIn className="mr-2 h-4 w-4" /> Student Login</Link>
              </Button>
            </div>
          </div>

          {/* Feature cards column */}
          <div className="grid gap-3">
            {features.map(({ icon: Icon, title, desc, to, cta }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-start gap-4 rounded-2xl border border-gold/25 bg-background/10 p-5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-gold/60 hover:bg-background/15"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gold text-primary shadow-lg">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-lg text-primary-foreground">{title}</div>
                  <div className="mt-0.5 text-sm text-primary-foreground/75">{desc}</div>
                </div>
                <ArrowRight className="mt-3 h-4 w-4 shrink-0 text-gold transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-border bg-background">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 py-8 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-gold-bg text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold">Feature</div>
                <div className="font-display text-primary">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Admin CTA */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-muted/60 to-background p-8 shadow-elegant sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-gold">
              <ShieldCheck className="h-3.5 w-3.5" /> Admin Access
            </div>
            <h3 className="mt-2 font-display text-2xl text-primary">Admin Panel</h3>
            <p className="mt-1 text-sm text-muted-foreground">Simamia wanafunzi, courses, academic years, na assignments.</p>
          </div>
          <Button asChild size="lg" className="mt-4 bg-primary text-primary-foreground sm:mt-0">
            <Link to="/admin">Ingia Admin <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>

      {/* Founder */}
      <section className="border-t border-border/60 bg-gradient-to-b from-background to-muted/30">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[420px_1fr] lg:items-center">
          <div className="relative mx-auto w-full max-w-sm">
            <div className="absolute -inset-3 rounded-3xl bg-gradient-to-br from-gold/30 to-primary/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-gold/40 shadow-elegant">
              <img src={founder} alt="Founder wa Simba Legal Academy" width={1024} height={1280} loading="lazy" className="h-full w-full object-cover" />
            </div>
            <div className="absolute -bottom-3 left-4 right-4 rounded-xl border border-gold/40 bg-background/95 px-4 py-3 text-center shadow-lg backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Founder & Principal</div>
              <div className="font-display text-primary">Sir Simba Lawyer</div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
              <Quote className="h-3.5 w-3.5" /> Mwalimu Mwanzilishi · Founder
            </div>
            <h2 className="mt-4 font-display text-3xl text-primary sm:text-4xl">Neno kutoka kwa Mwanzilishi</h2>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
              "Sheria si maandishi tu — ni chombo cha haki. Mfumo huu umeundwa ili wanafunzi
              wapate nafasi ya kujifunza, kutafiti, na kuwasilisha kazi zao kwa umahiri wa hali ya juu.
              Karibuni Simba Legal Academy."
            </p>
            <p className="mt-3 max-w-2xl text-sm italic leading-relaxed text-muted-foreground">
              "The law is not merely text — it is a tool for justice. This platform empowers our
              students to learn, research, and submit their work with excellence."
            </p>
            <div className="mt-6 h-px w-24 bg-gradient-to-r from-gold to-transparent" />
            <div className="mt-4 font-display text-primary">— Sir Simba Lawyer</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Founder · Simba Legal Academy</div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-primary/95 text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-6 sm:flex-row">
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-gold" />
            © {new Date().getFullYear()} Simba Legal Academy
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-primary-foreground/70">Learn · Research · Submit · Succeed</div>
        </div>
        <div className="border-t border-primary-foreground/10 bg-primary">
          <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-6 py-3 text-xs text-primary-foreground/80">
            <Code2 className="h-3.5 w-3.5 text-gold" />
            <span>Designed and Developed by</span>
            <span className="font-display text-gold">Viwango Software</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
