'use client';

import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import { annotate } from 'rough-notation';
import type {
  RoughAnnotation,
  RoughAnnotationConfig,
  RoughAnnotationType,
} from 'rough-notation/lib/model';

type RoughAnnotationProps = {
  children: ReactNode;
  className?: string;
  testId?: string;
  color?: RoughAnnotationConfig['color'];
  type?: RoughAnnotationType;
  padding?: RoughAnnotationConfig['padding'];
  strokeWidth?: number;
  animationDuration?: number;
};

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function canRenderRoughAnnotation() {
  if (typeof document === 'undefined') return false;

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

  return typeof path.getTotalLength === 'function';
}

export function RoughAnnotation({
  children,
  className,
  testId,
  type = 'underline',
  color = '#111111',
  padding = 2,
  strokeWidth = 1.5,
  animationDuration = 650,
}: RoughAnnotationProps) {
  const targetRef = useRef<HTMLSpanElement>(null);
  const hasShownRef = useRef(false);

  useEffect(() => {
    const target = targetRef.current;

    if (!target) return;
    if (!canRenderRoughAnnotation()) return;

    const annotation: RoughAnnotation = annotate(target, {
      type,
      color: color,
      padding,
      strokeWidth,
      animationDuration,
      animate: !prefersReducedMotion(),
      iterations: 1,
    });

    annotation.show();
    hasShownRef.current = true;

    return () => {
      annotation.remove();
      hasShownRef.current = false;
    };
  }, [animationDuration, padding, strokeWidth, type]);

  return (
    <span ref={targetRef} className={className} data-testid={testId} data-rough-annotation={type}>
      {children}
    </span>
  );
}
