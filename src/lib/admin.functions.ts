import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

type AdminSessionData = { adminId: string; username: string };

async function getSession() {
  return useSession<AdminSessionData>({
    password: process.env.ADMIN_SESSION_SECRET!,
    name: "sla_admin",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, secure: true, sameSite: "lax", path: "/" },
  });
}

async function requireAdmin() {
  const session = await getSession();
  if (!session.data?.adminId) throw new Error("UNAUTHORIZED");
  return session.data;
}

async function getServiceClient() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------- Auth ----------
export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) =>
    z.object({ username: z.string().trim().min(1).max(80), password: z.string().min(1).max(200) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    const { data: admin, error } = await supabase
      .from("admins").select("id, username, password_hash").eq("username", data.username).maybeSingle();
    if (error || !admin) return { ok: false as const, error: "Invalid credentials" };
    const bcrypt = (await import("bcryptjs")).default;
    const ok = await bcrypt.compare(data.password, admin.password_hash);
    if (!ok) return { ok: false as const, error: "Invalid credentials" };
    const session = await getSession();
    await session.update({ adminId: admin.id, username: admin.username });
    return { ok: true as const, username: admin.username };
  });

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getSession();
  await session.clear();
  return { ok: true };
});

export const getAdminSession = createServerFn({ method: "GET" }).handler(async (): Promise<{ username: string } | null> => {
  const session = await getSession();
  const data = session.data;
  if (!data || !data.adminId) return null;
  return { username: data.username ?? "admin" };
});

// ---------- Courses ----------
const nameSchema = z.object({ name: z.string().trim().min(2).max(120) });
const idNameSchema = z.object({ id: z.string().uuid(), name: z.string().trim().min(2).max(120) });
const idSchema = z.object({ id: z.string().uuid() });

export const listCourses = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getServiceClient();
  const { data } = await supabase.from("courses").select("*").order("name");
  return data ?? [];
});

export const createCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => nameSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("courses").insert({ name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; name: string }) => idNameSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("courses").update({ name: data.name }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCourse = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("courses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Academic Years ----------
export const listYears = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getServiceClient();
  const { data } = await supabase.from("academic_years").select("*").order("name", { ascending: false });
  return data ?? [];
});

export const createYear = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string }) => nameSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("academic_years").insert({ name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateYear = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; name: string }) => idNameSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("academic_years").update({ name: data.name }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteYear = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("academic_years").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Students ----------
type StudentRow = {
  id: string; full_name: string; reg_number: string; phone: string;
  exam_number: string | null; last_name: string | null; created_at: string;
  course: { id: string; name: string } | null;
  academic_year: { id: string; name: string } | null;
};

export const listStudents = createServerFn({ method: "GET" }).handler(async (): Promise<StudentRow[]> => {
  await requireAdmin();
  const supabase = await getServiceClient();
  const { data } = await supabase
    .from("students")
    .select("id, full_name, reg_number, phone, exam_number, last_name, created_at, course:courses(id,name), academic_year:academic_years(id,name)")
    .order("created_at", { ascending: false });
  return (data as unknown as StudentRow[]) ?? [];
});

const studentSchema = z.object({
  full_name: z.string().trim().min(2).max(160),
  last_name: z.string().trim().max(80).optional().nullable(),
  exam_number: z.string().trim().max(80).optional().nullable(),
  reg_number: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(5).max(30),
  academic_year_id: z.string().uuid(),
  course_id: z.string().uuid(),
});

export const registerStudent = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    studentSchema.extend({ password: z.string().min(6).max(72) }).parse(d),
  )
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    const bcrypt = (await import("bcryptjs")).default;
    const payload = {
      full_name: data.full_name,
      reg_number: data.reg_number,
      phone: data.phone,
      academic_year_id: data.academic_year_id,
      course_id: data.course_id,
      last_name: data.last_name ?? null,
      exam_number: data.exam_number ?? null,
      password_hash: await bcrypt.hash(data.password, 10),
    };
    const { error } = await supabase.from("students").insert(payload);
    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes("duplicate") || msg.includes("unique")) return { ok: false as const, error: "Registration number tayari ipo." };
      return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });


export const updateStudent = createServerFn({ method: "POST" })
  .inputValidator((d) => studentSchema.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { id, ...rest } = data;
    const { error } = await supabase.from("students").update(rest).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("students").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Public reader for registration form dropdowns
export const listCoursesAndYears = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await getServiceClient();
  const [{ data: courses }, { data: years }] = await Promise.all([
    supabase.from("courses").select("id, name").order("name"),
    supabase.from("academic_years").select("id, name").order("name", { ascending: false }),
  ]);
  return { courses: courses ?? [], years: years ?? [] };
});

// ---------- Assignments (Admin) ----------
const assignmentSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(4000).optional().nullable(),
  deadline: z.string().min(4),
  course_id: z.string().uuid(),
  academic_year_id: z.string().uuid(),
  kind: z.enum(["individual", "group"]).default("individual"),
  question_base64: z.string().optional().nullable(),
  question_name: z.string().optional().nullable(),
});

type AssignmentRow = {
  id: string; title: string; description: string | null;
  question_path: string | null; question_name: string | null;
  deadline: string; created_at: string; kind: "individual" | "group";
  course: { id: string; name: string } | null;
  academic_year: { id: string; name: string } | null;
  submission_count?: number;
};

function decodeBase64(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export const listAssignments = createServerFn({ method: "GET" }).handler(async (): Promise<AssignmentRow[]> => {
  await requireAdmin();
  const supabase = await getServiceClient();
  const { data } = await supabase
    .from("assignments")
    .select("id, title, description, question_path, question_name, deadline, created_at, kind, course:courses(id,name), academic_year:academic_years(id,name)")
    .order("deadline", { ascending: false });
  const rows = (data as unknown as AssignmentRow[]) ?? [];
  if (rows.length === 0) return rows;
  const [{ data: indCounts }, { data: grpCounts }] = await Promise.all([
    supabase.from("submissions").select("assignment_id"),
    supabase.from("group_submissions").select("assignment_id"),
  ]);
  const map = new Map<string, number>();
  (indCounts ?? []).forEach((c: { assignment_id: string }) => map.set(c.assignment_id, (map.get(c.assignment_id) ?? 0) + 1));
  (grpCounts ?? []).forEach((c: { assignment_id: string }) => map.set(c.assignment_id, (map.get(c.assignment_id) ?? 0) + 1));
  return rows.map((r) => ({ ...r, submission_count: map.get(r.id) ?? 0 }));
});

export const createAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) => assignmentSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    let question_path: string | null = null;
    let question_name: string | null = null;
    let drive_file_id: string | null = null;
    let drive_url: string | null = null;
    if (data.question_base64 && data.question_name) {
      const bytes = decodeBase64(data.question_base64);
      const path = `questions/${crypto.randomUUID()}-${data.question_name.replace(/[^\w.-]/g, "_")}`;
      const { error } = await supabase.storage.from("assignment-files").upload(path, bytes, {
        contentType: guessContentType(data.question_name),
        upsert: false,
      });
      if (error) throw new Error(error.message);
      question_path = path;
      question_name = data.question_name;
      // Backup copy to Google Drive (best-effort)
      const { mirrorToDrive } = await import("./drive.server");
      const drive = await mirrorToDrive(bytes, data.question_name, guessContentType(data.question_name), "Questions");
      drive_file_id = drive?.file_id ?? null;
      drive_url = drive?.url ?? null;
    }
    const { error } = await supabase.from("assignments").insert({
      title: data.title, description: data.description ?? null,
      deadline: data.deadline, course_id: data.course_id, academic_year_id: data.academic_year_id,
      kind: data.kind, question_path, question_name, drive_file_id, drive_url,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => idSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("assignments").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signQuestionDownload = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServiceClient();
    const { data: a } = await supabase.from("assignments").select("question_path").eq("id", data.assignment_id).maybeSingle();
    if (!a?.question_path) return { url: null };
    const { data: signed } = await supabase.storage.from("assignment-files").createSignedUrl(a.question_path, 600);
    return { url: signed?.signedUrl ?? null };
  });

// ---------- Individual Submissions (Admin) ----------
type SubmissionRow = {
  id: string; assignment_id: string; file_path: string; file_name: string;
  submitted_at: string; marks: number | null; remarks: string | null; marked_at: string | null;
  ai_score: number | null; ai_reason: string | null;
  annotations: Array<{ type: "tick" | "cross" | "note"; text: string; points?: number | null }>;
  student: { id: string; full_name: string; reg_number: string; last_name: string | null } | null;
};

export const listSubmissionsForAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<SubmissionRow[]> => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { data: rows } = await supabase
      .from("submissions")
      .select("id, assignment_id, file_path, file_name, submitted_at, marks, remarks, marked_at, ai_score, ai_reason, annotations, student:students(id, full_name, reg_number, last_name)")
      .eq("assignment_id", data.assignment_id)
      .order("submitted_at", { ascending: false });
    return (rows as unknown as SubmissionRow[]) ?? [];
  });

const annotationSchema = z.array(
  z.object({
    type: z.enum(["tick", "cross", "note"]),
    text: z.string().trim().min(1).max(500),
    points: z.number().min(-100).max(100).nullable().optional(),
  }),
).max(100);

const markSchema = z.object({
  id: z.string().uuid(),
  marks: z.number().min(0).max(100),
  remarks: z.string().max(4000),
  annotations: annotationSchema.optional().default([]),
});

export const markSubmission = createServerFn({ method: "POST" })
  .inputValidator((d) => markSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("submissions").update({
      marks: data.marks, remarks: data.remarks, annotations: data.annotations ?? [],
      marked_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signSubmissionDownload = createServerFn({ method: "POST" })
  .inputValidator((d: { submission_id: string }) => z.object({ submission_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { data: s } = await supabase.from("submissions").select("file_path").eq("id", data.submission_id).maybeSingle();
    if (!s?.file_path) return { url: null };
    const { data: signed } = await supabase.storage.from("assignment-files").createSignedUrl(s.file_path, 600);
    return { url: signed?.signedUrl ?? null };
  });

// ---------- Group Submissions (Admin) ----------
type GroupSubmissionRow = {
  id: string; group_id: string; assignment_id: string; file_path: string; file_name: string;
  submitted_at: string; marks: number | null; remarks: string | null; marked_at: string | null;
  ai_score: number | null; ai_reason: string | null;
  annotations: Array<{ type: "tick" | "cross" | "note"; text: string; points?: number | null }>;
  submitted_by_student_id: string;
  group: { id: string; name: string } | null;
  members: Array<{ full_name: string; reg_number: string; last_name: string | null; role: "leader" | "member" }>;
};

export const listGroupSubmissionsForAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<GroupSubmissionRow[]> => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { data: subs } = await supabase
      .from("group_submissions")
      .select("id, group_id, assignment_id, file_path, file_name, submitted_at, marks, remarks, marked_at, ai_score, ai_reason, annotations, submitted_by_student_id, group:groups(id, name, leader_student_id)")
      .eq("assignment_id", data.assignment_id)
      .order("submitted_at", { ascending: false });
    const list = (subs as unknown as (GroupSubmissionRow & { group: { id: string; name: string; leader_student_id: string } | null })[]) ?? [];
    if (list.length === 0) return [];
    const groupIds = list.map((g) => g.group_id);
    const { data: members } = await supabase
      .from("group_members")
      .select("group_id, status, student:students(full_name, reg_number, last_name, id)")
      .in("group_id", groupIds)
      .eq("status", "confirmed");
    const memberMap = new Map<string, GroupSubmissionRow["members"]>();
    (members ?? []).forEach((raw) => {
      const m = raw as unknown as { group_id: string; student: { full_name: string; reg_number: string; last_name: string | null; id: string } | null };
      if (!m.student) return;
      const arr = memberMap.get(m.group_id) ?? [];
      arr.push({ full_name: m.student.full_name, reg_number: m.student.reg_number, last_name: m.student.last_name, role: "member" });
      memberMap.set(m.group_id, arr);
    });
    return list.map((row) => {
      const leaderId = row.group?.leader_student_id;
      const mems = (memberMap.get(row.group_id) ?? []).map((m) => ({
        ...m,
        role: (leaderId && (row as unknown as { submitted_by_student_id: string }).submitted_by_student_id === leaderId ? "leader" : "member") as "leader" | "member",
      }));
      return { ...row, members: mems };
    });
  });

export const markGroupSubmission = createServerFn({ method: "POST" })
  .inputValidator((d) => markSchema.parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("group_submissions").update({
      marks: data.marks, remarks: data.remarks, annotations: data.annotations ?? [],
      marked_at: new Date().toISOString(),
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const signGroupSubmissionDownload = createServerFn({ method: "POST" })
  .inputValidator((d: { submission_id: string }) => z.object({ submission_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireAdmin();
    const supabase = await getServiceClient();
    const { data: s } = await supabase.from("group_submissions").select("file_path").eq("id", data.submission_id).maybeSingle();
    if (!s?.file_path) return { url: null };
    const { data: signed } = await supabase.storage.from("assignment-files").createSignedUrl(s.file_path, 600);
    return { url: signed?.signedUrl ?? null };
  });

// Count admin notifications = recent submissions (individual + group)
export const listRecentSubmissions = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  const supabase = await getServiceClient();
  const [{ data: ind }, { data: grp }] = await Promise.all([
    supabase
      .from("submissions")
      .select("id, submitted_at, file_name, marks, assignment:assignments(title), student:students(full_name, reg_number)")
      .order("submitted_at", { ascending: false })
      .limit(15),
    supabase
      .from("group_submissions")
      .select("id, submitted_at, file_name, marks, assignment:assignments(title), group:groups(name)")
      .order("submitted_at", { ascending: false })
      .limit(15),
  ]);
  const rows = [
    ...((ind ?? []).map((r: unknown) => ({ ...(r as object), _type: "individual" as const }))),
    ...((grp ?? []).map((r: unknown) => ({ ...(r as object), _type: "group" as const }))),
  ];
  rows.sort((a, b) => new Date((b as unknown as { submitted_at: string }).submitted_at).getTime() - new Date((a as unknown as { submitted_at: string }).submitted_at).getTime());
  return rows.slice(0, 20);
});


function guessContentType(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".doc")) return "application/msword";
  if (n.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "application/octet-stream";
}
