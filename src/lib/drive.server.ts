// Google Drive mirror — uploads files to the academy owner's Google Drive.
// Uses the Lovable connector gateway; never call Google APIs directly.
// Failures are non-blocking: the primary copy always stays in Lovable Cloud storage.

const GATEWAY_BASE = "https://connector-gateway.lovable.dev/google_drive";
const FOLDER_NAME = "Simba Legal Academy";

function gatewayHeaders(): Record<string, string> | null {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const driveKey = process.env["GOOGLE_DRIVE_API_KEY"];
  if (!lovableKey || !driveKey) return null;
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": driveKey,
  };
}

let folderIdCache: string | null = null;

async function ensureFolder(headers: Record<string, string>): Promise<string | null> {
  if (folderIdCache) return folderIdCache;
  // Search for existing folder
  const q = encodeURIComponent(
    `name='${FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const search = await fetch(`${GATEWAY_BASE}/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`, { headers });
  if (search.ok) {
    const body = (await search.json()) as { files?: Array<{ id: string }> };
    if (body.files && body.files.length > 0) {
      folderIdCache = body.files[0]!.id;
      return folderIdCache;
    }
  }
  // Create folder
  const create = await fetch(`${GATEWAY_BASE}/drive/v3/files`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: "application/vnd.google-apps.folder" }),
  });
  if (!create.ok) {
    console.error(`Drive folder create failed [${create.status}]: ${await create.text()}`);
    return null;
  }
  const created = (await create.json()) as { id: string };
  folderIdCache = created.id;
  return folderIdCache;
}

export type DriveMirror = { file_id: string; url: string };

/**
 * Uploads a copy of a file to Google Drive. Returns null on any failure —
 * callers must treat this as best-effort backup, not a hard requirement.
 */
export async function mirrorToDrive(
  bytes: Uint8Array,
  fileName: string,
  contentType: string,
  subfolder?: string
): Promise<DriveMirror | null> {
  try {
    const headers = gatewayHeaders();
    if (!headers) return null; // connector not linked

    let parentId = await ensureFolder(headers);
    if (!parentId) return null;

    if (subfolder) {
      const safe = subfolder.replace(/'/g, "");
      const q = encodeURIComponent(
        `name='${safe}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
      );
      const search = await fetch(`${GATEWAY_BASE}/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`, { headers });
      let subId: string | null = null;
      if (search.ok) {
        const body = (await search.json()) as { files?: Array<{ id: string }> };
        subId = body.files?.[0]?.id ?? null;
      }
      if (!subId) {
        const create = await fetch(`${GATEWAY_BASE}/drive/v3/files`, {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ name: safe, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
        });
        if (create.ok) subId = ((await create.json()) as { id: string }).id;
      }
      if (subId) parentId = subId;
    }

    // multipart/related upload: metadata part + media part
    const boundary = `sla_${crypto.randomUUID().replace(/-/g, "")}`;
    const metadata = JSON.stringify({ name: fileName, parents: [parentId] });
    const metaPart = new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
    );
    const mediaHeader = new TextEncoder().encode(`--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`);
    const closing = new TextEncoder().encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(metaPart.length + mediaHeader.length + bytes.length + closing.length);
    body.set(metaPart, 0);
    body.set(mediaHeader, metaPart.length);
    body.set(bytes, metaPart.length + mediaHeader.length);
    body.set(closing, metaPart.length + mediaHeader.length + bytes.length);

    const upload = await fetch(`${GATEWAY_BASE}/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink`, {
      method: "POST",
      headers: { ...headers, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: body as unknown as BodyInit,
    });
    if (!upload.ok) {
      console.error(`Drive upload failed [${upload.status}]: ${await upload.text()}`);
      return null;
    }
    const file = (await upload.json()) as { id: string; webViewLink?: string };
    return { file_id: file.id, url: file.webViewLink ?? `https://drive.google.com/file/d/${file.id}/view` };
  } catch (err) {
    console.error("Drive mirror error:", err);
    return null;
  }
}
