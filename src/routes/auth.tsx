import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { regToEmail } from "@/lib/reg-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import logo from "@/assets/logo.png";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In — Simba Legal Academy" },
      { name: "description", content: "Ingia au jisajili kama mwanafunzi wa Simba Legal Academy." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { redirect } = Route.useSearch();
  const [tab, setTab] = useState<"login" | "register">("login");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: redirect ?? "/dashboard", replace: true });
    });
  }, [navigate, redirect]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -right-24 bottom-10 h-96 w-96 rounded-full bg-gold/25 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Nyumbani
        </Link>

        <div className="mb-8 text-center">
          <img src={logo} alt="Simba Legal Academy" width={72} height={72} className="mx-auto h-18 w-18 object-contain" />
          <h1 className="mt-4 font-display text-3xl text-primary">Simba Legal Academy</h1>
          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-gold">Learn • Research • Submit • Succeed</p>
        </div>

        <div className="glass-card rounded-2xl bg-card/70 p-8 shadow-elegant">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "login" | "register")}>
            <TabsList className="mb-6 grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onSuccess={() => navigate({ to: redirect ?? "/dashboard", replace: true })} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSuccess={() => navigate({ to: "/dashboard", replace: true })} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [reg, setReg] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reg.trim() || !password) return toast.error("Jaza registration number na password");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: regToEmail(reg),
      password,
    });
    setLoading(false);
    if (error) return toast.error(error.message.includes("Invalid") ? "Registration number au password si sahihi" : error.message);
    toast.success("Karibu tena!");
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-reg">Registration Number</Label>
        <Input id="login-reg" placeholder="e.g. SLA/2024/001" value={reg} onChange={(e) => setReg(e.target.value)} autoComplete="username" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="login-pw">Password</Label>
        <Input id="login-pw" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingia"}
      </Button>
    </form>
  );
}

const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Jina lazima liwe herufi 2+").max(120),
  regNumber: z.string().trim().min(3, "Reg number lazima iwe herufi 3+").max(50),
  course: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(9).max(20),
  password: z.string().min(8, "Password iwe herufi 8+").max(128),
});

function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({ fullName: "", regNumber: "", course: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: regToEmail(parsed.data.regNumber),
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: {
          full_name: parsed.data.fullName,
          reg_number: parsed.data.regNumber.trim().toUpperCase(),
          course: parsed.data.course,
          phone: parsed.data.phone,
        },
      },
    });
    setLoading(false);
    if (error) {
      if (error.message.includes("already") || error.message.includes("registered"))
        return toast.error("Registration number hii tayari ipo. Jaribu login.");
      return toast.error(error.message);
    }
    toast.success("Umesajiliwa! Karibu Simba Legal Academy.");
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="r-name">Full Name</Label>
        <Input id="r-name" placeholder="John Doe Simba" value={form.fullName} onChange={set("fullName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-reg">Registration Number</Label>
        <Input id="r-reg" placeholder="SLA/2024/001" value={form.regNumber} onChange={set("regNumber")} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="r-course">Course</Label>
          <Input id="r-course" placeholder="LLB Year 1" value={form.course} onChange={set("course")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="r-phone">Phone</Label>
          <Input id="r-phone" placeholder="+255..." value={form.phone} onChange={set("phone")} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="r-pw">Password</Label>
        <Input id="r-pw" type="password" placeholder="Herufi 8 au zaidi" value={form.password} onChange={set("password")} autoComplete="new-password" />
      </div>
      <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Jisajili"}
      </Button>
    </form>
  );
}
