import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Scale,
  GraduationCap,
  Award,
  Gavel,
  BookOpen,
  Quote,
  Mail,
  Phone,
  MapPin,
  Linkedin,
  Twitter,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
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

const stats = [
  { value: "15+", label: "Years in Practice" },
  { value: "500+", label: "Students Mentored" },
  { value: "200+", label: "Cases Handled" },
  { value: "40+", label: "Legal Aid Camps" },
];

const achievements = [
  { icon: GraduationCap, label: "LLB, LLM (Master of Laws)", sub: "University of Dar es Salaam" },
  { icon: Gavel, label: "Advocate of the High Court", sub: "Tanganyika Law Society" },
  { icon: BookOpen, label: "Legal Researcher & Author", sub: "Constitutional & Criminal Law" },
  { icon: Award, label: "Founder — Simba Legal Academy", sub: "Est. 2015" },
];

const focus = [
  { title: "Constitutional Law", desc: "Utafiti wa katiba na haki za binadamu.", num: "01" },
  { title: "Criminal Law", desc: "Uwakili wa kesi za jinai na moot court.", num: "02" },
  { title: "Legal Research", desc: "Mafunzo ya research ya kina.", num: "03" },
  { title: "Legal Aid", desc: "Msaada wa kisheria bila malipo.", num: "04" },
];

const timeline = [
  { year: "2008", title: "LLB Graduation", desc: "Alihitimu LLB, University of Dar es Salaam." },
  { year: "2010", title: "Advocate Admission", desc: "Alikubaliwa kama Advocate of the High Court." },
  { year: "2013", title: "LLM Master's Degree", desc: "Alimaliza LLM in Constitutional Law." },
  { year: "2015", title: "Simba Legal Academy", desc: "Alianzisha chuo cha kisasa cha sheria." },
  { year: "2024", title: "Digital Transformation", desc: "Alizindua mfumo wa kisasa wa online learning." },
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

      {/* HERO — asymmetric magazine layout */}
      <section className="relative overflow-hidden bg-primary text-white">
        {/* Ambient background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-[500px] w-[500px] rounded-full bg-gold/20 blur-3xl" />
          <div className="absolute -left-20 bottom-0 h-[500px] w-[500px] rounded-full bg-primary-glow/30 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Vertical FOUNDER label */}
        <div className="absolute left-6 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[10px] uppercase tracking-[0.5em] text-gold/70 lg:block">
          Founder — Est. 2015
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-16 px-6 py-20 md:grid-cols-[1.15fr_1fr] md:items-center md:py-28 lg:pl-20">
          {/* LEFT — Text */}
          <div className="order-2 md:order-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] uppercase tracking-[0.4em] text-gold backdrop-blur">
              <Sparkles className="h-3 w-3" /> Founder & Principal
            </div>

            <h1 className="font-display text-[3.5rem] leading-[0.95] tracking-tight md:text-7xl lg:text-[5.5rem]">
              Sir. <span className="gold-text italic">Simba</span>
              <br />
              <span className="text-white/95">Lawyer</span>
              <span className="text-gold">.</span>
            </h1>

            <div className="mt-6 flex items-center gap-4">
              <div className="h-px w-16 bg-gold" />
              <div className="text-xs uppercase tracking-[0.35em] text-white/70">
                Advocate · Educator · Reformer
              </div>
            </div>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/75">
              Wakili aliyebobea, mwalimu wa sheria kwa zaidi ya miaka 15, na mwanzilishi wa
              <span className="text-gold"> Simba Legal Academy</span> — chuo cha kisasa
              kinachowaandaa mawakili wa kesho.
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a
                href="#contact"
                className="group inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary shadow-gold transition-transform hover:scale-105"
              >
                Wasiliana Nami
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:rotate-45" />
              </a>
              <a
                href="#journey"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-medium text-white backdrop-blur hover:bg-white/10"
              >
                Wasifu Kamili
              </a>
            </div>
          </div>

          {/* RIGHT — Portrait with floating glass cards */}
          <div className="relative order-1 md:order-2">
            {/* Gold frame */}
            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] border border-gold/40" />
              <div className="absolute -inset-6 rounded-[2.5rem] border border-gold/20" />
              <div className="absolute inset-0 -z-10 translate-x-4 translate-y-4 rounded-[2rem] bg-gold/30 blur-2xl" />

              <img
                src={sirSimba}
                alt="Portrait ya Sir Simba Lawyer, wakili na mwanzilishi wa Simba Legal Academy"
                width={1024}
                height={1280}
                className="relative aspect-[4/5] w-full rounded-[2rem] object-cover shadow-elegant"
              />

              {/* Floating glass badge — top */}
              <div className="absolute -left-6 top-8 hidden rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-xl sm:block">
                <div className="text-[9px] uppercase tracking-[0.3em] text-gold">Since</div>
                <div className="font-display text-2xl text-white">2010</div>
              </div>

              {/* Floating glass badge — bottom */}
              <div className="absolute -right-6 bottom-10 hidden rounded-2xl border border-gold/40 bg-primary/70 px-5 py-4 backdrop-blur-xl sm:block">
                <div className="flex items-center gap-3">
                  <Scale className="h-6 w-6 text-gold" />
                  <div>
                    <div className="font-display text-sm text-white">High Court</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/60">Advocate</div>
                  </div>
                </div>
              </div>

              {/* Signature ribbon */}
              <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-6 py-2 text-[10px] font-bold uppercase tracking-[0.4em] text-primary shadow-gold">
                Sir. Simba Lawyer
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="relative border-t border-white/10 bg-primary/60 backdrop-blur">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-white/10 md:grid-cols-4 md:divide-x">
            {stats.map((s) => (
              <div key={s.label} className="px-6 py-6 text-center md:py-8">
                <div className="font-display text-3xl text-gold md:text-4xl">{s.value}</div>
                <div className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-2 text-xs uppercase tracking-[0.3em] text-gold">Credentials</div>
              <h2 className="font-display text-4xl text-primary md:text-5xl">Sifa & Mafanikio</h2>
            </div>
            <div className="text-sm text-muted-foreground">Miaka 15+ ya utaalam</div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((a) => (
              <div
                key={a.label}
                className="group flex items-center gap-5 rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold/50 hover:shadow-elegant"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary text-gold ring-1 ring-gold/30 transition-colors group-hover:bg-gold group-hover:text-primary">
                  <a.icon className="h-6 w-6" />
                </div>
                <div>
                  <div className="font-display text-lg text-primary">{a.label}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">{a.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote — dark band */}
      <section className="relative overflow-hidden bg-primary py-24 text-white">
        <div className="pointer-events-none absolute inset-0">
          <Quote className="absolute left-10 top-10 h-40 w-40 text-gold/10" />
          <Quote className="absolute bottom-10 right-10 h-40 w-40 rotate-180 text-gold/10" />
        </div>
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <div className="mx-auto mb-6 h-px w-16 bg-gold" />
          <blockquote className="font-display text-2xl leading-relaxed text-white md:text-4xl">
            "Sheria ni chombo cha <span className="gold-text italic">haki</span>, na haki ni nguzo
            ya jamii yenye maadili. Nia yangu ni kuwaandaa vijana wenye uadilifu, ujuzi, na moyo wa
            kuwatumikia watu."
          </blockquote>
          <div className="mt-8 text-xs uppercase tracking-[0.4em] text-gold">— Sir. Simba Lawyer</div>
        </div>
      </section>

      {/* Focus areas — numbered bento */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mb-12 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">Utaalam</div>
            <h2 className="font-display text-4xl text-primary md:text-5xl">Focus Areas</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {focus.map((f) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-gold hover:shadow-elegant"
              >
                <div className="mb-6 font-display text-5xl text-gold/30 transition-colors group-hover:text-gold">
                  {f.num}
                </div>
                <div className="font-display text-xl text-primary">{f.title}</div>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
                <div className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gold transition-transform group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey / Timeline */}
      <section id="journey" className="bg-muted/30 py-20">
        <div className="mx-auto max-w-5xl px-6">
          <div className="mb-14 text-center">
            <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">Safari</div>
            <h2 className="font-display text-4xl text-primary md:text-5xl">Journey ya Uwakili</h2>
          </div>

          <div className="relative">
            {/* vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-gold via-gold/40 to-transparent md:left-1/2" />

            <div className="space-y-10">
              {timeline.map((t, i) => (
                <div
                  key={t.year}
                  className={`relative grid gap-4 md:grid-cols-2 md:gap-12 ${
                    i % 2 === 0 ? "" : "md:[&>*:first-child]:col-start-2"
                  }`}
                >
                  {/* dot */}
                  <div className="absolute left-4 top-2 z-10 h-3 w-3 -translate-x-1/2 rounded-full bg-gold ring-4 ring-background md:left-1/2" />

                  <div className={`pl-12 md:pl-0 ${i % 2 === 0 ? "md:text-right md:pr-12" : "md:pl-12"}`}>
                    <div className="font-display text-3xl text-gold">{t.year}</div>
                    <div className="mt-1 font-display text-xl text-primary">{t.title}</div>
                    <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-3xl gradient-hero-bg p-10 shadow-elegant md:p-16">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div className="text-white">
                <div className="mb-3 text-xs uppercase tracking-[0.3em] text-gold">Wasiliana</div>
                <h2 className="font-display text-4xl md:text-5xl">
                  Njia ya <span className="gold-text italic">Ushauri</span>
                </h2>
                <p className="mt-4 max-w-md text-white/75">
                  Kwa mashauri ya kisheria, ushirikiano wa kitaaluma, au msaada wa moot court,
                  wasiliana nami moja kwa moja.
                </p>

                <div className="mt-8 flex gap-3">
                  <a
                    href="#"
                    aria-label="LinkedIn"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-gold hover:text-primary"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                  <a
                    href="#"
                    aria-label="Twitter"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white hover:bg-gold hover:text-primary"
                  >
                    <Twitter className="h-5 w-5" />
                  </a>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Mail, label: "Email", value: "simba@simbalegal.ac.tz" },
                  { icon: Phone, label: "Simu", value: "+255 700 000 000" },
                  { icon: MapPin, label: "Ofisi", value: "Dar es Salaam, Tanzania" },
                ].map((c) => (
                  <div
                    key={c.label}
                    className="flex items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:border-gold/50"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold text-primary">
                      <c.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-[0.3em] text-gold">{c.label}</div>
                      <div className="text-white">{c.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
