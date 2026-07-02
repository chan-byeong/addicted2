import { ElementType, HTMLAttributes } from "react";
import { VariantProps, cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const textVariants = cva("font-head", {
  variants: {
    as: {
      p: "font-sans text-sm leading-relaxed",
      li: "font-sans text-sm leading-relaxed",
      a: "font-sans text-sm hover:underline underline-offset-2 decoration-primary",
      h1: "text-3xl font-bold leading-tight",
      h2: "text-xl font-semibold leading-tight",
      h3: "text-base font-semibold leading-snug",
      h4: "text-sm font-semibold",
      h5: "text-sm font-medium",
      h6: "text-xs font-medium",
    },
  },
  defaultVariants: {
    as: "p",
  },
});

interface TextProps
  extends Omit<HTMLAttributes<HTMLElement>, "className">,
    VariantProps<typeof textVariants> {
  className?: string;
}

export const Text = (props: TextProps) => {
  const { className, as, ...otherProps } = props;
  const Tag: ElementType = as || "p";

  return (
    <Tag className={cn(textVariants({ as }), className)} {...otherProps} />
  );
};
