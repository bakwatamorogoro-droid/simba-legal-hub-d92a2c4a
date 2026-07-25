import { createFileRoute, Link } from "@tanstack/react-router";
import { BookOpen, FileText, Users, ArrowRight, GraduationCap, ShieldCheck, Scale, Quote, Code2 } from "lucide-react";
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
    ],
  }),
  component: Landing,
});

const cards = [
  { icon: FileText, title: "Individual Assignment", desc: "Login kwa exam number na last name, download question, upload answer.", to: "/individual-assignment", cta: "Enter" },
  { icon: Users, title: "Group Assignment", desc: "Ona assignment za makundi kwa umma. Group leader hutuma jibu.", to: "/group-assignment", cta: "Browse" },
  { icon: GraduationCap, title: "Student Registration", desc: "Jisajili na jina, reg number, phone, course na academic year.", to: "/register", cta: "Register" },
  { icon: ShieldCheck, title: "Admin Panel", desc: "Simamia wanafunzi, courses, academic years, na assignments.", to: "/admin", cta: "Admin" },
] as const;

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border/60">
        <img src={hero} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="relative mx-auto max-w-7xl px-6 py-20 sm:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gold">
              <Scale className="h-3.5 w-3.5" /> Assignment Management System
            </div>
            <h1 className="mt-6 font-display text-4xl leading-tight text-primary sm:text-6xl">
              Simba Legal Academy
            </h1>
            <p className="mt-3 font-display text-xl italic text-gold">
              Learn • Research • Submit • Succeed
            </p>
            <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
              Mfumo wa kisasa wa kusimamia assignments za wanafunzi — jisajili, wasilisha kazi zako binafsi au za kikundi, na fuatilia matokeo yako.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground">
                <Link to="/register">Anza Kujisajili <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/individual-assignment">Individual Assignment</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 max-w-2xl">
          <div className="text-xs uppercase tracking-[0.25em] text-gold">Access Portal</div>
          <h2 className="mt-2 font-display text-3xl text-primary">Chagua sehemu unayotaka</h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ icon: Icon, title, desc, to, cta }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-2xl border border-border bg-card p-6 transition hover:-translate-y-1 hover:border-gold/60 hover:shadow-elegant"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold-bg text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg text-primary">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-gold group-hover:gap-2 transition-all">
                {cta} <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </section>

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
