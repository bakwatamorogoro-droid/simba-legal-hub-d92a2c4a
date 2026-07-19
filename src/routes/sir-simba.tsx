import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Scale, GraduationCap, Award, Gavel, BookOpen, Quote } from "lucide-react";
import sirSimba from "@/assets/sir-simba.jpg";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/sir-simba")({
  head: () => ({
    meta: [
      { title: "Sir Simba Lawyer — Founder | Simba Legal Academy" },
      {
        name: "description",
        content:
          "Kutana na Sir. Simba Lawyer — mwanzilishi wa Simba Legal Academy. Wakili aliyebobea, mwalimu, na kiongozi katika elimu ya sheria.",
      },
      { property: "og:title", content: "Sir Simba Lawyer — Founder & Principal" },
      { property: "og:description", content: "Mwanzilishi wa Simba Legal Academy — where future lawyers are shaped." },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: SirSimbaProfile,
});

const achievements = [
  { icon: GraduationCap, label: "LLB, LLM (Master of Laws)" },
  { icon: Gavel, label: "Advocate of the High Court" },
  { icon: BookOpen, label: "15+ years of legal practice" },
  { icon: Award, label: "Founder — Simba Legal Academy" },
];

const focus = [
  { title: "Constitutional Law", desc: "Utafiti na ufundishaji wa katiba na haki za binadamu." },
  { title: "Criminal Law", desc: "Uwakili wa kesi za jinai na mafunzo ya moot court." },
  { title: "Legal Research", desc: "Kuwaandaa wanafunzi kwa research ya kina ya sheria." },
  { title: "Legal Aid", desc: "Kutoa msaada wa kisheria kwa jamii bila malipo." },
];

function SirSimbaProfile() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div className="font-display text-primary">Simba Legal Academy</div>
          </Link>
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> Nyumbani
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden gradient-hero-bg">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-gold/30 blur-3xl" />
          <div className="absolute left-10 bottom-0 h-96 w-96 rounded-full bg-primary-glow/30 blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[420px_1fr] md:items-center md:py-28">
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl gradient-gold-bg blur-2xl opacity-40" />
            <img
              src={sirSimba}
              alt="Portrait ya Sir Simba Lawyer, wakili na mwanzilishi wa Simba Legal Academy"
              width={1024}
              height={1024}
              className="relative aspect-square w-full rounded-3xl object-cover shadow-elegant ring-4 ring-gold/40"
            />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-gold px-6 py-2 text-xs font-bold uppercase tracking-[0.3em] text-primary shadow-gold">
              Founder & Principal
            </div>
          </div>

          <div className="text-white">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-xs uppercase tracking-[0.3em] text-gold">
              <Scale className="h-3 w-3" /> Advocate of the High Court
            </div>
            <h1 className="font-display text-5xl leading-tight md:text-6xl lg:text-7xl">
              Sir. <span className="gold-text">Simba</span>
              <br />
              Lawyer
            </h1>
            <p className="mt-5 max-w-lg text-lg text-white/75">
              Wakili aliyebobea, mwalimu wa sheria kwa zaidi ya miaka 15, na mwanzilishi wa Simba
              Legal Academy — chuo cha kisasa cha sheria kinachowaandaa mawakili wa kesho.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {achievements.map((a) => (
                <div key={a.label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
                  <a.icon className="h-5 w-5 text-gold" />
                  <span className="text-sm text-white/90">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="border-y border-border/60 bg-muted/30 py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Quote className="mx-auto h-10 w-10 text-gold" />
          <blockquote className="mt-6 font-display text-2xl leading-relaxed text-primary md:text-3xl">
            "Sheria ni chombo cha haki, na haki ni nguzo ya jamii yenye maadili. Nia yangu ni
            kuwaandaa vijana wenye uadilifu, ujuzi, na moyo wa kuwatumikia watu."
          </blockquote>
          <div className="mt-6 text-xs uppercase tracking-[0.3em] text-muted-foreground">
            — Sir. Simba Lawyer
          </div>
        </div>
      </section>

      {/* Focus areas */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">Utaalam</div>
            <h2 className="font-display text-4xl text-primary md:text-5xl">Focus Areas</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {focus.map((f) => (
              <div key={f.title} className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/40 hover:shadow-elegant">
                <div className="font-display text-lg text-primary">{f.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bio */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2">
          <div>
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">Wasifu</div>
            <h2 className="font-display text-4xl text-primary">Safari ya Uwakili</h2>
          </div>
          <div className="space-y-4 text-foreground/80">
            <p>
              Sir. Simba Lawyer alianza safari yake ya sheria akiwa na ndoto ya kuona jamii yenye
              haki na usawa. Baada ya kumaliza LLB na LLM, alijiunga na uwakili na kutumikia
              mahakama mbalimbali za Tanzania.
            </p>
            <p>
              Kupitia uzoefu wake wa zaidi ya miaka 15, aligundua kuwa vijana wengi wanaotaka
              kusomea sheria hawana rasilimali za kutosha za kisasa. Ndipo alipoanzisha
              <strong className="text-primary"> Simba Legal Academy</strong> — kutoa elimu ya sheria
              iliyounganishwa na teknolojia, materials za kisasa, na msaada wa kisheria wa
              vitendo.
            </p>
            <p className="border-l-2 border-gold pl-4 text-primary/90 italic">
              "Kila mwanafunzi anayepita kwenye Simba Legal Academy ni tone la maji katika bahari
              ya haki tunayoijenga."
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background py-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Simba Legal Academy</span>
          <Link to="/" className="text-gold hover:underline">← Rudi Nyumbani</Link>
        </div>
      </footer>
    </div>
  );
}
