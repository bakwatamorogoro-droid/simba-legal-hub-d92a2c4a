import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Users, Home, LogOut, Loader2, ArrowRight, GraduationCap } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { getStudentSession, studentLogout } from "@/lib/student.functions";
import { getMyPhoto, uploadMyPhoto } from "@/lib/media.functions";
import { fileToBase64 } from "@/hooks/use-site-images";
import { toast } from "sonner";
import { Camera } from "lucide-react";

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — Simba Legal Academy" },
      { name: "description", content: "Dashboard ya mwanafunzi: assignments binafsi, group, na matokeo yako." },
      { property: "og:title", content: "Student Dashboard — Simba Legal Academy" },
      { property: "og:description", content: "Assignments binafsi, group na matokeo yako." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: StudentHome,
});

function StudentHome() {
  const router = useRouter();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const getSession = useServerFn(getStudentSession);
  const logout = useServerFn(studentLogout);
  const { data: session, isLoading } = useQuery({ queryKey: ["student-session"], queryFn: () => getSession() });
  const photoFn = useServerFn(getMyPhoto);
  const uploadPhoto = useServerFn(uploadMyPhoto);
  const photo = useQuery({ queryKey: ["my-photo"], queryFn: () => photoFn(), enabled: !!session });

  async function onPhoto(file?: File) {
    if (!file) return;
    const res = await uploadPhoto({ data: { file_name: file.name, file_base64: await fileToBase64(file) } });
    if (res.ok) { toast.success("Picha imehifadhiwa"); photo.refetch(); } else toast.error(res.error);
  }

  async function doLogout() {
    await logout();
    await qc.invalidateQueries({ queryKey: ["student-session"] });
    router.invalidate();
    navigate({ to: "/" });
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-muted/30">
        <SiteHeader />
        <main className="mx-auto max-w-md px-6 py-20 text-center">
          <h1 className="font-display text-2xl text-primary">Tafadhali ingia</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingia kwa Registration Number yako ili kuendelea.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button asChild><Link to="/login">Student Login</Link></Button>
            <Button asChild variant="outline"><Link to="/">Menu Kuu</Link></Button>
          </div>
        </main>
      </div>
    );
  }

  const cards = [
    { to: "/individual-assignment" as const, icon: FileText, title: "Individual Assignment", desc: "Pakua swali, tuma kazi yako, ona matokeo." },
    { to: "/group-assignment" as const, icon: Users, title: "Group Assignment", desc: "Jiunge na wenzako, jadili, na tuma kazi ya kikundi." },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-br from-primary to-primary/80 p-8 text-primary-foreground shadow-elegant">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/10 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold">
            <GraduationCap className="h-3.5 w-3.5" /> Student Portal
          </div>
          <div className="mt-4 flex items-center gap-4">
            <label className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-gold bg-primary-foreground/10" title="Pakia picha yako">
              {photo.data ? <img src={photo.data} alt="" className="h-full w-full object-cover" /> : <GraduationCap className="m-auto mt-5 h-9 w-9 text-gold" />}
              <span className="absolute bottom-0 right-0 rounded-full bg-gold p-1 text-primary"><Camera className="h-3.5 w-3.5" /></span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} />
            </label>
            <div>
              <h1 className="font-display text-3xl">Karibu, {session.fullName}</h1>
              <p className="mt-1 font-mono text-sm text-primary-foreground/80">{session.regNumber}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {cards.map(({ to, icon: Icon, title, desc }) => (
            <Link key={to} to={to} className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/60">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-gold-bg text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div className="mt-4 font-display text-lg text-primary">{title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-sm text-gold">
                Fungua <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild variant="outline"><Link to="/"><Home className="mr-1 h-4 w-4" /> Menu Kuu</Link></Button>
          <Button variant="ghost" onClick={doLogout}><LogOut className="mr-1 h-4 w-4" /> Sign out</Button>
        </div>
      </main>
    </div>
  );
}
