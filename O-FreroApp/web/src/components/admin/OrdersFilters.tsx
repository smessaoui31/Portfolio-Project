"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function OrdersFilters({ date }: { date: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function set(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  }

  const select = "rounded-xl border border-line-2 bg-surface px-3 py-2 text-sm";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="jour">
        Jour
      </label>
      <input id="jour" type="date" value={date} onChange={(e) => set("jour", e.target.value || null)} className={`${select} [color-scheme:dark]`} />
      <label className="sr-only" htmlFor="mode">
        Mode
      </label>
      <select id="mode" value={params.get("mode") ?? ""} onChange={(e) => set("mode", e.target.value || null)} className={select}>
        <option value="">Retrait et livraison</option>
        <option value="PICKUP">À emporter</option>
        <option value="DELIVERY">Livraison</option>
      </select>
      <label className="flex items-center gap-2 rounded-xl border border-line-2 px-3 py-2 text-sm">
        <input
          type="checkbox"
          className="accent-[var(--ember)]"
          checked={params.get("toutes") !== "1"}
          onChange={(e) => set("toutes", e.target.checked ? null : "1")}
        />
        En cours seulement
      </label>
    </div>
  );
}
