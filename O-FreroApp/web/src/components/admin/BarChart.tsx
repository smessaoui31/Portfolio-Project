import { formatEuros } from "@/lib/money";

/** Daily revenue bars, hand-made SVG (no chart library). */
export function BarChart({ data }: { data: { date: string; revenueCents: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.revenueCents));
  const width = 100 / data.length;
  return (
    <figure>
      <svg viewBox="0 0 100 44" preserveAspectRatio="none" className="h-44 w-full" role="img" aria-label="Chiffre d'affaires des 14 derniers jours">
        {data.map((d, i) => {
          const h = (d.revenueCents / max) * 40;
          return (
            <rect
              key={d.date}
              x={i * width + width * 0.18}
              y={42 - h}
              width={width * 0.64}
              height={Math.max(h, 0.4)}
              rx={0.6}
              className={i === data.length - 1 ? "fill-ember" : "fill-line-2"}
            >
              <title>{`${d.date} : ${formatEuros(d.revenueCents)}`}</title>
            </rect>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex justify-between text-xs text-muted tabular-nums">
        <span>{data[0]?.date.slice(5).split("-").reverse().join("/")}</span>
        <span>Aujourd&apos;hui</span>
      </figcaption>
    </figure>
  );
}
