import { SITE } from "@/lib/site";

export function VisitInfo({ hours }: { hours: { days: string; services: string }[] }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SITE.name} ${SITE.address} ${SITE.postalCity}`)}`;
  return (
    <div>
      <h2 className="font-display text-5xl md:text-6xl">Venir ou appeler</h2>
      <dl className="mt-6 text-[15px]">
        {hours.map((h) => (
          <div key={h.days} className="flex justify-between gap-4 border-b border-line py-3">
            <dt className="text-muted-2">{h.days}</dt>
            <dd className="text-right font-semibold tabular-nums">{h.services}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-b border-line py-3">
          <dt className="text-muted-2">Adresse</dt>
          <dd className="text-right font-semibold">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              {SITE.address}, {SITE.postalCity}
            </a>
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-3">
          <dt className="text-muted-2">Téléphone</dt>
          <dd className="text-right font-semibold">
            <a href={SITE.phoneHref} className="underline-offset-4 hover:underline">
              {SITE.phoneDisplay}
            </a>
          </dd>
        </div>
      </dl>
    </div>
  );
}
