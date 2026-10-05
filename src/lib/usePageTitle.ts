import { useEffect } from 'react';

/** Sets the tab title to "Page — RPM Platform". */
export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `${title} — RPM Platform`;
  }, [title]);
}
