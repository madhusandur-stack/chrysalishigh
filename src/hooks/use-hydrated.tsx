import * as React from "react";

/**
 * Returns true once the component has mounted on the client.
 * Useful for gating UI that depends on client-only state (localStorage,
 * matchMedia, window) so it doesn't mismatch server-rendered HTML.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => {
    setHydrated(true);
  }, []);
  return hydrated;
}
