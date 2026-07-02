'use client';

import { cn } from '@/lib/utils';
import { cva, VariantProps } from 'class-variance-authority';
import React, { ButtonHTMLAttributes } from 'react';
import { Button as BaseButton } from '@base-ui/react/button';

type BaseButtonRender = React.ComponentProps<typeof BaseButton>['render'];

export const buttonVariants = cva(
  'font-head inline-flex cursor-pointer items-center justify-center rounded-sm border-[1.5px] border-border text-sm font-semibold leading-none transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-retro hover:bg-primary-hover hover:shadow-retro-sm active:translate-x-px active:translate-y-px active:shadow-none',
        secondary:
          'bg-secondary text-secondary-foreground shadow-retro hover:bg-secondary-hover hover:shadow-retro-sm active:translate-x-px active:translate-y-px active:shadow-none',
        outline:
          'bg-background text-foreground shadow-retro-sm hover:bg-accent active:translate-x-px active:translate-y-px active:shadow-none',
        link: 'border-transparent bg-transparent shadow-none hover:underline',
        ghost: 'border-transparent bg-transparent shadow-none hover:bg-accent',
      },
      size: {
        sm: 'min-h-8 px-2.5 py-1.5',
        md: 'min-h-9 px-3.5 py-2',
        lg: 'min-h-11 px-5 py-2.5 text-base',
        icon: 'size-9 p-0',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
);

export interface IButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  render?: BaseButtonRender;
}

export const Button = ({
  children,
  size = 'md',
  className = '',
  variant = 'default',
  render,
  ref,
  ...props
}: IButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
  return (
    <BaseButton
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      render={render}
      {...props}
    >
      {children}
    </BaseButton>
  );
};
