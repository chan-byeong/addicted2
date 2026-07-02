import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({
  placeholder,
  className,
  ...props
}: TextareaProps) {
  return (
    <textarea
      placeholder={placeholder}
      rows={4}
      className={cn(
        "w-full rounded-sm border-[1.5px] border-input bg-input px-3 py-2 text-sm text-foreground shadow-retro-xs transition placeholder:text-muted-foreground focus:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
