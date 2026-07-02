import React, { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

export const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  className,
  ...props
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className={cn(
        'h-10 w-full rounded-sm border-[1.5px] border-input bg-input px-3 py-2 text-sm text-foreground shadow-retro-sm transition placeholder:text-muted-foreground  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-none',
        props['aria-invalid'] ? 'border-destructive text-destructive shadow-retro-sm' : '',
        className
      )}
      {...props}
    />
  );
};
