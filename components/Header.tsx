import Link from "next/link";

const NAV = [
  { href: "/", label: "Inicio", short: "01" },
  { href: "/clientes", label: "Clientes", short: "02" },
  { href: "/calendario", label: "Calendario", short: "03" },
];

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream">
      <Sidebar />
      <main className="md:pl-64">{children}</main>
    </div>
  );
}

function Sidebar() {
  return (
    <aside className="md:fixed md:left-0 md:top-0 md:h-screen md:w-64 border-r border-rule bg-cream-deep/40 flex md:flex-col">
      <div className="flex md:flex-col flex-row items-stretch w-full md:h-full">
        <Link
          href="/"
          className="px-8 py-7 md:py-10 flex items-baseline gap-2 group"
        >
          <span className="serif-italic text-5xl text-ink leading-none">B</span>
          <span className="serif-italic text-2xl text-terracotta leading-none">.</span>
          <span className="hidden md:inline-block tracker text-ink-muted ml-1 mt-2">
            Berta
          </span>
        </Link>

        <nav className="flex-1 md:px-4 md:mt-4 flex md:flex-col flex-row md:gap-1 gap-0">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-baseline gap-3 px-4 md:px-4 py-3 md:py-2.5 rounded-md text-ink-soft hover:text-ink hover:bg-paper/60 transition-colors"
            >
              <span className="font-mono text-[10px] text-ink-faint tabular w-5">
                {item.short}
              </span>
              <span className="font-medium text-[15px]">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="hidden md:block px-8 py-6 border-t border-rule/60">
          <p className="tracker text-ink-faint">Demo · DIAN 2026</p>
          <p className="font-mono text-[10px] text-ink-faint mt-1.5 tabular">
            v0.1.0
          </p>
        </div>
      </div>
    </aside>
  );
}
