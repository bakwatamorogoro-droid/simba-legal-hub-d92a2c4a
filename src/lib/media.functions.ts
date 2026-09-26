import { createServerFn } from "@tanstack/react-start";
import { useSession } from "@tanstack/react-start/server";
import { z } from "zod";

const BUCKET = "assignment-files";
const IMG_RE = /\.(png|jpe?g|webp|gif)$/i;
const SITE_KEYS = ["logo", "hero", "founder"] as const;

async function svc() {
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function decode(b64: string) {
  const clean = b64.includes(",") ? b64.split(",")[1] : b64;
  const bin = atob(clean);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

function imgType(n: string) {
  const x = n.toLowerCase();
  if (x.endsWith(".png")) return "image/png";
  if (x.endsWith(".webp")) return "image/webp";
  if (x.endsWith(".gif")) return "image/gif";
  return "image/jpeg";
}

async function sign(supabase: Awaited<ReturnType<typeof svc>>, path: string | null | undefined) {
  if (!path) return null;
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  return data?.signedUrl ?? null;
}

const imgSchema = z.object({
  file_base64: z.string().min(10).max(15_000_000),
  file_name: z.string().trim().min(1).max(200).refine((n) => IMG_RE.test(n), { message: "Picha tu (PNG/JPG/WEBP)" }),
});

// ---------- Site images (public read) ----------
export const getSiteImages = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = await svc();
  const { data } = await supabase.from("site_settings").select("key, value").in("key", [...SITE_KEYS]);
  const out: Record<string, string | null> = { logo: null, hero: null, founder: null };
  for (const r of data ?? []) out[r.key] = await sign(supabase, r.value);
  return out;
});

export const uploadSiteImage = createServerFn({ method: "POST" })
  .inputValidator((d) => imgSchema.extend({ key: z.enum(SITE_KEYS) }).parse(d))
  .handler(async ({ data }) => {
    const session = await useSession<{ adminId?: string; username?: string }>({
      password: process.env.ADMIN_SESSION_SECRET!,
      name: "sla_admin",
    });
    if (!session.data?.adminId && !session.data?.username) return { ok: false as const, error: "Ingia kama admin" };
    const bytes = decode(data.file_base64);
    if (bytes.byteLength > 10 * 1024 * 1024) return { ok: false as const, error: "Picha kubwa mno (max 10MB)" };
    const supabase = await svc();
    const path = `site/${data.key}-${Date.now()}-${data.file_name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: imgType(data.file_name), upsert: true });
    if (error) return { ok: false as const, error: error.message };
    await supabase.from("site_settings").upsert({ key: data.key, value: path, updated_at: new Date().toISOString() });
    return { ok: true as const };
  });

// ---------- Student photo ----------
async function studentSession() {
  const s = await useSession<{ studentId: string }>({
    password: process.env.ADMIN_SESSION_SECRET!,
    name: "sla_student",
  });
  return s.data?.studentId ?? null;
}

export const getMyPhoto = createServerFn({ method: "GET" }).handler(async () => {
  const id = await studentSession();
  if (!id) return null;
  const supabase = await svc();
  const { data } = await supabase.from("students").select("photo_url").eq("id", id).maybeSingle();
  return sign(supabase, data?.photo_url);
});

export const uploadMyPhoto = createServerFn({ method: "POST" })
  .inputValidator((d) => imgSchema.parse(d))
  .handler(async ({ data }) => {
    const id = await studentSession();
    if (!id) return { ok: false as const, error: "Tafadhali ingia" };
    const bytes = decode(data.file_base64);
    if (bytes.byteLength > 5 * 1024 * 1024) return { ok: false as const, error: "Picha kubwa mno (max 5MB)" };
    const supabase = await svc();
    const path = `photos/${id}-${Date.now()}-${data.file_name.replace(/[^\w.-]/g, "_")}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, bytes, { contentType: imgType(data.file_name), upsert: true });
    if (error) return { ok: false as const, error: error.message };
    await supabase.from("students").update({ photo_url: path }).eq("id", id);
    return { ok: true as const };
  });
