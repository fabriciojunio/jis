"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="card p-8 max-w-md w-full">
        <h2 className="text-xl font-bold text-stone-100 mb-2">Algo deu errado</h2>
        <p className="text-sm text-stone-400 mb-6">
          As fontes de vagas podem estar temporariamente indisponíveis. Tente novamente em
          alguns instantes.
        </p>
        <button onClick={reset} className="btn-primary">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
