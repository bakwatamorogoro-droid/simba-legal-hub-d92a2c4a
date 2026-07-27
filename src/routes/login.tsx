import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, LogIn, HelpCircle, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentLogin, recoverRegNumber } from "@/lib/student.functions";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Student Login — Simba Legal Academy" }] }),
  component: LoginPage,
});

function LoginPage() {
  const [mode, setMode] = useState<"login" | "forgot">("login");
  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col items-center px-6 py-12">
        <div className="w-full rounded-2xl border border-border bg-card p-8 shadow-elegant">
          {mode === "login" ? <LoginForm onForgot={() => setMode("forgot")} /> : <ForgotForm onBack={() => setMode("login")} />}
        </div>
      </main>
    </div>
  );
}

function LoginForm({ onForgot }: { onForgot: () => void }) {
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const doLogin = useServerFn(studentLogin);
  const [regNumber, setRegNumber] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!regNumber.trim()) return toast.error("Weka Registration Number");
    setLoading(true);
    const res = await doLogin({ data: { reg_number: regNumber } });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Karibu, ${res.full_name}`);
    await qc.invalidateQueries({ queryKey: ["student-session"] });
    router.invalidate();
    navigate({ to: "/individual-assignment" });
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold-bg text-primary">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-primary">Student Login</h1>
          <p className="text-xs uppercase tracking-wider text-gold">Ingia kwa Registration Number</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Registration Number</Label>
          <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="SLA/2024/001" autoFocus />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingia / Sign In"}
        </Button>
        <button type="button" onClick={onForgot} className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground hover:text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Umesahau reg number?
        </button>
      </form>
    </>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const doRecover = useServerFn(recoverRegNumber);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ reg_number: string; full_name: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) return toast.error("Weka simu");
    setLoading(true);
    const res = await doRecover({ data: { phone } });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setResult({ reg_number: res.reg_number, full_name: res.full_name });
  }

  if (result) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl gradient-gold-bg text-primary">
          <KeyRound className="h-6 w-6" />
        </div>
        <h2 className="mt-4 font-display text-xl text-primary">Karibu, {result.full_name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Registration Number yako ni:</p>
        <div className="mt-3 rounded-xl border border-gold/40 bg-gold/5 px-4 py-3 font-mono text-lg font-semibold text-primary">
          {result.reg_number}
        </div>
        <Button className="mt-6 w-full" onClick={onBack}>Rudi Login</Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold-bg text-primary">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-xl text-primary">Recover Reg Number</h1>
          <p className="text-xs text-muted-foreground">Weka simu uliyosajili nayo</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Pata Reg Number"}
        </Button>
        <button type="button" onClick={onBack} className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Rudi Login
        </button>
      </form>
    </>
  );
}
