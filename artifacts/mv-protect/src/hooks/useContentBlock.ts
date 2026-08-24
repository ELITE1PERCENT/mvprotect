import { useQuery } from "@tanstack/react-query";

export type ContentBlock = {
  key: string;
  label: string;
  section: string;
  value: string;
};

const BASE = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");

export function useContentBlocks() {
  return useQuery<ContentBlock[]>({
    queryKey: ["content-blocks"],
    queryFn: () =>
      fetch(`${BASE}/api/content`).then((r) => {
        if (!r.ok) throw new Error("content fetch failed");
        return r.json() as Promise<ContentBlock[]>;
      }),
    staleTime: 5 * 60 * 1000,
  });
}

/** Returns the live value for a content block, falling back to `fallback` while loading or on error. */
export function useContentBlock(key: string, fallback: string = ""): string {
  const { data } = useContentBlocks();
  return data?.find((b) => b.key === key)?.value ?? fallback;
}
