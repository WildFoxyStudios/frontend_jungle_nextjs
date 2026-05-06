import { useCallback, useState } from "react";

/**
 * Cursor-based admin lists (`id < cursor` + `has_more`); the backend ignores `page=`.
 */
export function useAdminCursorPages() {
  const [sentCursor, setSentCursor] = useState<string | undefined>(undefined);
  const [past, setPast] = useState<(string | undefined)[]>([]);
  const page = past.length + 1;

  const goToPage = useCallback(
    (newPage: number, nextCursorFromResponse?: string) => {
      if (newPage < 1) return;
      if (newPage > page) {
        if (nextCursorFromResponse) {
          setPast((p) => [...p, sentCursor]);
          setSentCursor(nextCursorFromResponse);
        }
      } else if (newPage < page) {
        const back = page - newPage;
        setSentCursor(past[past.length - back] ?? undefined);
        setPast((p) => p.slice(0, p.length - back));
      }
    },
    [page, past, sentCursor],
  );

  const reset = useCallback(() => {
    setSentCursor(undefined);
    setPast([]);
  }, []);

  return { sentCursor, page, goToPage, reset };
}
