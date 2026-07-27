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

// ---------- Types ----------
export type GroupMember = {
  student_id: string;
  full_name: string;
  reg_number: string;
  joined_at: string | null;
  is_leader: boolean;
  did_chat: boolean;
};

export type GroupAssignmentView = {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  question_path: string | null;
  question_name: string | null;
  course_id: string;
  academic_year_id: string;
  course_name: string | null;
  year_name: string | null;
  my_group: {
    id: string;
    name: string;
    leader_student_id: string;
    members: GroupMember[];
    participants_count: number;
    submission: {
      id: string; file_name: string; submitted_at: string;
      submitted_by_reg: string | null;
      marks: number | null; remarks: string | null; marked_at: string | null;
      ai_score: number | null; ai_reason: string | null;
      participants: Array<{ student_id: string; full_name: string; reg_number: string }>;
    } | null;
  } | null;
};

// ---------- Read: my group assignments ----------
export const listMyGroupAssignments = createServerFn({ method: "GET" }).handler(async (): Promise<GroupAssignmentView[]> => {
  const s = await requireStudent();
  const supabase = await getServiceClient();
  const { data: student } = await supabase
    .from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
  if (!student) return [];

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, description, deadline, question_path, question_name, course_id, academic_year_id, course:courses(name), academic_year:academic_years(name)")
    .eq("course_id", student.course_id)
    .eq("academic_year_id", student.academic_year_id)
    .eq("kind", "group")
    .order("deadline", { ascending: true });

  const list = (assignments ?? []) as unknown as Array<{
    id: string; title: string; description: string | null; deadline: string;
    question_path: string | null; question_name: string | null;
    course_id: string; academic_year_id: string;
    course: { name: string } | null; academic_year: { name: string } | null;
  }>;
  if (list.length === 0) return [];

  const results: GroupAssignmentView[] = [];
  for (const a of list) {
    const base = {
      id: a.id, title: a.title, description: a.description, deadline: a.deadline,
      question_path: a.question_path, question_name: a.question_name,
      course_id: a.course_id, academic_year_id: a.academic_year_id,
      course_name: a.course?.name ?? null, year_name: a.academic_year?.name ?? null,
    };
    // Find the (single) class-group row for this assignment/course/year
    const { data: grp } = await supabase.from("groups")
      .select("id, name, leader_student_id")
      .eq("assignment_id", a.id)
      .eq("course_id", a.course_id)
      .eq("academic_year_id", a.academic_year_id)
      .maybeSingle();
    if (!grp) { results.push({ ...base, my_group: null }); continue; }

    // Am I a member?
    const { data: myRow } = await supabase.from("group_members")
      .select("id").eq("group_id", grp.id).eq("student_id", s.studentId).maybeSingle();
    if (!myRow) { results.push({ ...base, my_group: null }); continue; }

    const [{ data: members }, { data: sub }, { data: chatSenders }] = await Promise.all([
      supabase.from("group_members")
        .select("student_id, confirmed_at, student:students(full_name, reg_number)")
        .eq("group_id", grp.id).order("confirmed_at", { ascending: true }),
      supabase.from("group_submissions")
        .select("id, file_name, submitted_at, marks, remarks, marked_at, ai_score, ai_reason, participants, submitted_by:students!group_submissions_submitted_by_student_id_fkey(reg_number)")
        .eq("group_id", grp.id).maybeSingle(),
      supabase.from("group_chat_messages")
        .select("student_id").eq("assignment_id", a.id).eq("course_id", a.course_id).eq("academic_year_id", a.academic_year_id),
    ]);

    const chatters = new Set((chatSenders ?? []).map((r) => r.student_id as string));
    const mems: GroupMember[] = (members ?? []).map((raw) => {
      const m = raw as unknown as { student_id: string; confirmed_at: string | null; student: { full_name: string; reg_number: string } | null };
      return {
        student_id: m.student_id,
        full_name: m.student?.full_name ?? "—",
        reg_number: m.student?.reg_number ?? "—",
        joined_at: m.confirmed_at,
        is_leader: m.student_id === grp.leader_student_id,
        did_chat: chatters.has(m.student_id),
      };
    });

    let subOut: GroupAssignmentView["my_group"] extends infer T ? (T extends { submission: infer U } ? U : never) : never = null as never;
    if (sub) {
      const raw = sub as unknown as {
        id: string; file_name: string; submitted_at: string;
        marks: number | null; remarks: string | null; marked_at: string | null;
        ai_score: number | null; ai_reason: string | null;
        participants: unknown;
        submitted_by: { reg_number: string } | null;
      };
      const parts = Array.isArray(raw.participants) ? raw.participants as Array<{ student_id: string; full_name: string; reg_number: string }> : [];
      subOut = {
        id: raw.id, file_name: raw.file_name, submitted_at: raw.submitted_at,
        marks: raw.marks, remarks: raw.remarks, marked_at: raw.marked_at,
        ai_score: raw.ai_score, ai_reason: raw.ai_reason,
        submitted_by_reg: raw.submitted_by?.reg_number ?? null,
        participants: parts,
      };
    }

    results.push({
      ...base,
      my_group: {
        id: grp.id, name: grp.name, leader_student_id: grp.leader_student_id,
        members: mems, participants_count: chatters.size,
        submission: subOut,
      },
    });
  }
  return results;
});

// ---------- Auto-join ----------
export const joinGroupAssignment = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();
    const { data: student } = await supabase
      .from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
    if (!student) return { ok: false as const, error: "Mwanafunzi hajapatikana" };

    const { data: a } = await supabase.from("assignments")
      .select("id, kind, course_id, academic_year_id, title, deadline")
      .eq("id", data.assignment_id).maybeSingle();
    if (!a || a.kind !== "group") return { ok: false as const, error: "Sio assignment ya group" };
    if (a.course_id !== student.course_id || a.academic_year_id !== student.academic_year_id) {
      return { ok: false as const, error: "Assignment hii sio ya course/mwaka wako" };
    }

    // Get or create the shared group row
    let { data: grp } = await supabase.from("groups")
      .select("id").eq("assignment_id", a.id).eq("course_id", a.course_id).eq("academic_year_id", a.academic_year_id)
      .maybeSingle();
    if (!grp) {
      const { data: created, error } = await supabase.from("groups").insert({
        name: (a as { title: string }).title,
        assignment_id: a.id, course_id: a.course_id, academic_year_id: a.academic_year_id,
        leader_student_id: s.studentId,
      }).select("id").single();
      if (error || !created) return { ok: false as const, error: error?.message ?? "Failed" };
      grp = created;
    }

    // Insert member (idempotent)
    const { data: existing } = await supabase.from("group_members")
      .select("id").eq("group_id", grp.id).eq("student_id", s.studentId).maybeSingle();
    if (!existing) {
      await supabase.from("group_members").insert({
        group_id: grp.id, student_id: s.studentId,
        status: "confirmed", confirmed_at: new Date().toISOString(),
      });
    }
    return { ok: true as const, group_id: grp.id };
  });

// ---------- Chat ----------
export const listGroupChat = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();
    const { data: st } = await supabase.from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
    if (!st) return [];
    const { data: msgs } = await supabase.from("group_chat_messages")
      .select("id, student_id, full_name, reg_number, message, created_at")
      .eq("assignment_id", data.assignment_id)
      .eq("course_id", st.course_id)
      .eq("academic_year_id", st.academic_year_id)
      .order("created_at", { ascending: true }).limit(500);
    return msgs ?? [];
  });

export const sendGroupChat = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string; message: string }) =>
    z.object({ assignment_id: z.string().uuid(), message: z.string().trim().min(1).max(2000) }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();
    const { data: st } = await supabase.from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
    if (!st) return { ok: false as const, error: "N/A" };
    const { error } = await supabase.from("group_chat_messages").insert({
      assignment_id: data.assignment_id,
      course_id: st.course_id,
      academic_year_id: st.academic_year_id,
      student_id: s.studentId,
      full_name: s.fullName,
      reg_number: s.regNumber,
      message: data.message,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

// ---------- Submit (any joined member can submit; records participants) ----------
const submitGroupSchema = z.object({
  group_id: z.string().uuid(),
  file_base64: z.string().min(1),
  file_name: z.string().trim().min(1).max(200)
    .refine((n) => /\.(pdf|doc|docx)$/i.test(n), { message: "PDF au Word pekee" }),
});

export const submitGroupAssignment = createServerFn({ method: "POST" })
  .inputValidator((d) => submitGroupSchema.parse(d))
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();

    const { data: grp } = await supabase.from("groups")
      .select("id, assignment_id, course_id, academic_year_id").eq("id", data.group_id).maybeSingle();
    if (!grp) return { ok: false as const, error: "Group haipo" };

    // Must be a member
    const { data: myMem } = await supabase.from("group_members")
      .select("id").eq("group_id", grp.id).eq("student_id", s.studentId).maybeSingle();
    if (!myMem) return { ok: false as const, error: "Wewe si mwanachama wa group hili" };

    // Already submitted?
    const { data: existing } = await supabase.from("group_submissions")
      .select("id").eq("group_id", grp.id).maybeSingle();
    if (existing) return { ok: false as const, error: "Kazi tayari imetumwa. Hakuna re-submit." };

    // Deadline
    const { data: a } = await supabase.from("assignments").select("deadline").eq("id", grp.assignment_id).maybeSingle();
    if (!a) return { ok: false as const, error: "Assignment haipo" };
    if (new Date(a.deadline).getTime() < Date.now()) {
      return { ok: false as const, error: "Deadline imeshapita" };
    }

    // Compute participants = members who posted ≥1 chat message
    const { data: chatSenders } = await supabase.from("group_chat_messages")
      .select("student_id").eq("assignment_id", grp.assignment_id)
      .eq("course_id", grp.course_id).eq("academic_year_id", grp.academic_year_id);
    const chatterIds = new Set<string>();
    (chatSenders ?? []).forEach((r) => { if (r.student_id) chatterIds.add(r.student_id as string); });
    chatterIds.add(s.studentId as string);

    const { data: memberRows } = await supabase.from("group_members")
      .select("student_id, student:students(full_name, reg_number)").eq("group_id", grp.id);
    const participants = (memberRows ?? [])
      .filter((raw) => chatterIds.has((raw as { student_id: string }).student_id))
      .map((raw) => {
        const m = raw as unknown as { student_id: string; student: { full_name: string; reg_number: string } | null };
        return { student_id: m.student_id, full_name: m.student?.full_name ?? "—", reg_number: m.student?.reg_number ?? "—" };
      });

    const bytes = decodeBase64(data.file_base64);
    if (bytes.byteLength > 15 * 1024 * 1024) {
      return { ok: false as const, error: "File kubwa mno (max 15MB)" };
    }
    const safeName = data.file_name.replace(/[^\w.-]/g, "_");
    const path = `group-submissions/${grp.assignment_id}/${grp.id}-${Date.now()}-${safeName}`;
    const { error: upErr } = await supabase.storage.from("assignment-files").upload(path, bytes, {
      contentType: guessContentType(data.file_name), upsert: true,
    });
    if (upErr) return { ok: false as const, error: upErr.message };

    const { runAiCheck } = await import("./ai-check.server");
    const ai = await runAiCheck(bytes, data.file_name);

    const { error } = await supabase.from("group_submissions").insert({
      group_id: grp.id, assignment_id: grp.assignment_id,
      submitted_by_student_id: s.studentId,
      file_path: path, file_name: data.file_name,
      ai_score: ai.ai_score, ai_reason: ai.ai_reason,
      participants,
    });
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, ai };
  });

export const getGroupQuestionUrl = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string }) => z.object({ assignment_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await requireStudent();
    const supabase = await getServiceClient();
    const { data: a } = await supabase.from("assignments").select("question_path").eq("id", data.assignment_id).maybeSingle();
    if (!a?.question_path) return { url: null };
    const { data: signed } = await supabase.storage.from("assignment-files").createSignedUrl(a.question_path, 600);
    return { url: signed?.signedUrl ?? null };
  });
