import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, UserPlus, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listCoursesAndYears, registerStudent } from "@/lib/admin.functions";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Student Registration — Simba Legal Academy" }] }),
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const fetchOptions = useServerFn(listCoursesAndYears);
  const doRegister = useServerFn(registerStudent);
  const { data, isLoading } = useQuery({ queryKey: ["cy"], queryFn: () => fetchOptions() });

  const [form, setForm] = useState({
    full_name: "", last_name: "", reg_number: "", exam_number: "",
    phone: "", academic_year_id: "", course_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.full_name || !form.last_name || !form.reg_number || !form.exam_number || !form.phone || !form.academic_year_id || !form.course_id) {
      return toast.error("Jaza sehemu zote / Fill all fields");
    }
    setSaving(true);
    const res = await doRegister({ data: form });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success("Umesajiliwa kikamilifu!");
    setDone(true);
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-elegant">
          {done ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
              <h1 className="mt-4 font-display text-2xl text-primary">Karibu Simba Legal Academy!</h1>
              <p className="mt-2 text-sm text-muted-foreground">Usajili wako umekamilika. Sasa unaweza kuingia kupitia <b>Student Login</b> ukitumia Exam Number na Last Name yako.</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button asChild variant="outline"><Link to="/">Nyumbani</Link></Button>
                <Button onClick={() => { setDone(false); setForm({ full_name: "", last_name: "", reg_number: "", exam_number: "", phone: "", academic_year_id: "", course_id: "" }); }}>Sajili Mwingine</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold-bg text-primary">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="font-display text-2xl text-primary">Student Registration</h1>
                  <p className="text-xs uppercase tracking-wider text-gold">Jisajili kama mwanafunzi</p>
                </div>
              </div>

              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Full Name / Jina Kamili">
                    <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="John Msele Bakari" />
                  </Field>
                  <Field label="Last Name / Jina la Mwisho">
                    <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} placeholder="Bakari" />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Registration Number">
                    <Input value={form.reg_number} onChange={(e) => setForm({ ...form, reg_number: e.target.value })} placeholder="SLA/2024/001" />
                  </Field>
                  <Field label="Exam Number">
                    <Input value={form.exam_number} onChange={(e) => setForm({ ...form, exam_number: e.target.value })} placeholder="EX/2024/001" />
                  </Field>
                </div>
                <Field label="Phone Number / Simu">
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+255 712 345 678" />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Academic Year">
                    <Select value={form.academic_year_id} onValueChange={(v) => setForm({ ...form, academic_year_id: v })}>
                      <SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Chagua"} /></SelectTrigger>
                      <SelectContent>
                        {data?.years.map((y) => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Course">
                    <Select value={form.course_id} onValueChange={(v) => setForm({ ...form, course_id: v })}>
                      <SelectTrigger><SelectValue placeholder={isLoading ? "Loading..." : "Chagua"} /></SelectTrigger>
                      <SelectContent>
                        {data?.courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <Button type="submit" disabled={saving} className="w-full bg-primary text-primary-foreground">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Jisajili / Register"}
                </Button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium text-foreground">{label}</Label>
      {children}
    </div>
  );
}
