import { useCallback, useRef, useState } from "react";

export function useAdminAction(reload: () => Promise<void>) {
  const [isActing, setIsActing] = useState(false);
  const [actionMessage, setActionMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const actingRef = useRef(false);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, successMessage: string) => {
      if (actingRef.current) return;
      actingRef.current = true;
      try {
        setIsActing(true);
        setLoadError("");
        setActionMessage("");
        await action();
        try {
          await reload();
        } catch (reloadError: unknown) {
          const reloadErr = reloadError as { response?: { status?: number; data?: { error_message?: string } } };
          // A quick retry helps when backend rate-limit or transient network issues occur.
          if (reloadErr?.response?.status === 429) {
            await new Promise((resolve) => setTimeout(resolve, 700));
            await reload();
          } else {
            throw reloadError;
          }
        }
        setActionMessage(successMessage);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { error_message?: string } } };
        setLoadError(err?.response?.data?.error_message || "Action failed.");
      } finally {
        actingRef.current = false;
        setIsActing(false);
      }
    },
    [reload],
  );

  return { isActing, actionMessage, loadError, setLoadError, runAction };
}
