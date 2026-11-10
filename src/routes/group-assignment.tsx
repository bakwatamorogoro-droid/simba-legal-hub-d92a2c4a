import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, Users, LogOut, User, UserPlus, CheckCircle2,
  Upload, Download, Calendar, Sparkles, Award, Crown, Lock, AlertTriangle,
  Send, MessageSquare,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { ErrorState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { getStudentSession, studentLogout } from "@/lib/student.functions";
import {
  listMyGroupAssignments, joinGroupAssignment,
  submitGroupAssignment, getGroupQuestionUrl,
  listGroupChat, sendGroupChat,
  type GroupAssignmentView, type GroupMember,
} from "@/lib/group.functions";

export const Route = createFileRoute("/group-assignment")({
  head: () => ({ meta: [{ title: "Group Assignment — Simba Legal Academy" }] }),
  component: Page,
});

type Session = { studentId: string; fullName: string; regNumber: string };

function Page() {
  const getSession = useServerFn(getStudentSession);
  const { data: session, isLoading, isError, refetch } = useQuery({
    queryKey: ["student-session"],
    queryFn: () => getSession(),
    retry: 1,
  });
  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (isError) return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto max-w-md px-6 py-20"><ErrorState onRetry={() => refetch()} /></main>
    </div>
  );
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
          Ingia kwa Registration Number ili kujiunga automatiki na wenzako wa course na mwaka.
        </p>
        <div className="mt-6 flex gap-3">
          <Button asChild><Link to="/login">Ingia / Login</Link></Button>
          <Button asChild variant="outline"><Link to="/register">Jisajili</Link></Button>
        </div>
      </main>
    </div>
  );
}

function GroupDashboard({ session }: { session: Session }) {
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = useServerFn(studentLogout);
  const fetchAssignments = useServerFn(listMyGroupAssignments);
  const assignments = useQuery({ queryKey: ["my-group-assignments"], queryFn: () => fetchAssignments() });

  useEffect(() => {
    const ch = supabase.channel("group-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members" }, () => assignments.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, () => assignments.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_submissions" }, () => assignments.refetch())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_chat_messages" }, () => assignments.refetch())
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
          Jiunge na assignment — utakutana automatiki na wenzako wa course na mwaka mmoja. Ongelea kabla ya kutuma; watakaoshiriki mazungumzo watajumuishwa kwenye submission.
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
  const join = useServerFn(joinGroupAssignment);
  const getQ = useServerFn(getGroupQuestionUrl);
  const [joining, setJoining] = useState(false);

  const deadline = new Date(row.deadline);
  const isOverdue = deadline.getTime() < Date.now();

  async function download() {
    const res = await getQ({ data: { assignment_id: row.id } });
    if (!res.url) return toast.error("Hakuna file ya swali");
    window.open(res.url, "_blank");
  }

  async function doJoin() {
    setJoining(true);
    const res = await join({ data: { assignment_id: row.id } });
    setJoining(false);
    if (!res.ok) toast.error(res.error);
    else { toast.success("Umejiunga!"); onChanged(); }
  }

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
          {row.question_path && row.my_group && (
            <Button size="sm" variant="outline" onClick={download}><Download className="mr-1 h-4 w-4" /> Question</Button>
          )}
          {!row.my_group && !isOverdue && (
            <Button size="sm" onClick={doJoin} disabled={joining}>
              {joining ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1 h-4 w-4" />}
              Jiunge
            </Button>
          )}
        </div>
      </div>

      {row.my_group && (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Members</div>
                <div className="font-display text-primary">{row.my_group.name}</div>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> {row.my_group.members.length} wamejiunga
              </span>
            </div>
            <MembersList members={row.my_group.members} session={session} />

            {!row.my_group.submission && (
              <SubmitBox
                groupId={row.my_group.id}
                disabled={isOverdue}
                onChanged={onChanged}
              />
            )}
            {row.my_group.submission && <SubmissionView sub={row.my_group.submission} />}
          </div>

          <ChatPanel assignmentId={row.id} session={session} />
        </div>
      )}

      {isOverdue && !row.my_group && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" /> Deadline imeshapita.
        </div>
      )}
    </div>
  );
}

function MembersList({ members, session }: { members: GroupMember[]; session: Session }) {
  const [online, setOnline] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (members.length === 0) return;
    const key = members.map((m) => m.student_id).sort().join(",");
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
  }, [members, session.studentId, session.fullName]);

  return (
    <ul className="space-y-1.5">
      {members.map((m) => {
        const isOnline = online.has(m.student_id);
        return (
          <li key={m.student_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/30"}`} title={isOnline ? "Live" : "Offline"} />
              {m.is_leader && <Crown className="h-4 w-4 text-gold" />}
              <span className="font-medium text-primary">{m.full_name}</span>
              <span className="font-mono text-xs text-muted-foreground">{m.reg_number}</span>
            </div>
            {m.did_chat ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <MessageSquare className="h-3 w-3" /> Alishiriki
              </span>
            ) : (
              <span className="text-[10px] text-muted-foreground">Bado</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function ChatPanel({ assignmentId, session }: { assignmentId: string; session: Session }) {
  const fetchChat = useServerFn(listGroupChat);
  const send = useServerFn(sendGroupChat);
  const chat = useQuery({ queryKey: ["chat", assignmentId], queryFn: () => fetchChat({ data: { assignment_id: assignmentId } }) });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ch = supabase.channel(`chat-${assignmentId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "group_chat_messages", filter: `assignment_id=eq.${assignmentId}` }, () => chat.refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [assignmentId, chat]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.data?.length]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setSending(true);
    const res = await send({ data: { assignment_id: assignmentId, message: t } });
    setSending(false);
    if (!res.ok) return toast.error(res.error);
    setText("");
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-gold" />
          <div className="text-sm font-semibold text-primary">Discussion</div>
        </div>
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Chat kabla ya kutuma</div>
      </div>
      <div className="max-h-72 min-h-[220px] flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {(chat.data ?? []).length === 0 && (
          <div className="py-8 text-center text-xs text-muted-foreground">Bado hakuna ujumbe. Anzisha mazungumzo!</div>
        )}
        {(chat.data ?? []).map((m) => {
          const mine = m.student_id === session.studentId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "border border-border bg-muted"}`}>
                {!mine && <div className="mb-0.5 text-[10px] font-semibold opacity-70">{m.full_name} · {m.reg_number}</div>}
                <div className="whitespace-pre-wrap">{m.message}</div>
                <div className={`mt-1 text-[9px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{new Date(m.created_at).toLocaleTimeString()}</div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <form onSubmit={submit} className="flex gap-2 border-t border-border p-3">
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Andika ujumbe..." maxLength={2000} />
        <Button type="submit" size="sm" disabled={sending || !text.trim()}>
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

function SubmitBox({ groupId, disabled, onChanged }: { groupId: string; disabled: boolean; onChanged: () => void }) {
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
        Yeyote aliyejiunga anaweza kutuma. Waliochat watajumuishwa kama washiriki.
      </div>
      <input ref={ref} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" className="hidden" onChange={onFile} />
      <Button size="sm" disabled={disabled || uploading} onClick={() => ref.current?.click()}>
        {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
        Tuma Kazi
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
        <div className="inline-flex items-center gap-2 text-sm">
          <Lock className="h-4 w-4 text-emerald-600" />
          <span className="font-medium text-primary">Imetumwa:</span>
          <span className="font-mono text-xs">{sub.file_name}</span>
        </div>
        <div className="text-xs text-muted-foreground">{new Date(sub.submitted_at).toLocaleString()}</div>
      </div>
      {sub.participants.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          <span className="font-semibold text-primary">Washiriki:</span>{" "}
          {sub.participants.map((p) => `${p.full_name} (${p.reg_number})`).join(", ")}
        </div>
      )}
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
          <Button asChild size="sm" variant="outline" className="ml-auto">
            <Link to="/marked-paper/$kind/$id" params={{ kind: "group", id: sub.id }}>
              <Award className="mr-1 h-4 w-4" /> Ona karatasi ya group
            </Link>
          </Button>
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">Bado haijamarkiwa.</div>
      )}
    </div>
  );
}
