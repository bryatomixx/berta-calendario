'use client';

import { useEffect, useState } from 'react';
import { useCurrentMember } from '@/hooks/useCurrentMember';
import { getMembers } from '@/lib/db/members';
import type { Member } from '@/lib/types';
import { NamePicker } from './NamePicker';
import { Sidebar } from './Sidebar';
import { Skeleton } from './ui/Skeleton';

/**
 * Gates the whole app. Shows the name picker until a member is chosen,
 * then renders the sidebar shell plus the routed page.
 */
export function NameGate({ children }: { children: React.ReactNode }) {
  const { memberId, loaded, choose, clear } = useCurrentMember();
  const [members, setMembers]         = useState<Member[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  useEffect(() => {
    getMembers()
      .then(setMembers)
      .catch(() => setMembers([]))
      .finally(() => setMembersLoaded(true));
  }, []);

  /* Estado de carga inicial */
  if (!loaded || !membersLoaded) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center">
        <div className="flex flex-col gap-3 w-48">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4 mx-auto" />
        </div>
      </div>
    );
  }

  const current = members.find((m) => m.id === memberId) ?? null;

  /* Sin miembro seleccionado: mostrar el gate */
  if (!current) {
    return (
      <NamePicker
        members={members}
        onPicked={(m) => {
          setMembers((prev) =>
            prev.some((x) => x.id === m.id) ? prev : [...prev, m],
          );
          choose(m.id);
        }}
      />
    );
  }

  /* Shell principal con sidebar */
  return (
    <>
      {/* Skip link accesible */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-[var(--color-teal-600)] focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-semibold"
      >
        Saltar al contenido principal
      </a>

      <div className="flex h-screen overflow-hidden">
        <Sidebar currentMember={current} onSwitchMember={clear} />

        {/* Offset para la topbar mobile */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto bg-[var(--color-surface)] lg:pt-0 pt-[var(--topbar-h)]"
        >
          <div className="max-w-[var(--content-max-w)] mx-auto px-[var(--page-px)] py-[var(--page-py)]">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
