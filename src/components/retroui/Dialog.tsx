"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { cva, VariantProps } from "class-variance-authority";
import React, { HTMLAttributes, ReactNode } from "react";
import { X } from "lucide-react";

const Dialog = BaseDialog.Root;
const DialogTrigger = BaseDialog.Trigger;
const DialogTitle = BaseDialog.Title;

const overlayVariants = cva(
  ` fixed bg-black/70 font-head
    data-[open]:fade-in-0
    data-[open]:animate-in
    data-[closed]:animate-out
    data-[closed]:fade-out-0
  `,
  {
    variants: {
      variant: {
        default: "inset-0 z-50 bg-black/70",
        none: "fixed bg-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

interface IDialogBackgroupProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof overlayVariants> {}

const DialogBackdrop = (inputProps: IDialogBackgroupProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const { variant = "default", className, ref, ...props } = inputProps;

  return (
    <BaseDialog.Backdrop
      className={cn(overlayVariants({ variant }), className)}
      ref={ref}
      {...props}
    />
  );
};

const dialogVariants = cva(
  `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 overflow-hidden rounded-sm border-[1.5px] border-border bg-background text-foreground shadow-retro-lg duration-200
  data-[open]:animate-in
  data-[open]:fade-in-0
  data-[open]:zoom-in-95
  data-[closed]:animate-out
  data-[closed]:fade-out-0
  data-[closed]:zoom-out-95`,
  {
    variants: {
      size: {
        auto: "max-w-fit",
        sm: "lg:max-w-[30%]",
        md: "lg:max-w-[40%]",
        lg: "lg:max-w-[50%]",
        xl: "lg:max-w-[60%]",
        "2xl": "lg:max-w-[70%]",
        "3xl": "lg:max-w-[80%]",
        "4xl": "lg:max-w-[90%]",
        screen: "max-w-[100%]",
      },
    },
    defaultVariants: {
      size: "auto",
    },
  },
);

interface IDialogContentProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogVariants> {
  overlay?: IDialogBackgroupProps;
}

const DialogContent = (inputProps: IDialogContentProps & { ref?: React.Ref<HTMLDivElement> }) => {
  const {
    children,
    size = "auto",
    className,
    overlay,
    ref,
    ...props
  } = inputProps;

  return (
    <BaseDialog.Portal>
      <DialogBackdrop {...overlay} />
      <BaseDialog.Popup
        className={cn(dialogVariants({ size }), className)}
        ref={ref}
        {...props}
      >
        <div className="flex flex-col relative">{children}</div>
      </BaseDialog.Popup>
    </BaseDialog.Portal>
  );
};

interface IDialogDescriptionProps extends HTMLAttributes<HTMLDivElement> {}
const DialogDescription = ({
  children,
  className,
  ...props
}: IDialogDescriptionProps) => {
  return (
    <BaseDialog.Description className={cn(className)} {...props}>
      {children}
    </BaseDialog.Description>
  );
};

const dialogFooterVariants = cva(
  "flex min-h-12 items-center justify-end gap-3 border-t-[1.5px] border-border px-4 py-2",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
      },
      position: {
        fixed: "sticky bottom-0",
        static: "static",
      },
    },
    defaultVariants: {
      position: "fixed",
    },
  },
);

export interface IDialogFooterProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogFooterVariants> {}

const DialogFooter = ({
  children,
  className,
  position,
  variant,
  ...props
}: IDialogFooterProps) => {
  return (
    <div
      className={cn(dialogFooterVariants({ position, variant }), className)}
      {...props}
    >
      {children}
    </div>
  );
};

const dialogHeaderVariants = cva(
  "flex min-h-12 items-center justify-between border-b-[1.5px] border-border px-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
      },
      position: {
        fixed: "sticky top-0",
        static: "static",
      },
    },
    defaultVariants: {
      variant: "default",
      position: "static",
    },
  },
);

const DialogHeaderDefaultLayout = ({ children }: { children: ReactNode }) => {
  return (
    <>
      {children}
      <BaseDialog.Close title="Close pop-up" className="cursor-pointer">
        <X />
      </BaseDialog.Close>
    </>
  );
};

interface IDialogHeaderProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dialogHeaderVariants> {
  asChild?: boolean;
}

const DialogHeader = ({
  children,
  className,
  position,
  variant,
  asChild,
  ...props
}: IDialogHeaderProps) => {
  return (
    <div
      className={cn(dialogHeaderVariants({ position, variant }), className)}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <DialogHeaderDefaultLayout>{children}</DialogHeaderDefaultLayout>
      )}
    </div>
  );
};

const DialogComponent = Object.assign(Dialog, {
  Trigger: DialogTrigger,
  Title: DialogTitle,
  Header: DialogHeader,
  Content: DialogContent,
  Description: DialogDescription,
  Footer: DialogFooter,
  Close: BaseDialog.Close,
});

export { DialogComponent as Dialog };
