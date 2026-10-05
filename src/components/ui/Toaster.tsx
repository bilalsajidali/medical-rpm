import { Toaster as Sonner } from 'sonner';

/** Black toast, white text, inner radius. */
export function Toaster() {
  return (
    <Sonner
      position="bottom-center"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast: 'flex w-[min(420px,calc(100vw-32px))] items-start gap-3 rounded-inner bg-ink px-4 py-3.5 font-sans text-[15px] leading-[22px] text-surface',
          title: 'font-semibold',
          description: 'text-surface/80',
          actionButton: 'ml-auto rounded-full bg-surface px-3 py-1 text-[13px] font-semibold text-ink',
        },
      }}
    />
  );
}

export { toast } from 'sonner';
