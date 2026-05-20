"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full">
        <p className="text-4xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Algo deu errado</h2>
        <p className="text-sm text-gray-500 mb-6">
          O backend pode estar offline. Configure{" "}
          <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> nas
          variáveis de ambiente do Vercel e faça o redeploy.
        </p>
        <button
          onClick={reset}
          className="text-sm font-semibold bg-[#0f3460] text-white px-5 py-2 rounded-lg hover:bg-[#1a1a2e] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
