import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Users, GraduationCap, Bell, BarChart3, Trash2, Plus, LogOut, ArrowLeft, ShieldCheck, Loader2,
} from "lucide-react";
import logo from "@/assets/logo.png";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Simba Legal Academy" }] }),
  component: AdminPanel,
});

type Student = { id: string; full_name: string; reg_number: string; course: string | null; phone: string | null; created_at: string };
type Lecturer = { id: string; full_name: string; specialty: string | null; email: string | null; phone: string | null; created_at: string };
type Announcement = { id: string; title: string; body: string; created_at: string };

function AdminPanel() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return navigate({ to: "/auth" });
      const { data } = await supabase.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
      setAuthorized(!!data);
      setChecking(false);
    })();
  }, [navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
        <div className="max-w-md rounded-2xl border border-destructive/40 bg-card p-8 text-center shadow-elegant">
          <ShieldCheck className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 font-display text-2xl text-primary">Access Denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">Huna ruhusa ya kuingia kwenye Admin Panel.</p>
          <Button asChild className="mt-4"><Link to="/dashboard">Rudi Dashboard</Link></Button>
        </div>
      </div>
    );
  }

  return <AdminContent />;
}

function AdminContent() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [subCount, setSubCount] = useState(0);
  const [avgMarks, setAvgMarks] = useState<number | null>(null);
  const [submissionSeries, setSubmissionSeries] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const [{ data: st }, { data: lc }, { data: ann }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("lecturers").select("*").order("created_at", { ascending: false }),
      supabase.from("announcements").select("*").order("created_at", { ascending: false }),
      supabase.from("submissions").select("id, marks, submitted_at"),
    ]);
    setStudents(st ?? []);
    setLecturers(lc ?? []);
    setAnnouncements(ann ?? []);
    setSubCount(subs?.length ?? 0);
    const graded = (subs ?? []).filter((s) => s.marks != null);
    setAvgMarks(graded.length ? graded.reduce((a, b) => a + Number(b.marks), 0) / graded.length : null);

    // Build last 7-day series
    const days: Record<string, number> = {};
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(5, 10); // MM-DD
      days[key] = 0;
    }
    (subs ?? []).forEach((s) => {
      const key = new Date(s.submitted_at).toISOString().slice(5, 10);
      if (key in days) days[key]++;
    });
    setSubmissionSeries(Object.entries(days).map(([day, count]) => ({ day, count })));
    setLoading(false);
  }

  useEffect(() => { refresh(); }, []);

  const roleChart = useMemo(
    () => [
      { name: "Students", value: students.length, color: "hsl(232, 45%, 25%)" },
      { name: "Lecturers", value: lecturers.length, color: "hsl(45, 70%, 55%)" },
    ],
    [students.length, lecturers.length]
  );

  async function logout() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <img src={logo} alt="" width={40} height={40} className="h-10 w-10 object-contain" />
            <div>
              <div className="font-display text-primary">Admin Panel</div>
              <div className="text-[10px] uppercase tracking-[0.25em] text-gold">Simba Legal Academy</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="mr-1 h-4 w-4" /> Toka
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Registered Students" value={students.length} />
          <StatCard icon={GraduationCap} label="Lecturers" value={lecturers.length} />
          <StatCard icon={Bell} label="Announcements" value={announcements.length} />
          <StatCard icon={BarChart3} label="Total Submissions" value={subCount} />
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="mb-6 flex w-full flex-wrap justify-start">
            <TabsTrigger value="analytics">📊 Analytics</TabsTrigger>
            <TabsTrigger value="students">👨‍🎓 Students</TabsTrigger>
            <TabsTrigger value="lecturers">👨‍🏫 Lecturers</TabsTrigger>
            <TabsTrigger value="announcements">📣 Announcements</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-1 text-xs uppercase tracking-wider text-gold">Last 7 days</div>
                <h3 className="mb-4 font-display text-xl text-primary">Assignment Submissions</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <BarChart data={submissionSeries}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="day" fontSize={12} />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="hsl(232, 45%, 25%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-1 text-xs uppercase tracking-wider text-gold">Community</div>
                <h3 className="mb-4 font-display text-xl text-primary">Users by Role</h3>
                <div className="h-72">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={roleChart} dataKey="value" nameKey="name" outerRadius={90} label>
                        {roleChart.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
                <div className="mb-1 text-xs uppercase tracking-wider text-gold">Performance</div>
                <h3 className="mb-4 font-display text-xl text-primary">Average Marks</h3>
                <div className="font-display text-5xl text-primary">
                  {avgMarks == null ? "—" : `${avgMarks.toFixed(1)} / 100`}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Kutoka kwa {subCount} uwasilishaji ({avgMarks == null ? 0 : "graded"}).
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="students">
            <StudentsTable rows={students} loading={loading} onChanged={refresh} />
          </TabsContent>

          <TabsContent value="lecturers">
            <LecturersManager rows={lecturers} onChanged={refresh} />
          </TabsContent>

          <TabsContent value="announcements">
            <AnnouncementsManager rows={announcements} onChanged={refresh} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
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

function StudentsTable({ rows, loading, onChanged }: { rows: Student[]; loading: boolean; onChanged: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = rows.filter(
    (r) =>
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.reg_number.toLowerCase().includes(search.toLowerCase()) ||
      (r.course ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function remove(id: string) {
    if (!confirm("Uhakika unataka kufuta mwanafunzi huyu?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Amefutwa.");
    onChanged();
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl text-primary">Students ({rows.length})</h3>
        <Input placeholder="Search jina, reg, au course..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-3">Jina</th>
              <th className="pb-3">Reg No</th>
              <th className="pb-3">Course</th>
              <th className="pb-3">Simu</th>
              <th className="pb-3 text-right">Vitendo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">Hakuna wanafunzi.</td></tr>
            ) : (
              filtered.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-0">
                  <td className="py-3 font-medium text-foreground">{r.full_name}</td>
                  <td className="py-3 font-mono text-xs">{r.reg_number}</td>
                  <td className="py-3 text-muted-foreground">{r.course ?? "—"}</td>
                  <td className="py-3 text-muted-foreground">{r.phone ?? "—"}</td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const lecturerSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  specialty: z.string().trim().max(120).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
});

function LecturersManager({ rows, onChanged }: { rows: Lecturer[]; onChanged: () => void }) {
  const [form, setForm] = useState({ full_name: "", specialty: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const parsed = lecturerSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { error } = await supabase.from("lecturers").insert({
      full_name: parsed.data.full_name,
      specialty: parsed.data.specialty || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Lecturer ameongezwa.");
    setForm({ full_name: "", specialty: "", email: "", phone: "" });
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm("Futa lecturer huyu?")) return;
    const { error } = await supabase.from("lecturers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Amefutwa.");
    onChanged();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={add} className="h-fit rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-xl text-primary">Ongeza Lecturer</h3>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Jina Kamili</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div className="space-y-1"><Label>Utaalam (Specialty)</Label><Input value={form.specialty} onChange={(e) => setForm({ ...form, specialty: e.target.value })} placeholder="Constitutional Law" /></div>
          <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div className="space-y-1"><Label>Simu</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        </div>
        <Button type="submit" disabled={saving} className="mt-4 w-full bg-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Ongeza</>}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-xl text-primary">Lecturers ({rows.length})</h3>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Hakuna lecturer bado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((l) => (
              <li key={l.id} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <div className="font-medium text-primary">{l.full_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.specialty ?? "—"} · {l.email ?? "—"} · {l.phone ?? "—"}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(l.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const annSchema = z.object({
  title: z.string().trim().min(3).max(160),
  body: z.string().trim().min(3).max(2000),
});

function AnnouncementsManager({ rows, onChanged }: { rows: Announcement[]; onChanged: () => void }) {
  const [form, setForm] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);

  async function post(e: React.FormEvent) {
    e.preventDefault();
    const parsed = annSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("announcements").insert({
      title: parsed.data.title,
      body: parsed.data.body,
      created_by: userData.user?.id,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tangazo limechapishwa.");
    setForm({ title: "", body: "" });
    onChanged();
  }

  async function remove(id: string) {
    if (!confirm("Futa tangazo hili?")) return;
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Limefutwa.");
    onChanged();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={post} className="h-fit rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-xl text-primary">Andika Tangazo</h3>
        <div className="space-y-3">
          <div className="space-y-1"><Label>Kichwa</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div className="space-y-1"><Label>Ujumbe</Label><Textarea rows={6} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
        </div>
        <Button type="submit" disabled={saving} className="mt-4 w-full bg-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Chapisha</>}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-xl text-primary">Matangazo Yote ({rows.length})</h3>
        {rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Hakuna tangazo.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((a) => (
              <li key={a.id} className="rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-display text-primary">{a.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground">{a.body}</div>
                    <div className="mt-2 text-xs uppercase tracking-wider text-muted-foreground/70">
                      {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(a.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
