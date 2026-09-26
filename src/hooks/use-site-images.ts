import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSiteImages } from "@/lib/media.functions";

export function useSiteImages() {
  const fn = useServerFn(getSiteImages);
  const { data } = useQuery({ queryKey: ["site-images"], queryFn: () => fn(), staleTime: 1000 * 60 * 30 });
  return data ?? { logo: null, hero: null, founder: null };
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}
