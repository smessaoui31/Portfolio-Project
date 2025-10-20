export default function Price({ cents }: { cents: number }) {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return <span className="font-semibold">{euros} €</span>;
}