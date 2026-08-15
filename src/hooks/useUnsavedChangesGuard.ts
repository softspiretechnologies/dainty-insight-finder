import { useBlocker } from "@tanstack/react-router";
import { useEffect, useRef } from "react";

const DEFAULT_MESSAGE = "You have unsaved changes.\nLeave without saving?";

/**
 * Blocks in-app navigation and tab close when `isDirty` is true.
 * Uses TanStack Router's official useBlocker + beforeunload.
 */
export function useUnsavedChangesGuard(isDirty: boolean, message = DEFAULT_MESSAGE) {
  const dirtyRef = useRef(isDirty);
  dirtyRef.current = isDirty;

  useBlocker({
    disabled: !isDirty,
    enableBeforeUnload: isDirty,
    shouldBlockFn: async () => {
      if (!dirtyRef.current) return false;
      return !window.confirm(message);
    },
  });

  // Keep a stable listener for environments that only honor beforeunload via direct attach.
  useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);
}
