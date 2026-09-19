import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2, KeyRound, LogIn, HelpCircle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { studentLogin, resetStudentPassword } from "@/lib/student.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Student Login — Simba Legal Academy" },
      { name: "description", content: "Ingia kwa Registration Number na password yako kuona assignments zako." },
      { property: "og:title", content: "Student Login — Simba Legal Academy" },
      { property: "og:description", content: "Ingia kwa Registration Number na password yako." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
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
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!regNumber.trim()) return toast.error("Weka Registration Number");
    if (!password) return toast.error("Weka password yako");
    setLoading(true);
    const res = await doLogin({ data: { reg_number: regNumber, password } });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Karibu, ${res.full_name}`);
    await qc.invalidateQueries({ queryKey: ["student-session"] });
    router.invalidate();
    navigate({ to: "/student" });
  }

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-gold-bg text-primary">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl text-primary">Student Login</h1>
          <p className="text-xs uppercase tracking-wider text-gold">Reg Number + Password</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Registration Number</Label>
          <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="SLA/2024/001" autoFocus />
        </div>
        <div className="space-y-1.5">
          <Label>Password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingia / Sign In"}
        </Button>
        <button type="button" onClick={onForgot} className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground hover:text-primary">
          <HelpCircle className="h-3.5 w-3.5" /> Umesahau password?
        </button>
      </form>
    </>
  );
}

function ForgotForm({ onBack }: { onBack: () => void }) {
  const doReset = useServerFn(resetStudentPassword);
  const [regNumber, setRegNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!regNumber.trim() || !phone.trim()) return toast.error("Weka reg number na namba ya simu");
    if (password.length < 6) return toast.error("Password iwe na herufi 6 au zaidi");
    if (password !== confirm) return toast.error("Password hazifanani");
    setLoading(true);
    const res = await doReset({ data: { reg_number: regNumber, phone, password } });
    setLoading(false);
    if (!res.ok) return toast.error(res.error);
    setDone(res.full_name);
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-gold" />
        <h2 className="mt-4 font-display text-xl text-primary">Imefanikiwa, {done}</h2>
        <p className="mt-2 text-sm text-muted-foreground">Password yako mpya imehifadhiwa. Sasa unaweza kuingia.</p>
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
          <h1 className="font-display text-xl text-primary">Weka Password Mpya</h1>
          <p className="text-xs text-muted-foreground">Reg Number + simu uliyosajili nayo</p>
        </div>
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="space-y-1.5">
          <Label>Registration Number</Label>
          <Input value={regNumber} onChange={(e) => setRegNumber(e.target.value)} placeholder="SLA/2024/001" />
        </div>
        <div className="space-y-1.5">
          <Label>Phone Number</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 712 345 678" />
        </div>
        <div className="space-y-1.5">
          <Label>Password Mpya</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Angalau herufi 6" />
        </div>
        <div className="space-y-1.5">
          <Label>Thibitisha Password</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Rudia password" />
        </div>
        <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Hifadhi Password Mpya"}
        </Button>
        <button type="button" onClick={onBack} className="flex w-full items-center justify-center gap-1.5 pt-2 text-xs text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Rudi Login
        </button>
      </form>
    </>
  );
}
