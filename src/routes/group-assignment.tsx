import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Users, LogOut, User, UserPlus, CheckCircle2, XCircle,
  Upload, Download, Calendar, Sparkles, Award, Crown, Lock, AlertTriangle,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getStudentSession, studentLogout } from "@/lib/student.functions";
import {
  listMyGroupAssignments, listMyClassmates,
  createGroup, respondGroupInvite, leaveOrCancelGroup,
  submitGroupAssignment, getGroupQuestionUrl,
  type GroupAssignmentView, type GroupMember,
} from "@/lib/group.functions";

export const Route = createFileRoute("/group-assignment")({
  head: () => ({ meta: [{ title: "Group Assignment — Simba Legal Academy" }] }),
  component: Page,
});

function Page() {
  const getSession = useServerFn(getStudentSession);
  const { data: session, isLoading } = useQuery({ queryKey: ["student-session"], queryFn: () => getSession() });
  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!session) return <NotLoggedIn />;
  return <GroupDashboard session={session} />;
}

function NotLoggedIn() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-gold-bg text-primary">
          <Users className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl text-primary">Group Assignment Portal</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Ingia kwa Exam Number na Last Name ili kuunda au kujiunga na group.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild><Link to="/login">Ingia / Login</Link></Button>
          <Button asChild variant="outline"><Link to="/register">Jisajili</Link></Button>
        </div>
      </main>
    </div>
  );
}

type Session = { studentId: string; fullName: string; regNumber: string };

function GroupDashboard({ session }: { session: Session }) {
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = useServerFn(studentLogout);

  const fetchAssignments = useServerFn(listMyGroupAssignments);
  const assignments = useQuery({ queryKey: ["my-group-assignments"], queryFn: () => fetchAssignments() });

  // Realtime: refetch when any group/member/submission changes
  useEffect(() => {
    const ch = supabase.channel("group-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => assignments.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, () => assignments.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_submissions" }, () => assignments.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [assignments]);

  async function doLogout() {
    await logout();
    await qc.invalidateQueries({ queryKey: ["student-session"] });
    router.invalidate();
    navigate({ to: "/" });
  }

  const rows = assignments.data ?? [];

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <div className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-gold" />
            <span className="font-medium text-primary">{session.fullName}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs text-muted-foreground">{session.regNumber}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={doLogout}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="font-display text-2xl text-primary">Group Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unda group na wanachama wa course/mwaka wako. Wote wakikonfirm, kiongozi hutuma kazi.
        </p>

        <div className="mt-8 space-y-4">
          {assignments.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Hakuna group assignments bado.
            </div>
          ) : rows.map((r) => (
            <GroupAssignmentCard key={r.id} row={r} session={session} onChanged={() => assignments.refetch()} />
          ))}
        </div>
      </main>
    </div>
  );
}

function GroupAssignmentCard({ row, session, onChanged }: { row: GroupAssignmentView; session: Session; onChanged: () => void }) {
  const [createOpen, setCreateOpen] = useState(false);
  const respond = useServerFn(respondGroupInvite);
  const leave = useServerFn(leaveOrCancelGroup);
  const getQ = useServerFn(getGroupQuestionUrl);

  const deadline = new Date(row.deadline);
  const isOverdue = deadline.getTime() < Date.now();

  async function download() {
    const res = await getQ({ data: { assignment_id: row.id } });
    if (!res.url) return toast.error("Hakuna file ya swali");
    window.open(res.url, "_blank");
  }

  async function respondInvite(accept: boolean) {
    if (!row.my_group) return;
    const res = await respond({ data: { group_id: row.my_group.id, accept } });
    if (!res.ok) toast.error(res.error);
    else { toast.success(accept ? "Umekonfirm" : "Umekataa"); onChanged(); }
  }

  async function leaveGroup() {
    if (!row.my_group) return;
    if (!confirm("Uhakika unataka kutoka/kufuta group?")) return;
    const res = await leave({ data: { group_id: row.my_group.id } });
    if (!res.ok) toast.error(res.error);
    else { toast.success("Imefanyika"); onChanged(); }
  }

  const isLeader = row.my_group?.leader_student_id === session.studentId;
  const myStatus = row.my_group?.members.find((m) => m.student_id === session.studentId)?.status;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-gold/10">
      <div className="mb-3 flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
          <Users className="h-3 w-3" /> Group
        </span>
        {row.course_name && <span className="text-xs text-muted-foreground">· {row.course_name}</span>}
        {row.year_name && <span className="text-xs text-muted-foreground">· {row.year_name}</span>}
      </div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg text-primary">{row.title}</h3>
          {row.description && <p className="mt-1 text-sm text-muted-foreground">{row.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
              <Calendar className="h-3.5 w-3.5" /> Deadline: {deadline.toLocaleString()}
            </span>
            {row.question_name && <span>· {row.question_name}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          {row.question_path && (
            <Button size="sm" variant="outline" onClick={download}><Download className="mr-1 h-4 w-4" /> Question</Button>
          )}
          {!row.my_group && !isOverdue && (
            <Button size="sm" onClick={() => setCreateOpen(true)}><UserPlus className="mr-1 h-4 w-4" /> Unda Group</Button>
          )}
        </div>
      </div>

      {row.my_group && (
        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Group</div>
              <div className="font-display text-primary">{row.my_group.name}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${row.my_group.all_confirmed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                <CheckCircle2 className="h-3.5 w-3.5" /> {row.my_group.confirmed_count}/{row.my_group.total_count} confirmed
              </span>
              {!row.my_group.submission && (
                <Button size="sm" variant="ghost" onClick={leaveGroup}>
                  {isLeader ? "Futa Group" : "Toka"}
                </Button>
              )}
            </div>
          </div>

          <MembersList members={row.my_group.members} session={session} />

          {myStatus === "pending" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-gold/40 bg-gold/5 p-3">
              <span className="text-sm">Umealikwa kwenye group hili. Konfirm?</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => respondInvite(true)}><CheckCircle2 className="mr-1 h-4 w-4" /> Konfirm</Button>
                <Button size="sm" variant="outline" onClick={() => respondInvite(false)}><XCircle className="mr-1 h-4 w-4" /> Kataa</Button>
              </div>
            </div>
          )}

          {isLeader && !row.my_group.submission && (
            <LeaderSubmit
              groupId={row.my_group.id}
              canSubmit={row.my_group.all_confirmed && !isOverdue}
              onChanged={onChanged}
            />
          )}

          {row.my_group.submission && (
            <SubmissionView sub={row.my_group.submission} />
          )}
        </div>
      )}

      {isOverdue && !row.my_group && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" /> Deadline imeshapita.
        </div>
      )}

      <CreateGroupDialog
        open={createOpen} onClose={() => setCreateOpen(false)}
        assignmentId={row.id} assignmentTitle={row.title}
        onCreated={() => { setCreateOpen(false); onChanged(); }}
      />
    </div>
  );
}

function MembersList({ members, session }: { members: GroupMember[]; session: Session }) {
  const [online, setOnline] = useState<Set<string>>(new Set());
  const key = useMemo(() => members.map((m) => m.student_id).sort().join(","), [members]);
  useEffect(() => {
    if (!key) return;
    const ch = supabase.channel(`presence:${key}`, { config: { presence: { key: session.studentId } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<{ id: string }>();
      const ids = new Set<string>();
      Object.values(state).forEach((arr) => arr.forEach((p) => ids.add(p.id)));
      setOnline(ids);
    }).subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ id: session.studentId, name: session.fullName });
    });
    return () => { supabase.removeChannel(ch); };
  }, [key, session.studentId, session.fullName]);

  return (
    <ul className="space-y-2">
      {members.map((m) => {
        const isOnline = online.has(m.student_id);
        return (
          <li key={m.student_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-muted-foreground/30"}`} title={isOnline ? "Live" : "Offline"} />
              {m.is_leader && <Crown className="h-4 w-4 text-gold" />}
              <span className="font-medium text-primary">{m.full_name}</span>
              <span className="text-xs font-mono text-muted-foreground">{m.reg_number}</span>
            </div>
            <StatusBadge status={m.status} />
          </li>
        );
      })}
    </ul>
  );
}

function StatusBadge({ status }: { status: "pending" | "confirmed" | "declined" }) {
  if (status === "confirmed") return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Confirmed</span>;
  if (status === "declined") return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700"><XCircle className="h-3 w-3" /> Declined</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>;
}

function LeaderSubmit({ groupId, canSubmit, onChanged }: { groupId: string; canSubmit: boolean; onChanged: () => void }) {
  const submit = useServerFn(submitGroupAssignment);
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) return toast.error("PDF au Word pekee");
    if (file.size > 15 * 1024 * 1024) return toast.error("Max 15MB");
    setUploading(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(r.error);
        r.readAsDataURL(file);
      });
      const res = await submit({ data: { group_id: groupId, file_base64: base64, file_name: file.name } });
      if (!res.ok) toast.error(res.error);
      else { toast.success("Kazi imetumwa!"); onChanged(); }
    } catch (err) { toast.error((err as Error).message); }
    finally { setUploading(false); }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
      <div className="text-xs text-muted-foreground">
        {canSubmit ? "Wanachama wote wamekonfirm — unaweza kutuma." : "Subiri wanachama wote wakonfirm kwanza."}
      </div>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFile} />
      <Button size="sm" disabled={!canSubmit || uploading} onClick={() => ref.current?.click()}>
        {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
        Tuma Kazi ya Group
      </Button>
    </div>
  );
}

function SubmissionView({ sub }: { sub: NonNullable<GroupAssignmentView["my_group"]>["submission"] }) {
  if (!sub) return null;
  const aiHigh = typeof sub.ai_score === "number" && sub.ai_score >= 60;
  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm inline-flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-primary">Imetumwa:</span>
          <span className="font-mono text-xs">{sub.file_name}</span>
        </div>
        <div className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</div>
      </div>
      {typeof sub.ai_score === "number" && (
        <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${aiHigh ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-background text-muted-foreground"}`}>
          <Sparkles className="mt-0.5 h-3.5 w-3.5" />
          <div>
            <div className="font-semibold">AI Check: {sub.ai_score}%</div>
            {sub.ai_reason && <div className="mt-0.5">{sub.ai_reason}</div>}
          </div>
        </div>
      )}
      {sub.marked_at ? (
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
            <Award className="h-4 w-4" /> {sub.marks}/100
          </span>
          {sub.remarks && <span className="whitespace-pre-wrap text-muted-foreground">Remarks: {sub.remarks}</span>}
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">Bado haijamarkiwa.</div>
      )}
    </div>
  );
}

function CreateGroupDialog({ open, onClose, assignmentId, assignmentTitle, onCreated }: {
  open: boolean; onClose: () => void;
  assignmentId: string; assignmentTitle: string; onCreated: () => void;
}) {
  const fetchClassmates = useServerFn(listMyClassmates);
  const create = useServerFn(createGroup);
  const classmates = useQuery({ queryKey: ["classmates"], queryFn: () => fetchClassmates(), enabled: open });
  const [name, setName] = useState("");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const list = classmates.data ?? [];
  const filtered = list.filter((s) => !q || s.full_name.toLowerCase().includes(q.toLowerCase()) || s.reg_number.toLowerCase().includes(q.toLowerCase()));

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function submit() {
    if (!name.trim()) return toast.error("Jina la group linahitajika");
    if (selected.size < 1) return toast.error("Chagua angalau mwanachama mmoja");
    setSaving(true);
    try {
      const res = await create({ data: { assignment_id: assignmentId, name: name.trim(), member_ids: Array.from(selected) } });
      if (!res.ok) toast.error(res.error);
      else { toast.success("Group imeundwa. Subiri wanachama wakonfirm."); setName(""); setSelected(new Set()); onCreated(); }
    } finally { setSaving(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Unda Group — {assignmentTitle}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Jina la Group</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Team Alpha" />
          </div>
          <div className="space-y-1.5">
            <Label>Wanachama ({selected.size} wamechaguliwa)</Label>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tafuta jina au reg number..." />
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
              {classmates.isLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>
              ) : filtered.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">Hakuna wanafunzi.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((s) => (
                    <li key={s.id}>
                      <button type="button" onClick={() => toggle(s.id)} className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50 ${selected.has(s.id) ? "bg-primary/5" : ""}`}>
                        <div>
                          <div className="font-medium">{s.full_name}</div>
                          <div className="text-xs font-mono text-muted-foreground">{s.reg_number}</div>
                        </div>
                        {selected.has(s.id) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Unda"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
