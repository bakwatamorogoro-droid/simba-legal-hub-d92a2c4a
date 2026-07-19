import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BookOpen,
  FileText,
  Scale,
  Bell,
  LogOut,
  ShieldCheck,
  GraduationCap,
  Award,
  Sparkles,
} from "lucide-react";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Simba Legal Academy" }] }),
  component: Dashboard,
});

type Profile = { full_name: string; reg_number: string; course: string | null };

function Dashboard() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; body: string; created_at: string }[]>([]);
  const [stats, setStats] = useState({ notes: 0, cases: 0, pending: 0, submitted: 0 });
  const [canBootstrap, setCanBootstrap] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const [{ data: prof }, { data: roles }, { data: anns }, { data: subs }, { count: adminCount }] = await Promise.all([
        supabase.from("profiles").select("full_name, reg_number, course").eq("id", userData.user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", userData.user.id),
        supabase.from("announcements").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(5),
        supabase.from("submissions").select("id").eq("student_id", userData.user.id),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
      ]);

      setProfile(prof);
      setIsAdmin(!!roles?.some((r) => r.role === "admin"));
      setAnnouncements(anns ?? []);
      setStats({ notes: 0, cases: 0, pending: 0, submitted: subs?.length ?? 0 });
      setCanBootstrap((adminCount ?? 0) === 0);
    })();
  }, []);

  async function bootstrap() {
    const { data, error } = await supabase.rpc("bootstrap_first_admin");
    if (error) return toast.error(error.message);
    if (data) {
      toast.success("Umefanywa Admin!");
      setIsAdmin(true);
      setCanBootstrap(false);
    } else {
      toast.info("Admin tayari yupo.");
      setCanBootstrap(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <div className="font-display text-primary">Simba Legal Academy</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Student Dashboard</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button asChild size="sm" className="gradient-gold-bg text-primary shadow-gold hover:opacity-90">
                <Link to="/admin"><ShieldCheck className="mr-1 h-4 w-4" /> Admin Panel</Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="mr-1 h-4 w-4" /> Toka
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Welcome hero */}
        <div className="mb-8 overflow-hidden rounded-2xl gradient-hero-bg p-8 text-white shadow-elegant">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold">Karibu tena</div>
              <h1 className="mt-2 font-display text-3xl md:text-4xl">
                Hujambo, {profile?.full_name ?? "Mwanafunzi"} 👋
              </h1>
              <p className="mt-1 text-sm text-white/70">
                Reg No: <span className="font-mono text-gold">{profile?.reg_number ?? "—"}</span>
                {profile?.course && <> · {profile.course}</>}
              </p>
            </div>
            <GraduationCap className="h-16 w-16 text-gold/70" />
          </div>
        </div>

        {canBootstrap && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-gold/40 bg-gold/10 p-4">
            <div>
              <div className="font-semibold text-primary">Bado hakuna admin kwenye mfumo.</div>
              <div className="text-sm text-muted-foreground">Bofya kifungo ili kujifanya admin wa kwanza.</div>
            </div>
            <Button onClick={bootstrap} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Sparkles className="mr-2 h-4 w-4" /> Kuwa Admin wa Kwanza
            </Button>
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={BookOpen} label="Total Notes" value={stats.notes} />
          <StatCard icon={Scale} label="Legal Cases" value={stats.cases} />
          <StatCard icon={FileText} label="Pending Assignments" value={stats.pending} />
          <StatCard icon={Award} label="Submitted" value={stats.submitted} />
        </div>

        {/* Two column */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5 text-gold" />
              <h2 className="font-display text-xl text-primary">Announcements</h2>
            </div>
            {announcements.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Hakuna tangazo bado.</p>
            ) : (
              <ul className="space-y-4">
                {announcements.map((a) => (
                  <li key={a.id} className="border-l-2 border-gold pl-4">
                    <div className="font-display text-primary">{a.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{a.body}</div>
                    <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground/60">
                      {new Date(a.created_at).toLocaleDateString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl text-primary">Quick Links</h2>
            <div className="space-y-2 text-sm">
              <QuickLink label="Lecture Notes" />
              <QuickLink label="Case Laws" />
              <QuickLink label="Submit Assignment" />
              <QuickLink label="My Results" />
              <QuickLink label="Legal Aid" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:shadow-elegant">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 font-display text-3xl text-primary">{value}</div>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-gold-bg text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ label }: { label: string }) {
  return (
    <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-foreground/80 transition-colors hover:bg-muted">
      <span>{label}</span>
      <span className="text-gold">→</span>
    </button>
  );
}
