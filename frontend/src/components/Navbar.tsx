import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/vagas", label: "Vagas" },
  { href: "/candidaturas", label: "Candidaturas" },
  { href: "/metricas", label: "Métricas" },
  { href: "/perfil", label: "Perfil" },
];

export function Navbar() {
  return (
    <nav className="border-b border-[#2b251c] bg-[#13110d]/95 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid place-items-center w-7 h-7 rounded-md bg-amber-500 text-[#1b1813] text-sm font-bold">
            J
          </span>
          <span className="text-sm font-semibold text-stone-100 tracking-tight">
            JIS
            <span className="text-stone-500 font-normal hidden sm:inline"> · Job Intelligence</span>
          </span>
        </Link>
        <div className="flex items-center gap-0.5 text-sm">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded-md text-stone-400 hover:text-stone-100 hover:bg-white/5 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
