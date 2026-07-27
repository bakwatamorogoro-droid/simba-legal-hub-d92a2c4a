import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

type StudentSessionData = { studentId: string; fullName: string; regNumber: string };

async function getSession() {
  return useSession<StudentSessionData>({
    password: process.env.ADMIN_SESSION_SECRET!,
    name: "sla_student",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

async function requireStudent() {
  const session = await getSession();
  if (!session.data?.studentId) throw new Error("UNAUTHORIZED");
  return session.data;
}

async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalize(s: string) {
  return s.trim().toLowerCase();
}

// ---------- Auth ----------
export const studentLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { reg_number: string }) =>
    z.object({ reg_number: z.string().trim().min(1).max(80) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    const { data: student } = await supabase
      .from("students")
      .select("id, full_name, reg_number")
      .ilike("reg_number", data.reg_number.trim())
      .maybeSingle();
    if (!student) {
      return { ok: false as const, error: "Registration number haipo. Hakikisha umejisajili." };
    }
    const session = await getSession();
    await session.update({
      studentId: student.id as string,
      fullName: (student.full_name as string) ?? "",
      regNumber: (student.reg_number as string) ?? "",
    });
    return { ok: true as const, full_name: student.full_name };
  });

export const studentLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSession();
  await session.clear();
  return { ok: true };
});

export const getStudentSession = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ studentId: string; fullName: string; regNumber: string } | null> => {
    const session = await getSession();
    const d = session.data;
    if (!d || !d.studentId) return null;
    return { studentId: d.studentId, fullName: d.fullName ?? "", regNumber: d.regNumber ?? "" };
  },
);

// Recover Reg Number using phone
export const recoverRegNumber = createServerFn({ method: "POST" })
  .inputValidator((d: { phone: string }) =>
    z.object({ phone: z.string().trim().min(5).max(30) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    const { data: student } = await supabase
      .from("students")
      .select("full_name, reg_number, phone")
      .eq("phone", data.phone.trim())
      .maybeSingle();
    if (!student) return { ok: false as const, error: "Simu haipatikani kwenye mfumo." };
    return { ok: true as const, reg_number: student.reg_number, full_name: student.full_name };
  });

// Back-compat alias (existing imports may still reference it briefly)
export const recoverExamNumber = recoverRegNumber;

// ---------- Student portal ----------
type MyAssignment = {
  id: string; title: string; description: string | null;
  question_path: string | null; question_name: string | null;
  deadline: string; created_at: string;
  submission: {
    id: string; file_name: string; submitted_at: string;
    marks: number | null; remarks: string | null; marked_at: string | null;
    ai_score: number | null; ai_reason: string | null; locked: boolean;
  } | null;
};

export const listMyAssignments = createServerFn({ method: "GET" }).handler(async (): Promise<MyAssignment[]> => {
  const s = await requireStudent();
  const supabase = await getServiceClient();
  const { data: student } = await supabase
    .from("students")
    .select("course_id, academic_year_id")
    .eq("id", s.studentId)
    .maybeSingle();
  if (!student) return [];
  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, description, question_path, question_name, deadline, created_at")
    .eq("course_id", student.course_id)
    .eq("academic_year_id", student.academic_year_id)
    .eq("kind", "individual")
    .order("deadline", { ascending: true });
  const list = assignments ?? [];
  if (list.length === 0) return [];
  const { data: subs } = await supabase
    .from("submissions")
    .select("id, assignment_id, file_name, submitted_at, marks, remarks, marked_at, ai_score, ai_reason, locked")
    .eq("student_id", s.studentId)
    .in("assignment_id", list.map((a) => a.id));
  const bySub = new Map<string, MyAssignment["submission"]>();
  (subs ?? []).forEach((row) => {
    bySub.set(row.assignment_id, {
      id: row.id, file_name: row.file_name, submitted_at: row.submitted_at,
      marks: row.marks, remarks: row.remarks, marked_at: row.marked_at,
      ai_score: row.ai_score, ai_reason: row.ai_reason, locked: !!row.locked,
    });
  });
  return list.map((a) => ({ ...a, submission: bySub.get(a.id) ?? null }));
});

export const getMyQuestionUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireStudent();
    const supabase = await getServiceClient();
    const { data: a } = await supabase
      .from("assignments").select("question_path").eq("id", data.assignment_id).maybeSingle();
    if (!a?.question_path) return { url: null };
    const { data: signed } = await supabase.storage.from("assignment-files").createSignedUrl(a.question_path, 600);
    return { url: signed?.signedUrl ?? null };
  });

const submitSchema = z.object({
  assignment_id: z.string().uuid(),
  file_base64: z.string().min(1),
  file_name: z.string().trim().min(1).max(200)
    .refine((n) => /\.(pdf|doc|docx)$/i.test(n), { message: "PDF au Word pekee" }),
});

function decodeBase64(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function guessContentType(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}

export const submitMyAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) => submitSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();
    const { data: assignment } = await supabase
      .from("assignments").select("id, deadline, kind").eq("id", data.assignment_id).maybeSingle();
    if (!assignment) return { ok: false as const, error: "Assignment haipo" };
    if (assignment.kind === "group") return { ok: false as const, error: "Hii ni group assignment. Tumia group portal." };
    if (new Date(assignment.deadline).getTime() < Date.now()) {
      return { ok: false as const, error: "Deadline imeshapita" };
    }

    const { data: existing } = await supabase.from("submissions")
      .select("id, locked").eq("assignment_id", assignment.id).eq("student_id", s.studentId).maybeSingle();
    if (existing?.locked) return { ok: false as const, error: "Umeshatuma kazi hii. Hairuhusiwi kutuma tena." };

    const bytes = decodeBase64(data.file_base64);
    if (bytes.byteLength > 10 * 1024 * 1024) {
      return { ok: false as const, error: "File kubwa mno (max 10MB)" };
    }
    const safeName = data.file_name.replace(/[^\w.-]/g, "_");
    const path = `submissions/${assignment.id}/${s.studentId}-${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, bytes, {
      contentType: guessContentType(data.file_name),
      upsert: true,
    });
    if (upErr) return { ok: false as const, error: upErr.message };

    const { runAiCheck } = await import("./ai-check.server");
    const ai = await runAiCheck(bytes, data.file_name);

    if (existing) {
      const { error } = await supabase.from("submissions").update({
        file_path: path, file_name: data.file_name, submitted_at: new Date().toISOString(),
        locked: true, ai_score: ai.ai_score, ai_reason: ai.ai_reason,
      }).eq("id", existing.id);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabase.from("submissions").insert({
        assignment_id: assignment.id, student_id: s.studentId,
        file_path: path, file_name: data.file_name, locked: true,
        ai_score: ai.ai_score, ai_reason: ai.ai_reason,
      });
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const, ai };
  });

// Unused normalize (kept to avoid unused-var lint if imported later)
void normalize;
