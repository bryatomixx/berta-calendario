'use client';

import { useState } from 'react';
import { Calculator } from 'lucide-react';
import { addMember } from '@/lib/db/members';
import { MEMBER_COLORS, ROLE_LABELS } from '@/lib/constants';
import type { Member } from '@/lib/types';
import { Avatar } from './Avatar';
import { Skeleton } from './ui/Skeleton';

interface NamePickerProps {
  members:  Member[];
  onPicked: (member: Member) => void;
}

export function NamePicker({ members, onPicked }: NamePickerProps) {
  const [newName, setNewName] = useState('');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  async function handleAdd() {
    if (newName.trim() === '') return;
    setSaving(true);
    setError('');
    try {
      const color  = MEMBER_COLORS[members.length % MEMBER_COLORS.length];
      const member = await addMember(newName.trim(), color);
      onPicked(member);
    } catch {
      setError('No pudimos agregar tu nombre. Revisa tu conexion e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-scale-in">

        {/* Logo / marca */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-[var(--radius-xl)] bg-[var(--color-teal-600)] flex items-center justify-center mx-auto mb-4 shadow-card">
            <Calculator className="w-6 h-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)]">BVR Asesorias</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Quien eres hoy?</p>
        </div>

        {/* Grid de miembros o skeleton */}
        {members.length === 0 ? (
          <p className="text-sm text-center text-[var(--color-text-muted)] mb-6">
            Todavia no hay nadie en el equipo. Agrega tu nombre abajo para empezar.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {members.map((m) => (
              <button
                key={m.id}
                onClick={() => onPicked(m)}
                className="flex flex-col items-center gap-2.5 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-white p-5 text-center shadow-xs transition-all duration-[var(--duration-normal)] hover:border-teal-300 hover:shadow-card hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40 focus-visible:outline-none cursor-pointer"
              >
                <Avatar name={m.name} color={m.color} size={44} />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">{m.name}</span>
                <span className="text-[11px] font-medium text-[var(--color-text-muted)] bg-[var(--color-surface-2)] rounded-full px-2 py-0.5">
                  {ROLE_LABELS[m.role]}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Agregar nombre */}
        <div className="border-t border-[var(--color-border-soft)] pt-5">
          <label className="text-xs font-semibold text-[var(--color-text-secondary)] block mb-2">
            No estas en la lista?
          </label>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="Tu nombre"
              disabled={saving}
              className="flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm placeholder:text-[var(--color-text-disabled)] shadow-xs transition-colors duration-150 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30 disabled:opacity-50"
            />
            <button
              onClick={handleAdd}
              disabled={saving || newName.trim() === ''}
              className="h-9 rounded-[var(--radius-md)] bg-[var(--color-teal-600)] px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[var(--color-teal-700)] disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40"
            >
              {saving ? 'Agregando...' : 'Unirme al equipo'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-600" role="alert">{error}</p>
          )}
        </div>

      </div>
    </div>
  );
}
