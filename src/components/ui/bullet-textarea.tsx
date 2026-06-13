import * as React from "react";

import { bulletDisplayToPlain, plainToBulletDisplay } from "@/lib/bullet-lines";
import { cn } from "@/lib/utils";

import { Textarea } from "./textarea";

type BulletTextareaProps = Omit<React.ComponentProps<typeof Textarea>, "value" | "onChange"> & {
  value: string;
  onChange: (value: string) => void;
};

export const BulletTextarea = React.forwardRef<HTMLTextAreaElement, BulletTextareaProps>(
  ({ value, onChange, className, onKeyDown, onFocus, onBlur, placeholder, ...props }, ref) => {
    const innerRef = React.useRef<HTMLTextAreaElement | null>(null);
    const pendingCursor = React.useRef<number | null>(null);

    const setRefs = (node: HTMLTextAreaElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const [display, setDisplay] = React.useState(() => plainToBulletDisplay(value));

    React.useEffect(() => {
      setDisplay(plainToBulletDisplay(value));
    }, [value]);

    React.useLayoutEffect(() => {
      if (pendingCursor.current === null || !innerRef.current) return;
      innerRef.current.selectionStart = pendingCursor.current;
      innerRef.current.selectionEnd = pendingCursor.current;
      pendingCursor.current = null;
    });

    const commitDisplay = (nextDisplay: string, cursor?: number) => {
      setDisplay(nextDisplay);
      onChange(bulletDisplayToPlain(nextDisplay));
      if (cursor !== undefined) pendingCursor.current = cursor;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      commitDisplay(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const { selectionStart, selectionEnd, value: current } = el;

      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const insert = "\n• ";
        const next = current.slice(0, selectionStart) + insert + current.slice(selectionEnd);
        commitDisplay(next, selectionStart + insert.length);
        return;
      }

      if (e.key === "Backspace" && selectionStart === selectionEnd) {
        const lineStart = current.lastIndexOf("\n", selectionStart - 1) + 1;
        const line = current.slice(lineStart, selectionStart);
        if (line === "• " || line === "•") {
          e.preventDefault();
          if (lineStart === 0) {
            commitDisplay("", 0);
            return;
          }
          const next = current.slice(0, lineStart - 1) + current.slice(selectionStart);
          commitDisplay(next, lineStart - 1);
          return;
        }
      }

      onKeyDown?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (!display.trim()) {
        commitDisplay("• ", 2);
      }
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (bulletDisplayToPlain(display) === "") {
        setDisplay("");
      }
      onBlur?.(e);
    };

    return (
      <Textarea
        ref={setRefs}
        value={display}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder ?? "• First point\n• Second point"}
        className={cn("leading-relaxed", className)}
        {...props}
      />
    );
  },
);

BulletTextarea.displayName = "BulletTextarea";
