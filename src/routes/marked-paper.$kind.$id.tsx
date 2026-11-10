import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Printer, Home, ArrowLeft, Sparkles } from "lucide-react";
import { ErrorState } from "@/components/query-state";
import { Button } from "@/components/ui/button";
import { getMarkedPaper } from "@/lib/student.functions";

export const Route = createFileRoute("/marked-paper/$kind/$id")({
  head: () => ({
    meta: [
      { title: "Marked Paper — Simba Legal Academy" },
      { name: "description", content: "Softcopy ya kazi yako iliyosahihishwa na mwalimu — chapisha kwa matumizi ya baadaye." },
      { property: "og:title", content: "Marked Paper — Simba Legal Academy" },
      { property: "og:description", content: "Kazi yako iliyosahihishwa kwa alama nyekundu za mwalimu." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MarkedPaperPage,
});

function MarkedPaperPage() {
  const { kind, id } = useParams({ from: "/marked-paper/$kind/$id" });
  const fetchPaper = useServerFn(getMarkedPaper);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["marked-paper", kind, id],
    queryFn: () => fetchPaper({ data: { submission_id: id, kind: kind === "group" ? "group" : "individual" } }),
    retry: 1,
  });

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (isError) {
    return (
      <div className="mx-auto max-w-md px-6 py-20">
        <ErrorState onRetry={() => refetch()} />
      </div>
    );
  }
  if (!data?.ok) {
    return (
      <div className="mx-auto max-w-md px-6 py-20 text-center">
        <h1 className="font-display text-xl text-primary">{data?.error ?? "Kazi haipatikani"}</h1>
        <Button asChild className="mt-6"><Link to="/student">Rudi Dashboard</Link></Button>
      </div>
    );
  }
  const p = data.paper;
  const marked = p.marked_at !== null;

  return (
    <div className="min-h-screen bg-muted/40 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3 px-6 print:hidden">
        <Button asChild variant="ghost" size="sm">
          <Link to={p.kind === "group" ? "/group-assignment" : "/individual-assignment"}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Rudi
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm"><Link to="/"><Home className="mr-1 h-4 w-4" /> Menu Kuu</Link></Button>
          <Button size="sm" onClick={() => window.print()}><Printer className="mr-1 h-4 w-4" /> Print / Hifadhi PDF</Button>
        </div>
      </div>

      <article className="mx-auto max-w-3xl bg-white p-8 text-[15px] leading-relaxed text-slate-900 shadow-elegant print:max-w-none print:p-0 print:shadow-none">
        <header className="border-b-2 border-slate-800 pb-4 text-center">
          <h1 className="font-display text-2xl text-slate-900">SIMBA LEGAL ACADEMY</h1>
          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Learn · Research · Submit · Succeed</p>
          <p className="mt-3 font-semibold">Marked Answer Sheet — {p.kind === "group" ? "Group Assignment" : "Individual Assignment"}</p>
        </header>

        <section className="mt-5 grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          <Row label="Jina / Name" value={p.student_name} />
          <Row label="Reg Number" value={p.reg_number} />
          <Row label="Assignment" value={p.assignment_title} />
          <Row label="Course" value={p.course ?? "—"} />
          <Row label="Academic Year" value={p.academic_year ?? "—"} />
          <Row label="Submitted" value={new Date(p.submitted_at).toLocaleString()} />
          {p.group_name && <Row label="Group" value={p.group_name} />}
          <Row label="File" value={p.file_name} />
        </section>

        {p.members.length > 0 && (
          <section className="mt-4 rounded border border-slate-300 p-3 text-sm">
            <div className="font-semibold">Wanachama wa Group</div>
            <ul className="mt-1 list-inside list-disc text-slate-700">
              {p.members.map((m) => <li key={m.reg_number}>{m.full_name} — {m.reg_number}</li>)}
            </ul>
          </section>
        )}

        {typeof p.ai_score === "number" && (
          <section className="mt-4 rounded border border-slate-300 bg-slate-50 p-3 text-sm print:bg-white">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" /> AI Check: {p.ai_score}%
            </div>
            {p.ai_reason && <p className="mt-1 text-slate-700">{p.ai_reason}</p>}
          </section>
        )}

        <section className="mt-6">
          <h2 className="border-b border-red-600 pb-1 font-display text-lg text-red-600">Usahihishaji wa Mwalimu / Teacher's Marking</h2>
          {marked ? (
            <>
              <ul className="mt-3 space-y-2">
                {p.annotations.length === 0 && <li className="text-sm text-slate-500">Hakuna alama za ziada.</li>}
                {p.annotations.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-red-600">
                    <span className="mt-0.5 font-bold">{a.type === "tick" ? "✓" : a.type === "cross" ? "✗" : "✎"}</span>
                    <span className="flex-1 font-medium">{a.text}</span>
                    {typeof a.points === "number" && <span className="font-bold">{a.points > 0 ? `+${a.points}` : a.points}</span>}
                  </li>
                ))}
              </ul>
              {p.remarks && (
                <div className="mt-4 rounded border border-red-300 p-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-red-600">Remarks</div>
                  <p className="mt-1 whitespace-pre-wrap text-red-600">{p.remarks}</p>
                </div>
              )}
              <div className="mt-6 flex items-end justify-between border-t-2 border-slate-800 pt-4">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-500">Marked on</div>
                  <div className="text-sm">{new Date(p.marked_at as string).toLocaleString()}</div>
                  <div className="mt-6 w-56 border-t border-slate-500 pt-1 text-xs text-slate-500">Signature — Mwalimu</div>
                </div>
                <div className="rounded-full border-4 border-red-600 px-6 py-4 text-center">
                  <div className="text-[10px] uppercase tracking-widest text-red-600">Score</div>
                  <div className="font-display text-3xl font-bold text-red-600">{p.marks}/100</div>
                </div>
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-slate-500">Kazi hii bado haijasahihishwa. Rudi baadaye.</p>
          )}
        </section>

        <footer className="mt-8 border-t border-slate-300 pt-3 text-center text-[11px] text-slate-500">
          Hii ni softcopy rasmi — chapisha (print) na uihifadhi kwa matumizi ya baadaye. · Simba Legal Academy
        </footer>
      </article>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="min-w-32 font-semibold text-slate-600">{label}:</span>
      <span className="flex-1">{value}</span>
    </div>
  );
}
