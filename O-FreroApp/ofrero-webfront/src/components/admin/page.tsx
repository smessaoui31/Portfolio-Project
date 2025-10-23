export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
        <p className="text-neutral-400 text-sm">
          Vue d’ensemble de l’activité (à brancher : commandes du jour, CA, etc.).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Commandes (jour)", value: "—" },
          { label: "CA (jour)", value: "—" },
          { label: "Paniers actifs", value: "—" },
          { label: "Produits", value: "—" },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4"
          >
            <div className="text-sm text-neutral-400">{c.label}</div>
            <div className="mt-1 text-2xl font-semibold">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4">
        <div className="text-sm text-neutral-400 mb-2">Dernières commandes</div>
        <div className="text-neutral-300 text-sm">
          À connecter à <code>/admin/orders</code> (API) — on l’ajoute ensuite.
        </div>
      </div>
    </div>
  );
}