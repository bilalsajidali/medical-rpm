import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

/** Hover intent (only on devices with a real hover) + keyboard focus. */
export function usePeek(available: boolean) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<'left' | 'right'>('left');
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover) and (pointer: fine)').matches;
  useEffect(() => () => clearTimeout(timer.current), []);
  const later = (v: boolean, ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      // grow toward the side with more room so a wide panel never runs off screen
      const r = ref.current?.getBoundingClientRect();
      if (v && r) setAnchor(r.left + r.width / 2 > window.innerWidth / 2 ? 'right' : 'left');
      setOpen(v);
    }, ms);
  };
  return {
    enabled: available,
    open,
    anchor,
    ref,
    handlers: {
      onPointerEnter: (e: PointerEvent) => { if (canHover && e.pointerType === 'mouse') later(true, 140); },
      onPointerLeave: () => later(false, 90),
      onFocus: () => later(true, 0),
      onBlur: () => later(false, 0),
      onKeyDown: (e: KeyboardEvent) => { if (e.key === 'Escape') later(false, 0); },
    },
  };
}
