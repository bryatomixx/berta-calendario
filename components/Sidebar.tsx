'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Calculator,
  LayoutDashboard,
  Activity,
  Users,
  FolderKanban,
  BarChart2,
  ChevronsUpDown,
  Menu,
  X,
  CalendarClock,
  CalendarDays,
  Building2,
} from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';
import { Avatar } from './Avatar';
import type { Member } from '@/lib/types';

interface SidebarProps {
  currentMember:  Member;
  onSwitchMember: () => void;
}

interface NavItemProps {
  href:   string;
  icon:   React.ComponentType<{ className?: string }>;
  label:  string;
  active: boolean;
}

function NavItem({ href, icon: Icon, label, active }: NavItemProps) {
  return (
    <Link
      href={href}
      className={[
        'flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium',
        'transition-all duration-[var(--duration-fast)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40',
        active
          ? 'bg-[var(--color-teal-50)] text-[var(--color-teal-700)] font-semibold'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]',
      ].join(' ')}
    >
      <Icon
        className={`w-4 h-4 ${active ? 'text-[var(--color-teal-600)]' : 'text-[var(--color-text-muted)]'}`}
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}

/* Rutas comunes para cualquier rol */
const BASE_NAV = [
  { href: '/',           icon: LayoutDashboard, label: 'Tablero' },
  { href: '/actividad',  icon: Activity,        label: 'Actividad' },
  { href: '/proyectos',  icon: FolderKanban,    label: 'Proyectos' },
];

/* Rutas exclusivas de admin (Berta) */
const ADMIN_NAV = [
  { href: '/equipo',    icon: Users,     label: 'Equipo' },
  { href: '/reportes',  icon: BarChart2, label: 'Reportes' },
];

/* Modulo tributario: visible para todos los roles */
const TRIBUTARIO_NAV = [
  { href: '/vencimientos', icon: CalendarClock, label: 'Vencimientos' },
  { href: '/calendario',   icon: CalendarDays,  label: 'Calendario' },
  { href: '/clientes',     icon: Building2,     label: 'Clientes' },
];

/** Contenido interior del sidebar, reutilizado en desktop y en el drawer mobile. */
function SidebarContent({
  currentMember,
  onSwitchMember,
  pathname,
  onClose,
}: SidebarProps & { pathname: string; onClose?: () => void }) {
  const isAdmin = currentMember.role === 'admin';
  const navLinks = isAdmin ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV;

  return (
    <div className="flex flex-col h-full">
      {/* Marca */}
      <div className="px-5 py-5 border-b border-[var(--color-border-soft)] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-teal-600)] flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
            BVR Asesorias
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-[var(--radius-sm)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
            aria-label="Cerrar menu"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Nav principal */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Navegacion principal">
        {/* Grupo: Equipo */}
        <p className="px-3 pt-1 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Equipo
        </p>
        <div className="flex flex-col gap-0.5 mb-2">
          {navLinks.map((link) => {
            const active =
              link.href === '/'
                ? pathname === '/'
                : pathname.startsWith(link.href);
            return (
              <NavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={active}
              />
            );
          })}
        </div>

        {/* Grupo: Tributario */}
        <p className="px-3 pt-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-muted)]">
          Tributario
        </p>
        <div className="flex flex-col gap-0.5">
          {TRIBUTARIO_NAV.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <NavItem
                key={link.href}
                href={link.href}
                icon={link.icon}
                label={link.label}
                active={active}
              />
            );
          })}
        </div>
      </nav>

      {/* Member switcher */}
      <div className="px-3 py-4 border-t border-[var(--color-border-soft)]">
        <button
          onClick={onSwitchMember}
          className="w-full flex items-center gap-3 rounded-[var(--radius-lg)] px-2 py-2 text-left transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-surface-2)] focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40 focus-visible:outline-none cursor-pointer"
          title={`Sesion de ${currentMember.name}. Clic para cambiar.`}
        >
          <Avatar name={currentMember.name} color={currentMember.color} size={32} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {currentMember.name}
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {ROLE_LABELS[currentMember.role]}
            </p>
          </div>
          <ChevronsUpDown className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function Sidebar({ currentMember, onSwitchMember }: SidebarProps) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      {/* Sidebar desktop (>= 1024px) */}
      <aside className="hidden lg:flex w-[var(--sidebar-w)] shrink-0 h-full flex-col border-r border-[var(--color-border)] bg-white">
        <SidebarContent
          currentMember={currentMember}
          onSwitchMember={onSwitchMember}
          pathname={pathname}
        />
      </aside>

      {/* Topbar mobile (< 1024px) */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 z-40 h-[var(--topbar-h)] flex items-center justify-between px-4 bg-white border-b border-[var(--color-border)]"
        role="banner"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[var(--radius-md)] bg-[var(--color-teal-600)] flex items-center justify-center shrink-0">
            <Calculator className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="text-sm font-bold tracking-tight text-[var(--color-text-primary)]">
            BVR Asesorias
          </span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="p-2 rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-teal-500)]/40"
          aria-label="Abrir menu"
        >
          <Menu className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Drawer mobile */}
      {drawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          {/* Panel */}
          <aside
            className="relative w-[var(--sidebar-w)] h-full bg-white border-r border-[var(--color-border)] flex flex-col animate-slide-up-fade"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacion"
          >
            <SidebarContent
              currentMember={currentMember}
              onSwitchMember={() => {
                setDrawerOpen(false);
                onSwitchMember();
              }}
              pathname={pathname}
              onClose={() => setDrawerOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
