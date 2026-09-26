import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { uploadSiteImage } from "@/lib/media.functions";
import { useSiteImages, fileToBase64 } from "@/hooks/use-site-images";
import logoDefault from "@/assets/logo.png";
import heroDefault from "@/assets/hero.jpg";
import founderDefault from "@/assets/founder.jpg";

const items = [
  { key: "logo", label: "Logo / Nembo", fallback: logoDefault },
  { key: "hero", label: "Picha ya Home (Hero)", fallback: heroDefault },
  { key: "founder", label: "Picha ya Founder", fallback: founderDefault },
] as const;

export function SiteImagesPanel() {
  const imgs = useSiteImages();
  const upload = useServerFn(uploadSiteImage);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);

  async function onPick(key: (typeof items)[number]["key"], file?: File) {
    if (!file) return;
    setBusy(key);
    try {
      const res = await upload({ data: { key, file_name: file.name, file_base64: await fileToBase64(file) } });
      if (res.ok) { toast.success("Picha imebadilishwa"); qc.invalidateQueries({ queryKey: ["site-images"] }); }
      else toast.error(res.error);
    } catch (e) { toast.error((e as Error).message); }
    setBusy(null);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {items.map((it) => (
        <div key={it.key} className="rounded-2xl border border-border bg-card p-4">
          <div className="font-display text-primary">{it.label}</div>
          <div className="mt-3 flex aspect-video items-center justify-center overflow-hidden rounded-xl bg-muted">
            <img src={imgs[it.key] ?? it.fallback} alt={it.label} className="h-full w-full object-contain" />
          </div>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm hover:border-gold">
            {busy === it.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Pakia picha mpya
            <input type="file" accept="image/*" className="hidden" onChange={(e) => onPick(it.key, e.target.files?.[0])} />
          </label>
        </div>
      ))}
    </div>
  );
}
