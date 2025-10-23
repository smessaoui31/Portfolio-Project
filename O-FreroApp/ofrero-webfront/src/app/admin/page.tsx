export default function AdminHome() {
  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Aperçu</h1>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-sm text-neutral-400">Ventes du jour</div>
          <div className="mt-2 text-2xl font-semibold text-white">— €</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-sm text-neutral-400">Commandes en attente</div>
          <div className="mt-2 text-2xl font-semibold text-white">—</div>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
          <div className="text-sm text-neutral-400">Clients</div>
          <div className="mt-2 text-2xl font-semibold text-white">—</div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-4">
        <div className="mb-3 text-sm text-neutral-400">Dernières commandes</div>
        <div className="text-neutral-500 text-sm">À connecter à l’API.</div>
      </section>
    </main>
  );
}