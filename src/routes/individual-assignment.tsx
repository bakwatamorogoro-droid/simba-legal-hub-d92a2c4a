import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Loader2, FileText, Upload, Download, LogOut, Calendar, CheckCircle2,
  Clock, Award, AlertTriangle, User, Sparkles, Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import {
  getStudentSession, studentLogout, listMyAssignments,
  getMyQuestionUrl, submitMyAssignment,
} from "@/lib/student.functions";

export const Route = createFileRoute("/individual-assignment")({
  head: () => ({ meta: [{ title: "Individual Assignment — Simba Legal Academy" }] }),
  component: Page,
});

function Page() {
  const getSession = useServerFn(getStudentSession);
  const { data: session, isLoading } = useQuery({ queryKey: ["student-session"], queryFn: () => getSession() });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!session) return <NotLoggedIn />;
  return <StudentDashboard session={session} />;
}

function NotLoggedIn() {
  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-xl flex-col items-center px-6 py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl gradient-gold-bg text-primary">
          <FileText className="h-7 w-7" />
        </div>
        <h1 className="mt-5 font-display text-2xl text-primary">Individual Assignment Portal</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Tafadhali ingia kupitia Exam Number na Last Name yako ili kuona assignments zako.
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

function StudentDashboard({ session }: { session: Session }) {
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const logout = useServerFn(studentLogout);
  const fetchAssignments = useServerFn(listMyAssignments);
  const assignments = useQuery({ queryKey: ["my-assignments"], queryFn: () => fetchAssignments() });

  async function doLogout() {
    await logout();
    await qc.invalidateQueries({ queryKey: ["student-session"] });
    router.invalidate();
    navigate({ to: "/" });
  }

  const rows = assignments.data ?? [];
  const now = Date.now();
  const submitted = rows.filter((r) => r.submission).length;
  const pending = rows.filter((r) => !r.submission && new Date(r.deadline).getTime() >= now).length;
  const overdue = rows.filter((r) => !r.submission && new Date(r.deadline).getTime() < now).length;

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
        <h1 className="font-display text-2xl text-primary">My Assignments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Individual assignments za course na mwaka wako.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat icon={CheckCircle2} label="Submitted" value={submitted} tint="text-emerald-600" />
          <Stat icon={Clock} label="Pending" value={pending} tint="text-primary" />
          <Stat icon={AlertTriangle} label="Overdue" value={overdue} tint="text-destructive" />
        </div>

        <div className="mt-8 space-y-4">
          {assignments.isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Hakuna assignments bado. Admin akiongeza utaziona hapa.
            </div>
          ) : rows.map((r) => (
            <AssignmentCard key={r.id} row={r} onChanged={() => assignments.refetch()} />
          ))}
        </div>
      </main>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }: { icon: typeof Award; label: string; value: number; tint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className={`mt-2 font-display text-3xl ${tint}`}>{value}</div>
        </div>
        <Icon className={`h-6 w-6 ${tint}`} />
      </div>
    </div>
  );
}

type Row = {
  id: string; title: string; description: string | null;
  question_path: string | null; question_name: string | null;
  deadline: string; created_at: string;
  submission: {
    id: string; file_name: string; submitted_at: string;
    marks: number | null; remarks: string | null; marked_at: string | null;
    ai_score: number | null; ai_reason: string | null; locked: boolean;
  } | null;
};

function AssignmentCard({ row, onChanged }: { row: Row; onChanged: () => void }) {
  const getUrl = useServerFn(getMyQuestionUrl);
  const submit = useServerFn(submitMyAssignment);
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const deadline = new Date(row.deadline);
  const isOverdue = deadline.getTime() < Date.now();
  const alreadySubmitted = !!row.submission;
  const canSubmit = !isOverdue && !alreadySubmitted;

  async function download() {
    const res = await getUrl({ data: { assignment_id: row.id } });
    if (!res.url) return toast.error("Hakuna file ya swali");
    window.open(res.url, "_blank");
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!/\.(pdf|doc|docx)$/i.test(file.name)) return toast.error("PDF au Word pekee");
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await submit({ data: { assignment_id: row.id, file_base64: base64, file_name: file.name } });
      if (!res.ok) toast.error(res.error);
      else { toast.success("Kazi imetumwa! Hairuhusiwi kutuma tena."); onChanged(); }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const ai = row.submission?.ai_score;
  const aiHigh = typeof ai === "number" && ai >= 60;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg text-primary">{row.title}</h3>
          {row.description && <p className="mt-1 text-sm text-muted-foreground">{row.description}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className={`inline-flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
              <Calendar className="h-3.5 w-3.5" /> Deadline: {deadline.toLocaleString()}
            </span>
            {row.question_name && (
              <span className="inline-flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {row.question_name}</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {row.question_path && (
            <Button variant="outline" size="sm" onClick={download}>
              <Download className="mr-1 h-4 w-4" /> Question
            </Button>
          )}
          {alreadySubmitted ? (
            <Button size="sm" disabled variant="secondary">
              <Lock className="mr-1 h-4 w-4" /> Imetumwa
            </Button>
          ) : (
            <>
              <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={onFile} />
              <Button size="sm" disabled={!canSubmit || uploading} onClick={() => inputRef.current?.click()}>
                {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
                Tuma Kazi
              </Button>
            </>
          )}
        </div>
      </div>

      {row.submission && (
        <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm">
              <span className="font-medium text-primary">Submitted:</span>{" "}
              <span className="font-mono text-xs">{row.submission.file_name}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(row.submission.submitted_at).toLocaleString()}
            </div>
          </div>

          {typeof ai === "number" && (
            <div className={`mt-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${aiHigh ? "border-destructive/40 bg-destructive/10 text-destructive" : "border-border bg-background text-muted-foreground"}`}>
              <Sparkles className="mt-0.5 h-3.5 w-3.5" />
              <div>
                <div className="font-semibold">AI Check: {ai}%</div>
                {row.submission.ai_reason && <div className="mt-0.5">{row.submission.ai_reason}</div>}
              </div>
            </div>
          )}

          {row.submission.marked_at ? (
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
                <Award className="h-4 w-4" /> {row.submission.marks}/100
              </span>
              {row.submission.remarks && (
                <span className="whitespace-pre-wrap text-muted-foreground">Remarks: {row.submission.remarks}</span>
              )}
              <Button asChild size="sm" variant="outline" className="ml-auto">
                <Link to="/marked-paper/$kind/$id" params={{ kind: "individual", id: row.submission.id }}>
                  <FileText className="mr-1 h-4 w-4" /> Ona karatasi yangu
                </Link>
              </Button>
            </div>
          ) : (
            <div className="mt-2 text-xs text-muted-foreground">Bado haijamarkiwa.</div>
          )}
        </div>
      )}

      {isOverdue && !row.submission && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-4 w-4" /> Deadline imeshapita — huwezi kutuma.
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
