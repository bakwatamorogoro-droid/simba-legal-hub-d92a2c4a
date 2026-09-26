import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import {
  Loader2, LogOut, ShieldCheck, Users, BookOpen, CalendarDays, Plus, Trash2, Pencil, Search, LayoutDashboard,
  FileText, Upload, Download, Award, Bell,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteImagesPanel } from "@/components/site-images-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  adminLogin, adminLogout, getAdminSession,
  listCourses, createCourse, updateCourse, deleteCourse,
  listYears, createYear, updateYear, deleteYear,
  listStudents, updateStudent, deleteStudent,
  listAssignments, createAssignment, deleteAssignment,
  listSubmissionsForAssignment, markSubmission, signSubmissionDownload, signQuestionDownload,
  listGroupSubmissionsForAssignment, markGroupSubmission, signGroupSubmissionDownload,
  listRecentSubmissions,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Simba Legal Academy" }] }),
  component: AdminRoot,
});

function AdminRoot() {
  const getSession = useServerFn(getAdminSession);
  const { data: session, isLoading } = useQuery({ queryKey: ["admin-session"], queryFn: () => getSession() });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  return session ? <AdminDashboard username={session.username} /> : <AdminLogin />;
}

function AdminLogin() {
  const router = useRouter();
  const qc = useQueryClient();
  const login = useServerFn(adminLogin);
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await login({ data: form });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Karibu, ${res.username}`);
    await qc.invalidateQueries({ queryKey: ["admin-session"] });
    router.invalidate();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-16">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold-bg text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl text-primary">Admin Login</h1>
              <p className="text-xs uppercase tracking-wider text-gold">Simba Legal Academy</p>
            </div>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="admin" />
            </div>
            <div className="space-y-1.5">
              <Label>Password</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign In"}
            </Button>
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Default: <code className="rounded bg-muted px-1.5 py-0.5">admin</code> / <code className="rounded bg-muted px-1.5 py-0.5">admin123</code>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}

function AdminDashboard({ username }: { username: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const logout = useServerFn(adminLogout);

  const fetchStudents = useServerFn(listStudents);
  const fetchCourses = useServerFn(listCourses);
  const fetchYears = useServerFn(listYears);

  const createCourseFn = useServerFn(createCourse);
  const updateCourseFn = useServerFn(updateCourse);
  const deleteCourseFn = useServerFn(deleteCourse);
  const createYearFn = useServerFn(createYear);
  const updateYearFn = useServerFn(updateYear);
  const deleteYearFn = useServerFn(deleteYear);

  const students = useQuery({ queryKey: ["students"], queryFn: () => fetchStudents() });
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => fetchCourses() });
  const years = useQuery({ queryKey: ["years"], queryFn: () => fetchYears() });

  async function doLogout() {
    await logout();
    await qc.invalidateQueries({ queryKey: ["admin-session"] });
    router.invalidate();
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <ShieldCheck className="h-4 w-4 text-gold" />
            <span className="text-muted-foreground">Signed in as</span>
            <span className="font-medium text-primary">{username}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={doLogout}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard icon={Users} label="Students" value={students.data?.length ?? 0} />
          <StatCard icon={BookOpen} label="Courses" value={courses.data?.length ?? 0} />
          <StatCard icon={CalendarDays} label="Academic Years" value={years.data?.length ?? 0} />
        </div>

        <Tabs defaultValue="assignments">
          <TabsList className="flex w-full flex-wrap justify-start">
            <TabsTrigger value="assignments"><FileText className="mr-1 h-4 w-4" /> Assignments</TabsTrigger>
            <TabsTrigger value="students"><LayoutDashboard className="mr-1 h-4 w-4" /> Students</TabsTrigger>
            <TabsTrigger value="courses"><BookOpen className="mr-1 h-4 w-4" /> Courses</TabsTrigger>
            <TabsTrigger value="years"><CalendarDays className="mr-1 h-4 w-4" /> Academic Years</TabsTrigger>
            <TabsTrigger value="notifications"><Bell className="mr-1 h-4 w-4" /> Notifications</TabsTrigger>
            <TabsTrigger value="media"><Upload className="mr-1 h-4 w-4" /> Picha za Tovuti</TabsTrigger>
          </TabsList>

          <TabsContent value="assignments" className="mt-6">
            <AssignmentsPanel courses={courses.data ?? []} years={years.data ?? []} />
          </TabsContent>
          <TabsContent value="students" className="mt-6">
            <StudentsPanel
              rows={students.data ?? []}
              loading={students.isLoading}
              courses={courses.data ?? []}
              years={years.data ?? []}
              onChanged={() => students.refetch()}
            />
          </TabsContent>
          <TabsContent value="courses" className="mt-6">
            <SimpleCrudPanel
              title="Courses"
              rows={courses.data ?? []}
              loading={courses.isLoading}
              placeholder="e.g. Bachelor of Laws (LLB)"
              onCreate={(name) => createCourseFn({ data: { name } })}
              onUpdate={(id, name) => updateCourseFn({ data: { id, name } })}
              onDelete={(id) => deleteCourseFn({ data: { id } })}
              onChanged={() => courses.refetch()}
            />
          </TabsContent>
          <TabsContent value="years" className="mt-6">
            <SimpleCrudPanel
              title="Academic Years"
              rows={years.data ?? []}
              loading={years.isLoading}
              placeholder="e.g. 2025/2026"
              onCreate={(name) => createYearFn({ data: { name } })}
              onUpdate={(id, name) => updateYearFn({ data: { id, name } })}
              onDelete={(id) => deleteYearFn({ data: { id } })}
              onChanged={() => years.refetch()}
            />
          </TabsContent>
          <TabsContent value="notifications" className="mt-6">
            <NotificationsPanel />
          </TabsContent>
          <TabsContent value="media" className="mt-6">
            <SiteImagesPanel />
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

type Named = { id: string; name: string };

function SimpleCrudPanel({
  title, rows, loading, placeholder, onCreate, onUpdate, onDelete, onChanged,
}: {
  title: string;
  rows: Named[];
  loading: boolean;
  placeholder: string;
  onCreate: (name: string) => Promise<unknown>;
  onUpdate: (id: string, name: string) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Named | null>(null);
  const [editName, setEditName] = useState("");

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try { await onCreate(name.trim()); toast.success("Added"); setName(""); onChanged(); }
    catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  }
  async function save() {
    if (!editing || !editName.trim()) return;
    try { await onUpdate(editing.id, editName.trim()); toast.success("Updated"); setEditing(null); onChanged(); }
    catch (err) { toast.error((err as Error).message); }
  }
  async function remove(id: string) {
    if (!confirm("Uhakika? / Are you sure?")) return;
    try { await onDelete(id); toast.success("Deleted"); onChanged(); }
    catch (err) { toast.error((err as Error).message); }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      <form onSubmit={add} className="h-fit rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-lg text-primary">Add {title.replace(/s$/, "")}</h3>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} />
        </div>
        <Button type="submit" disabled={saving} className="mt-4 w-full bg-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Add</>}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-lg text-primary">{title} ({rows.length})</h3>
        {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Hakuna bado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">{r.name}</span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setEditName(r.name); }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit {title.replace(/s$/, "")}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <Label>Name</Label>
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type StudentRow = {
  id: string; full_name: string; reg_number: string; phone: string;
  exam_number: string | null; last_name: string | null;
  created_at: string;
  course: { id: string; name: string } | null;
  academic_year: { id: string; name: string } | null;
};

function StudentsPanel({
  rows, loading, courses, years, onChanged,
}: {
  rows: StudentRow[]; loading: boolean; courses: Named[]; years: Named[]; onChanged: () => void;
}) {
  const doUpdate = useServerFn(updateStudent);
  const doDelete = useServerFn(deleteStudent);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<StudentRow | null>(null);
  const [form, setForm] = useState({ full_name: "", last_name: "", reg_number: "", exam_number: "", phone: "", academic_year_id: "", course_id: "" });

  function openEdit(r: StudentRow) {
    setEditing(r);
    setForm({
      full_name: r.full_name, last_name: r.last_name ?? "", reg_number: r.reg_number,
      exam_number: r.exam_number ?? "", phone: r.phone,
      academic_year_id: r.academic_year?.id ?? "", course_id: r.course?.id ?? "",
    });
  }
  async function save() {
    if (!editing) return;
    try { await doUpdate({ data: { id: editing.id, ...form } }); toast.success("Updated"); setEditing(null); onChanged(); }
    catch (err) { toast.error((err as Error).message); }
  }
  async function remove(id: string) {
    if (!confirm("Futa mwanafunzi huyu?")) return;
    try { await doDelete({ data: { id } }); toast.success("Deleted"); onChanged(); }
    catch (err) { toast.error((err as Error).message); }
  }

  const filtered = rows.filter((r) => {
    const s = q.toLowerCase();
    return !s || r.full_name.toLowerCase().includes(s) || r.reg_number.toLowerCase().includes(s) ||
      (r.course?.name ?? "").toLowerCase().includes(s);
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg text-primary">Students ({rows.length})</h3>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, reg, course..." className="w-64 pl-9" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="pb-3">Name</th>
              <th className="pb-3">Reg No</th>
              <th className="pb-3">Exam No</th>
              <th className="pb-3">Course</th>
              <th className="pb-3">Year</th>
              <th className="pb-3">Phone</th>
              <th className="pb-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">Hakuna wanafunzi.</td></tr>
            ) : filtered.map((r) => (
              <tr key={r.id} className="border-b border-border/50 last:border-0">
                <td className="py-3 font-medium text-foreground">{r.full_name}{r.last_name ? <span className="text-muted-foreground"> · {r.last_name}</span> : null}</td>
                <td className="py-3 font-mono text-xs">{r.reg_number}</td>
                <td className="py-3 font-mono text-xs">{r.exam_number ?? "—"}</td>
                <td className="py-3 text-muted-foreground">{r.course?.name ?? "—"}</td>
                <td className="py-3 text-muted-foreground">{r.academic_year?.name ?? "—"}</td>
                <td className="py-3 text-muted-foreground">{r.phone}</td>
                <td className="py-3 text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit Student</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Last Name</Label><Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} /></div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Reg Number</Label><Input value={form.reg_number} onChange={(e) => setForm({ ...form, reg_number: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Exam Number</Label><Input value={form.exam_number} onChange={(e) => setForm({ ...form, exam_number: e.target.value })} /></div>
            </div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Course</Label>
                <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------- Assignments Panel ----------
type AssignmentRow = {
  id: string; title: string; description: string | null;
  question_path: string | null; question_name: string | null;
  deadline: string; created_at: string; kind: "individual" | "group";
  course: { id: string; name: string } | null;
  academic_year: { id: string; name: string } | null;
  submission_count?: number;
};

function AssignmentsPanel({ courses, years }: { courses: Named[]; years: Named[] }) {
  const fetchAssignments = useServerFn(listAssignments);
  const doCreate = useServerFn(createAssignment);
  const doDelete = useServerFn(deleteAssignment);
  const getQ = useServerFn(signQuestionDownload);
  const assignments = useQuery({ queryKey: ["assignments"], queryFn: () => fetchAssignments() });

  const [form, setForm] = useState<{ title: string; description: string; deadline: string; course_id: string; academic_year_id: string; kind: "individual" | "group" }>({
    title: "", description: "", deadline: "", course_id: "", academic_year_id: "", kind: "individual",
  });
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState<AssignmentRow | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title || !form.deadline || !form.course_id || !form.academic_year_id)
      return toast.error("Jaza sehemu zote muhimu");
    setSaving(true);
    try {
      let question_base64: string | null = null;
      let question_name: string | null = null;
      if (file) {
        question_base64 = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(r.error);
          r.readAsDataURL(file);
        });
        question_name = file.name;
      }
      await doCreate({ data: { ...form, description: form.description || null, question_base64, question_name } });
      toast.success("Assignment created");
      setForm({ title: "", description: "", deadline: "", course_id: "", academic_year_id: "", kind: "individual" });
      setFile(null);
      assignments.refetch();
    } catch (err) { toast.error((err as Error).message); }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Futa assignment hii na submissions zake zote?")) return;
    try { await doDelete({ data: { id } }); toast.success("Deleted"); assignments.refetch(); }
    catch (err) { toast.error((err as Error).message); }
  }

  async function download(id: string) {
    const res = await getQ({ data: { assignment_id: id } });
    if (!res.url) return toast.error("Hakuna file");
    window.open(res.url, "_blank");
  }

  const rows = assignments.data ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-[400px_1fr]">
      <form onSubmit={add} className="h-fit space-y-3 rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-2 font-display text-lg text-primary">New Assignment</h3>
        <div className="space-y-1.5"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Contract Law — Case Analysis" /></div>
        <div className="space-y-1.5"><Label>Description / Swali</Label><Textarea rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Maelezo mafupi..." /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Course</Label>
            <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
              <SelectTrigger><SelectValue placeholder="Chagua" /></SelectTrigger>
              <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Academic Year</Label>
            <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
              <SelectTrigger><SelectValue placeholder="Chagua" /></SelectTrigger>
              <SelectContent>{years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Aina / Type</Label>
            <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as "individual" | "group" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="group">Group</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Deadline</Label><Input type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>Question File (PDF/Word) — Optional</Label>
          <Input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
        </div>
        <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="mr-2 h-4 w-4" /> Create Assignment</>}
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-lg text-primary">Assignments ({rows.length})</h3>
        {assignments.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Hakuna assignments bado.</p>
        ) : (
          <div className="space-y-3">
            {rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${r.kind === "group" ? "bg-gold/20 text-gold" : "bg-primary/10 text-primary"}`}>
                        {r.kind}
                      </span>
                      <div className="font-medium text-primary">{r.title}</div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{r.course?.name ?? "—"}</span>
                      <span>·</span>
                      <span>{r.academic_year?.name ?? "—"}</span>
                      <span>·</span>
                      <span>Deadline: {new Date(r.deadline).toLocaleString()}</span>
                      <span>·</span>
                      <span className="font-medium text-primary">{r.submission_count ?? 0} submission(s)</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {r.question_path && (
                      <Button variant="ghost" size="icon" onClick={() => download(r.id)}><Download className="h-4 w-4" /></Button>
                    )}
                    <Button variant="outline" size="sm" onClick={() => setViewing(r)}><Award className="mr-1 h-4 w-4" /> Submissions</Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <SubmissionsDialog assignment={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}

function SubmissionsDialog({ assignment, onClose }: { assignment: AssignmentRow | null; onClose: () => void }) {
  if (!assignment) return null;
  return assignment.kind === "group"
    ? <GroupSubmissionsDialog assignment={assignment} onClose={onClose} />
    : <IndividualSubmissionsDialog assignment={assignment} onClose={onClose} />;
}

const AI_TEMPLATES = [
  "Kazi nzuri — muundo mzuri na hoja imara.",
  "Marekebisho: Ongeza rejea (case citation) kwa hoja hii.",
  "Kosa: Sheria uliyotaja haitumiki hapa.",
  "AI detected — andika kwa maneno yako mwenyewe.",
];

function AiBadge({ score, reason }: { score: number | null; reason: string | null }) {
  if (typeof score !== "number") return <span className="text-xs text-muted-foreground">AI: —</span>;
  const high = score >= 60;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${high ? "bg-destructive/15 text-destructive" : "bg-emerald-100 text-emerald-700"}`} title={reason ?? undefined}>
      AI {score}%
    </span>
  );
}

export type Annotation = { type: "tick" | "cross" | "note"; text: string; points?: number | null };

function MarkingBox({
  marks, remarks, annotations, onChange,
}: {
  marks: string; remarks: string; annotations: Annotation[];
  onChange: (m: string, r: string, a: Annotation[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const [points, setPoints] = useState("");

  function add(type: Annotation["type"]) {
    const text = draft.trim() || (type === "tick" ? "Sahihi / Correct" : type === "cross" ? "Kosa / Wrong" : "Maelezo / Note");
    const p = points.trim() === "" ? null : Number(points);
    const next = [...annotations, { type, text, points: isNaN(p as number) ? null : p }];
    onChange(marks, remarks, next);
    setDraft(""); setPoints("");
  }
  function remove(i: number) {
    onChange(marks, remarks, annotations.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Input className="h-8 w-24" type="number" min={0} max={100} placeholder="0-100" value={marks} onChange={(e) => onChange(e.target.value, remarks, annotations)} />
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>

      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <div className="mb-2 text-xs font-semibold text-destructive">Peni Nyekundu — tiki, kosa au maelezo</div>
        <div className="flex flex-wrap items-center gap-2">
          <Input className="h-8 min-w-[180px] flex-1" placeholder="Andika maelezo ya alama hii..." value={draft} onChange={(e) => setDraft(e.target.value)} />
          <Input className="h-8 w-20" type="number" placeholder="pts" value={points} onChange={(e) => setPoints(e.target.value)} />
          <button type="button" onClick={() => add("tick")}
            className="rounded-md border border-emerald-500/40 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">✓ Tick</button>
          <button type="button" onClick={() => add("cross")}
            className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive hover:bg-destructive/15">✗ Kosa</button>
          <button type="button" onClick={() => add("note")}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs font-semibold hover:bg-muted">✎ Note</button>
        </div>
        {annotations.length > 0 && (
          <ul className="mt-2 space-y-1">
            {annotations.map((a, i) => (
              <li key={i} className="flex items-center gap-2 rounded-md bg-background px-2 py-1 text-xs">
                <span className={a.type === "tick" ? "text-emerald-600" : a.type === "cross" ? "text-destructive" : "text-muted-foreground"}>
                  {a.type === "tick" ? "✓" : a.type === "cross" ? "✗" : "✎"}
                </span>
                <span className="flex-1">{a.text}</span>
                {typeof a.points === "number" && <span className="font-semibold">{a.points > 0 ? `+${a.points}` : a.points}</span>}
                <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">×</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Textarea rows={4} placeholder="Remarks / Marekebisho..." value={remarks} onChange={(e) => onChange(marks, e.target.value, annotations)} />
      <div className="flex flex-wrap gap-1">
        {AI_TEMPLATES.map((t) => (
          <button key={t} type="button" onClick={() => onChange(marks, remarks ? `${remarks}\n• ${t}` : `• ${t}`, annotations)}
            className="rounded-full border border-border bg-background px-2 py-0.5 text-[11px] hover:bg-muted">
            + {t.split(" ").slice(0, 3).join(" ")}…
          </button>
        ))}
      </div>
    </div>
  );
}

function InlinePreview({ url, fileName }: { url: string; fileName: string }) {
  const isPdf = /\.pdf$/i.test(fileName);
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-border">
      {isPdf ? (
        <iframe src={url} title={fileName} className="h-[420px] w-full bg-white" />
      ) : (
        <div className="flex items-center justify-between gap-3 bg-muted/40 px-3 py-4 text-xs text-muted-foreground">
          <span>Word document — preview haipatikani mtandaoni. Pakua ili kusoma.</span>
          <a href={url} target="_blank" rel="noreferrer" className="rounded-md border border-border bg-background px-2 py-1 text-primary hover:bg-muted">Fungua</a>
        </div>
      )}
    </div>
  );
}

function IndividualSubmissionsDialog({ assignment, onClose }: { assignment: AssignmentRow; onClose: () => void }) {
  const fetchSubs = useServerFn(listSubmissionsForAssignment);
  const doMark = useServerFn(markSubmission);
  const signDL = useServerFn(signSubmissionDownload);
  const subs = useQuery({
    queryKey: ["submissions", assignment.id],
    queryFn: () => fetchSubs({ data: { assignment_id: assignment.id } }),
  });

  const [marking, setMarking] = useState<string | null>(null);
  const [mForm, setMForm] = useState<{ marks: string; remarks: string; annotations: Annotation[] }>({ marks: "", remarks: "", annotations: [] });
  const [previewUrl, setPreviewUrl] = useState<Record<string, string>>({});

  async function save(id: string) {
    const m = Number(mForm.marks);
    if (isNaN(m) || m < 0 || m > 100) return toast.error("Marks 0-100");
    try {
      await doMark({ data: { id, marks: m, remarks: mForm.remarks, annotations: mForm.annotations } });
      toast.success("Marked"); setMarking(null); subs.refetch();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function download(id: string) {
    const res = await signDL({ data: { submission_id: id } });
    if (!res.url) return toast.error("File haipatikani");
    window.open(res.url, "_blank");
  }

  async function togglePreview(id: string) {
    if (previewUrl[id]) { setPreviewUrl((p) => { const n = { ...p }; delete n[id]; return n; }); return; }
    const res = await signDL({ data: { submission_id: id } });
    if (!res.url) return toast.error("File haipatikani");
    setPreviewUrl((p) => ({ ...p, [id]: res.url as string }));
  }

  function exportCSV() {
    const rows = subs.data ?? [];
    const header = ["Reg Number", "Full Name", "Last Name", "File", "Submitted", "AI %", "Marks", "Remarks"];
    const lines = [header.join(",")].concat(rows.map((r) => [
      r.student?.reg_number ?? "", r.student?.full_name ?? "", r.student?.last_name ?? "",
      r.file_name, new Date(r.submitted_at).toISOString(),
      r.ai_score ?? "", r.marks ?? "", (r.remarks ?? "").replace(/,/g, ";").replace(/\n/g, " "),
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")));
    downloadCSV(lines.join("\n"), `${assignment.title.replace(/[^\w]+/g, "_")}-marks.csv`);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Individual Submissions — {assignment.title}</span>
            {(subs.data?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          {subs.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (subs.data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hakuna submissions bado.</p>
          ) : (
            <div className="space-y-3">
              {(subs.data ?? []).map((s) => {
                const marked = s.marks !== null;
                const pass = marked && (s.marks as number) >= 50;
                const ringClass = marked ? (pass ? "border-emerald-500/60 bg-emerald-50/40" : "border-destructive/60 bg-destructive/5") : "border-border";
                return (
                <div key={s.id} className={`rounded-xl border p-4 ${ringClass}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium text-primary">{s.student?.full_name ?? "—"}</div>
                        <span className="font-mono text-xs text-muted-foreground">{s.student?.reg_number ?? "—"}</span>
                        <AiBadge score={s.ai_score} reason={s.ai_reason} />
                        {marked && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${pass ? "bg-emerald-100 text-emerald-700" : "bg-destructive/15 text-destructive"}`}>
                            {pass ? "✓ Pass" : "✗ Fail"}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {s.file_name} · {new Date(s.submitted_at).toLocaleString()}
                      </div>
                      {s.ai_reason && typeof s.ai_score === "number" && (
                        <div className="mt-1 text-xs italic text-muted-foreground">{s.ai_reason}</div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => togglePreview(s.id)}>
                        <FileText className="mr-1 h-4 w-4" /> {previewUrl[s.id] ? "Funga" : "Preview"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => download(s.id)}><Download className="mr-1 h-4 w-4" /></Button>
                      {marking !== s.id && (
                        <Button size="sm" onClick={() => { setMarking(s.id); setMForm({ marks: String(s.marks ?? ""), remarks: s.remarks ?? "", annotations: s.annotations ?? [] }); }}>
                          <Pencil className="mr-1 h-4 w-4" /> {marked ? "Edit" : "Mark"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {previewUrl[s.id] && <InlinePreview url={previewUrl[s.id]} fileName={s.file_name} />}

                  {marking === s.id ? (
                    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                      <MarkingBox marks={mForm.marks} remarks={mForm.remarks} annotations={mForm.annotations} onChange={(m, r, a) => setMForm({ marks: m, remarks: r, annotations: a })} />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMarking(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => save(s.id)}>Save</Button>
                      </div>
                    </div>
                  ) : marked ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm">
                      <span className={`inline-flex items-center gap-1 font-semibold ${pass ? "text-emerald-600" : "text-destructive"}`}>
                        <Award className="h-4 w-4" /> {s.marks}/100
                      </span>
                      {s.remarks && <span className="whitespace-pre-wrap text-xs text-muted-foreground">{s.remarks}</span>}
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function GroupSubmissionsDialog({ assignment, onClose }: { assignment: AssignmentRow; onClose: () => void }) {
  const fetchSubs = useServerFn(listGroupSubmissionsForAssignment);
  const doMark = useServerFn(markGroupSubmission);
  const signDL = useServerFn(signGroupSubmissionDownload);
  const subs = useQuery({
    queryKey: ["group-submissions", assignment.id],
    queryFn: () => fetchSubs({ data: { assignment_id: assignment.id } }),
  });

  const [marking, setMarking] = useState<string | null>(null);
  const [mForm, setMForm] = useState<{ marks: string; remarks: string; annotations: Annotation[] }>({ marks: "", remarks: "", annotations: [] });
  const [previewUrl, setPreviewUrl] = useState<Record<string, string>>({});

  async function save(id: string) {
    const m = Number(mForm.marks);
    if (isNaN(m) || m < 0 || m > 100) return toast.error("Marks 0-100");
    try {
      await doMark({ data: { id, marks: m, remarks: mForm.remarks, annotations: mForm.annotations } });
      toast.success("Marked"); setMarking(null); subs.refetch();
    } catch (err) { toast.error((err as Error).message); }
  }

  async function download(id: string) {
    const res = await signDL({ data: { submission_id: id } });
    if (!res.url) return toast.error("File haipatikani");
    window.open(res.url, "_blank");
  }

  async function togglePreview(id: string) {
    if (previewUrl[id]) { setPreviewUrl((p) => { const n = { ...p }; delete n[id]; return n; }); return; }
    const res = await signDL({ data: { submission_id: id } });
    if (!res.url) return toast.error("File haipatikani");
    setPreviewUrl((p) => ({ ...p, [id]: res.url as string }));
  }

  function exportCSV() {
    const rows = subs.data ?? [];
    const header = ["Group", "Member Reg", "Member Name", "Last Name", "Role", "File", "Submitted", "AI %", "Marks", "Remarks"];
    const lines = [header.join(",")];
    rows.forEach((g) => {
      g.members.forEach((m) => {
        lines.push([
          g.group?.name ?? "", m.reg_number, m.full_name, m.last_name ?? "", m.role,
          g.file_name, new Date(g.submitted_at).toISOString(),
          g.ai_score ?? "", g.marks ?? "", (g.remarks ?? "").replace(/,/g, ";").replace(/\n/g, " "),
        ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
      });
    });
    downloadCSV(lines.join("\n"), `${assignment.title.replace(/[^\w]+/g, "_")}-group-marks.csv`);
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span>Group Submissions — {assignment.title}</span>
            {(subs.data?.length ?? 0) > 0 && (
              <Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-1 h-4 w-4" /> Export CSV</Button>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto">
          {subs.isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (subs.data ?? []).length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Hakuna group submissions bado.</p>
          ) : (
            <div className="space-y-3">
              {(subs.data ?? []).map((g) => {
                const marked = g.marks !== null;
                const pass = marked && (g.marks as number) >= 50;
                const ringClass = marked ? (pass ? "border-emerald-500/60 bg-emerald-50/40" : "border-destructive/60 bg-destructive/5") : "border-border";
                return (
                <div key={g.id} className={`rounded-xl border p-4 ${ringClass}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="font-display text-primary">{g.group?.name ?? "—"}</div>
                        <AiBadge score={g.ai_score} reason={g.ai_reason} />
                        {marked && (
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${pass ? "bg-emerald-100 text-emerald-700" : "bg-destructive/15 text-destructive"}`}>
                            {pass ? "✓ Pass" : "✗ Fail"}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {g.file_name} · {new Date(g.submitted_at).toLocaleString()}
                      </div>
                      {g.ai_reason && typeof g.ai_score === "number" && (
                        <div className="mt-1 text-xs italic text-muted-foreground">{g.ai_reason}</div>
                      )}
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {g.members.map((m) => (
                          <li key={m.reg_number} className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-xs">
                            <span className="font-medium">{m.full_name}</span>
                            <span className="font-mono text-[10px] text-muted-foreground">{m.reg_number}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => togglePreview(g.id)}>
                        <FileText className="mr-1 h-4 w-4" /> {previewUrl[g.id] ? "Funga" : "Preview"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => download(g.id)}><Download className="mr-1 h-4 w-4" /></Button>
                      {marking !== g.id && (
                        <Button size="sm" onClick={() => { setMarking(g.id); setMForm({ marks: String(g.marks ?? ""), remarks: g.remarks ?? "", annotations: g.annotations ?? [] }); }}>
                          <Pencil className="mr-1 h-4 w-4" /> {marked ? "Edit" : "Mark"}
                        </Button>
                      )}
                    </div>
                  </div>

                  {previewUrl[g.id] && <InlinePreview url={previewUrl[g.id]} fileName={g.file_name} />}

                  {marking === g.id ? (
                    <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
                      <MarkingBox marks={mForm.marks} remarks={mForm.remarks} annotations={mForm.annotations} onChange={(m, r, a) => setMForm({ marks: m, remarks: r, annotations: a })} />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setMarking(null)}>Cancel</Button>
                        <Button size="sm" onClick={() => save(g.id)}>Save (kwa members wote)</Button>
                      </div>
                    </div>
                  ) : marked ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-border pt-3 text-sm">
                      <span className={`inline-flex items-center gap-1 font-semibold ${pass ? "text-emerald-600" : "text-destructive"}`}>
                        <Award className="h-4 w-4" /> {g.marks}/100
                      </span>
                      {g.remarks && <span className="whitespace-pre-wrap text-xs text-muted-foreground">{g.remarks}</span>}
                    </div>
                  ) : null}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}


// ---------- Notifications Panel ----------
function NotificationsPanel() {
  const fetchRecent = useServerFn(listRecentSubmissions);
  const q = useQuery({ queryKey: ["recent-submissions"], queryFn: () => fetchRecent() });
  const rows = (q.data ?? []) as unknown as Array<{
    id: string; submitted_at: string; file_name: string; marks: number | null;
    assignment: { title: string } | null;
    student: { full_name: string; reg_number: string } | null;
  }>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="mb-4 font-display text-lg text-primary">Recent Submissions</h3>
      {q.isLoading ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : rows.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Hakuna notifications bado.</p>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium text-primary">{r.student?.full_name} <span className="font-mono text-xs text-muted-foreground">({r.student?.reg_number})</span></div>
                <div className="text-xs text-muted-foreground">Submitted <b>{r.assignment?.title}</b> — {r.file_name}</div>
              </div>
              <div className="text-right text-xs">
                <div className="text-muted-foreground">{new Date(r.submitted_at).toLocaleString()}</div>
                {r.marks !== null && <div className="mt-1 font-semibold text-emerald-600">{r.marks}/100</div>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
