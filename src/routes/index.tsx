import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Scale,
  GraduationCap,
  FileText,
  Users,
  Shield,
  Search,
  ArrowRight,
  CheckCircle2,
  Gavel,
} from "lucide-react";
import logo from "@/assets/logo.png";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

const features = [
  {
    icon: BookOpen,
    title: "Lecture Notes & Past Papers",
    desc: "Access lecture notes, past papers, na Legal Research Materials — PDF, DOCX, PPTX.",
  },
  {
    icon: Scale,
    title: "Case Laws & Constitution",
    desc: "Case laws, Constitution, Acts, na Regulations zote mahali pamoja kwa research.",
  },
  {
    icon: FileText,
    title: "Assignment Submission",
    desc: "Wasilisha individual au group assignments na pokea alama moja kwa moja.",
  },
  {
    icon: Users,
    title: "Academic Discussions",
    desc: "Jadili kesi, share ideas, na fanya kazi na wenzako kwa moot court prep.",
  },
  {
    icon: Gavel,
    title: "Legal Aid Section",
    desc: "Uliza maswali ya kisheria, book consultation, na pata legal news & articles.",
  },
  {
    icon: Search,
    title: "Smart Search",
    desc: "Tafuta notes, cases, results kwa registration number — matokeo ya papo hapo.",
  },
];

const portals = [
  {
    icon: GraduationCap,
    tag: "Student Portal",
    title: "Kwa Wanafunzi",
    points: [
      "View & download notes na cases",
      "Submit individual/group assignments",
      "Angalia alama kwa registration number",
      "Notifications & profile management",
    ],
    cta: "Student Login",
  },
  {
    icon: Shield,
    tag: "Admin Panel",
    title: "Kwa Walimu & Admin",
    points: [
      "Manage students & lecturers",
      "Upload notes, cases & assignments",
      "Grade individual & group work",
      "Reports, backup & announcements",
    ],
    cta: "Admin Login",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="Simba Legal Academy" width={44} height={44} className="h-11 w-11 object-contain" />
            <div className="hidden sm:block">
              <div className="font-display text-lg leading-tight text-primary">Simba Legal Academy</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Learn • Research • Submit • Succeed
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-primary">Features</a>
            <a href="#portals" className="transition-colors hover:text-primary">Portals</a>
            <Link to="/sir-simba" className="transition-colors hover:text-primary">Founder</Link>
            <a href="#legal-aid" className="transition-colors hover:text-primary">Legal Aid</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={hero} alt="" width={1920} height={1200} className="h-full w-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        </div>

        <div className="mx-auto grid max-w-7xl gap-14 px-6 py-24 md:grid-cols-2 md:items-center md:py-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              Modern Legal Education Platform
            </div>
            <h1 className="font-display text-5xl leading-[1.05] text-primary md:text-6xl lg:text-7xl">
              Where future <span className="gold-text">lawyers</span> are shaped.
            </h1>
            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Simba Legal Academy huleta lecture notes, case laws, assignments, na legal aid mahali pamoja —
              iliyoundwa mahsusi kwa wanafunzi wa sheria na waalimu wao.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-elegant hover:bg-primary/90">
                <Link to="/auth">
                  Anza kama Mwanafunzi
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-primary/20">
                <Link to="/sir-simba">Kutana na Founder</Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-8 text-sm text-muted-foreground">
              <div>
                <div className="font-display text-2xl text-primary">500+</div>
                <div className="text-xs uppercase tracking-wider">Lecture Notes</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="font-display text-2xl text-primary">1,200+</div>
                <div className="text-xs uppercase tracking-wider">Case Laws</div>
              </div>
              <div className="h-8 w-px bg-border" />
              <div>
                <div className="font-display text-2xl text-primary">24/7</div>
                <div className="text-xs uppercase tracking-wider">Legal Aid</div>
              </div>
            </div>
          </div>

          {/* Glass card preview */}
          <div className="relative">
            <div className="glass-card rounded-2xl p-8 shadow-elegant">
              <img src={logo} alt="" width={120} height={120} className="mx-auto h-28 w-28 object-contain" />
              <div className="mt-4 text-center">
                <div className="font-display text-2xl text-primary">Simba Legal Academy</div>
                <div className="mt-1 text-xs uppercase tracking-[0.3em] text-gold">Est. Excellence</div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                {[
                  ["Notes", "500+"],
                  ["Cases", "1.2k"],
                  ["Students", "800"],
                  ["Lecturers", "45"],
                ].map(([label, val]) => (
                  <div key={label} className="rounded-lg bg-white/40 p-3 backdrop-blur">
                    <div className="text-xs uppercase text-muted-foreground">{label}</div>
                    <div className="font-display text-xl text-primary">{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gold/30 blur-3xl" />
            <div className="absolute -bottom-6 -left-6 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60 bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 max-w-2xl">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              What we offer
            </div>
            <h2 className="font-display text-4xl text-primary md:text-5xl">
              Kila kitu unachohitaji kwa masomo ya sheria.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-xl border border-border bg-card p-7 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant"
              >
                <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg gradient-gold-bg text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 font-display text-xl text-primary">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Portals */}
      <section id="portals" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
              Two Portals, One Academy
            </div>
            <h2 className="font-display text-4xl text-primary md:text-5xl">
              Chagua portal yako
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {portals.map((p) => (
              <div
                key={p.title}
                className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card p-10 shadow-elegant"
              >
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                    <p.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-widest text-gold">{p.tag}</div>
                    <div className="font-display text-2xl text-primary">{p.title}</div>
                  </div>
                </div>
                <ul className="mb-8 space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-3 text-sm text-foreground/80">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                  <Link to="/auth">
                    {p.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section id="legal-aid" className="px-6 pb-24">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl gradient-hero-bg p-12 shadow-elegant md:p-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <div className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                Legal Aid & Consultation
              </div>
              <h2 className="font-display text-4xl leading-tight text-white md:text-5xl">
                Have a legal question? <span className="gold-text">Ask.</span>
              </h2>
              <p className="mt-4 max-w-md text-white/70">
                Uliza swali la kisheria, book consultation, au soma legal articles — msaada wa
                kitaalamu kila wakati.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 md:justify-end">
              <Button size="lg" className="gradient-gold-bg text-primary shadow-gold hover:opacity-90">
                Ask a Question
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 bg-white/5 text-white hover:bg-white/10"
              >
                Book Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60 bg-muted/40 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="flex items-center gap-3">
            <img src={logo} alt="" width={32} height={32} className="h-8 w-8 object-contain" />
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Simba Legal Academy. All rights reserved.
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold">
            Learn • Research • Submit • Succeed
          </div>
        </div>
      </footer>
    </div>
  );
}
