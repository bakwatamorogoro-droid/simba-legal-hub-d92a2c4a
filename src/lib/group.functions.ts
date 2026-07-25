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
  last_name: string | null;
  status: "pending" | "confirmed" | "declined";
  is_leader: boolean;
  confirmed_at: string | null;
};

export type GroupAssignmentView = {
  id: string;
  title: string;
  description: string | null;
  deadline: string;
  question_path: string | null;
  question_name: string | null;
  course_name: string | null;
  year_name: string | null;
  my_group: {
    id: string;
    name: string;
    leader_student_id: string;
    members: GroupMember[];
    all_confirmed: boolean;
    confirmed_count: number;
    total_count: number;
    submission: {
      id: string; file_name: string; submitted_at: string;
      marks: number | null; remarks: string | null; marked_at: string | null;
      ai_score: number | null; ai_reason: string | null;
    } | null;
  } | null;
};

// ---------- Reads ----------
export const listMyGroupAssignments = createServerFn({ method: "GET" }).handler(async (): Promise<GroupAssignmentView[]> => {
  const s = await requireStudent();
  const supabase = await getServiceClient();
  const { data: student } = await supabase
    .from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
  if (!student) return [];

  const { data: assignments } = await supabase
    .from("assignments")
    .select("id, title, description, deadline, question_path, question_name, course:courses(name), academic_year:academic_years(name)")
    .eq("course_id", student.course_id)
    .eq("academic_year_id", student.academic_year_id)
    .eq("kind", "group")
    .order("deadline", { ascending: true });
  const list = (assignments ?? []) as unknown as Array<{
    id: string; title: string; description: string | null; deadline: string;
    question_path: string | null; question_name: string | null;
    course: { name: string } | null; academic_year: { name: string } | null;
  }>;
  if (list.length === 0) return [];

  const assignmentIds = list.map((a) => a.id);
  const { data: myMemberships } = await supabase
    .from("group_members")
    .select("group_id, group:groups(id, name, leader_student_id, assignment_id)")
    .eq("student_id", s.studentId);
  const myByAssignment = new Map<string, { groupId: string; name: string; leaderId: string }>();
  (myMemberships ?? []).forEach((raw) => {
    const m = raw as unknown as { group_id: string; group: { id: string; name: string; leader_student_id: string; assignment_id: string } | null };
    if (m.group && assignmentIds.includes(m.group.assignment_id)) {
      myByAssignment.set(m.group.assignment_id, { groupId: m.group.id, name: m.group.name, leaderId: m.group.leader_student_id });
    }
  });

  const results: GroupAssignmentView[] = [];
  for (const a of list) {
    const base = {
      id: a.id, title: a.title, description: a.description, deadline: a.deadline,
      question_path: a.question_path, question_name: a.question_name,
      course_name: a.course?.name ?? null, year_name: a.academic_year?.name ?? null,
    };
    const my = myByAssignment.get(a.id);
    if (!my) {
      results.push({ ...base, my_group: null });
      continue;
    }
    const [{ data: members }, { data: sub }] = await Promise.all([
      supabase.from("group_members")
        .select("student_id, status, confirmed_at, student:students(full_name, reg_number, last_name)")
        .eq("group_id", my.groupId),
      supabase.from("group_submissions")
        .select("id, file_name, submitted_at, marks, remarks, marked_at, ai_score, ai_reason")
        .eq("group_id", my.groupId).maybeSingle(),
    ]);
    const mems: GroupMember[] = (members ?? []).map((raw) => {
      const m = raw as unknown as { student_id: string; status: "pending" | "confirmed" | "declined"; confirmed_at: string | null; student: { full_name: string; reg_number: string; last_name: string | null } | null };
      return {
        student_id: m.student_id,
        full_name: m.student?.full_name ?? "—",
        reg_number: m.student?.reg_number ?? "—",
        last_name: m.student?.last_name ?? null,
        status: m.status, is_leader: m.student_id === my.leaderId,
        confirmed_at: m.confirmed_at,
      };
    });
    const confirmedCount = mems.filter((m) => m.status === "confirmed").length;
    const allConfirmed = mems.length > 0 && confirmedCount === mems.length;
    results.push({
      ...base,
      my_group: {
        id: my.groupId, name: my.name, leader_student_id: my.leaderId,
        members: mems, all_confirmed: allConfirmed,
        confirmed_count: confirmedCount, total_count: mems.length,
        submission: sub ?? null,
      },
    });
  }
  return results;
});

// Students in same course + year (for leader to pick members)
export const listMyClassmates = createServerFn({ method: "GET" }).handler(async () => {
  const s = await requireStudent();
  const supabase = await getServiceClient();
  const { data: me } = await supabase
    .from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
  if (!me) return [];
  const { data } = await supabase
    .from("students")
    .select("id, full_name, reg_number, last_name")
    .eq("course_id", me.course_id)
    .eq("academic_year_id", me.academic_year_id)
    .neq("id", s.studentId)
    .order("full_name");
  return data ?? [];
});

// ---------- Mutations ----------
export const createGroup = createServerFn({ method: "POST" })
  .inputValidator((d: { assignment_id: string; name: string; member_ids: string[] }) =>
    z.object({
      assignment_id: z.string().uuid(),
      name: z.string().trim().min(2).max(120),
      member_ids: z.array(z.string().uuid()).min(1).max(20),
    }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();

    // Verify assignment is group kind & get course/year
    const { data: a } = await supabase
      .from("assignments").select("id, kind, course_id, academic_year_id")
      .eq("id", data.assignment_id).maybeSingle();
    if (!a || a.kind !== "group") return { ok: false as const, error: "Sio assignment ya group" };

    // Verify leader belongs to course/year
    const { data: me } = await supabase
      .from("students").select("course_id, academic_year_id").eq("id", s.studentId).maybeSingle();
    if (!me || me.course_id !== a.course_id || me.academic_year_id !== a.academic_year_id) {
      return { ok: false as const, error: "Wewe si wa course/mwaka huu" };
    }

    // Verify none of the students is already in a group for this assignment
    const involvedIds = [s.studentId, ...data.member_ids];
    const { data: existingGroups } = await supabase
      .from("group_members")
      .select("student_id, group:groups!inner(assignment_id)")
      .in("student_id", involvedIds);
    const clashing = (existingGroups ?? []).some((raw) => {
      const g = raw as unknown as { group: { assignment_id: string } | null };
      return g.group?.assignment_id === data.assignment_id;
    });
    if (clashing) return { ok: false as const, error: "Mwanachama mmoja tayari yumo kwenye group ya assignment hii" };

    // Verify all members are from same course/year
    const { data: members } = await supabase
      .from("students").select("id, course_id, academic_year_id").in("id", data.member_ids);
    for (const m of members ?? []) {
      if (m.course_id !== a.course_id || m.academic_year_id !== a.academic_year_id) {
        return { ok: false as const, error: "Wanachama wote lazima wawe wa course na mwaka mmoja" };
      }
    }

    // Create group
    const { data: grp, error: grpErr } = await supabase.from("groups").insert({
      name: data.name, assignment_id: data.assignment_id,
      course_id: a.course_id, academic_year_id: a.academic_year_id,
      leader_student_id: s.studentId,
    }).select("id").single();
    if (grpErr || !grp) return { ok: false as const, error: grpErr?.message ?? "Failed" };

    // Insert leader (auto-confirmed) + members (pending)
    const rows = [
      { group_id: grp.id, student_id: s.studentId, status: "confirmed", confirmed_at: new Date().toISOString() },
      ...data.member_ids.map((id) => ({ group_id: grp.id, student_id: id, status: "pending" as const })),
    ];
    const { error: memErr } = await supabase.from("group_members").insert(rows);
    if (memErr) {
      await supabase.from("groups").delete().eq("id", grp.id);
      return { ok: false as const, error: memErr.message };
    }
    return { ok: true as const, group_id: grp.id };
  });

export const respondGroupInvite = createServerFn({ method: "POST" })
  .inputValidator((d: { group_id: string; accept: boolean }) =>
    z.object({ group_id: z.string().uuid(), accept: z.boolean() }).parse(d),
  )
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();
    const { error } = await supabase.from("group_members").update({
      status: data.accept ? "confirmed" : "declined",
      confirmed_at: data.accept ? new Date().toISOString() : null,
    }).eq("group_id", data.group_id).eq("student_id", s.studentId);
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const };
  });

export const leaveOrCancelGroup = createServerFn({ method: "POST" })
  .inputValidator((d: { group_id: string }) => z.object({ group_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const s = await requireStudent();
    const supabase = await getServiceClient();
    const { data: g } = await supabase.from("groups").select("leader_student_id").eq("id", data.group_id).maybeSingle();
    if (!g) return { ok: false as const, error: "Group haipo" };
    // Prevent leave after submission
    const { data: sub } = await supabase.from("group_submissions").select("id").eq("group_id", data.group_id).maybeSingle();
    if (sub) return { ok: false as const, error: "Kazi tayari imetumwa" };
    if (g.leader_student_id === s.studentId) {
      // leader cancels whole group
      const { error } = await supabase.from("groups").delete().eq("id", data.group_id);
      if (error) return { ok: false as const, error: error.message };
    } else {
      const { error } = await supabase.from("group_members").delete().eq("group_id", data.group_id).eq("student_id", s.studentId);
      if (error) return { ok: false as const, error: error.message };
    }
    return { ok: true as const };
  });

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
      .select("id, assignment_id, leader_student_id").eq("id", data.group_id).maybeSingle();
    if (!grp) return { ok: false as const, error: "Group haipo" };
    if (grp.leader_student_id !== s.studentId) {
      return { ok: false as const, error: "Ni kiongozi tu wa group anaweza kutuma" };
    }

    // All confirmed?
    const { data: members } = await supabase.from("group_members")
      .select("status").eq("group_id", grp.id);
    if (!members || members.length === 0 || members.some((m) => m.status !== "confirmed")) {
      return { ok: false as const, error: "Wanachama wote hawajakonfirm bado" };
    }

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
