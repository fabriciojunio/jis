import Link from "next/link";

export function Navbar() {
  return (
    <nav className="bg-[#1a1a2e] text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-wide">JIS</span>
          <span className="text-xs text-gray-400 hidden sm:inline">Job Intelligence System</span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          <Link href="/" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition">
            Dashboard
          </Link>
          <Link href="/vagas" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition">
            Vagas
          </Link>
          <Link href="/candidaturas" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition">
            Candidaturas
          </Link>
          <Link href="/metricas" className="px-3 py-1.5 rounded-md hover:bg-white/10 transition">
            Métricas
          </Link>
        </div>
      </div>
    </nav>
  );
}
