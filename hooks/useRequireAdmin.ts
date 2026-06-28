'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentMember } from './useCurrentMember';
import { getMembers } from '@/lib/db/members';
import type { Role } from '@/lib/types';

/**
 * Restringe una pagina a admin (Berta). Resuelve el rol del miembro actual y,
 * si NO es admin, redirige al tablero. Las paginas usan `status` para no
 * renderizar el contenido protegido mientras se decide o si no esta permitido.
 *
 *  - 'checking': aun resolviendo el rol
 *  - 'allowed' : es admin, mostrar la pagina
 *  - 'denied'  : no es admin, se esta redirigiendo
 */
export function useRequireAdmin() {
  const router = useRouter();
  const { memberId, loaded } = useCurrentMember();
  const [role, setRole] = useState<Role | null>(null);
  const [resolved, setResolved] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    let active = true;
    getMembers()
      .then((ms) => {
        if (active) setRole(ms.find((m) => m.id === memberId)?.role ?? null);
      })
      .catch(() => { /* sin miembros: queda denegado */ })
      .finally(() => { if (active) setResolved(true); });
    return () => { active = false; };
  }, [loaded, memberId]);

  const isAdmin = role === 'admin';

  useEffect(() => {
    if (resolved && !isAdmin) router.replace('/');
  }, [resolved, isAdmin, router]);

  const status: 'checking' | 'allowed' | 'denied' = !resolved
    ? 'checking'
    : isAdmin
      ? 'allowed'
      : 'denied';

  return { status, isAdmin };
}
