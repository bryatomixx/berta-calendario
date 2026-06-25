'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ccc.currentMemberId';

/**
 * Tracks which team member is using the app. The id is persisted in
 * localStorage so the choice survives reloads. `loaded` is false until
 * the first client-side read completes, so callers can avoid a flash.
 */
export function useCurrentMember() {
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setMemberId(localStorage.getItem(STORAGE_KEY));
    setLoaded(true);
  }, []);

  function choose(id: string) {
    localStorage.setItem(STORAGE_KEY, id);
    setMemberId(id);
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    setMemberId(null);
  }

  return { memberId, loaded, choose, clear };
}
